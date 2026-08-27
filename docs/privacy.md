# Datenschutz-Übersicht (privacy.md)

> **Anwendbares Recht:** DSGVO / GDPR (EU/AT/DE) und Schweizer DSG · **Stance:** standard
> **Verantwortlicher (Controller):** Erich Birsak, Privatperson (Praxisprojekt, keine Firma)
> **Letzte Prüfung:** 2026-08-27 (`/dsgvo PROJ-3`)
>
> Dies ist ein Engineering-Dokument — die ehrliche Übersicht, was das Produkt mit personenbezogenen
> Daten tut. Es ist keine rechtliche Einreichung und ersetzt keine Datenschutzerklärung.
> Es lehnt sich an das Verarbeitungsverzeichnis (Art. 30 DSGVO; Art. 12 DSG) an.

## Verarbeitungstätigkeiten

| Zweck | Daten | Wessen | Rechtsgrundlage / Zulässigkeit | Aufbewahrung | Beteiligte Dienste |
|-------|-------|--------|-------------------------------|--------------|--------------------|
| Benutzerkonten betreiben (Registrierung, Login, Profil) | E-Mail-Adresse, Passwort (nur als Hash), optional Anzeigename und Wohnort (Ort + Koordinaten) | Nutzer der App | DSGVO: Vertrag, Art. 6(1)(b) · DSG: entspricht der erwartbaren Bearbeitung (Art. 6 Abs. 3 DSG), keine Rechtfertigung nötig | bis zur Kontolöschung | Supabase (Auth + Datenbank) |
| Konto-Mails (Bestätigung, Passwort-Reset) | E-Mail-Adresse | Nutzer | DSGVO: Vertrag, Art. 6(1)(b) | nicht gespeichert (Versand) | Supabase (Mailversand) |
| Missbrauchsschutz (Sperre nach Fehlversuchen, Auth-Logs) | E-Mail-Adresse, IP-Adresse, Zeitstempel | Nutzer und Anfragende | DSGVO: berechtigtes Interesse (Sicherheit), Art. 6(1)(f) | kurzfristig (Log-Retention von Supabase) | Supabase |
| Aktivitäten verwalten (PROJ-2) | Aktivitätsname (Freitext), Wetterbedingungen, Zeitfenster, Wochentage, optionaler Standort (Name + Koordinaten) | Nutzer, dem sie gehören | DSGVO: Vertrag, Art. 6(1)(b) · DSG: erwartbare Bearbeitung | bis zur Löschung der Aktivität bzw. des Kontos | Supabase |
| Slot-Vorschläge berechnen (PROJ-3) | Standort-Koordinaten (Wohnort bzw. Aktivitäts-Ort) — ohne Nutzerkennung, nur Koordinaten + API-Key in der Anfrage | Nutzer, dessen Vorschläge berechnet werden | DSGVO: Vertrag, Art. 6(1)(b) — Kernfunktion der App · DSG: erwartbare Bearbeitung | nicht gespeichert (Live-Abruf; kurzlebiger Cache ≤ 30 Min ohne Nutzerbezug) | OpenWeather Ltd (Forecast-API) |

## Besonders schützenswerte Daten

**Keine.** Weder Gesundheits- noch andere Daten der Art.-9-DSGVO- / Art.-5-lit.-c-DSG-Listen. Der Wohnort ist ein grober Ort (Stadt), kein Bewegungsprofil.

## Auftragsverarbeiter / Auftragsbearbeiter

