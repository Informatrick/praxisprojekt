# PROJ-3 — Tech Design

> Technisches Design (das WIE) für Slot-Vorschläge. Zwei Leser: der PM (muss freigeben) und `/build` (setzt dagegen um). Kein Code — aber implementierungsgenau: jede Regel benannt, Zugriff und Datenfluss explizit.
> Owner: `/architecture`. Der Vertrag (WAS) steht in `spec.md`; die Aufgabenliste in `tasks.md`.

## Komponentenstruktur

```
/ — Vorschläge-Seite (Startseite, geschützt, serverseitig gerendert)
+-- Seitenkopf: Titel „Vorschläge" (Seitenmuster aus docs/app-shell.md; keine Hauptaktion)
+-- Ladezustand: Skeleton-Blöcke an der Stelle der Aktivitäts-Blöcke (loading.tsx, wie /activities)
+-- Leerzustand (AC-10, bei 0 Aktivitäten): Erklärung + Button „Neue Aktivität" → /activities
+-- Fehlerzustand (AC-11, EC-3): „Wetterdaten gerade nicht verfügbar" + Button „Erneut versuchen"
|     (Client-Baustein; der Button lädt die Server-Seite neu — kein stiller Fehlschlag)
+-- Vorschlagsliste — ein Block pro Aktivität (AC-1), Reihenfolge wie auf /activities (neueste zuerst)
    +-- ActivitySuggestions (Block)
        +-- Kopf: Aktivitätsname + Bedingungs-Zusammenfassung (wiederverwendet
        |     `src/lib/activity-format.ts` aus PROJ-2) + Standortname
        +-- Fall A — Slots vorhanden: SlotCard je Slot (AC-2, AC-6)
        |     „Heute 17–20 Uhr" / „Jetzt bis 18 Uhr" (AC-7) / „Fr 9–15 Uhr"
        |     darunter kompakt: Temperaturspanne · max. Wind (km/h) · max. Regenwahrsch. (%)
        +-- Fall B — keine Slots (AC-9): „Kein passendes Zeitfenster in den nächsten 5 Tagen"
        +-- Fall C — kein Standort auflösbar (AC-8): Hinweis + Link zum Profil
              (kein Wohnort) bzw. zur Aktivität auf /activities (Ort dort setzen)
```

Die Seite ersetzt den Platzhalter in `src/app/page.tsx`. App-Shell unverändert: Bereich „Vorschläge" existiert in Nav und `docs/app-shell.md` bereits (Owner der Zeile: PROJ-3) — kein neuer Nav-Eintrag, keine neue Region.

**Datenschutzerklärung (AC-15):** Die bestehende Seite `src/app/datenschutz/page.tsx` bekommt im Empfänger-Abschnitt einen Eintrag zu OpenWeather Ltd — Zweck (Wettervorhersage/Ortssuche), übermittelte Daten (nur Koordinaten bzw. Suchbegriff), Exportland UK. Die inhaltliche Quelle ist `docs/privacy.md`.

## Datenmodell

**Keine neue Tabelle, keine Migration.** PROJ-3 liest nur:

- **`activities`** (PROJ-2) — alle Felder der Bedingungen; nur die eigenen Zeilen (Row Level Security, owner-only, unverändert)
- **`profiles`** (PROJ-1) — der Wohnort (Name + Koordinaten) als Standard-Standort

**Standort-Auflösung** (wie in PROJ-2 festgelegt): Aktivitäts-Standort, wenn gesetzt; sonst Profil-Wohnort; ist beides leer → Fall C (AC-8). Nie wird ein Ort in die Aktivität kopiert.

**Wetterdaten werden nicht gespeichert** (Beschluss aus `docs/data-model.md`). Der Forecast wird live geholt und in einem kurzlebigen serverseitigen Zwischenspeicher gehalten:

- **Schlüssel:** die Anfrage-URL mit auf 2 Dezimalstellen gerundeten Koordinaten (≈ 1 km — für einen stadtweiten Forecast mehr als genau genug)
- **Lebensdauer:** 30 Minuten (AC-12), danach automatisch frisch geholt
- **Inhalt:** nur Wetterdaten pro Koordinate — keine Nutzerkennung, kein Nutzerbezug (AC-14); zwei Nutzer mit demselben Ort teilen sich denselben Eintrag, das ist unbedenklich und spart Free-Tier-Aufrufe
- **Aufbewahrung:** verfällt nach 30 Minuten von selbst; nichts landet in der Datenbank

