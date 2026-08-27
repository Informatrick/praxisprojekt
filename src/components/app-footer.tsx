import Link from "next/link";

// Footer auf jeder Seite, auch ausgeloggt: der Weg zur Datenschutzerklärung (AC-17).
export function AppFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4 text-sm text-muted-foreground">
        {/* Name verlinkt zur Startseite — der Weg zurück von jeder Seite,
            auch von /datenschutz und ausgeloggt (führt dann zum Login). */}
        <Link
          href="/"
          className="rounded-md font-medium transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          ActivitySlot
        </Link>
        <Link
          href="/datenschutz"
          className="rounded-md underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring"
        >
          Datenschutz
        </Link>
      </div>
    </footer>
  );
}
