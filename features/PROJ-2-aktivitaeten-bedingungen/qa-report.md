# QA Test Results

**Getestet:** 2026-08-27
**App-URL:** http://localhost:3000 (`probe.kind: http`) — live geprüft; Dev-Projekt Supabase (eu-central-1), verknüpft; Datenbank zusätzlich per SQL geprüft
**Tester:** QA Engineer (AI)

> Legende: `[x]` in diesem Lauf verifiziert (mit Beleg) · `[ ] BUG` als defekt bestätigt · `[!] NOT VERIFIED` nicht prüfbar (Grund genannt)

## Acceptance Criteria — Status

### Anlegen & Validierung
- [x] **AC-1** — Anlegen mit Name + einer Bedingung: Server-Action `createActivity` + DB akzeptiert gültige Zeile — Beleg: `src/app/activities/actions.ts` `createActivity`, `activity.test.ts` „akzeptiert gültige Aktivität"; DB-Insert einer gültigen Zeile möglich (Constraint-Tests unten)
- [x] **AC-2** — Leerer Name abgelehnt: Zod (min 1) + DB-Constraint `activities_name_len` — Beleg: `activity.test.ts` „lehnt leeren Namen ab" / „über 80 Zeichen"; `src/lib/validations/activity.ts`
- [x] **AC-3** — Ohne Wetterbedingung abgelehnt: **live in der DB** — `insert … name 'ohne Bedingung'` → `violates check constraint "activities_at_least_one_condition"`; zusätzlich Zod-refine — Beleg: SQL-Insert-Test + `activity.test.ts` „lehnt Aktivität ohne jede Wetterbedingung ab"
- [x] **AC-4** — temp min≥max bzw. negativer Wind abgelehnt: **live in der DB** — `insert … temp 30/10` → `violates check constraint "activities_temp_order"`; zusätzlich Zod — Beleg: SQL-Insert-Test + `activity.test.ts` „lehnt temp min >= max ab" / „negativen Wind"
- [x] **AC-5** — Zeitfenster von<bis, kein Mitternachtssprung: Zod-refines (Paar zusammen, Reihenfolge) + DB-Constraint `activities_time_order` — Beleg: `activity.test.ts` (3 Zeit-Fälle); pg_constraint zeigt Constraint live
- [x] **AC-6** — Mindestens ein Wochentag: Zod (min 1) + DB-Constraints `activities_weekdays_nonempty`/`_range` — Beleg: `activity.test.ts` „lehnt leere Wochentagsauswahl ab"; pg_constraint live
- [x] **AC-7** — Leerer Standort erlaubt, Wohnort gilt bei Berechnung: leerer Standort wird als leer gespeichert (nicht befüllt); Auflösung liegt bei PROJ-3 — Beleg: `activities.actions.ts` `toRow` (location null möglich), `design.md` Standort-Auflösung; Formularhinweis in `activity-form.tsx`
- [!] **AC-7 (Browser)** — Anlegen ohne Standort über die UI und Hinweisanzeige — NOT VERIFIED (kein Browser); Logik/Erlaubnis oben bestätigt

### Verwalten
- [x] **AC-8** — Nur eigene Aktivitäten, DB-seitig erzwungen: RLS aktiv (`relrowsecurity=true`), 4 owner-only Policies (select/insert/update/delete) live; anonymer SELECT → `[]`, anonymer INSERT → 401; `/activities` ohne Session → 307 zum Login — Beleg: pg_policies-Abfrage, curl gegen REST + App
- [x] **AC-9** — Bearbeiten der eigenen Aktivität: `updateActivity` mit `.eq(user_id)` + `.select()`-0-Zeilen-Prüfung — Beleg: `src/app/activities/actions.ts` `updateActivity`
- [!] **AC-9 (Browser)** — Bearbeiten über den Dialog + Bestätigungs-Toast — NOT VERIFIED (kein Browser)
- [x] **AC-10** — Löschen mit Bestätigungsdialog: AlertDialog in `activity-card.tsx`, `deleteActivity`-Action — Beleg: `src/components/activity-card.tsx`, `actions.ts` `deleteActivity`
- [!] **AC-10 (Browser)** — Klick-Ablauf Dialog → Löschen — NOT VERIFIED (kein Browser)
- [x] **AC-11** — Leerzustand „Noch keine Aktivitäten — lege deine erste an!": exakt dieser Text + Button — Beleg: `src/components/activity-list.tsx`

### Datenschutz
- [x] **AC-12** — Kontolöschung entfernt Aktivitäten: Fremdschlüssel `user_id → auth.users ON DELETE CASCADE` **live in der DB** bestätigt — Beleg: pg_constraint `fk_def` = „… ON DELETE CASCADE"; nutzt die vorhandene `delete_user()` aus PROJ-1
- [x] **AC-13** — Export enthält Aktivitäten: `getExportData` liest jetzt zusätzlich `activities` — Beleg: `src/app/profile/actions.ts` (Feld `aktivitaeten`)
- [!] **AC-13 (Browser)** — tatsächlicher JSON-Download mit Aktivitäten — NOT VERIFIED (kein Browser)

