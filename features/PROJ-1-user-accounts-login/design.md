# PROJ-1 — Tech Design

> Technisches Design (das WIE) für Benutzerkonten & Login. Zwei Leser: der PM (muss freigeben) und `/build` (setzt dagegen um). Kein Code — aber implementierungsgenau: jedes Feld mit Typ und Regeln, Zugriff und Eigentümerschaft explizit.
> Owner: `/architecture`. Der Vertrag (WAS) steht in `spec.md`; die Aufgabenliste in `tasks.md`.

## Komponentenstruktur

```
Öffentliche Seiten (ohne Navigation, zentriertes Karten-Layout)
+-- /login            Login-Formular (E-Mail, Passwort, Links zu Registrierung & „Passwort vergessen")
+-- /register         Registrierungs-Formular (E-Mail, Passwort) + Erfolgshinweis „Postfach prüfen"
+-- /forgot-password  E-Mail-Eingabe für Reset-Link + neutrale Bestätigung
+-- /reset-password   Neues Passwort setzen (nur über gültigen Reset-Link erreichbar)
+-- /auth/confirm     Technische Route: löst den Bestätigungs-/Reset-Link ein und leitet weiter
+-- /datenschutz      Datenschutzerklärung (statisch, von jeder Seite über den Footer erreichbar)

Geschützte Seiten (im App-Rahmen)
+-- /profile          Profilseite
    +-- Formular: Anzeigename, Wohnort (Suchfeld mit Vorschlagsliste)
    +-- Bereich „Meine Daten": Daten-Export (JSON-Download)
    +-- Gefahrenzone: „Konto löschen" mit Bestätigungsdialog (AlertDialog)

Gemeinsame Bausteine (dieses Feature erstellt sie)
+-- AppHeader         Logo/App-Name links, Konto-Menü rechts (Profil, Abmelden)
|                     — noch OHNE Navigationslinks; die ergänzt PROJ-2 als Shell-Owner
+-- AppFooter         Link „Datenschutz" (auf jeder Seite, auch ausgeloggt)
+-- LocationSearch    Wiederverwendbares Orts-Suchfeld (tippen → Vorschläge → Auswahl);
                      PROJ-2 nutzt es später für den Aktivitäts-Standort
```

## Datenmodell

**Tabelle `profiles`** — ein Datensatz pro Konto, automatisch beim Signup angelegt (Datenbank-Trigger auf neue Auth-Nutzer):

- ID — eindeutig, identisch mit der Auth-Nutzer-ID
- Anzeigename — Text, max. 50 Zeichen, optional
- Wohnort-Name — Text, z.B. „Linz, AT", optional
- Wohnort-Koordinaten — Breiten-/Längengrad (Dezimalzahlen), optional; immer zusammen mit dem Namen gesetzt (ein Ort ist entweder vollständig oder gar nicht gespeichert)
- Angelegt am / geändert am — Zeitstempel

Zugriff: Nur der Nutzer selbst kann sein Profil lesen und ändern (Row Level Security, owner-only). Anlegen übernimmt der Trigger, Löschen die Kontolöschung (siehe unten) — der Client kann beides nicht direkt.
Aufbewahrung: bis zur Kontolöschung; dann wird der Datensatz mitgelöscht.

**Tabelle `login_throttle`** — interner Zähler für den Missbrauchsschutz (AC-13):

- E-Mail (normalisiert) — Schlüssel
- Fehlversuche im aktuellen Fenster — Zahl
- Fensterbeginn / gesperrt bis — Zeitstempel

Zugriff: Kein Client-Zugriff (keine RLS-Policy für Nutzer); nur die Server-Logik liest und schreibt.
Aufbewahrung: Einträge sind nach Ablauf des 15-Minuten-Fensters bedeutungslos und werden beim nächsten Versuch überschrieben bzw. bereinigt — kein dauerhaftes Protokoll.

**Von Supabase Auth verwaltet** (Tabelle `auth.users`, nicht von uns entworfen): E-Mail, Passwort-Hash, Bestätigungsstatus, Login-Zeitstempel.

## Verhalten & Zugriff

Alle Auth-Vorgänge laufen über serverseitige Actions (POST per Design — keine Zugangsdaten in URLs, AC-Grundlage aus den Technical Requirements):

