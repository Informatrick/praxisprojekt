# PROJ-2: Aktivitäten & Bedingungen

<!-- This file (spec.md) is the stable CONTRACT — it defines WHAT, not HOW.
     Owner: /write-spec (creates), /refine (updates). During /build this file is READ-ONLY.
     Technical design lives in design.md, QA results in qa-report.md.
     No status or date fields here: the feature's status lives ONLY in features/INDEX.md,
     and git records when this file changed. -->

## Dependencies
- **PROJ-1 (Benutzerkonten & Login)** — Login (nur eigene Daten sichtbar), Profil-Wohnort als Standard-Standort, die `LocationSearch`-Komponente sowie die bestehenden Lösch- und Export-Mechanismen

## User Stories
- Als eingeloggter Nutzer möchte ich eine Aktivität mit Wetterbedingungen anlegen, damit die App später passende Zeitfenster vorschlägt.
- Als Nutzer möchte ich meine Aktivitäten in einer Liste sehen und bearbeiten, damit ich sie aktuell halten kann.
- Als Nutzer möchte ich eine Aktivität wieder löschen, wenn ich sie nicht mehr brauche.
- Als Nutzer möchte ich pro Aktivität einen eigenen Ort setzen können, falls sie nicht an meinem Wohnort stattfindet.

## Out of Scope
- Benachrichtigungen — eigenes Feature (PROJ-4)
- Die eigentliche Slot-Berechnung und Wetterabfrage — eigenes Feature (PROJ-3)
- Zeitfenster über Mitternacht (z. B. 22–6 Uhr) — bewusst nicht im MVP
- Kategorien / Tags für Aktivitäten
- Teilen von Aktivitäten mit anderen Nutzern
- Mengenbegrenzung der Aktivitäten pro Nutzer

## Acceptance Criteria

### Anlegen & Validierung
- [ ] **AC-1** — Angenommen der Nutzer ist eingeloggt, wenn er eine Aktivität mit gültigem Namen und mindestens einer Wetterbedingung speichert, dann wird sie angelegt und erscheint in seiner Liste
- [ ] **AC-2** — Angenommen das Namensfeld ist leer, wenn der Nutzer speichern will, dann erscheint eine Validierungsfehlermeldung und nichts wird gespeichert
- [ ] **AC-3** — Angenommen weder Temperatur noch „kein Regen" noch Wind ist gesetzt, wenn der Nutzer speichern will, dann erscheint der Hinweis, dass mindestens eine Wetterbedingung nötig ist
- [ ] **AC-4** — Angenommen Temperatur-min und -max sind beide gesetzt und min ist nicht kleiner als max (oder ein Wind-Wert ist negativ), wenn der Nutzer speichern will, dann erscheint eine Validierungsfehlermeldung
- [ ] **AC-5** — Angenommen ein Zeitfenster ist gesetzt und die Von-Zeit liegt nicht vor der Bis-Zeit, wenn der Nutzer speichern will, dann erscheint eine Validierungsfehlermeldung (kein Überschreiten von Mitternacht)
- [ ] **AC-6** — Angenommen kein Wochentag ist ausgewählt, wenn der Nutzer speichern will, dann erscheint eine Validierungsfehlermeldung (Standard bei einer neuen Aktivität: alle sieben Tage)
- [ ] **AC-7** — Angenommen die Aktivität hat keinen eigenen Standort, wenn sie gespeichert wird, dann gilt der Wohnort aus dem Profil als Standort

### Verwalten
- [ ] **AC-8** — Angenommen der Nutzer ist eingeloggt, wenn er die Aktivitäten-Seite öffnet, dann sieht er ausschließlich seine eigenen Aktivitäten mit ihren Bedingungen (auf Datenbankebene erzwungen, Row Level Security)
- [ ] **AC-9** — Angenommen eine Aktivität existiert, wenn der Nutzer sie bearbeitet und speichert, dann sind die Änderungen übernommen und eine Bestätigung erscheint
- [ ] **AC-10** — Angenommen eine Aktivität existiert, wenn der Nutzer auf „Löschen" klickt, dann erscheint ein Bestätigungsdialog, und erst nach Bestätigung wird die Aktivität entfernt
- [ ] **AC-11** — Angenommen der Nutzer hat noch keine Aktivitäten, wenn er die Seite öffnet, dann sieht er „Noch keine Aktivitäten — lege deine erste an!" und einen Button „Neue Aktivität"