## Verhalten & Zugriff

Die Seite rendert serverseitig: Sitzung serverseitig geprüft (nicht eingeloggt → Redirect zum Login, wie überall), Aktivitäten + Profil per RLS gelesen (AC-13), Forecast pro **einzigartiger** gerundeter Koordinate genau einmal geholt, Slots berechnet, HTML ausgeliefert. Der OpenWeatherMap-Key bleibt ausschließlich auf dem Server (bereits vorhanden: `OPENWEATHER_API_KEY`, seit PROJ-1 in `.env.local.example` dokumentiert — kein neuer Eintrag nötig).

**Forecast-Abruf:** OpenWeatherMap „5 day / 3 hour forecast" (`/data/2.5/forecast`), metrische Einheiten. Geliefert werden bis zu 40 Blöcke à 3 Stunden mit u. a. Temperatur, Windgeschwindigkeit (m/s — wird in km/h umgerechnet, weil `activities.wind_max` in km/h gespeichert ist), Regenwahrscheinlichkeit (0–1 — wird als % gelesen), Regen-/Schneemenge und dem Zeitzonen-Offset des Orts.

**Slot-Berechnung** — eine reine, von der Seite unabhängige Funktion (`src/lib/slots.ts`), damit `/qa` jede Regel als Unit-Test prüfen kann. Die Regeln, vollständig:

1. **Blockprüfung** — ein 3h-Block „passt", wenn alle gesetzten Bedingungen erfüllt sind (AC-3), Grenzwerte inklusive (EC-5):
   - Temperatur: `temp_min ≤ Block-Temperatur ≤ temp_max` (nur gesetzte Grenzen prüfen)
   - Kein Regen (wenn aktiv): Regenwahrscheinlichkeit ≤ 30 % **und** keine Regen-/Schneemenge prognostiziert (AC-4)
   - Wind: Block-Wind (km/h) ≤ `wind_max`
2. **Zeitliche Eingrenzung** — alles in der **lokalen Zeit des Standorts** (Zeitzonen-Offset aus der Forecast-Antwort, EC-6):
   - Wochentag erlaubt? (`weekdays`, ISO 1–7)
   - Überschneidung mit dem Zeitfenster genügt (AC-2, EC-1); kein Zeitfenster → ganzer Tag (AC-5)
   - Ein Block, der über Mitternacht reicht, wird gegen **beide** Tage geschnitten; jeder Tagesanteil zählt nur, wenn dessen Wochentag erlaubt ist
3. **Verschmelzen & Zuschneiden** — zeitlich benachbarte passende Blöcke desselben Tages verschmelzen; angezeigt wird die Schnittmenge mit dem Zeitfenster (AC-2). Der Forecast-Horizont ist die harte Grenze: nichts jenseits des letzten Blocks (EC-2)
4. **Heute** — Slots mit Ende ≤ jetzt entfallen; ein laufender Slot beginnt bei „jetzt" und heißt „Jetzt bis X Uhr" (AC-7)
5. **Wetterwerte je Slot** (AC-6): Temperatur-Spanne (min–max über die beteiligten Blöcke), maximaler Wind (gerundet, km/h), maximale Regenwahrscheinlichkeit (%)

**Aktualität der Bedingungen (EC-4):** Aktivitäten und Profil werden bei jedem Seitenaufruf frisch aus der Datenbank gelesen — der 30-Minuten-Cache gilt ausschließlich für die Wetterdaten.

**Fehlerverhalten (AC-11, EC-3):** Scheitert irgendein benötigter Forecast-Abruf (Timeout, Nicht-200-Antwort — auch ungültiger Key oder Rate-Limit), zeigt die ganze Seite den Fehlerzustand mit „Erneut versuchen". Die Meldung bleibt generisch; technische Details (Statuscode, Key) erscheinen nur im Server-Log. Es werden nie stillschweigend ältere Daten gezeigt — der Cache liefert nur innerhalb seiner 30 Minuten, danach gibt es frische Daten oder den Fehlerzustand.

**Kein zusätzliches Rate-Limit:** Die Seite prüft kein Credential; sie ist login-geschützt, und der Koordinaten-Cache deckelt die OpenWeatherMap-Aufrufe (höchstens ein Abruf pro Ort pro 30 Minuten). Ein App-Level-Throttle (Upstash) wäre hier Aufwand ohne Bedrohungsmodell.

