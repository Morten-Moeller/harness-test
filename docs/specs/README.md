# Specs

Eine Spec pro Änderung, Vorlage `0000-template.md`. Status-Werte und Gates: `harness/workflow.md`.
Die Freigabe (`approved`) setzt eine Person, nie ein Agent.

| Nr | Titel | Risiko | Status | PR | Erstellt | Offene Fragen |
|---|---|---|---|---|---|---|
| 0001 | Eine Einkaufsliste mit Artikeln | high | Review | – | 2026-11-09 | – |

## Entscheidungen

Beantwortete offene Fragen aus den Specs.

| Spec | Frage | Entscheidung | Datum |
|---|---|---|---|
| 0001 | Bearbeiten eines Artikels Teil der Spec? | Nein, nicht enthalten | 2026-11-09 |
| 0001 | Sortieren oder Filtern Teil der Spec? | Nein, nicht enthalten | 2026-11-09 |
| 0001 | Form der Menge | Freitext, höchstens 50 Zeichen | 2026-11-09 |
| 0001 | Längen für Name und Menge | Name 1 bis 100 Zeichen, Menge bis 50 Zeichen | 2026-11-09 |
| 0001 | Name der einen Einkaufsliste | Fest „Einkaufsliste“, nicht änderbar | 2026-11-09 |
| 0001 | Generator für die Frontend-Typen aus dem Contract | `openapi-typescript` als Entwicklungsabhängigkeit | 2026-11-09 |
| 0001 | Versionierung des Contracts | Im Feld `info.version` des Dokuments, nicht im Pfad | 2026-11-09 |
