# PROJ-1: Benutzerkonten & Login

<!-- This file (spec.md) is the stable CONTRACT — it defines WHAT, not HOW.
     Owner: /write-spec (creates), /refine (updates). During /build this file is READ-ONLY.
     Technical design lives in design.md, QA results in qa-report.md.
     No status or date fields here: the feature's status lives ONLY in features/INDEX.md,
     and git records when this file changed. -->

## Dependencies
- Keine (erstes Feature; PROJ-2 und PROJ-3 bauen darauf auf)

## User Stories
- Als neue Nutzerin möchte ich mich mit E-Mail und Passwort registrieren, damit ich eigene Aktivitäten anlegen kann.
- Als Nutzer möchte ich mich ein- und ausloggen, damit nur ich Zugriff auf meine Daten habe.
- Als Nutzerin möchte ich mein Passwort per E-Mail zurücksetzen, wenn ich es vergessen habe.
- Als Nutzer möchte ich in meinem Profil Anzeigename und Wohnort pflegen, damit die Slot-Vorschläge zu meinem Ort passen.
- Als Nutzerin möchte ich mein Konto samt aller Daten löschen können, damit nichts von mir zurückbleibt.

## Out of Scope
- Social Login (Google, Apple, …) — bewusst weggelassen, nachrüstbar
- E-Mail-Adresse ändern — nicht im MVP
- CAPTCHA / Bot-Schutz auf Formularen — bewusst abgelehnt, siehe Entscheidungsprotokoll
- Rollen- oder Admin-Funktionen — die App kennt nur gleichberechtigte Nutzer
- Benachrichtigungen — eigenes Feature (PROJ-4)
- GPS-Ortung — Standorte sind gespeicherte Orte (siehe PRD Non-Goals)

## Acceptance Criteria

### Registrierung & Bestätigung
- [ ] **AC-1** — Angenommen ein Besucher ist auf der Registrierungsseite, wenn er eine gültige E-Mail-Adresse und ein Passwort abschickt, dann wird das Konto angelegt, eine Bestätigungs-Mail verschickt und der Hinweis angezeigt, das Postfach zu prüfen
- [ ] **AC-2** — Angenommen das eingegebene Passwort hat weniger als 8 Zeichen, wenn das Registrierungsformular abgeschickt wird, dann erscheint eine Validierungsfehlermeldung und es wird kein Konto angelegt
- [ ] **AC-3** — Angenommen ein Konto ist noch nicht bestätigt, wenn sich der Nutzer einloggen will, dann wird der Login mit einem Hinweis auf die ausstehende E-Mail-Bestätigung abgelehnt
- [ ] **AC-4** — Angenommen der Nutzer klickt den Bestätigungslink aus der Mail, dann ist das Konto aktiv und er landet eingeloggt auf der Vorschläge-Seite

### Login, Logout, Zugriffsschutz
- [ ] **AC-5** — Angenommen ein bestätigtes Konto existiert, wenn korrekte Zugangsdaten eingegeben werden, dann ist der Nutzer eingeloggt und landet auf der Vorschläge-Seite
- [ ] **AC-6** — Angenommen der Nutzer ist eingeloggt, wenn er sich abmeldet, dann ist die Sitzung beendet und geschützte Seiten leiten zum Login um
- [ ] **AC-7** — Angenommen ein Besucher ist nicht eingeloggt, wenn er eine geschützte Seite aufruft, dann wird er zum Login umgeleitet
- [ ] **AC-8** — Angenommen zwei Konten existieren, wenn Nutzer A eingeloggt ist, dann sieht er ausschließlich seine eigenen Daten — auch auf Datenbankebene erzwungen (Row Level Security)

### Passwort-Reset
- [ ] **AC-9** — Angenommen ein Nutzer fordert „Passwort vergessen" an, wenn er eine E-Mail-Adresse eingibt, dann erscheint immer dieselbe Bestätigungsmeldung — und nur bei existierendem Konto wird eine Mail mit Reset-Link verschickt
- [ ] **AC-10** — Angenommen ein gültiger Reset-Link, wenn der Nutzer ein neues Passwort (min. 8 Zeichen) setzt, dann funktioniert der Login nur noch mit dem neuen Passwort

### Profil
- [ ] **AC-11** — Angenommen der Nutzer ist eingeloggt, wenn er im Profil Anzeigename oder Wohnort ändert und speichert, dann sind die Änderungen gespeichert und eine Bestätigung erscheint
- [ ] **AC-12** — Angenommen der Nutzer tippt einen Ortsnamen ins Wohnort-Feld, dann erscheint eine Vorschlagsliste, und erst die Auswahl eines Treffers speichert den Ort (mit Koordinaten)

### Missbrauchsschutz
_Nicht aus dem Interview — schützt den Login vor automatisiertem Durchprobieren. Ohne diese Kriterien ist ein Login nicht fertig._
- [ ] **AC-13** — Angenommen es gab 5 fehlgeschlagene Login-Versuche für dasselbe Konto innerhalb von 15 Minuten, wenn ein weiterer Versuch erfolgt, dann wird er abgelehnt und der Nutzer sieht, dass er es später erneut versuchen kann
- [ ] **AC-14** — Angenommen ein Login- oder Reset-Versuch schlägt fehl, wenn die Fehlermeldung angezeigt wird, dann verrät sie nie, ob die E-Mail-Adresse registriert ist (immer dieselbe Meldung für unbekannte Adresse und falsches Passwort)