## Abhängigkeiten

**Keine neuen Pakete.** Datums- und Zeitformatierung über die eingebaute `Intl`-API (keine date-fns/luxon nötig — es ist nur Offset-Rechnung und Anzeige). UI aus vorhandenen Bausteinen: Card, Badge, Skeleton, Button; Icons aus lucide-react (installiert).

## Settings the user makes

keine — der OpenWeatherMap-Key liegt seit PROJ-1 in `.env.local`, und der kostenlose Plan enthält den 5-Tage/3-Stunden-Forecast bereits. Kein Dashboard-Setting nötig.

## Technische Entscheidungen

| Entscheidung | Begründung | Erwogene Alternative | Trade-off | Datum |
| --- | --- | --- | --- | --- |
| Berechnung serverseitig in der Seite, keine eigene API-Route | Key und Logik bleiben auf dem Server (AC-14, Technical Req.); passt zum Muster der übrigen Seiten; weniger Angriffsfläche | Client-Abruf über eine eigene `/api/forecast`-Route | Kein Client-seitiges Nachladen ohne Seiten-Reload — für eine Anzeige-Seite verschmerzbar, später nachrüstbar | 2026-08-27 |
| Forecast-Cache über den Framework-Daten-Cache (fetch mit 30-Min-Revalidierung), Schlüssel = URL mit gerundeten Koordinaten | Erfüllt AC-12 ohne neues Paket und ohne eigene Infrastruktur; Cache über Nutzer hinweg geteilt, enthält keine Nutzerdaten | Next 16 `use cache`/`cacheLife`; eigener In-Memory-Cache; Redis | fetch-Revalidierung ist die dokumentierte stabile Option; `/build` verifiziert die Mechanik gegen die installierte Version (`node_modules/next/dist/docs`) und nimmt `use cache`, falls die Version es verlangt | 2026-08-27 |
| Koordinaten vor dem Abruf auf 2 Dezimalstellen runden (≈ 1 km) | Datenminimierung gegenüber OpenWeather (AC-14) und bessere Cache-Treffer für nahe Orte; der Forecast ist ohnehin stadtweit | Volle Koordinaten-Präzision | Minimal gröberer Ort — für Stadtwetter irrelevant | 2026-08-27 |
| Slot-Logik als reine Funktion in `src/lib/slots.ts`, OWM-Antwort über einen kleinen Adapter normalisiert | Jede Regel (AC-2–AC-7, EC-1/2/5/6) wird als Unit-Test prüfbar — das PRD-Erfolgskriterium „nachvollziehbar korrekt" braucht genau das | Logik direkt im Seiten-Code | Etwas mehr Struktur; dafür testbar und vom API-Format entkoppelt | 2026-08-27 |
| Zeitzonen über den Offset aus der Forecast-Antwort, Formatierung mit `Intl`, keine Datums-Bibliothek | Erfüllt EC-6 ohne neue Abhängigkeit; nur Offset-Arithmetik nötig | date-fns oder luxon | Der Offset ist der aktuell gültige — ein DST-Wechsel innerhalb der 5 Tage verschiebt späte Blöcke um 1 h; als Randfall akzeptiert | 2026-08-27 |
| Wind m/s → km/h im Adapter umgerechnet | `activities.wind_max` ist km/h (PROJ-2); die Umrechnung gehört an die API-Grenze, nicht in die Regel-Logik | Einheit in der DB ändern | keiner | 2026-08-27 |
| Teilausfall = ganzseitiger Fehlerzustand | AC-11 verlangt ehrliches Scheitern; Teilausfälle (mehrere Standorte, einer scheitert) sind selten | Fehler-Block nur pro betroffener Aktivität | Bei einem Teilausfall verschwinden auch berechenbare Blöcke — im MVP bewusst einfach gehalten | 2026-08-27 |
| Kein App-Level-Rate-Limit auf der Vorschläge-Seite | Kein Credential-Check; login-geschützt; der Cache begrenzt die OWM-Last strukturell | Upstash-Throttle pro IP/Konto | keiner — bei späterem öffentlichem Betrieb neu bewerten | 2026-08-27 |

## Offene Fragen

- keine