### Datenschutz
_Folgen aus der Datenschutz-Betrachtung (2026-08-27) und setzen die in PROJ-1 etablierten Pflichten fort. Begründung in `docs/privacy.md`._
- [ ] **AC-12** — Angenommen der Nutzer löscht sein Konto, wenn die Löschung erfolgt, dann werden alle seine Aktivitäten mitgelöscht *(Art. 17 DSGVO)*
- [ ] **AC-13** — Angenommen der Nutzer fordert seinen Daten-Export an, wenn die Datei erzeugt wird, dann enthält sie auch alle seine Aktivitäten *(Art. 15/20 DSGVO; Art. 25/28 DSG)*

## Edge Cases
- **EC-1** — Angenommen dieselbe Aktivität ist auf zwei Geräten geöffnet, wenn beide nacheinander gespeichert werden, dann gewinnt die zuletzt gespeicherte Version (last-write-wins, keine Warnung)
- **EC-2** — Angenommen eine Aktivität hat keinen eigenen Standort und das Profil hat keinen Wohnort, wenn sie gespeichert wird, dann ist das erlaubt, aber ein Hinweis weist auf den fehlenden Standort für Vorschläge hin
- **EC-3** — Angenommen der Nutzer klickt „Anlegen"/„Speichern" doppelt, wenn beide Klicks durchgehen, dann entsteht nur eine Aktivität
- **EC-4** — Angenommen beim Speichern tritt ein Netzwerkfehler auf, wenn die Anfrage scheitert, dann erscheint eine Fehlermeldung und die Eingaben bleiben im Formular erhalten
- **EC-5** — Angenommen eine Aktivität wurde in einem anderen Tab bereits gelöscht, wenn der Nutzer sie hier noch bearbeiten oder löschen will, dann erscheint ein freundlicher Hinweis, dass sie nicht mehr existiert

## Technical Requirements
- Authentifizierung serverseitig bei jeder Anfrage geprüft; Aktivitäten sind über Row Level Security an den Eigentümer gebunden
- Eingaben serverseitig validiert (Zod), bevor gespeichert wird
- Aktivitäten hängen per Fremdschlüssel am Konto und werden bei Kontolöschung kaskadierend entfernt (AC-12)

## Open Questions
- keine

## Decision Log

### Product Decisions
| Entscheidung | Begründung | Datum |
|--------------|------------|-------|
| Name einziges Pflichtfeld, alle Bedingungen optional | Niedrige Einstiegshürde — wer nur „kein Regen" will, muss nicht Temperatur und Wind ausfüllen | 2026-08-27 |
| Mindestens eine Wetterbedingung (Temperatur, Regen oder Wind) verpflichtend | Ohne Bedingung würde in PROJ-3 jeder Slot passen — die Vorschläge wären sinnlos | 2026-08-27 |
| Zeitfenster und Wochentage zählen nicht als Wetterbedingung | Sie schränken nur zeitlich ein, sagen nichts über das Wetter | 2026-08-27 |
| Kein Zeitfenster über Mitternacht im MVP | Vereinfacht Eingabe und Slot-Abgleich (PROJ-3) deutlich; Nacht-Aktivitäten sind seltener Sonderfall | 2026-08-27 |
| Bestätigungsdialog beim Löschen, keine Mengenbegrenzung | Schutz vor versehentlichem Löschen; eine künstliche Obergrenze wäre unnötige Reibung | 2026-08-27 |
| last-write-wins bei gleichzeitiger Bearbeitung | Einzelnutzer-Randfall; Konflikterkennung wäre spürbarer Mehraufwand für wenig Nutzen | 2026-08-27 |
| Speichern ohne auflösbaren Standort erlaubt, mit Hinweis | Anlegen nicht blockieren; das Erzwingen des Standorts gehört zu PROJ-3, wo die Vorschläge berechnet werden | 2026-08-27 |