### Datenschutz
_Aus dem `/dsgvo`-Check (2026-08-27) — Rechtspflichten, nicht verhandelbar wie die übrigen Kriterien. Begründung in `docs/privacy.md`._
- [ ] **AC-15** — Angenommen der Nutzer ist eingeloggt, wenn er im Profil sein Konto löscht und den Bestätigungsdialog bestätigt, dann werden Konto und alle personenbezogenen Daten (Profil, Aktivitäten) unverzüglich gelöscht und er wird ausgeloggt *(Art. 17 DSGVO)*
- [ ] **AC-16** — Angenommen der Nutzer ist eingeloggt, wenn er im Profil den Daten-Export anfordert, dann erhält er eine maschinenlesbare Datei (JSON) mit allen über ihn gespeicherten Daten *(Art. 15/20 DSGVO; Art. 25/28 DSG)*
- [ ] **AC-17** — Angenommen ein Besucher ist auf einer beliebigen Seite (auch ausgeloggt), wenn er den Footer-Link „Datenschutz" klickt, dann erreicht er die Datenschutzerklärung mit Verantwortlichem, Zwecken, Empfängern und Exportländern *(Art. 13 DSGVO; Art. 19 Abs. 4 DSG)*

## Edge Cases
- **EC-1** — Angenommen die E-Mail-Adresse ist bereits registriert, wenn jemand sich damit erneut registriert, dann erscheint dieselbe neutrale Erfolgsmeldung wie sonst (keine Konto-Enumeration) und es entsteht kein zweites Konto
- **EC-2** — Angenommen ein Bestätigungs- oder Reset-Link ist abgelaufen oder wurde schon benutzt, wenn er geöffnet wird, dann erscheint eine verständliche Meldung mit der Möglichkeit, einen neuen Link anzufordern
- **EC-3** — Angenommen die Ortssuche liefert keine Treffer, wenn der Nutzer speichern will, dann bleibt der Wohnort unverändert und ein Hinweis „kein Ort gefunden" erscheint — ein unaufgelöster Freitext wird nie gespeichert
- **EC-4** — Angenommen beim Speichern des Profils tritt ein Netzwerkfehler auf, wenn die Anfrage scheitert, dann erscheint eine Fehlermeldung und die Eingaben bleiben im Formular erhalten
- **EC-5** — Angenommen der Nutzer klickt „Registrieren" doppelt (Doppel-Submit), dann entsteht nur ein Konto und nur eine Bestätigungs-Mail
- **EC-6** — Angenommen ein Konto wurde gelöscht, wenn sich jemand damit einloggen will, dann verhält sich die App wie bei einem unbekannten Konto (dieselbe neutrale Meldung)

## Technical Requirements
- Authentifizierung wird bei jeder Anfrage serverseitig geprüft — nie nur in der UI
- Row Level Security auf allen Tabellen mit Nutzerdaten (zweite, unabhängige Kontrollebene)
- Auth-Formulare senden per POST; keine Zugangsdaten, Tokens oder personenbezogenen Daten in URLs
- Passwort-Mindestlänge 8 Zeichen serverseitig erzwungen (Supabase-Einstellung)
- Datenregion: eu-central-1 (Frankfurt), siehe PRD Constraints

## Open Questions
- [ ] Text der Datenschutzerklärung (Generator oder Anwalt) — die App baut nur die Seite; siehe `docs/privacy.md` → Offene Punkte

## Decision Log

### Product Decisions
| Entscheidung | Begründung | Datum |
|--------------|------------|-------|
| Nur E-Mail + Passwort, kein Social Login | Für ein Praxisprojekt viel Einrichtungsaufwand (OAuth-Apps) bei wenig Lerneffekt; mit Supabase jederzeit nachrüstbar | 2026-08-27 |
| E-Mail-Bestätigung verpflichtend | Supabase-Standard; verhindert Konten mit Tippfehler- oder Fremdadressen | 2026-08-27 |
| Registrierung nur mit E-Mail + Passwort; Anzeigename und Wohnort optional im Profil | Jedes Pflichtfeld mehr kostet Nutzer; für den Login braucht die App den Ort nicht | 2026-08-27 |
| Wohnort über Vorschlagsliste statt Freitext | Nur so ist der Ort eindeutig und liefert verlässliche Koordinaten für den Forecast (PROJ-3) | 2026-08-27 |
| Passwort: min. 8 Zeichen, keine Komplexitätsregeln | Üblicher Mindeststandard; Sonderzeichen-Pflicht bringt wenig Sicherheit und nervt messbar | 2026-08-27 |
| Sperre nach 5 Fehlversuchen / 15 Minuten pro Konto | Üblicher Standard: streng genug gegen Skripte, locker genug für Tippfehler | 2026-08-27 |
| Kein CAPTCHA auf Registrierung und Reset | Bewusste Nutzerentscheidung; Restrisiko Massenregistrierung akzeptiert, Supabase-eigene Rate-Limits als Basisschutz | 2026-08-27 |
| E-Mail-Änderung nicht im MVP | Selten gebraucht; eigener Bestätigungs-Flow wäre nötig | 2026-08-27 |
