# PROJ-1 Tasks

> Erstellt von `/tasks` aus `spec.md` + `design.md`. Der geordnete, nachvollziehbare Bauplan — die Brücke zwischen Vertrag (WAS) und Build (WIE).
> `[P]` = parallelisierbar: die Dateien der Aufgabe überschneiden sich mit keiner anderen `[P]`-Aufgabe derselben Ebene, `/build` kann sie an einen eigenen Subagenten geben.
> Ebenen laufen **nacheinander** (jede ist eine Barriere). Aufgaben **innerhalb** einer Ebene laufen parallel, wo `[P]` steht. Jede Aufgabe referenziert die AC-IDs aus `spec.md` — das ist die Kette AC → Task → Test.
> `[user]` = eine Einstellung, die nur der Nutzer machen kann (Dashboard/Konto): `where:` statt `files:`, nie `[P]`, wird vom Nutzer abgehakt — `/build` übergibt sie, `/deploy` liefert nicht aus, solange eine offen ist.
> Owner: `/tasks` erstellt diese Datei; `/build` hakt die Kästchen ab — außer `[user]`-Aufgaben, die hakt der Nutzer ab.

## Ebene 1 — Grundlagen (Daten & Infrastruktur)

<!-- Fundament: Supabase-Projekt, Schema, Clients, Routenschutz. Läuft zuerst, weil alles Weitere auf dem Datenvertrag aufbaut. -->

- [ ] T1 [user]  Supabase-Dev-Projekt anlegen, Region **eu-central-1 (Frankfurt)** + DPA/AVV akzeptieren  · where: supabase.com → New Project · Organization Settings → Legal Documents  · → AC-17 (und Grundlage für alle)
- [ ] T2 [user]  Auth-Einstellungen: Passwort-Mindestlänge **8**, E-Mail-Bestätigung **an**, Site URL + Redirect-URLs **http://localhost:3000** (inkl. `/auth/confirm`, `/reset-password`), Rate Limits auf Standard belassen  · where: Dashboard → Authentication → Sign In / Providers → Email · URL Configuration · Rate Limits  · → AC-1, AC-2, AC-3, AC-4, AC-10
- [ ] T3 [user]  OpenWeatherMap-API-Key besorgen (kostenloser Account); Supabase-URL + anon key (Dev-Projekt, Settings → API) und `OPENWEATHER_API_KEY` in `.env.local` eintragen; einmalig `supabase login` + `supabase link --project-ref <ref>` (fragt das DB-Passwort ab)  · where: openweathermap.org → API keys · lokal  · → AC-12 (und Grundlage für alle)
- [ ] T4 [P]  Supabase-Setup im Repo: `supabase init` (Config), Migration `profiles` (Tabelle, RLS owner-only, Signup-Trigger), Platzhalter in `.env.local.example`  · files: supabase/config.toml, supabase/migrations/0001_profiles.sql, .env.local.example  · → AC-8, AC-11
- [ ] T5 [P]  Migrationen `login_throttle` (atomarer Zähler) + `delete_user()`-Funktion (Security Definer, Kaskade)  · files: supabase/migrations/0002_login_throttle.sql, supabase/migrations/0003_delete_user.sql  · → AC-13, AC-15
- [ ] T6 [P]  `@supabase/ssr` installieren; Server-/Client-Helper; Middleware-Routenschutz (geschützt: alles außer Auth-Seiten und `/datenschutz`)  · files: package.json, src/lib/supabase/server.ts, src/lib/supabase/client.ts, src/lib/supabase.ts, src/middleware.ts  · → AC-7

_Nach T3–T5 wendet `/build` die Migrationen per `supabase db push` auf das Dev-Projekt an und prüft mit `supabase migration list`._

## Ebene 2 — API / Server-Logik

<!-- Server Actions und Routen. Bauen auf Schema und Clients aus Ebene 1 auf. Alle Dateien disjunkt → alle [P]. -->

