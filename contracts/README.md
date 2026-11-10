# Contracts

Contracts sind die Vereinbarung mit den Konsumenten der Schnittstellen dieses Repositorys.
Entscheidung: `docs/adr/0001-openapi-contract-und-frontend-typen.md`. Änderungen folgen
`harness/policies/risk.md` (high) und dem Skill `/contract`.

| Contract | Datei | Quelle | Konsumenten |
|---|---|---|---|
| REST-API des Backends | `contracts/openapi.yaml` | Jakarta-REST-Code unter `backend/src/main/java`, von Quarkus (`quarkus-smallrye-openapi`) beim Build geschrieben | Frontend über `frontend/src/app/shared/api.generated.ts` |

## Erzeugung

- Quarkus schreibt `contracts/openapi.yaml` bei jedem Build, der die Anwendung augmentiert:
  `./mvnw package` und jeder `@QuarkusTest`-Lauf (`make backend-test`). Ein reines
  `test-compile` (`make backend-typecheck`) schreibt nicht. Konfiguration:
  `quarkus.smallrye-openapi.store-schema-directory` in
  `backend/src/main/resources/application.properties`.
- `make contracts` baut das Backend ohne Tests, schreibt `contracts/openapi.yaml` und erzeugt
  daraus mit `openapi-typescript` die Datei `frontend/src/app/shared/api.generated.ts`. Das ist
  das Target für `contracts_generate_target` in `harness/config.yml`.
- `contracts/openapi.json` entsteht daneben und ist in `.gitignore` ausgeschlossen. Nur die
  YAML-Datei ist der Contract.
- Erzeugte Dateien werden nie von Hand geändert. Eine Änderung der Schnittstelle geschieht im
  Backend-Code, danach `make contracts`. Beide Seiten werden im selben Commit eingecheckt.
- Prüfung: `make contracts && git diff --exit-code -- contracts/ frontend/src/app/shared/api.generated.ts`.

## Version

- Die Version steht in `info.version` des Dokuments, gesetzt über
  `quarkus.smallrye-openapi.info-version`. Start: `1.0.0`.
- Kompatible Änderung (neues optionales Feld, neuer Endpunkt, neuer Enum-Wert): zweite Stelle
  erhöhen. Brechende Änderung (Feld, Endpunkt oder Typ entfernt oder umbenannt, neues
  Pflichtfeld, geänderter Statuscode): erste Stelle erhöhen; sie braucht ein ADR mit dem
  Migrationspfad für jeden Konsumenten (`harness/policies/adr.md`).
- Es gibt keine Version im Pfad. Parallele Versionen gibt es nicht, solange das Frontend im
  selben Repository der einzige Konsument ist.

## Konsumenten

- Frontend: `frontend/src/app/shared/api.ts` exportiert Aliasse auf die erzeugten Typen. Daneben
  liegt keine handgeschriebene Kopie der Backend-Typen (`project-rules/frontend.md`).
