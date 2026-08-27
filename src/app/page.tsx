import Link from "next/link";
import { CloudSun } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Vorschläge — WetterSlot" };

// Startseite = Bereich „Vorschläge" (docs/app-shell.md). PROJ-3 baut hier die
// Slot-Vorschläge; bis dahin ein ehrlicher Platzhalter mit dem nächsten Schritt.
export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Vorschläge</h1>
      </header>
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed px-6 py-16 text-center">
        <CloudSun className="size-12 text-primary" aria-hidden />
        <div className="space-y-1">
          <p className="font-medium">Noch keine Vorschläge</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Die Zeitfenster-Vorschläge kommen mit dem nächsten Ausbau-Schritt.
            Lege schon jetzt deinen Wohnort im Profil fest — dann kann es
            direkt losgehen.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/profile">Profil öffnen</Link>
        </Button>
      </div>
    </div>
  );
}
