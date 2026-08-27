# QA Test Results

**Getestet:** 2026-08-27
**App-URL:** http://localhost:3000 (Dev-Server, HTTP-Proben ohne Browser)
**Tester:** QA Engineer (AI)

> Legende: `[x]` in diesem Lauf verifiziert (mit Beleg) · `[ ] BUG` als kaputt verifiziert · `[!] NOT VERIFIED` in diesem Lauf nicht prüfbar (mit Grund)

### Acceptance Criteria Status

#### AC-1: Vorschläge-Seite zeigt pro Aktivität einen Block
- [x] Implementierung vorhanden und verdrahtet — Beleg: `src/app/page.tsx` (Blöcke via `ActivitySuggestions`), Route `/` dynamisch im Build-Output
- [!] NOT VERIFIED: gerenderte Seite mit echten Aktivitäten — braucht eingeloggten Nutzer (Smoke-Test unten)

#### AC-2: Überschneidung zählt, Slot zugeschnitten, benachbarte Blöcke verschmelzen
- [x] Beleg: `src/lib/slots.test.ts` → „schneidet auf das Zeitfenster zu und verschmilzt benachbarte Blöcke (AC-2)" — grün

#### AC-3: Slot genau dann, wenn alle gesetzten Bedingungen erfüllt
- [x] Beleg: `src/lib/slots.test.ts` → „ein durchfallender Block trennt zwei Slots (AC-3)" + `blockPasses`-Tests — grün

#### AC-4: „Kein Regen" = Wahrscheinlichkeit > 30 % oder Niederschlagsmenge
- [x] Beleg: `src/lib/slots.test.ts` → AC-4-Test (30 % erfüllt, 31 % fällt durch, Menge fällt durch) — grün

#### AC-5: Kein Zeitfenster = ganzer Tag; abgewählte Wochentage nie
- [x] Beleg: `src/lib/slots.test.ts` → AC-5-Test — grün

#### AC-6: Kompakte Wetterwerte je Slot
- [x] Aggregation (Temperaturspanne, max. Wind, max. Regenwahrsch.) — Beleg: `src/lib/slots.test.ts` → AC-6-Test; Einheiten-Umrechnung `src/lib/weather.test.ts` — grün
- [!] NOT VERIFIED: Anzeige im Browser — Smoke-Test

#### AC-7: Vergangene Slots weg, laufender Slot „Jetzt bis X Uhr"
- [x] Logik — Beleg: `src/lib/slots.test.ts` → Heute-Regel-Tests (isNow, Start = jetzt, Vergangenes entfällt) — grün; Anzeige-Text `src/components/slot-card.tsx:50`

#### AC-8: Aktivität ohne Standort: Block mit Hinweis + Links
- [x] Implementierung — Beleg: `src/components/activity-suggestions.tsx` (Fall C mit Links zu /profile und /activities)
- [!] NOT VERIFIED: gerenderter Fall — Smoke-Test

#### AC-9: „Kein passendes Zeitfenster in den nächsten 5 Tagen"
- [x] Implementierung — Beleg: `src/components/activity-suggestions.tsx` (Fall B, exakter Text)
- [!] NOT VERIFIED: gerenderter Fall — Smoke-Test

#### AC-10: Leerzustand mit Button „Neue Aktivität"
- [x] Implementierung — Beleg: `src/app/page.tsx` (Leerzustand bei 0 Aktivitäten, Button → /activities)
- [!] NOT VERIFIED: gerendert — Smoke-Test

#### AC-11: API-Ausfall → Fehlermeldung + „Erneut versuchen", nie stillschweigend veraltete Daten
- [x] Fehler-Mapping serverseitig — Beleg: `src/lib/weather.test.ts` → 401/Netzwerkfehler → `WeatherUnavailableError` (generisch) — grün; Fehler-UI `src/components/forecast-error.tsx` (router.refresh)
- [!] NOT VERIFIED: Fehlerzustand im Browser ausgelöst — bräuchte manipulierten Key im laufenden System

