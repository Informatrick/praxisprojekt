# PROJ-2 Tasks

> Erstellt von `/tasks` aus `spec.md` + `design.md`. Der geordnete, nachvollziehbare Bauplan — die Brücke zwischen Vertrag (WAS) und Build (WIE).
> `[P]` = parallelisierbar: die Dateien der Aufgabe überschneiden sich mit keiner anderen `[P]`-Aufgabe derselben Ebene, `/build` kann sie an einen eigenen Subagenten geben.
> Ebenen laufen **nacheinander** (jede ist eine Barriere). Aufgaben **innerhalb** einer Ebene laufen parallel, wo `[P]` steht. Jede Aufgabe referenziert die AC-IDs aus `spec.md` — das ist die Kette AC → Task → Test.
> Owner: `/tasks` erstellt diese Datei; `/build` hakt die Kästchen ab.

## Ebene 1 — Daten

<!-- Fundament: die activities-Tabelle mit Regeln und Zugriff. Alles Weitere baut darauf auf. -->

- [ ] T1  Migration `activities`: Tabelle (id, user_id, name, temp_min/max, no_rain, wind_max, time_from/to, weekdays, location_name/lat/lon, Zeitstempel); Check-Constraints (mind. eine Wetterbedingung, temp-min<max, zeit-von<bis, Standort vollständig-oder-leer); RLS owner-only für select/insert/update/delete; Fremdschlüssel `user_id` → auth.users ON DELETE CASCADE  · files: supabase/migrations/20260827110000_activities.sql  · → AC-1, AC-3, AC-4, AC-5, AC-8, AC-12

_Danach wendet `/build` die Migration per `supabase db push` auf das Dev-Projekt an und prüft mit `supabase migration list`._

## Ebene 2 — Server-Logik

<!-- Zod-Validierung + Server Actions gegen Schema und RLS aus Ebene 1. Disjunkte Dateien → beide [P]. -->

- [ ] T2 [P]  Zod-Schema + CRUD-Server-Actions (Anlegen, Bearbeiten, Löschen, Liste): serverseitige Validierung inkl. „mindestens eine Wetterbedingung", Standort vollständig-oder-leer, mindestens ein Wochentag; 0-Zeilen-Erkennung bei Update/Delete (freundlicher Hinweis); last-write-wins ohne Konfliktprüfung  · files: src/lib/validations/activity.ts, src/app/activities/actions.ts  · → AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-9, AC-10, EC-1, EC-4, EC-5
- [ ] T3 [P]  Daten-Export (aus PROJ-1) um die Aktivitäten des Nutzers erweitern (Platzhalter ersetzen)  · files: src/app/profile/actions.ts  · → AC-13

## Ebene 3 — UI

<!-- Seiten und Komponenten gegen die fertigen Actions aus Ebene 2. Alle Dateien disjunkt → alle [P]. -->

- [ ] T4 [P]  AppNav: Nav-Links „Vorschläge" (/) und „Aktivitäten" (/activities) mit Aktiv-Markierung + mobiles Burger-Menü (Sheet); eingebunden in den AppHeader  · files: src/components/app-nav.tsx, src/components/app-header.tsx  · → AC-8
- [ ] T5 [P]  Aktivitäten-Seite: Seitenkopf mit „Neue Aktivität", Liste, Aktivitätskarten (Zusammenfassung der Bedingungen, Bearbeiten/Löschen), Leerzustand „Noch keine Aktivitäten — lege deine erste an!", Löschen-Bestätigung (AlertDialog)  · files: src/app/activities/page.tsx, src/components/activity-list.tsx, src/components/activity-card.tsx  · → AC-8, AC-10, AC-11, EC-5
- [ ] T6 [P]  ActivityForm (Anlegen + Bearbeiten, Dialog): Name, Temperatur min/max, „kein Regen"-Schalter, Wind max, Zeitfenster, Wochentag-Umschalter (Standard alle), LocationSearch; Hinweistexte „mindestens eine Bedingung" und „ohne Standort keine Vorschläge"  · files: src/components/activity-form.tsx  · → AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-9, EC-2, EC-4

## Ebene 4 — Feinschliff

- [ ] T7  Integration & Feinschliff: Lade-/Fehlerzustände nach Seitenmuster (`docs/app-shell.md`), Toasts (sonner), sichtbare Fokus-Zustände, Doppel-Submit-Sperre auf dem Formular  · files: src/app/activities/loading.tsx + UI-Dateien aus Ebene 3 (sequenziell, kein [P])  · → AC-1, EC-3, EC-4

## Parallelisierung

- **Ebenen sind Barrieren.** Eine Ebene startet erst, wenn die vorige vollständig integriert und gegen ihre AC-IDs geprüft ist. So bleibt der Datenvertrag vor der UI: Schema (E1) → API (E2) → UI (E3).
- **`[P]` verlangt disjunkte Dateien.** Zwei `[P]`-Aufgaben derselben Ebene nennen nie denselben Pfad unter `files:`.
- **Keine `[user]`-Aufgaben:** Supabase-Projekt, Keys und `link` bestehen aus PROJ-1; die neue Migration wird per `supabase db push` nachgezogen (Teil von `/build`, kein Dashboard-Schritt).
- Während `/build` läuft jede `[P]`-Aufgabe der aktiven Ebene in einem eigenen Subagenten mit isoliertem Worktree; der Hauptagent integriert, prüft gegen die AC-IDs der Ebene und hakt hier ab.
