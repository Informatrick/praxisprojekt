export const metadata = { title: "Datenschutzerklärung — ActivitySlot" };

// Datenschutzerklärung (AC-17): von jeder Seite über den Footer erreichbar,
// auch ausgeloggt. Inhalte gemäß docs/privacy.md; der endgültige Text gehört
// vor einem öffentlichen Betrieb zu einem Anwalt oder Generator
// (spec.md → Offene Fragen).
export default function DatenschutzPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Datenschutzerklärung</h1>
      <div className="space-y-6 text-sm leading-relaxed [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_p]:text-muted-foreground [&_li]:text-muted-foreground">
        <section className="space-y-2">
          <h2>Verantwortlicher</h2>
          <p>
            Erich Birsak (Privatperson, Praxisprojekt). Kontakt: über die im
            Impressum bzw. bei der Registrierung angegebene E-Mail-Adresse.
          </p>
        </section>

        <section className="space-y-2">
          <h2>Welche Daten wir verarbeiten und wozu</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Benutzerkonto:</strong> E-Mail-Adresse, Passwort (nur als
              Hash), optional Anzeigename und Wohnort — um dein Konto zu
              betreiben und Vorschläge für deinen Ort zu berechnen
              (Vertragserfüllung, Art. 6 Abs. 1 lit. b DSGVO).
            </li>
            <li>
              <strong>Konto-Mails:</strong> Bestätigungs- und
              Passwort-Reset-Mails an deine E-Mail-Adresse (Vertragserfüllung).
            </li>
            <li>
              <strong>Missbrauchsschutz:</strong> fehlgeschlagene
              Login-Versuche werden kurzzeitig gezählt (15 Minuten), um dein
              Konto vor automatischem Durchprobieren zu schützen (berechtigtes
              Interesse, Art. 6 Abs. 1 lit. f DSGVO).
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2>Empfänger und Speicherort</h2>
          <p>
            Die Daten liegen bei unserem Auftragsverarbeiter Supabase
            (Datenbank und Login-Dienst) in der EU, Region Frankfurt am Main.
            Eine Bekanntgabe in Staaten außerhalb der EU findet nicht statt.
          </p>
        </section>

        <section className="space-y-2">
          <h2>Speicherdauer</h2>
          <p>
            Deine Daten bleiben gespeichert, bis du dein Konto löschst — dann
            werden sie unverzüglich und vollständig entfernt. Die Zähler des
            Missbrauchsschutzes sind nach 15 Minuten bedeutungslos.
          </p>
        </section>

        <section className="space-y-2">
          <h2>Deine Rechte</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Auskunft und Export:</strong> Unter Profil → „Meine
              Daten“ lädst du jederzeit eine Kopie aller gespeicherten Daten
              herunter (Art. 15, 20 DSGVO; Art. 25, 28 DSG).
            </li>
            <li>
              <strong>Berichtigung:</strong> Anzeigename und Wohnort änderst du
              selbst im Profil (Art. 16 DSGVO).
            </li>
            <li>
              <strong>Löschung:</strong> Unter Profil → „Konto löschen“
              entfernst du Konto und Daten selbst und sofort (Art. 17 DSGVO).
            </li>
            <li>
              Du kannst dich außerdem bei einer Datenschutz-Aufsichtsbehörde
              beschweren (in Österreich: Datenschutzbehörde, dsb.gv.at; in der
              Schweiz: EDÖB).
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2>Stand</h2>
          <p>
            August 2026. Diese App ist ein nicht-kommerzielles Praxisprojekt
            und wird nicht öffentlich betrieben.
          </p>
        </section>
      </div>
    </div>
  );
}
