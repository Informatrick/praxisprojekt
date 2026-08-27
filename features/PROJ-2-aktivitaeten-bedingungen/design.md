# PROJ-2 — Tech Design

> Technisches Design (das WIE) für Aktivitäten & Bedingungen. Zwei Leser: der PM (muss freigeben) und `/build` (setzt dagegen um). Kein Code — aber implementierungsgenau: jedes Feld mit Typ und Regeln, Zugriff und Eigentümerschaft explizit.
> Owner: `/architecture`. Der Vertrag (WAS) steht in `spec.md`; die Aufgabenliste in `tasks.md`.

## Komponentenstruktur

```
Header (AppHeader, erweitert von PROJ-2 als Shell-Owner)
+-- Nav-Links: „Vorschläge" (/) · „Aktivitäten" (/activities) — aktiver Bereich markiert
+-- Mobile: Burger-Menü (Sheet) mit denselben Links
+-- Konto-Menü rechts (aus PROJ-1, unverändert)

/activities — Aktivitäten-Seite (geschützt)
+-- Seitenkopf: Titel „Aktivitäten" + Button „Neue Aktivität"
+-- Leerzustand: „Noch keine Aktivitäten — lege deine erste an!" + Button (bei 0 Einträgen)
+-- Aktivitätenliste
|   +-- ActivityCard je Aktivität: Name, Zusammenfassung der Bedingungen
|       (z. B. „5–25°, kein Regen, Wind ≤ 20, Mo–Fr 6–20 Uhr, Linz"),
|       Buttons „Bearbeiten" und „Löschen"
+-- ActivityForm (Dialog) — zum Anlegen und Bearbeiten
|   +-- Name (Pflicht)
|   +-- Temperatur min / max (optional)
|   +-- „Kein Regen" (Schalter)
|   +-- Wind max (optional)
|   +-- Zeitfenster Von / Bis (optional, zusammen)
|   +-- Wochentage (7 Umschalt-Buttons, Standard alle)
|   +-- Standort (LocationSearch aus PROJ-1; leer = Wohnort aus Profil)
|   +-- Hinweistexte: „mindestens eine Wetterbedingung" (AC-3) und
|       „ohne Standort keine Vorschläge" (EC-2)
+-- Lösch-Bestätigung (AlertDialog)
```

## Datenmodell

**Tabelle `activities`** — eine Zeile pro Aktivität, gehört einem Nutzer:

- **id** — UUID, Primärschlüssel
- **user_id** — UUID, Fremdschlüssel auf den Auth-Nutzer, Pflicht; **ON DELETE CASCADE** (Kontolöschung entfernt die Aktivitäten, AC-12)
- **name** — Text, Pflicht, 1–80 Zeichen
- **temp_min** — Ganzzahl °C, optional, Bereich −50…60
- **temp_max** — Ganzzahl °C, optional, Bereich −50…60
- **no_rain** — Boolean, Standard `false` (true = Bedingung „kein Regen" aktiv)
- **wind_max** — Zahl km/h, optional, ≥ 0
- **time_from** — Uhrzeit, optional
- **time_to** — Uhrzeit, optional
- **weekdays** — Liste von Wochentagen als Ganzzahlen **1–7 (ISO: 1 = Montag … 7 = Sonntag)**, mindestens ein Eintrag, Standard bei neuer Aktivität alle sieben
- **location_name** — Text, optional
- **location_lat** — Dezimalzahl, optional
- **location_lon** — Dezimalzahl, optional
- **created_at / updated_at** — Zeitstempel

**Regeln auf Datenbankebene (Check-Constraints):**
- Mindestens eine Wetterbedingung: `temp_min` ODER `temp_max` gesetzt, ODER `no_rain = true`, ODER `wind_max` gesetzt (AC-3)
- Wenn `temp_min` und `temp_max` beide gesetzt: `temp_min < temp_max` (AC-4)
- Wenn `time_from` und `time_to` beide gesetzt: `time_from < time_to` (AC-5)
- Standort vollständig oder gar nicht: entweder alle drei (`location_name`, `location_lat`, `location_lon`) gesetzt oder alle drei leer (wie bei `profiles`)

Zugriff: Nur der Eigentümer kann seine Aktivitäten lesen, anlegen, ändern und löschen — Row Level Security, owner-only, für **alle vier** Operationen (`auth.uid() = user_id`). Anders als `profiles` (dort nur select/update) braucht diese Tabelle auch insert- und delete-Policies, weil der Client Aktivitäten direkt anlegt und löscht.
Aufbewahrung: bis der Nutzer die Aktivität löscht oder sein Konto löscht.

**Standort-Auflösung (AC-7):** Ist bei der Aktivität kein Standort gesetzt, gilt der Wohnort aus dem Profil. Die Auflösung passiert **nicht** in der Datenbank, sondern beim Lesen/Berechnen: PROJ-3 nimmt den Aktivitäts-Standort, sonst den Profil-Wohnort. In `activities` wird ein leerer Standort als „leer" gespeichert, nicht mit dem Profilwert gefüllt — sonst würde eine spätere Profiländerung nicht mehr durchschlagen.

## Verhalten & Zugriff

Alle Schreibvorgänge laufen über serverseitige Actions mit Zod-Validierung; Sitzung serverseitig geprüft, RLS als zweite Ebene.

- **Anlegen** — eingeloggt; Name (1–80) + mindestens eine Wetterbedingung + gültige Zahlen/Zeiten + mindestens ein Wochentag; `user_id` = aktueller Nutzer (AC-1, AC-2, AC-3, AC-4, AC-5, AC-6)
- **Liste** — liefert nur die eigenen Aktivitäten, neueste zuerst (AC-8)
- **Bearbeiten** — nur die eigene Aktivität; gleiche Validierung wie Anlegen (AC-9)
- **Löschen** — nur die eigene Aktivität; UI zeigt vorher Bestätigungsdialog (AC-10)
- **Daten-Export (AC-13)** — die bestehende Export-Action aus PROJ-1 (`src/app/profile/actions.ts` → `getExportData`) wird erweitert: sie liest zusätzlich die Aktivitäten des Nutzers und legt sie in die JSON-Datei. Der in PROJ-1 hinterlassene Platzhalter „PROJ-2 ergänzt hier die Aktivitäten" wird ersetzt.
- **Konto löschen (AC-12)** — kein neuer Code: der Fremdschlüssel `user_id … ON DELETE CASCADE` sorgt dafür, dass die vorhandene `delete_user()`-Funktion aus PROJ-1 die Aktivitäten mitnimmt.

**Garantien hinter den Timing-Edge-Cases:**
- **EC-1 (gleichzeitige Bearbeitung, last-write-wins):** bewusst **keine** Versions-/Konfliktprüfung — ein einfaches UPDATE überschreibt. Das ist die Produktentscheidung aus der Spec, hier als Technische Entscheidung festgehalten, damit `/build` keine Optimistic-Locking-Logik erfindet.
- **EC-3 (Doppel-Submit):** der Absende-Button ist während der Verarbeitung deaktiviert; zwei gleichnamige Aktivitäten sind fachlich erlaubt (kein Unique-Constraint auf dem Namen), daher ist die Button-Sperre der richtige Schutz gegen das versehentliche Doppelanlegen.
- **EC-5 (Aktivität woanders schon gelöscht):** UPDATE bzw. DELETE trifft dann 0 Zeilen; die Action erkennt „0 betroffen" und gibt einen freundlichen Hinweis zurück („Diese Aktivität existiert nicht mehr"), statt still zu scheitern.

