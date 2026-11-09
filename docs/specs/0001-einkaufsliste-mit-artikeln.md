---
id: "0001"
title: Eine Einkaufsliste mit Artikeln
status: approved
risk: high
adrs: ["0001"]
owner: Morten Möller
created: 2026-11-09
---

# Eine Einkaufsliste mit Artikeln

## Ziel

Eine Person öffnet die Anwendung im Browser, sieht ihre Einkaufsliste und pflegt die Artikel
darauf: sie fügt Artikel mit Name und optionaler Menge hinzu, markiert sie als erledigt und löscht
sie. Die Artikel liegen im Backend; nach einem Neuladen der Seite sind sie noch da. Gelöst ist das
Problem, wenn die Kriterien A1 bis A15 erfüllt sind und der Frontend-Platzhalter von Angular
ersetzt ist.

Mit dieser Spec wird außerdem entschieden, wie das von Quarkus erzeugte OpenAPI-Dokument nach
`contracts/` kommt und wie das Frontend seine Typen daraus bezieht (`project-rules/backend.md`,
Abschnitt APIs, und `project-rules/frontend.md`, Abschnitt State and data).

## Scope

### Enthalten

- Genau eine Einkaufsliste mit dem festen Namen „Einkaufsliste“. Sie existiert beim Start des
  Backends, ohne Anlegen durch die Person.
- Artikel hinzufügen mit Name (Pflicht) und Menge (optional).
- Artikel als erledigt markieren und die Markierung zurücknehmen. Ein erledigter Artikel bleibt
  auf der Liste, bis er gelöscht wird (Glossar).
- Artikel löschen.
- REST-Endpunkte unter `/api` im Backend, Speicherung im Arbeitsspeicher.
- Ein Bildschirm im Frontend unter `/`, der den Angular-Platzhalter ersetzt.
- Dev-Proxy `/api` → http://localhost:8080 (`frontend/proxy.conf.json`).
- Der erste Contract: `contracts/openapi.yaml`, erzeugt aus dem laufenden Backend, dazu
  `contracts/README.md` mit den Regeln für Contracts und ein Make-Target, das den Contract
  regeneriert.
- Frontend-Typen für Requests und Responses aus dem Contract, erzeugt mit `openapi-typescript`
  als neue Entwicklungsabhängigkeit in `frontend/package.json`, nicht von Hand geschrieben.

### Nicht enthalten

- Mehrere Einkaufslisten, Anlegen, Umbenennen oder Löschen von Listen.
- Speicherung über einen Neustart des Backends hinaus (Datenbank, Datei). Kommt mit eigener Spec
  und eigenem ADR (`project-rules/backend.md`, Abschnitt Data).
- Authentifizierung und Mehrbenutzerbetrieb.
- Ein End-to-End-Test. Der Browser-Gang läuft über `/verify`.
- Bearbeiten eines Artikels (Name oder Menge nach dem Anlegen ändern). Löschen und neu anlegen
  stattdessen.
- Sortieren und Filtern. Die Liste zeigt alle Artikel in Reihenfolge des Anlegens.
- Umbenennen der Einkaufsliste. Ihr Name ist fest „Einkaufsliste“.

## Begriffe

| Begriff | Bedeutung hier |
|---|---|
| Einkaufsliste | Die eine Liste dieser Spec, im Code `ShoppingList`. Sie hat einen Namen und Artikel. |
| Artikel | Ein Eintrag auf der Einkaufsliste mit Name und optionaler Menge, im Code `Item`. |
| erledigt | Der Artikel ist eingekauft, im Code `done`. Er bleibt auf der Liste, bis er gelöscht wird. |
| Menge | Freitext, der angibt, wie viel von einem Artikel eingekauft wird, zum Beispiel „2 kg“ oder „3 Stück“. Höchstens 50 Zeichen. Im Code `quantity`. Neu, mit /domain ins Glossar. |
| Contract | Das OpenAPI-Dokument in `contracts/openapi.yaml`, das die REST-Schnittstelle des Backends beschreibt und aus dem das Frontend seine Typen bezieht. Kein Fachbegriff; gehört nicht ins Glossar. |

## REST-Schnittstelle

Contract first: die Endpunkte stehen hier, bevor Code entsteht. Der Contract wird aus dem Backend
erzeugt und muss zu dieser Tabelle passen.

| Methode und Pfad | Request | Antwort | Fehler |
|---|---|---|---|
| `GET /api/shopping-list` | – | 200, `ShoppingList` | – |
| `POST /api/shopping-list/items` | `CreateItemRequest` | 201, `Item` | 400 bei Validierungsfehler |
| `PATCH /api/shopping-list/items/{id}` | `UpdateItemRequest` | 200, `Item` | 400 bei Validierungsfehler, 404 bei unbekannter `id` |
| `DELETE /api/shopping-list/items/{id}` | – | 204 | 404 bei unbekannter `id` |

