# Design-System

> Richtung: **frisch, freundlich, sportlich**. Vorgeschlagen von `/init`, vom Nutzer bestätigt.
> `/build` wendet diese Werte bei jedem Feature an, ohne nachzufragen. Konkrete Werte, keine Adjektive.

## Farben

Tokens im shadcn/ui-Format (CSS-Variablen in `src/app/globals.css`). Beide Themes sind von Anfang an definiert.

| Token | Hell | Dunkel | Verwendung |
|-------|------|--------|------------|
| `--background` | `#F8FAFC` | `#0F172A` | Seitenhintergrund — nie reines Weiß/Schwarz |
| `--foreground` | `#0F172A` | `#F1F5F9` | Text — nie reines Schwarz/Weiß |
| `--card` | `#FFFFFF` | `#1E293B` | Karten/Flächen (im Dunkeln eine Stufe heller als der Grund) |
| `--primary` | `#059669` | `#34D399` | Hauptaktionen, aktive Navigation — das satte Grün |
| `--primary-foreground` | `#FFFFFF` | `#052E16` | Text auf Primärflächen |
| `--accent` | `#0EA5E9` | `#38BDF8` | Hervorhebungen, Slot-Badges (Himmelblau) |
| `--destructive` | `#DC2626` | `#F87171` | Löschen, Fehler |
| `--muted` | `#F1F5F9` | `#1E293B` | Dezente Hintergründe (z.B. Primär-Hintergrund-Variante: Grün mit ~10% Deckkraft) |
| `--border` | `#E2E8F0` | `#334155` | Rahmen |

**Zustände der Primärfarbe:** Hover eine Stufe dunkler (hell: `#047857`) bzw. heller (dunkel: `#6EE7B7`), Aktiv noch eine Stufe weiter, dezente Hintergrund-Variante als Grün mit geringer Deckkraft. Nie eine flache, unmodulierte Markenfarbe über große Flächen.

## Typografie

- **Schrift:** Inter (über `next/font`), für Überschriften und Fließtext.
- **Gewichte:** Überschriften 600 (semibold), Fließtext 400, Hervorhebungen 500.
- **Größen:** Tailwind-Standardskala — Seitentitel `text-2xl`, Abschnittstitel `text-lg`, Fließtext `text-sm`/`text-base`, Nebentext `text-sm text-muted-foreground`.

## Radius, Abstände, Trennung

- **Eckenradius:** `--radius: 0.75rem` (12px) — **eine** Radius-Entscheidung, überall gleich.
- **Abstände:** 4px-Raster (Tailwind-Spacing); Seiteninhalt max. `max-w-5xl`, zentriert.
- **Trennung von Flächen:** feiner Rahmen (`border`) plus sehr dezenter Schatten (`shadow-sm`). Keine schweren Schatten.

## Komponenten-Konventionen

- **Buttons:** shadcn-Standardgröße; die Hauptaktion einer Seite ist immer genau ein Primär-Button (grün), Sekundäres als `outline`/`ghost`.
- **Formularfelder:** einheitliche Höhe (shadcn-Standard `h-9`), Label oberhalb, Fehlertext darunter in `--destructive`.
- **Hover & Fokus:** jedes interaktive Element hat einen sichtbaren Hover- **und** Fokus-Zustand (Fokusring in Primärfarbe) — Fokus ist Accessibility, keine Kür.
- **Ladezustände:** Skeletons an Ort und Stelle, keine Vollbild-Spinner.
- **Leerzustände:** Icon (lucide) + ein Satz Erklärung + Handlungsaufforderung als Button.
- **Toasts:** sonner, unten rechts, für Bestätigungen und Fehler.

## Nicht verhandelbar

- Hell **und** Dunkel sind von Anfang an definiert; kein nachträgliches Dark-Mode-Retrofit.
- Nie reines `#000` oder `#fff` für Hintergrund oder Text.
- Textkontrast mindestens **4,5:1** gegen den eigenen Hintergrund, in beiden Themes.
- Installierte shadcn/ui-Komponenten werden nie durch Eigenbauten ersetzt.