#### AC-12: Wetterdaten höchstens 30 Minuten alt
- [x] Beleg: `src/lib/weather.test.ts` → fetch mit `next: { revalidate: 1800 }` — grün; Fehler werden nicht gecacht (Next cached nur ok-Antworten)

#### AC-13: Nur eigene Aktivitäten
- [x] Query auf `user_id` des eingeloggten Nutzers — Beleg: `src/app/activities/actions.ts:190` (`listActivities`); RLS owner-only `supabase/migrations/20260827110000_activities.sql`; unauthentifiziert: `GET /` → 307 `/login` (Probe in diesem Lauf)

#### AC-14: Anfrage an OpenWeatherMap enthält nur Koordinaten + Key
- [x] Beleg: `src/lib/weather.test.ts` → Query-Parameter exakt `[appid, lat, lon, units]`, Koordinaten auf 2 Dezimalstellen gerundet — grün

#### AC-15: Datenschutzerklärung nennt OpenWeather Ltd + Exportland UK
- [x] Beleg: `GET /datenschutz` (Dev-Server) → 200, enthält „OpenWeather" und „Vereinigtes Königreich" (Probe in diesem Lauf)

### Edge Cases Status

#### EC-1: Zeitfenster kürzer als 3 h
- [x] Beleg: `src/lib/slots.test.ts` → EC-1-Test (Fenster 17–19, Block 15–18 → Slot 17–18) — grün

#### EC-2: Forecast-Horizont ist harte Grenze
- [x] Beleg: `src/lib/slots.test.ts` → EC-2-Test; konstruktiv: Slots entstehen nur aus vorhandenen Blöcken — grün

#### EC-3: Ungültiger Key / Rate-Limit → wie AC-11, ohne Details
- [x] Beleg: `src/lib/weather.test.ts` → 401 → generischer Fehler; Details nur via `console.error` ins Server-Log (`src/lib/weather.ts:74-83`) — grün

#### EC-4: Bedingungsänderung schlägt sofort durch
- [x] Aktivitäten/Profil werden pro Request frisch gelesen, nur der Wetter-Fetch ist gecacht — Beleg: `src/app/page.tsx` (keine Cache-Direktive auf DB-Reads), Build-Output: Route `/` = ƒ (dynamisch)

#### EC-5: Grenzwerte inklusive
- [x] Beleg: `src/lib/slots.test.ts` → EC-5-Tests (Temperatur exakt min/max, Wind exakt max) — grün

#### EC-6: Lokale Zeit des Standorts
- [x] Beleg: `src/lib/slots.test.ts` → EC-6-Tests (Wochentag/Tagesgrenze mit Offset; UTC-Sonntag = Orts-Montag zählt für Montag) — grün

**Red-Check:** Für die neuen Testdateien wurde je eine repräsentative Erwartung absichtlich gekippt (`slots.test.ts` EC-5, `weather.test.ts` AC-14) — beide Tests schlugen mit genau dem erwarteten Fehler fehl und sind nach dem Zurückstellen wieder grün.

### Security Audit Results

