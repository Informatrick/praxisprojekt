# Product Requirements Document

## Vision
Eine Web-App, die Wettervorhersagen in konkrete Handlungsempfehlungen übersetzt: Nutzer legen Aktivitäten mit persönlichen Wetterbedingungen an (z.B. Joggen: über 5°, unter 30°, kein Regen), die App gleicht sie mit dem OpenWeatherMap-Forecast ab und schlägt die Zeitfenster der nächsten fünf Tage vor, in denen die Bedingungen erfüllt sind. Statt selbst Wetterberichte zu deuten, sieht man auf einen Blick: Morgen zwischen 15 und 18 Uhr passt es.

## Zielgruppe
Aktive Menschen, die wetterabhängige Aktivitäten planen — Läufer, Radfahrer, Wanderer, Gartenfreunde. Ihr Problem: Wetter-Apps zeigen Rohdaten, aber niemand rechnet einem aus, *wann* die eigenen Bedingungen tatsächlich erfüllt sind. Mehrere Benutzer, jeder mit eigenem Konto und eigenen Aktivitäten.

## Kern-Features (Roadmap)

_Die Feature-Übersicht — Name, Beschreibung, Status und Build-Reihenfolge jedes Features — lebt in **`features/INDEX.md`** und nur dort._

Das MVP muss können: Registrierung und Login, Aktivitäten anlegen mit Wetterbedingungen (Temperatur min/max, Niederschlag, Wind max), Zeitfenster und Wochentagen sowie optionalem eigenem Standort (Standard: Wohnort im Profil) — und daraus per OpenWeatherMap-Forecast passende Zeitslots der nächsten 5 Tage vorschlagen. Bewusst später: Benachrichtigungen (E-Mail/Push), wenn ein passender Slot auftaucht.

## Erfolgskriterien
- Der Kern-Ablauf funktioniert durchgängig: Konto anlegen → Aktivität mit Bedingungen definieren → korrekte Slot-Vorschläge sehen
- Die Slot-Logik ist nachvollziehbar korrekt: ein Slot erscheint genau dann, wenn alle Bedingungen im Forecast-Zeitraum erfüllt sind
- Das Projekt ist als Praxisprojekt vorzeigbar: sauberer Code, dokumentiert, lokal lauffähig

## Rahmenbedingungen
- Einzelentwickler:in, kein Abgabetermin, Betrieb kostenlos (Free Tiers)
- **Kein Deployment geplant** — das Projekt liegt im GitHub-Repo und muss nur lokal lauffähig sein
- Wetterdaten: OpenWeatherMap, kostenloser 5-Tage/3-Stunden-Forecast (API-Key erforderlich)
- Environment strategy: two-projects (gehostetes Dev- und Prod-Projekt bei Supabase)
- Data region: eu-central-1 (Frankfurt)
- Data protection law: GDPR (EU/AT/DE), DSG (CH)
- Data protection stance: standard
- Design system: siehe `docs/design-system.md`

## Non-Goals
- Keine Benachrichtigungen im MVP (Push/E-Mail kommt später als eigenes Feature)
- Keine GPS-Ortung — Standorte werden als gespeicherte Orte gepflegt
- Keine weiteren Wetterparameter (Luftfeuchtigkeit, UV, Schnee, Bewölkung)
- Keine Kalender-Integration
- Kein öffentliches Hosting / kein Produktivbetrieb