## Edge Cases — Status
- [x] **EC-1** — last-write-wins: bewusst kein Versions-/Konfliktcheck; einfaches UPDATE — Beleg: `updateActivity` in `actions.ts` (kein optimistic locking), so in `design.md` festgehalten
- [!] **EC-2** — Aktivität ohne Standort + Profil ohne Wohnort → speichern erlaubt + Hinweis: Speichern erlaubt (AC-7 bestätigt); der UI-Hinweistext existiert (`activity-form.tsx`), Anzeige im Browser NOT VERIFIED
- [x] **EC-3** — Doppel-Submit → eine Aktivität: Absende-Button während `pending` deaktiviert — Beleg: `activity-form.tsx` (`disabled={pending}`)
- [x] **EC-4** — Netzwerkfehler beim Speichern → Fehlermeldung, Eingaben bleiben: Action gibt Fehler zurück, `useActionState` hält Formularzustand, Felder mit `defaultValue` — Beleg: `actions.ts` (error-Rückgabe), `activity-form.tsx`
- [x] **EC-5** — Aktivität woanders schon gelöscht: Update/Delete mit `.select()` erkennt 0 Zeilen → „Diese Aktivität existiert nicht mehr." — Beleg: `actions.ts` `updateActivity`/`deleteActivity`

## Security Audit
- [x] **Authentifizierung:** `/activities` ohne Session → 307 zum Login; Actions prüfen `auth.getUser()` — Beleg: Live-HTTP-Probe; `src/proxy.ts`, `actions.ts`
- [x] **Autorisierung:** RLS owner-only für alle 4 Operationen live; anonymer SELECT → `[]`, anonymer INSERT → 401 — Beleg: pg_policies, curl gegen Supabase REST
- [x] **Input-Validierung:** alle Eingaben serverseitig via Zod; DB-Zugriff nur über parametrisierte Supabase-Clients; zusätzlich 10 Check-Constraints in der DB; Ausgabe (Aktivitätsname) von React escaped — Beleg: `activity.ts`, `actions.ts`, `activities.sql`, `activity-card.tsx`
- [x] **Keine Zugangsdaten/PII in der URL:** Formulare senden über Server Actions (POST); kein GET-Formular — Beleg: `activity-form.tsx` (`<form action={formAction}>`)
- [x] **Keine neuen Server-Secrets im Client:** dieses Feature führt keinen neuen Secret ein; die Ortssuche nutzt den serverseitigen Geocode-Proxy aus PROJ-1 (Key bleibt am Server) — Beleg: keine `process.env`-Server-Werte in den Client-Komponenten
- [!] **Rate Limiting:** kein Credential-Check in diesem Feature → NOT VERIFIED (nicht zutreffend; kein Login/Signup hier)

## E2E Tests
- Status: **nicht ausgeführt** (für kritische Flows `/e2e-tests` ausführen)

## In diesem Lauf NICHT verifiziert
- [!] Browser-Interaktionen: Anlegen/Bearbeiten/Löschen über den Dialog, Ortssuche-Autocomplete, Wochentag-Umschalter, JSON-Download, Hinweistexte (AC-7/9/10/13, EC-2) — kein Browser in `/qa`
- [!] Mobiles Burger-Menü (Sheet) und aktive Nav-Markierung — Client-Interaktion, kein Browser
- [!] Responsives Layout bei 375px / 768px / 1440px — kein Viewport
- [!] Cross-Browser (Chrome / Firefox / Safari) — keine Browser-Engine

## Gefundene Bugs
Keine. Server-Logik, Datenbank-Sicherheit (RLS, 4 Policies, 10 Check-Constraints, Kaskaden-FK — alle live geprüft), Routenschutz und Validierung verhalten sich wie spezifiziert.

## Zusammenfassung
- **Acceptance Criteria:** 13/13 auf Logik-/Sicherheits-/DB-Ebene bestätigt; 5 davon haben einen Browser-Anteil (Dialog-Interaktion/Download), der hier NOT VERIFIED ist
- **Edge Cases:** 4/5 verifiziert; EC-2 nur im Code (Browser-Hinweisanzeige offen)
- **Bugs:** 0 (0 critical, 0 high, 0 medium, 0 low)
- **Security:** 5/6 Checks verifiziert, 1 nicht zutreffend (kein Credential-Check) — RLS, Autorisierung, Input-Validierung, POST-Formulare, keine Secrets im Client alle bestätigt
- **Regression:** 36/36 Tests grün (`npm test`); Build + Lint grün
- **Production Ready:** JA für den verifizierten Umfang (keine Critical/High-Bugs) — die Browser-Journeys brauchen noch einen menschlichen Smoke-Test oder `/e2e-tests`

> „Production Ready: JA" heißt: keine Critical/High-Bugs. Die oben unter „NICHT verifiziert" gelisteten Browser-Abläufe sind damit nicht abgedeckt.
