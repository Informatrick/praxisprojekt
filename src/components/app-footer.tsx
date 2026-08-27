import Link from "next/link";

// Footer auf jeder Seite, auch ausgeloggt: der Weg zur Datenschutzerklärung (AC-17).
export function AppFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4 text-sm text-muted-foreground">
        <span>WetterSlot</span>
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
