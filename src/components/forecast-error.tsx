"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CloudOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Fehlerzustand der Vorschläge-Seite (AC-11, EC-3): generische Meldung ohne
// technische Details, „Erneut versuchen" lädt die Server-Seite neu.
export function ForecastError() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed px-6 py-16 text-center">
      <CloudOff className="size-12 text-muted-foreground" aria-hidden />
      <div className="space-y-1">
        <p className="font-medium">Wetterdaten gerade nicht verfügbar</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Die Wettervorhersage konnte nicht geladen werden. Bitte versuche es
          gleich noch einmal.
        </p>
      </div>
      <Button
        onClick={() => startTransition(() => router.refresh())}
        disabled={pending}
      >
        <RefreshCw className={pending ? "animate-spin" : undefined} aria-hidden />
        Erneut versuchen
      </Button>
    </div>
  );
}
