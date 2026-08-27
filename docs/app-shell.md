# App Shell & Navigation

> Die app-weite Karte des **Rahmens, in dem jedes Feature angezeigt wird** — Navigation, Layout-Regionen und die Muster, die jede Seite wiederholt.
>
> - Erstellt von `/init` (der erste ganzheitliche Blick: Hauptbereiche + Layout).
> - Verfeinert von `/architecture`, wenn ein Feature im Detail entworfen wird.
> - **Flughöhe:** Struktur, nicht Styling. Welche Bereiche es gibt, wo sie liegen, wer sie sieht, was jede Seite teilt. Farben, Schriften und Komponenten-Styling gehören in `docs/design-system.md`; das Innere einer einzelnen Seite in das `design.md` des jeweiligen Features.

## Verantwortliches Feature

Owner: **PROJ-2 (Aktivitäten & Bedingungen)** — das erste Feature, das einen Bereich mit dem Rahmen baut. Änderungen am Rahmen laufen über `/refine PROJ-2`, nie direkt in ein anderes Feature.

## Hauptbereiche

| Bereich | Was man dort tut | Sichtbar für | Feature |
|---------|------------------|--------------|---------|
| Vorschläge (Startseite, `/`) | Passende Zeitslots der nächsten 5 Tage pro Aktivität sehen | angemeldete Nutzer | PROJ-3 |
| Aktivitäten | Aktivitäten mit Bedingungen anlegen und pflegen | angemeldete Nutzer | PROJ-2 |
| Profil (im Konto-Menü, kein Nav-Link) | Anzeigename und Standard-Standort pflegen, Abmelden | angemeldete Nutzer | PROJ-1 |

## Layout-Regionen

- **Header:** Logo/App-Name links, daneben die zwei Navigationslinks (aktiver Bereich markiert), rechts das Konto-Menü.
- **Content:** darunter, der eigentliche Inhalt des Features.
- **Keine Sidebar** — die App hat nur zwei Hauptbereiche.
- **Mobile:** unterhalb `md` klappen die Navigationslinks in ein Burger-Menü im Header.

## Seitenmuster

- **Seitenkopf:** Titel links, Hauptaktion rechts (z.B. „Neue Aktivität").
- **Ladezustand:** Skeletons an der Stelle des Inhalts, keine Vollbild-Spinner.
- **Leerzustand:** Erklärung plus Handlungsaufforderung („Noch keine Aktivitäten — lege deine erste an").
- **Fehlerzustand:** Hinweis mit „Erneut versuchen", kein stiller Fehlschlag.
- **Toasts / Feedback:** Bestätigungen als Toast (sonner), unten rechts.

## Auth-Zustände

- **Abgemeldet:** nur Login, Registrierung, Passwort-Reset und die Datenschutzerklärung erreichbar (PROJ-1); der Header zeigt keine Navigation.
- **Angemeldet:** volle Navigation; nach dem Login landet man auf „Vorschläge".
- **Rollen:** keine — alle angemeldeten Nutzer sehen dasselbe.

## Shell-Komponenten

| Komponente | Datei | Zweck |
|------------|-------|-------|
| AppHeader | `src/components/app-header.tsx` | Logo/App-Name + Konto-Menü; **erstellt von PROJ-1** (ohne Nav-Links), Navigationslinks ergänzt PROJ-2 als Shell-Owner |
| AppFooter | `src/components/app-footer.tsx` | Footer mit Link „Datenschutz" auf jeder Seite (auch ausgeloggt); erstellt von PROJ-1 |
| LocationSearch | `src/components/location-search.tsx` | Orts-Suchfeld (tippen → Vorschläge → Auswahl); erstellt von PROJ-1, wiederverwendet von PROJ-2 |

---

_Dies ist ein lebendes Dokument. Wenn `/architecture` ein Feature entwirft, das einen Nav-Eintrag, eine Layout-Region oder ein neues Seitenmuster hinzufügt, wird diese Karte zuerst aktualisiert. Verhaltensänderungen am Rahmen laufen über `/refine` auf dem verantwortlichen Feature._
