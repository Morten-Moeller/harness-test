# 0001: OpenAPI-Contract aus dem Quarkus-Build, Frontend-Typen mit openapi-typescript

Status: proposed
Datum: 2026-11-09
Spec: docs/specs/0001-einkaufsliste-mit-artikeln.md

## Kontext

Spec 0001 bringt die erste REST-Schnittstelle. `project-rules/backend.md` schreibt Contract first
vor und lässt offen, wie das von Quarkus erzeugte OpenAPI-Dokument nach `contracts/` kommt.
`project-rules/frontend.md` verlangt, dass die Typen für Requests und Responses aus dem Contract
stammen und keine handgeschriebene Kopie daneben liegt. `AGENTS.md` verbietet Handänderungen an
erzeugten Dateien; sie werden mit dem Target aus `contracts/README.md` regeneriert, das
`contracts_generate_target` in `harness/config.yml` nennt.

Kräfte:

- Das Backend ist die einzige Quelle der Schnittstelle. Jakarta-REST-Annotationen und
  `quarkus-smallrye-openapi` erzeugen das Dokument; eine zweite Quelle wäre Doppelpflege.
- `make check` muss ohne laufenden Server auskommen, lokal und in CI.
- Das Frontend soll keinen Laufzeitcode aus einem Generator erhalten; `HttpClient` und Signals
  bleiben die Mittel (`project-rules/frontend.md`).
- Es gibt einen Konsumenten (das Frontend) und keine fremden Systeme
  (`docs/architecture/overview.md`). Die Versionierung muss nicht mehr leisten, als eine brechende
  Änderung sichtbar zu machen.
- Drei Teilfragen: Export des Dokuments, Erzeugung der Frontend-Typen, Versionierung.

## Optionen

### Teil 1: Export des OpenAPI-Dokuments nach `contracts/`

#### Option A: Quarkus schreibt das Dokument beim Build

`quarkus.smallrye-openapi.store-schema-directory=../contracts` in `application.properties`.
Jeder Build, der die Anwendung augmentiert (`./mvnw package`, jeder `@QuarkusTest`-Lauf in
`make backend-test`), schreibt `contracts/openapi.yaml` neu; ein reines `test-compile` nicht.

- Vorteile: kein laufender Server, keine zusätzliche Abhängigkeit, läuft in CI mit den
  vorhandenen Gates. Eine Abweichung zwischen Code und Contract wird als `git diff` sichtbar und
  erfüllt A14 der Spec direkt.
- Nachteile: Quarkus schreibt auch `openapi.json`; die Datei muss ausgeschlossen werden. Der
  Pfad ist relativ zu `backend/` und muss in der Dokumentation stehen.

#### Option B: Make-Target lädt `/q/openapi` vom laufenden Backend

`make contracts` startet das Backend, lädt `/q/openapi?format=yaml` nach `contracts/` und stoppt
das Backend.

- Vorteile: ein expliziter Schritt, das Dokument entspricht genau dem, was der Server ausliefert.
- Nachteile: Skript mit Start, Warten auf `/q/health` und Stopp; ein freier Port 8080 ist nötig;
  in CI ein zweiter Backend-Start. Mehr Teile, die brechen können, für dasselbe Ergebnis.

#### Option C: Handgeschriebener Contract, Backend wird dagegen geprüft

`contracts/openapi.yaml` wird von Hand gepflegt; ein Test vergleicht ihn mit `/q/openapi`.

- Vorteile: der Contract entsteht vor dem Code und ist unabhängig vom Framework.
- Nachteile: zwei Quellen für dieselbe Schnittstelle; der Vergleichstest muss Reihenfolge und
  Formatierung tolerieren; kein Generator für die Serverseite im Projekt. Für einen Konsumenten im
  selben Repository ist der Aufwand nicht gerechtfertigt.

### Teil 2: Frontend-Typen aus dem Contract

#### Option A: `openapi-typescript`

Entwicklungsabhängigkeit in `frontend/package.json`. Erzeugt eine Datei mit reinen Typen, kein
Laufzeitcode.

- Vorteile: nur Typen, passt zu `HttpClient` und Signals; eine Abhängigkeit ohne Laufzeitanteil;
  `make typecheck` prüft die Nutzung. Die erzeugte Datei trägt Quelle und Generator im Kopf.
- Nachteile: neue Abhängigkeit (Bedingung 2 der ADR-Policy); die Typpfade
  (`components['schemas']['Item']`) brauchen kurze Aliasse im Frontend.

#### Option B: Typen von Hand schreiben

- Vorteile: keine Abhängigkeit.
- Nachteile: verstößt gegen `project-rules/frontend.md` (keine handgeschriebene Kopie neben
  einem Contract); Abweichungen fallen erst zur Laufzeit auf.

