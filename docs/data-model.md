# Datenmodell

> Die app-weite Karte, **welche Daten dieses Produkt speichert und wie sie zusammenhängen** — der gemeinsame Bauplan, an dem sich die Tabellen jedes Features ausrichten.
>
> - Erstellt von `/init` (der erste ganzheitliche Blick: Entitäten + Beziehungen).
> - Verfeinert von `/architecture`, wenn ein Feature im Detail entworfen wird.
> - **Flughöhe:** Entitäten, Beziehungen und Eigentümerschaft stehen hier (Produkt-Ebene, für alle lesbar). Spaltentypen, Indizes und exakte Fremdschlüssel werden pro Feature in dessen `design.md` entschieden — nicht hier.

## Entitäten

| Entität | Was sie darstellt | Gehört wem / wer sieht sie |
|---------|-------------------|----------------------------|
| profiles | Das Benutzerkonto mit Anzeigename und Standard-Standort (Wohnort) | dem Nutzer selbst — niemand sonst |
| activities | Eine Aktivität mit ihren Wetterbedingungen (Temperatur min/max, Niederschlag, Wind max), Zeitfenster, Wochentagen und optional eigenem Standort | dem Nutzer, dem sie gehört |

## Beziehungen

- Ein Profil hat viele Aktivitäten; jede Aktivität gehört zu genau einem Profil.
- Ein Standort ist Teil des Datensatzes, zu dem er gehört: der Standard-Standort steckt im Profil, ein abweichender Standort direkt in der Aktivität. Kein eigener „Orte"-Katalog — fürs MVP bewusst weggelassen.

## Bewusst nicht gespeichert

- **Wetterdaten und Slot-Vorschläge:** werden bei Bedarf live von OpenWeatherMap geholt und berechnet, nicht in der Datenbank abgelegt. Ob ein kurzlebiger Zwischenspeicher sinnvoll ist, entscheidet die Architektur von PROJ-3.
- **Benachrichtigungen (PROJ-4)** erweitern das Modell später um ihre eigenen Daten.

## Diagramm

```
profiles (Konto + Standard-Standort)
  └─ hat viele activities (Bedingungen, Zeitfenster, optional eigener Standort)
```

---

_Dies ist ein lebendes Dokument. Wenn `/architecture` ein Feature entwirft, das eine Entität einführt oder ändert, wird diese Karte zuerst aktualisiert, damit spätere Features gegen ein korrektes Bild bauen._