- [x] Authentication: `GET /` ohne Session → 307 `/login`; `GET /activities` → 307 `/login`; `GET /api/geocode` → 401 — Beleg: HTTP-Proben in diesem Lauf; Guard `src/proxy.ts`
- [!] Authorization (Cross-User): NOT VERIFIED — kein zweites Testkonto in diesem Lauf; RLS-Policies owner-only unverändert aus PROJ-2 (`supabase/migrations/20260827110000_activities.sql`), PROJ-3 fügt keine Schreibpfade hinzu
- [x] Input validation: PROJ-3 hat keinen neuen Endpunkt und keine neue Nutzereingabe — kein Angriffsvektor hinzugekommen; bestehende Validierungen unverändert (Regression: 61/61 Tests grün)
- [!] Rate limiting (Vorschläge-Seite): NOT VERIFIED — bewusst nicht implementiert (design.md: kein Credential-Check, login-geschützt, Cache deckelt OWM-Last); bei öffentlichem Betrieb neu bewerten
- [x] Brute force: kein Credential-Check in diesem Feature; Login-Throttle aus PROJ-1 unverändert vorhanden (`supabase/migrations/20260827100100_login_throttle.sql`)
- [x] Keine Credentials/PII in URLs: Feature hat keine Formulare; OWM-Anfrage (serverseitig) enthält nur Koordinaten + Key — Beleg: `src/lib/weather.test.ts`
- [x] Keine Secrets im Client-Bundle: Grep über `.next/static/**/*.js` nach `openweathermap` / `OPENWEATHER_API_KEY` → 0 Treffer (Production-Build) — Beleg: Grep in diesem Lauf

### E2E Tests
- Status: **not run** (run `/e2e-tests` for critical flows)

### Not Verified In This Run

- [!] Gerenderte Logged-in-Flows (AC-1, AC-6-Anzeige, AC-8, AC-9, AC-10, AC-11-UI) — kein Browser, kein Testkonto; → Smoke-Test durch den Nutzer (Schritte unten)
- [!] Cross-User-Zugriff mit zwei Konten — kein zweites Testkonto in diesem Lauf
- [!] Cross-Browser-Rendering (Chrome / Firefox / Safari) — `/qa` läuft ohne Browser; `/e2e-tests`
- [!] Responsive Layout 375px / 768px / 1440px — braucht echten Viewport
- [!] Browser-Konsole / Network-Tab — braucht DevTools
- [!] Echte 30-Minuten-Cache-Beobachtung über die Zeit — nur per Code/Test belegt, nicht über 30 Minuten beobachtet

### Smoke-Test für den Nutzer (macht die offenen Laufzeit-ACs zu)

1. `npm run dev`, einloggen → du landest auf **Vorschläge** (AC-1)
2. Mit vorhandenen Aktivitäten: pro Aktivität ein Block; Slots zeigen Tag/Zeit + Temperatur/Wind/Regen (AC-1, AC-6)
3. Eine Aktivität ohne eigenen Ort + Wohnort im Profil leeren → Block zeigt Hinweis mit zwei Links (AC-8)
4. Eine Aktivität mit unerfüllbarer Bedingung (z. B. Temperatur min 45°) → „Kein passendes Zeitfenster in den nächsten 5 Tagen" (AC-9)
5. Alle Aktivitäten löschen (oder frisches Konto) → Leerzustand mit „Neue Aktivität" (AC-10)
6. In `.env.local` den OWM-Key kurz verfälschen, Seite neu laden → Fehlermeldung mit „Erneut versuchen"; Key zurücksetzen, Button klicken → Seite lädt wieder (AC-11)

### Bugs Found

Keine.

### Summary
- **Acceptance Criteria:** 9/15 vollständig verifiziert (AC-2–5, AC-7, AC-12–15), 6 in der Logik verifiziert, gerenderter Flow offen (AC-1, AC-6, AC-8–11) → Smoke-Test
- **Bugs Found:** 0 (0 critical, 0 high, 0 medium, 0 low)
- **Security:** 5/7 Checks verifiziert, 2 NOT VERIFIED — Cross-User (kein zweites Konto), Rate-Limit Vorschläge-Seite (bewusst nicht implementiert)
- **Production Ready:** ausstehend — kein Critical/High-Fund, aber die gerenderten Laufzeit-ACs brauchen den Smoke-Test des Nutzers
- **Recommendation:** Smoke-Test durchführen; danach Approved

> „Production Ready: YES" heißt *keine Critical/High-Bugs* — nicht, dass alles geprüft wurde.
> Offene NOT-VERIFIED-Punkte oben brauchen einen Menschen oder `/e2e-tests`.