## Abhängigkeiten

Keine neuen Pakete. Alle benötigten shadcn/ui-Komponenten sind bereits installiert: Dialog, AlertDialog, Input, Label, Switch, Button, Card, Sheet (mobiles Menü), sowie die `use-mobile`-Hook und die `LocationSearch`-Komponente aus PROJ-1.

Für die Wochentag-Auswahl werden 7 Umschalt-Buttons aus dem vorhandenen Button-Baustein gebaut (kein neues Toggle-Group-Paket nötig).

## Settings the user makes

keine — dieses Feature braucht keine Dashboard-Einstellung. (Migrationen werden wie in PROJ-1 per `supabase db push` auf das bereits verknüpfte Dev-Projekt angewandt.)

## Technische Entscheidungen

| Entscheidung | Begründung | Erwogene Alternative | Trade-off | Datum |
| --- | --- | --- | --- | --- |
| Wetterbedingungen als eigene Spalten in `activities` (nicht als JSON) | Feste, kleine Menge an Bedingungen; einzelne Spalten sind per Check-Constraint validierbar und für PROJ-3 direkt abfragbar | Ein JSON-Feld „conditions" | JSON wäre flexibler für spätere Bedingungsarten, aber ohne DB-seitige Validierung und schwerer abzufragen | 2026-08-27 |
| „Mindestens eine Bedingung" als DB-Check-Constraint **und** Zod | Zwei unabhängige Ebenen (AC-3); die DB hält die Regel auch, wenn je ein Client sie umgeht | Nur Zod-Validierung | Etwas mehr Migrationsaufwand; dafür kann keine ungültige Zeile entstehen | 2026-08-27 |
| Wochentage als Integer-Liste 1–7 (ISO, Mo=1) | Kompakt; passt zu der Wochentags-Rechnung, die PROJ-3 für Forecast-Zeitstempel braucht | 7 Boolean-Spalten; oder Bitmaske | Array ist gut lesbar und indexfrei ausreichend; Bitmaske wäre kryptisch | 2026-08-27 |
| Leerer Standort bleibt leer, Profil-Wohnort wird erst bei der Berechnung eingesetzt | Eine spätere Profiländerung schlägt so auf alle Aktivitäten ohne eigenen Ort durch (AC-7) | Profil-Wohnort beim Speichern in die Aktivität kopieren | Kopieren würde den Ort „einfrieren" und bei Profiländerung veralten | 2026-08-27 |
| last-write-wins ohne Konfliktprüfung (EC-1) | Einzelnutzer-Produkt; gleichzeitige Selbstbearbeitung ist ein Randfall | Optimistic Locking mit Versionsspalte | Spürbarer Mehraufwand in Form und Action für sehr seltenen Fall | 2026-08-27 |
| Nav-Links direkt im AppHeader (PROJ-2 ist Shell-Owner) | PROJ-2 besitzt die App-Shell laut `docs/app-shell.md`; Erweiterung gehört legitim hierher, kein zweiter Header | Separate Nav-Komponente in einem eigenen Feature | Header wächst leicht; dafür keine Zersplitterung des Rahmens | 2026-08-27 |
| Kontolöschung & Kaskade über vorhandene `delete_user()` + FK ON DELETE CASCADE | Wiederverwendung der PROJ-1-Mechanik; kein zusätzlicher Löschpfad (AC-12) | Eigene Löschlogik in PROJ-2 | Keiner — die Kaskade ist der robusteste Weg | 2026-08-27 |

## Offene Fragen

- keine