#### Option C: Vollständiger Client-Generator (`openapi-generator-cli`, Angular-Client)

- Vorteile: fertige Services pro Endpunkt.
- Nachteile: erzeugt Laufzeitcode mit eigener `HttpClient`-Nutzung und Konfiguration, braucht
  Java zur Laufzeit des Generators im Frontend-Build, kollidiert mit der Regel „ein Service pro
  Feature“ und mit Signals als Zustandsmodell. Zu viel für vier Endpunkte.

### Teil 3: Versionierung des Contracts

#### Option A: Feld `info.version` im Dokument

`quarkus.smallrye-openapi.info-version` in `application.properties`, Start `1.0.0`. Kompatible
Änderung erhöht die zweite Stelle, brechende die erste.

- Vorteile: eine Stelle, keine Pfadänderung, im `git diff` des Contracts sichtbar;
  `/contract` prüft brechende Änderungen am Dokument.
- Nachteile: eine brechende Änderung ersetzt das Dokument; zwei Versionen parallel sind nicht
  möglich. Mit einem Konsumenten im selben Repository ist das kein Verlust.

#### Option B: Version im Pfad (`/api/v1/...`)

- Vorteile: zwei Versionen können parallel laufen.
- Nachteile: Pfade im Backend, im Proxy und im Frontend tragen die Version; parallele Versionen
  braucht niemand, solange es keinen fremden Konsumenten gibt.

#### Option C: Keine Versionierung

- Vorteile: nichts zu pflegen.
- Nachteile: `contracts/README.md` und `/contract` verlangen eine Regel für brechende
  Änderungen; ohne Version fehlt der Platz, sie festzuhalten.

## Entscheidung

Teil 1 Option A, Teil 2 Option A, Teil 3 Option A. Quarkus schreibt `contracts/openapi.yaml`
bei jedem augmentierenden Build über `store-schema-directory`; die Datei ist der Contract und wird nie von
Hand geändert. Das Frontend erzeugt seine Typen mit `openapi-typescript` aus dieser Datei nach
`frontend/src/app/shared/api.generated.ts`; ein Make-Target `contracts` führt beide Schritte
nacheinander aus und ist das Target für `contracts_generate_target`. Die Version steht in
`info.version`, beginnend mit `1.0.0`. Gründe: eine Quelle (der Backend-Code), keine laufenden
Server in den Gates, nur Typen und kein Laufzeitcode im Frontend, und eine Versionierung, die für
einen Konsumenten im selben Repository ausreicht.

## Folgen

- `backend/src/main/resources/application.properties` erhält `store-schema-directory`,
  `store-schema-file-name=openapi`, `info-title` und `info-version=1.0.0`. `contracts/openapi.json`
  wird in `.gitignore` ausgeschlossen; nur die YAML-Datei ist der Contract.
- `Makefile` erhält das Target `contracts`: Maven-Compile im Backend, dann
  `pnpm exec openapi-typescript ../contracts/openapi.yaml -o src/app/shared/api.generated.ts`.
  `make format` lässt die erzeugte Datei aus; Prettier und ESLint ignorieren sie.
- `frontend/package.json` erhält `openapi-typescript` als Entwicklungsabhängigkeit. Eskalator
  dependency manifest in `harness/policies/risk.md`.
- `contracts/README.md` wird angelegt und nennt Quelle, Generator, Target, Versionsregel und das
  Verbot von Handänderungen. Die Prüfung in `/contract` (brechend oder kompatibel) läuft gegen das
  Dokument.
- Eine Person trägt `contracts_generate_target: contracts` in `harness/config.yml` ein. Agenten
  dürfen diese Datei nicht ändern (`harness/policies/human-approval.md`).
- `project-rules/backend.md`, Abschnitt APIs: der Satz „wie es in `contracts/` landet, wird mit
  der ersten API-Spec entschieden“ wird durch einen Verweis auf dieses ADR ersetzt.
  `project-rules/frontend.md`, Abschnitt State and data: Verweis auf `api.generated.ts` in
  `shared/` als Quelle der Typen. Beide Änderungen kommen mit dem PR zu Spec 0001.
- Schwerer wird: ein Contract, der dem Code vorausgeht. Der Endpunkt steht in der Spec, der Code
  folgt, das Dokument bestätigt ihn. Eine Abweichung zwischen Spec-Tabelle und Dokument ist ein
  Review-Befund, kein Build-Fehler.
- Einfacher wird: jede Änderung an der Schnittstelle erscheint als Diff in `contracts/` und läuft
  damit automatisch als high risk durch alle Reviews.