| Dienst | Verarbeitet | Region | AVV/DPA unterzeichnet | Außerhalb der Angemessenheitsländer? |
|--------|-------------|--------|-----------------------|--------------------------------------|
| Supabase (Supabase Inc., US-Unternehmen) | Konten, Profile, alle App-Daten | eu-central-1 (Frankfurt) | ☑ gilt automatisch — der DPA ist in die Terms of Service integriert („all organizations get its protections automatically, no separate signed DPA is needed"; Dashboard geprüft 2026-08-27) | Daten liegen in der EU; EU ist auf der Schweizer Angemessenheitsliste (Anhang 1 DSV) |
| OpenWeather Ltd (UK-Unternehmen, Forecast-API) | nur Standort-Koordinaten pro Forecast-Abfrage, keine Nutzerkennung | UK | ☐ offen — im Free Tier gibt es üblicherweise keinen AVV; Risiko gering, da keine identifizierenden Daten übermittelt werden (siehe Offene Punkte) | UK hat einen EU-Angemessenheitsbeschluss (Art. 45 DSGVO) und steht auf der Schweizer Angemessenheitsliste (Anhang 1 DSV) — Export nach UK muss in der Datenschutzerklärung genannt werden (Art. 19 Abs. 4 DSG) |

## Betroffenenrechte

| Recht | Rechtsgrundlage | Wie die App es liefert | Frist |
|-------|-----------------|------------------------|-------|
| Auskunft / Kopie | Art. 15 DSGVO; Art. 25 DSG | Daten-Export im Profil (AC in PROJ-1) | 1 Monat (DSGVO) / 30 Tage (DSG) |
| Berichtigung | Art. 16 DSGVO; Art. 32 Abs. 1 DSG | Profil selbst editierbar (PROJ-1) | sofort, Selbstbedienung |
| Löschung | Art. 17 DSGVO; Art. 6 Abs. 4 DSG | Konto löschen im Profil, entfernt alle Daten (AC in PROJ-1) | unverzüglich, Selbstbedienung |
| Datenübertragbarkeit | Art. 20 DSGVO; Art. 28 DSG | derselbe Export (maschinenlesbar, JSON) | 1 Monat |
| Information | Art. 13 DSGVO; Art. 19 DSG | Datenschutzerklärung von jeder Seite verlinkt (AC in PROJ-1); nennt nach Art. 19 Abs. 4 DSG auch die Exportländer | bei Erhebung |

## Offene Punkte

- [x] Supabase-DPA — erledigt ohne eigenes Zutun: laut Dashboard (geprüft 2026-08-27) ist der DPA Teil der Terms of Service und gilt automatisch; ein separates Akzeptieren existiert nicht
- [ ] Datenschutzerklärung um OpenWeather Ltd ergänzen: Empfänger, Zweck (Wettervorhersage), übermittelte Daten (nur Koordinaten), Exportland UK (Art. 13 DSGVO; Art. 19 Abs. 4 DSG) — als AC in PROJ-3 vorgesehen
- [ ] Text der Datenschutzerklärung erstellen (Generator oder Anwalt), sobald die Seite gebaut wird (PROJ-1)
- [ ] Bei Wiederaufnahme eines öffentlichen Betriebs: Impressumspflicht (DDG) prüfen — aktuell kein Deployment geplant

## Für Anwalt / Datenschutzberater

- OpenWeatherMap (Free Tier) bietet üblicherweise keinen Auftragsverarbeitungsvertrag an. Übermittelt werden ausschließlich Standort-Koordinaten ohne Nutzerkennung — ist OpenWeather damit überhaupt Auftragsverarbeiter (Art. 28 DSGVO), oder liegt mangels identifizierbarer Daten aus Empfängersicht keine Verarbeitung personenbezogener Daten vor? Bitte einschätzen, ob die Nennung in der Datenschutzerklärung genügt.
- Reicht für ein nicht öffentlich betriebenes Praxisprojekt (GitHub-Repo, lokal lauffähig, Test-Nutzer) die hier skizzierte Datenschutzerklärung, oder besteht schon für Testbetrieb mit realen E-Mail-Adressen eine weitergehende Informationspflicht?
- DSFA/DPIA: Nach Prüfung der Trigger (Art. 35 DSGVO, Art. 22 DSG) liegt keiner vor — keine sensiblen Daten, kein Profiling, kein großer Umfang. Bitte bestätigen, falls die App später öffentlich betrieben wird.