- **Registrieren** — jeder Besucher; E-Mail-Format und Passwort ≥ 8 Zeichen werden serverseitig validiert (Zod), dann Supabase-Signup mit Bestätigungs-Mail. Antwort ist immer dieselbe neutrale Erfolgsmeldung — auch wenn die E-Mail schon registriert ist (EC-1, AC-14).
- **E-Mail bestätigen** — der Link aus der Mail landet auf `/auth/confirm`, das Konto wird aktiv, Weiterleitung eingeloggt auf die Startseite (AC-4). Abgelaufene/benutzte Links → verständliche Fehlerseite mit „Neuen Link anfordern" (EC-2).
- **Login** — vor dem eigentlichen Anmeldeversuch prüft die Server-Action den Throttle (siehe Sicherheit); danach Supabase-Login. Fehlermeldung immer identisch, egal ob E-Mail unbekannt, Passwort falsch oder Konto gelöscht (AC-14, EC-6). Unbestätigtes Konto → eigener Hinweis auf die Bestätigung (AC-3).
- **Logout** — beendet die Sitzung serverseitig, Weiterleitung zum Login (AC-6).
- **Passwort-Reset anfordern** — immer dieselbe neutrale Bestätigung; Mail geht nur an existierende Konten (AC-9).
- **Neues Passwort setzen** — nur mit gültigem Reset-Link; ≥ 8 Zeichen; danach gilt nur noch das neue Passwort (AC-10).
- **Profil lesen/ändern** — nur eingeloggt, nur das eigene (AC-11); Wohnort nur als aufgelöster Treffer aus der Ortssuche speicherbar, nie als Freitext (AC-12, EC-3).
- **Ortssuche** — eingeloggte Nutzer tippen ≥ 2 Zeichen; eine Server-Route fragt die OpenWeatherMap Geocoding API ab (max. 5 Treffer, „Name, Land") — der API-Key bleibt serverseitig und erreicht nie den Browser.
- **Daten-Export** — nur eingeloggt; eine Server-Action sammelt alle Daten des Nutzers (Profil, E-Mail, später Aktivitäten) und liefert sie als JSON-Download (AC-16).
- **Konto löschen** — nur eingeloggt, nur nach Bestätigungsdialog; eine Datenbank-Funktion löscht den eigenen Auth-Nutzer, alle abhängigen Daten (Profil, künftig Aktivitäten) werden per Fremdschlüssel-Kaskade mitgelöscht; danach Logout (AC-15).

**Routenschutz:** Eine Middleware hält die Sitzung aktuell und leitet nicht eingeloggte Besucher von geschützten Seiten (`/`, `/profile`, künftig `/activities`) zum Login um (AC-7). Öffentlich sind nur die Auth-Seiten und `/datenschutz`. Zusätzlich prüft jede Server-Action selbst die Sitzung — zwei unabhängige Kontrollen, RLS ist die dritte.

**Garantie hinter den Timing-Edge-Cases:** Doppel-Submit bei der Registrierung (EC-5) — der Submit-Button sperrt während der Verarbeitung, und Supabase legt pro E-Mail ohnehin nur ein Konto an (Eindeutigkeit auf Datenbankebene); die zweite Anfrage erhält dieselbe neutrale Meldung. Der Throttle-Zähler wird atomar hochgezählt (ein einzelnes Update, kein Lesen-dann-Schreiben), damit parallele Fehlversuche nicht verloren gehen.

## Sicherheit / Brute-Force-Schutz (AC-13, AC-14)

Was Supabase selbst abdeckt: Die eingebauten Auth-Endpunkte sind **pro IP** limitiert (nicht änderbar); Mail-bezogene Limits (Signup-Bestätigung, Reset) sind im Dashboard konfigurierbar. Das stoppt **nicht**: einen geduldigen Angriff auf ein einzelnes Konto über wechselnde IPs und Credential Stuffing.

Deshalb zusätzlich ein **app-eigener Throttle pro Konto** in der Login-Action: 5 Fehlversuche pro E-Mail innerhalb von 15 Minuten → 15 Minuten Sperre für dieses Konto, mit klarer Meldung (AC-13). Gezählt wird in der Tabelle `login_throttle` (kein neuer Dienst nötig — die Datenbank ist schon da); erfolgreicher Login setzt den Zähler zurück.

- **Keine Konto-Enumeration:** identische Meldungen für „E-Mail unbekannt" und „Passwort falsch", neutrale Erfolgsmeldungen bei Registrierung und Reset (AC-14, EC-1).
- **Passwort-Policy:** min. 8 Zeichen, serverseitig validiert **und** in Supabase als Mindestlänge hinterlegt (Einstellung, siehe unten). Leaked-Password-Schutz (HaveIBeenPwned) ist ein Bezahl-Feature — bewusst weggelassen, siehe Entscheidungen.
- **Kein CAPTCHA:** Produktentscheidung aus der Spec; Restrisiko dokumentiert. Supabase-eigene Mail-Limits bremsen Massenregistrierung als Basisschutz.
- **MFA:** für dieses Produkt (Freizeitdaten, Praxisprojekt) bewusst nicht vorgesehen.

## Abhängigkeiten

- `@supabase/ssr` — **neu**: der offizielle Server-Side-Auth-Adapter für Next.js (Sitzung in Cookies, Middleware-Support). Aktuelle API-Form bei `/build` gegen Context7 prüfen.
- Bereits vorhanden: `@supabase/supabase-js`, `zod`, `react-hook-form`, shadcn/ui (Form, Input, Button, Card, AlertDialog, DropdownMenu, Command/Popover für die Ortssuche, sonner).

Neue Umgebungsvariablen (Platzhalter in `.env.local.example`, echte Werte trägt der Nutzer ein):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Dev-Projekt (Settings → API)
- `OPENWEATHER_API_KEY` — serverseitig (ohne `NEXT_PUBLIC_`-Präfix, erreicht nie den Browser); schon in PROJ-1 nötig für die Geocoding-Ortssuche

## Settings the user makes

Einstellungen im Supabase-Dashboard des **Dev-Projekts**, die kein Code setzen kann. `/tasks` macht daraus `[user]`-Aufgaben:

| Einstellung | Wo | Wert | Warum | → AC |
| --- | --- | --- | --- | --- |
| Supabase-Projekt anlegen | supabase.com, Region **eu-central-1 (Frankfurt)** | Dev-Projekt | Region ist unveränderlich; EU-Pflicht aus PRD | alle |
| DPA/AVV akzeptieren | Organization Settings → Legal Documents | akzeptiert | Auftragsverarbeitung, Art. 28 DSGVO (`docs/privacy.md`) | AC-17 |
| Passwort-Mindestlänge | Authentication → Sign In / Providers → Email | 8 Zeichen | AC-2 serverseitig auch bei Supabase erzwungen | AC-2 |
| E-Mail-Bestätigung | Authentication → Sign In / Providers → Email → Confirm email | an (Standard) | Konto erst nach Bestätigung nutzbar | AC-1, AC-3 |
| Site URL + Redirect-URLs | Authentication → URL Configuration | `http://localhost:3000` (+ `/auth/confirm`, `/reset-password`) | Bestätigungs- und Reset-Links müssen zur lokalen App zurückführen | AC-4, AC-10 |
| Auth-Rate-Limits | Authentication → Rate Limits | Standardwerte belassen | Basisschutz für Mail-Versand; unser Konto-Throttle liegt in der App | AC-13 |

## Technische Entscheidungen

| Entscheidung | Begründung | Erwogene Alternative | Trade-off | Datum |
| --- | --- | --- | --- | --- |
| Auth über `@supabase/ssr` mit Server Actions und Middleware | Offizielles Muster; POST per Design, Zugangsdaten nie in URLs; Sitzung serverseitig prüfbar | Client-seitige Auth mit `supabase-js` allein | Etwas mehr Setup; dafür Routenschutz und Server-Validierung überhaupt erst möglich | 2026-08-27 |
| Profil-Anlage per Datenbank-Trigger beim Signup | Profil existiert garantiert für jedes Konto; kein Client-Code kann es vergessen | Profil beim ersten Login aus der App anlegen | Trigger ist „unsichtbarer" Code — dafür lückenlos | 2026-08-27 |
| Kontolöschung über Security-Definer-Datenbankfunktion + Fremdschlüssel-Kaskade | Nutzer löscht nur sich selbst; kein Service-Role-Key in der App nötig (ein Leck dieses Keys wäre Totalschaden) | Server-Route mit Service-Role-Key | Funktion braucht sorgfältige Definition; dafür kleinere Angriffsfläche | 2026-08-27 |
| Login-Throttle als Datenbanktabelle mit atomarem Zähler | AC-13 verlangt Limit pro Konto; Supabase limitiert nur pro IP. DB ist vorhanden — kein neuer Dienst | Redis/Upstash-Ratelimit | Bei extremer Last langsamer als Redis — für dieses Produkt irrelevant | 2026-08-27 |
| Ortssuche über OpenWeatherMap Geocoding API, serverseitig proxied | Gleicher Anbieter und Key wie der Forecast (PROJ-3); Key bleibt auf dem Server | Open-Meteo Geocoding (ohne Key) | OWM-Key wird schon in PROJ-1 nötig statt erst in PROJ-3; dafür ein Anbieter für alles | 2026-08-27 |
| Migrations per Supabase CLI gegen das Dev-Projekt (`supabase link` + `db push`) | Schema als versionierte Dateien im Repo, Migrations-Ledger auf dem Dev-Projekt — kein „nur in Studio geklickt" | SQL manuell im Studio-Editor einfügen | Einmaliges `login`/`link` durch den Nutzer nötig; dafür nachvollziehbare Historie | 2026-08-27 |
| Leaked-Password-Schutz weggelassen | Bezahl-Feature bei Supabase; Praxisprojekt ohne Budget | Aktivieren (Pro-Plan) | Bekannt-geleakte Passwörter werden nicht abgewiesen | 2026-08-27 |
| AppHeader/Footer entstehen hier ohne Nav-Links; PROJ-2 (Shell-Owner) ergänzt die Navigation | PROJ-1 wird zuerst gebaut und braucht Konto-Menü + Datenschutz-Link; kein zweiter Rahmen | Shell komplett in PROJ-1 vorziehen | PROJ-1 wächst über sein Thema hinaus — abgelehnt, Ownership bleibt bei PROJ-2 | 2026-08-27 |

## Offene Fragen

- keine
