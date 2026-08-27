# PROJ-3: Slot-Vorschläge

<!-- This file (spec.md) is the stable CONTRACT — it defines WHAT, not HOW.
     Owner: /write-spec (creates), /refine (updates). During /build this file is READ-ONLY.
     Technical design lives in design.md, QA results in qa-report.md.
     No status or date fields here: the feature's status lives ONLY in features/INDEX.md,
     and git records when this file changed. -->

## Dependencies
- **PROJ-1 (Benutzerkonten & Login)** — Login (nur eigene Daten sichtbar), Wohnort im Profil als Standard-Standort, die Vorschläge-Seite als Ziel nach dem Login
- **PROJ-2 (Aktivitäten & Bedingungen)** — Aktivitäten mit Wetterbedingungen (Temperatur min/max, „kein Regen", Wind max), Zeitfenster, Wochentagen und optionalem eigenem Standort

## User Stories
- Als eingeloggter Nutzer möchte ich nach dem Login sofort sehen, welche meiner Aktivitäten in den nächsten 5 Tagen passende Zeitfenster haben, damit ich keine Wetterberichte deuten muss.
- Als Nutzer möchte ich pro Slot die Wetterwerte sehen, damit ich nachvollziehen kann, warum er vorgeschlagen wird.
- Als Nutzer möchte ich einen gerade laufenden Slot sehen („Jetzt bis 18 Uhr"), damit ich noch spontan los kann.
- Als Nutzer ohne hinterlegten Standort möchte ich verstehen, warum es keine Vorschläge gibt, und direkt dorthin springen, wo ich es beheben kann.

## Out of Scope
- Benachrichtigungen, wenn ein passender Slot auftaucht — eigenes Feature (PROJ-4)
- Chronologische Zeitleisten- oder Kalenderansicht über alle Aktivitäten hinweg — bewusst nur die Gruppierung nach Aktivität
- Einstellbare Regen-Schwelle pro Aktivität — die 30-%-Regel gilt app-weit
- Weitere Wetterparameter (Luftfeuchtigkeit, UV, Schnee, Bewölkung) — PRD Non-Goal
- Vorschläge über 5 Tage hinaus — Grenze des kostenlosen OpenWeatherMap-Forecasts
- Slots merken, buchen oder in einen Kalender exportieren — reine Anzeige, keine Interaktion mit Slots

## Acceptance Criteria

### Anzeige & Berechnung
- [ ] **AC-1** — Angenommen der Nutzer ist eingeloggt und hat Aktivitäten mit auflösbarem Standort, wenn er die Vorschläge-Seite öffnet, dann sieht er pro Aktivität einen Block mit den passenden Zeitfenstern der nächsten 5 Tage (auf Basis des OpenWeatherMap 5-Tage/3-Stunden-Forecasts)
- [ ] **AC-2** — Angenommen ein 3-Stunden-Forecast-Block überschneidet sich an einem erlaubten Wochentag mit dem Zeitfenster der Aktivität und erfüllt alle gesetzten Bedingungen, wenn die Vorschläge berechnet werden, dann zählt er zum Slot — benachbarte passende Blöcke verschmelzen zu einem Slot, und angezeigt wird die Schnittmenge mit dem Zeitfenster (z. B. „Morgen 17–20 Uhr")
- [ ] **AC-3** — Angenommen eine gesetzte Bedingung (Temperatur min/max, „kein Regen", Wind max) ist in einem Block nicht erfüllt, wenn die Vorschläge berechnet werden, dann erscheint dieser Block in keinem Slot — ein Slot erscheint genau dann, wenn alle gesetzten Bedingungen erfüllt sind
- [ ] **AC-4** — Angenommen die Aktivität verlangt „kein Regen", wenn ein Block eine Regenwahrscheinlichkeit über 30 % oder prognostizierten Niederschlag (Regen oder Schnee) hat, dann gilt der Block als Regen und fällt durch
- [ ] **AC-5** — Angenommen eine Aktivität hat kein Zeitfenster gesetzt, wenn die Vorschläge berechnet werden, dann gilt der ganze Tag als Zeitfenster; an abgewählten Wochentagen erscheinen nie Slots
- [ ] **AC-6** — Angenommen ein Slot wird angezeigt, dann zeigt er kompakt die Wetterwerte des Zeitraums: Temperaturspanne, maximalen Wind und maximale Regenwahrscheinlichkeit
- [ ] **AC-7** — Angenommen es ist mitten am Tag, wenn die Vorschläge-Seite geöffnet wird, dann erscheinen heute komplett vergangene Slots nicht mehr, und ein gerade laufender Slot wird als „Jetzt bis X Uhr" angezeigt
- [ ] **AC-8** — Angenommen eine Aktivität hat keinen auflösbaren Standort (kein eigener Ort und kein Wohnort im Profil), wenn die Vorschläge-Seite geöffnet wird, dann erscheint ihr Block mit dem Hinweis, dass ein Standort fehlt, und einem direkten Link zum Profil bzw. zur Aktivität — sie verschwindet nie stillschweigend
- [ ] **AC-9** — Angenommen für eine Aktivität passt in den nächsten 5 Tagen kein einziger Block, wenn die Vorschläge-Seite geöffnet wird, dann zeigt ihr Block die Meldung „Kein passendes Zeitfenster in den nächsten 5 Tagen"
- [ ] **AC-10** — Angenommen der Nutzer hat noch keine Aktivitäten, wenn er die Vorschläge-Seite öffnet, dann sieht er einen Empty State mit einem Button „Neue Aktivität", der zum Anlegen (PROJ-2) führt
- [ ] **AC-11** — Angenommen OpenWeatherMap antwortet nicht (Timeout, Störung oder API-Limit erreicht), wenn die Vorschläge-Seite lädt, dann erscheint eine verständliche Fehlermeldung („Wetterdaten gerade nicht verfügbar") mit einem „Erneut versuchen"-Button — es werden nie stillschweigend veraltete Daten angezeigt
- [ ] **AC-12** — Angenommen die Vorschläge-Seite wird geöffnet, wenn Wetterdaten angezeigt werden, dann sind sie höchstens 30 Minuten alt (ein Zwischenspeicher innerhalb dieser Frist ist erlaubt)
- [ ] **AC-13** — Angenommen zwei Konten existieren, wenn Nutzer A die Vorschläge-Seite öffnet, dann basieren alle Blöcke ausschließlich auf seinen eigenen Aktivitäten

### Datenschutz
_Aus dem `/dsgvo`-Check (2026-08-27) — Rechtspflichten, nicht verhandelbar wie die übrigen Kriterien. Begründung in `docs/privacy.md`._
- [ ] **AC-14** — Angenommen die App ruft den Forecast ab, wenn die Anfrage an OpenWeatherMap geht, dann enthält sie ausschließlich Standort-Koordinaten und den API-Key — nie Nutzerkennung, E-Mail-Adresse oder Aktivitätsnamen *(Datenminimierung, Art. 5(1)(c) DSGVO)*
- [ ] **AC-15** — Angenommen ein Besucher öffnet die Datenschutzerklärung, dann nennt sie OpenWeather Ltd als Empfänger mit Zweck (Wettervorhersage), übermittelten Daten (nur Koordinaten) und Exportland UK *(Art. 13 DSGVO; Art. 19 Abs. 4 DSG)*

## Edge Cases
- **EC-1** — Angenommen das Zeitfenster einer Aktivität ist kürzer als 3 Stunden (z. B. 17–19 Uhr), wenn ein überlappender Block alle Bedingungen erfüllt, dann erscheint der Slot in Fensterlänge — die Überschneidung genügt
- **EC-2** — Angenommen der Forecast deckt den fünften Tag nur teilweise ab, wenn die Vorschläge berechnet werden, dann werden nur die abgedeckten Blöcke bewertet und nie Zeiten jenseits des Forecast-Horizonts vorgeschlagen
- **EC-3** — Angenommen der API-Key ist ungültig oder das Rate-Limit ist erreicht, wenn die Seite lädt, dann verhält sie sich wie bei AC-11 — ohne technische Details oder den Key preiszugeben
- **EC-4** — Angenommen der Nutzer ändert die Bedingungen einer Aktivität, wenn er danach die Vorschläge-Seite öffnet, dann sind die Slots gegen den neuen Stand berechnet — der 30-Minuten-Zwischenspeicher betrifft nur Wetterdaten, nie Bedingungen
- **EC-5** — Angenommen ein Forecast-Wert liegt exakt auf einer Grenze (Temperatur genau min oder max, Wind genau max), wenn die Bedingung geprüft wird, dann gilt sie als erfüllt (Grenzwerte inklusive)
- **EC-6** — Angenommen der Standort einer Aktivität liegt in einer anderen Zeitzone als der Nutzer, wenn Slots berechnet und angezeigt werden, dann gelten Zeitfenster und Uhrzeiten in der lokalen Zeit des Aktivitäts-Standorts

## Technical Requirements
- Der OpenWeatherMap-API-Key liegt ausschließlich serverseitig und landet nie im Browser-Bundle; alle Forecast-Abrufe laufen über den Server. Platzhalter `OPENWEATHER_API_KEY` in `.env.local.example` dokumentiert
- Authentifizierung wird bei jeder Anfrage serverseitig geprüft; der Datenzugriff läuft über die Row-Level-Security-Regeln aus PROJ-1/PROJ-2
- Keine Speicherung von Wetterdaten mit Nutzerbezug; ein etwaiger Zwischenspeicher ist nur nach Koordinaten geschlüsselt und lebt höchstens 30 Minuten — ob und wie gecacht wird, entscheidet `/architecture`

## Open Questions
- keine

## Decision Log

### Product Decisions
| Entscheidung | Begründung | Datum |
|--------------|------------|-------|
| Vorschläge-Seite gruppiert nach Aktivität, keine Zeitleiste | Die Kernfrage des Nutzers ist „wann passt meine Aktivität?" — der Block pro Aktivität beantwortet sie direkt; eine Zeitleiste wäre ein zweiter Blickwinkel für später | 2026-08-27 |
| Überschneidung mit dem 3h-Block genügt, Slot auf das Zeitfenster zugeschnitten | Nur-vollständige-Blöcke würden kurzen Zeitfenstern (< 3 h) nie einen Vorschlag geben; die Schnittmenge zeigt ehrlich, was erlaubt ist | 2026-08-27 |
| „Regen" = Wahrscheinlichkeit > 30 % oder prognostizierte Menge | Kompromiss: Nieselrisiko wird gemieden, ohne dass im Herbst fast jeder Block durchfällt | 2026-08-27 |
| Vergangene Slots ausgeblendet, laufender Slot sichtbar („Jetzt bis X Uhr") | Vorbei ist vorbei; ein laufender Slot ist dagegen genau die Information, mit der man noch losziehen kann | 2026-08-27 |
| Bei API-Ausfall Fehlermeldung + erneut versuchen, keine veralteten Daten | Ehrlich und einfach; stillschweigend alte Vorschläge könnten zu falschen Entscheidungen führen | 2026-08-27 |
| Wetterdaten dürfen bis zu 30 Minuten alt sein | Für einen 3-Stunden-Forecast völlig ausreichend; schont das Free-Tier-Limit spürbar | 2026-08-27 |
| Kompakte Wetterwerte an jedem Slot | PRD-Erfolgskriterium „nachvollziehbar korrekte Slot-Logik" — der Nutzer sieht sofort, warum ein Slot passt | 2026-08-27 |
| Aktivität ohne Standort bleibt sichtbar, mit Hinweis und Link | Nichts verschwindet stillschweigend; der Nutzer sieht das Problem dort, wo er es erwartet, und kann es direkt beheben | 2026-08-27 |
| Grenzwerte inklusive (genau min/max erfüllt die Bedingung) | Einfachste, erwartbare Regel — „über 5°" heißt ab 5,0° | 2026-08-27 |
| Zeiten in der lokalen Zeit des Aktivitäts-Standorts | Die Aktivität findet am Standort statt; dessen Uhrzeit ist die relevante | 2026-08-27 |