- [ ] T7 [P]  Zod-Schemas + Auth-Server-Actions: Registrieren (neutrale Erfolgsmeldung), Login (Konto-Throttle 5/15 min, Zähler-Reset bei Erfolg, identische Fehlermeldungen), Logout, Reset anfordern (neutral), Passwort setzen (≥ 8)  · files: src/lib/validations/auth.ts, src/app/(auth)/actions.ts  · → AC-1, AC-2, AC-3, AC-5, AC-6, AC-9, AC-10, AC-13, AC-14, EC-1, EC-5, EC-6
- [ ] T8 [P]  Bestätigungs-Route `/auth/confirm`: Token einlösen, eingeloggt zur Startseite; abgelaufene/benutzte Links → Fehlerseite mit „Neuen Link anfordern"  · files: src/app/auth/confirm/route.ts  · → AC-4, EC-2
- [ ] T9 [P]  Geocoding-Proxy `/api/geocode`: OWM Geocoding, ab 2 Zeichen, max. 5 Treffer („Name, Land"), Key nur serverseitig, nur für eingeloggte Nutzer  · files: src/app/api/geocode/route.ts  · → AC-12, EC-3
- [ ] T10 [P]  Profil-Actions: Profil aktualisieren (Zod: Anzeigename max. 50, Ort nur vollständig), Daten-Export als JSON-Download, Konto löschen (rpc `delete_user` + Logout)  · files: src/app/profile/actions.ts  · → AC-11, AC-15, AC-16

## Ebene 3 — UI

<!-- Seiten und Komponenten gegen die fertigen Actions/Routen aus Ebene 2. Alle Dateien disjunkt → alle [P]. -->

- [ ] T11 [P]  Auth-Seiten: `/login`, `/register`, `/forgot-password`, `/reset-password` — Formulare (react-hook-form + Zod), Validierungsanzeige, neutrale Meldungen, zentriertes Karten-Layout  · files: src/app/(auth)/layout.tsx, src/app/(auth)/login/page.tsx, src/app/(auth)/register/page.tsx, src/app/(auth)/forgot-password/page.tsx, src/app/(auth)/reset-password/page.tsx  · → AC-1, AC-2, AC-3, AC-5, AC-9, AC-10
- [ ] T12 [P]  AppHeader (Logo, Konto-Menü mit Profil + Abmelden — ohne Nav-Links, die ergänzt PROJ-2) + AppFooter (Link „Datenschutz") + Einbindung ins Root-Layout  · files: src/components/app-header.tsx, src/components/app-footer.tsx, src/app/layout.tsx  · → AC-6, AC-17
- [ ] T13 [P]  LocationSearch-Komponente: tippen → Vorschläge → Auswahl; „kein Ort gefunden"-Zustand  · files: src/components/location-search.tsx  · → AC-12, EC-3
- [ ] T14 [P]  Profilseite: Formular (Anzeigename, Wohnort via LocationSearch), Daten-Export-Button, „Konto löschen" mit AlertDialog; Eingaben bleiben bei Fehlern erhalten  · files: src/app/profile/page.tsx, src/components/profile-form.tsx  · → AC-11, AC-12, AC-15, AC-16, EC-4
- [ ] T15 [P]  Datenschutz-Seite (statisch, Inhalte aus `docs/privacy.md`-Angaben) + Startseite `/` (geschützter Platzhalter „Vorschläge — kommt mit PROJ-3")  · files: src/app/datenschutz/page.tsx, src/app/page.tsx  · → AC-17, AC-4, AC-5

## Ebene 4 — Feinschliff

- [ ] T16  Integration & Feinschliff: Lade-/Fehlerzustände nach Seitenmuster (`docs/app-shell.md`), Toasts (sonner), sichtbare Fokus-Zustände, Meldungstexte auf Identität gegenprüfen (keine Enumeration), Doppel-Submit-Sperre auf allen Formularen  · files: UI-Dateien aus Ebene 3 (sequenziell, kein [P])  · → AC-14, EC-1, EC-4, EC-5

## Parallelisierung

- **Ebenen sind Barrieren.** Eine Ebene startet erst, wenn die vorige vollständig integriert und gegen ihre AC-IDs geprüft ist. So bleibt der Datenvertrag vor der UI: Schema (E1) → API (E2) → UI (E3).
- **`[P]` verlangt disjunkte Dateien.** Zwei `[P]`-Aufgaben derselben Ebene nennen nie denselben Pfad unter `files:`.
- **`[user]`-Aufgaben werden nie gebaut und nie parallelisiert.** T1–T3 stehen in Ebene 1, weil `supabase db push` und die Keys von ihnen abhängen; `/build` übergibt sie und macht weiter — die Kästchen hakt der Nutzer ab. Ein Feature mit offener `[user]`-Aufgabe ist nicht fertig.
- Während `/build` läuft jede `[P]`-Aufgabe der aktiven Ebene in einem eigenen Subagenten mit isoliertem Worktree; der Hauptagent integriert, prüft gegen die AC-IDs der Ebene und hakt hier ab. Subagenten erklären sich nie selbst für fertig — es gibt einen Verifikations-Owner.