Typen:

| Typ | Felder |
|---|---|
| `ShoppingList` | `name: string`, immer „Einkaufsliste“; `items: Item[]` in Reihenfolge des Anlegens |
| `Item` | `id: string` (UUID), `name: string`, `quantity: string` (Freitext) oder fehlt, `done: boolean` |
| `CreateItemRequest` | `name: string` (Pflicht, nach Trimmen 1 bis 100 Zeichen), `quantity: string` (optional, Freitext, höchstens 50 Zeichen) |
| `UpdateItemRequest` | `done: boolean` (Pflicht) |

Die Längen und die Freitext-Form von `quantity` sind entschieden (Entscheidungstabelle in
`README.md`).

## Akzeptanzkriterien

| Nr | Kriterium | Prüfung |
|---|---|---|
| A1 | http://localhost:4200 zeigt die Überschrift „Einkaufsliste“ und darunter die Artikel der Liste. Der Angular-Platzhalter ist nicht mehr sichtbar. | Bildschirm `/`, /verify im Browser; Frontend-Test |
| A2 | Ohne Artikel zeigt die Seite den Text „Noch keine Artikel“. | Bildschirm `/`, /verify im Browser; Frontend-Test |
| A3 | Die Seite hat ein Formular mit einem Eingabefeld mit Label „Artikel“, einem Eingabefeld mit Label „Menge“ und einem Button „Hinzufügen“. Nach dem Absenden erscheint der Artikel am Ende der Liste, beide Felder sind leer und das Feld „Artikel“ hat den Fokus. | Bildschirm `/`, /verify im Browser; Frontend-Test |
| A4 | Absenden mit leerem oder nur aus Leerzeichen bestehendem Namen legt keinen Artikel an und zeigt die Meldung „Bitte einen Namen eingeben“. | Bildschirm `/`, /verify im Browser; Frontend-Test |
| A5 | Jeder Artikel hat eine Checkbox, deren Label der Name des Artikels ist, gefolgt von der Menge, wenn eine vorhanden ist. Anhaken setzt den Artikel auf erledigt, Abhaken nimmt das zurück. Ein erledigter Artikel wird durchgestrichen dargestellt und bleibt an seiner Stelle in der Liste. | Bildschirm `/`, /verify im Browser; Frontend-Test |
| A6 | Jeder Artikel hat einen Button „Löschen“. Nach dem Klick ist der Artikel nicht mehr in der Liste. | Bildschirm `/`, /verify im Browser; Frontend-Test |
| A7 | Nach dem Neuladen der Seite sind dieselben Artikel mit demselben Zustand sichtbar wie davor. | Bildschirm `/`, /verify im Browser |
| A8 | Jedes Steuerelement ist mit Tab erreichbar, hat ein Label und einen sichtbaren Fokus. Die Checkbox wird mit Leertaste geschaltet, die Buttons mit Enter ausgelöst. | Bildschirm `/`, /verify im Browser |
| A9 | Antwortet das Backend nicht oder mit einem Fehlerstatus, zeigt die Seite die Meldung „Der Server ist nicht erreichbar“. Die Liste bleibt im letzten bekannten Zustand. | Frontend-Test; Bildschirm `/` mit gestopptem Backend, /verify im Browser |
| A10 | `GET /api/shopping-list` antwortet 200 mit `name` „Einkaufsliste“ und `items` in Reihenfolge des Anlegens. | Backend-API-Test |
| A11 | `POST /api/shopping-list/items` mit gültigem Body antwortet 201 mit einem `Item`, das eine `id` hat und `done: false`. Der Artikel ist danach in `GET` enthalten. Ein Body ohne `name`, mit leerem `name`, mit `name` über 100 Zeichen oder mit `quantity` über 50 Zeichen antwortet 400. | Backend-API-Test |
| A12 | `PATCH /api/shopping-list/items/{id}` mit `done: true` antwortet 200 mit `done: true`; mit `done: false` setzt es zurück. Eine unbekannte `id` antwortet 404. | Backend-API-Test |
| A13 | `DELETE /api/shopping-list/items/{id}` antwortet 204 und der Artikel ist danach nicht mehr in `GET`. Eine unbekannte `id` antwortet 404. | Backend-API-Test |
| A14 | `contracts/openapi.yaml` existiert, enthält die vier Endpunkte aus dieser Spec und `info.version: 1.0.0` und ist mit dem Make-Target aus `contracts/README.md` erzeugt. Nach `make <target>` auf dem fertigen Stand ist `git diff -- contracts/` leer. | Aufruf des Make-Targets, danach `git diff --exit-code -- contracts/` |
| A15 | Die Typen für Requests und Responses im Frontend stammen aus dem Contract, erzeugt mit `openapi-typescript`. Die erzeugte Datei nennt im Kopf Quelle und Generator. Daneben liegt keine handgeschriebene Kopie der Backend-Typen. `make typecheck` läuft mit diesen Typen durch. | Aufruf `make typecheck`; Blick in die erzeugte Datei |

## Contracts

- Neu: `contracts/openapi.yaml`, erzeugt aus `/q/openapi` des Backends. Erste Version, daher
  keine Frage der Abwärtskompatibilität.
- Neu: `contracts/README.md` mit den Regeln: Quelle des Contracts, Generator und Make-Target,
  Versionierung im Feld `info.version` des Dokuments (nicht im Pfad; Start `1.0.0`, kompatible
  Änderung erhöht die zweite Stelle, brechende Änderung die erste), Verbot von Handänderungen an
  erzeugten Dateien.
- Konsument: das Frontend (`frontend/src/app/shopping-list/`). Andere Systeme: keine.
- `contracts_generate_target` in `harness/config.yml` ist leer. Eine Person trägt das neue Target
  ein; Agenten dürfen diese Datei nicht ändern (`harness/policies/human-approval.md`). Das
  geschieht vor oder mit dem PR dieser Spec.

## Risiko

Ergebnis von `harness/scripts/risk-level.sh --files-from <Liste der geplanten Dateien>`: **high**.

Stufe: high
Begründung:
- `contracts/openapi.yaml` und `contracts/README.md` treffen `contracts/**` (high).
- `harness/config.yml` (Eintrag `contracts_generate_target`) ist high und darf nur eine Person
  ändern.
- Frontend und Backend-Code unter `frontend/src/app/` und `backend/src/main/java/` passen auf kein
  Muster der Matrix und zählen als medium. Die Tests sind low.
- Eskalator dependency manifest: `frontend/package.json` und `frontend/pnpm-lock.yaml` ändern
  sich durch `openapi-typescript`; mindestens medium.
- Eskalator size: mehr als 200 geänderte Zeilen, ohne Wirkung, da die Stufe schon high ist.

Gates (`harness/policies/human-approval.md`): G0 Spec-Freigabe, G1 Plan-Freigabe nach dem Plan
von `/implement`, G2 Merge durch eine Person mit Label `human-approved` auf dem letzten Commit,
G3 die `/verify`-Tabelle auf dem letzten Commit vor der Freigabe. Kein Auto-Merge. AI-Reviews:
Code, Security und Architektur.

ADR nötig: ja, Nr. 0001. Bedingung 1 (high risk), Bedingung 2 (`openapi-typescript` als neue
Abhängigkeit) und Bedingung 3 (ein Contract, von dem ein anderer Teil des Systems abhängt) aus
`harness/policies/adr.md`. Gegenstand des ADR: wie das OpenAPI-Dokument nach `contracts/` kommt
(Export aus dem laufenden Backend oder beim Build), `openapi-typescript` als Generator der
Frontend-Typen und die Versionierung über `info.version`. Geschrieben mit `/adr`, nicht hier.

## Offene Fragen

Keine. Beantwortete Fragen stehen in der Entscheidungstabelle in `README.md`.

## Verifikationsplan

- `make check`
- betroffene Tests:
  - `frontend/src/app/shopping-list/shopping-list.spec.ts` (A1 bis A6, A9)
  - `frontend/src/app/shopping-list/shopping-list.service.spec.ts` (A9, Aufrufe der vier
    Endpunkte)
  - `frontend/src/app/app.spec.ts` (A1, Platzhalter ersetzt)
  - `backend/src/test/java/de/mmoller/einkaufsliste/shoppinglist/ShoppingListResourceTest.java`
    (A10 bis A13, `@QuarkusTest` mit RestAssured)
  - `backend/src/test/java/de/mmoller/einkaufsliste/shoppinglist/ShoppingListServiceTest.java`
    (Regeln: erledigt setzen und zurücknehmen, Löschen, unbekannte `id`)
- Contract: Make-Target aus `contracts/README.md` ausführen, danach
  `git diff --exit-code -- contracts/` (A14); `make typecheck` (A15)
- Browser: http://localhost:4200, Bildschirm `/` mit laufendem Backend (A1 bis A8) und einmal mit
  gestopptem Backend (A9). Testdaten über die Oberfläche oder mit `curl` gegen
  http://localhost:8080/api/shopping-list/items.
