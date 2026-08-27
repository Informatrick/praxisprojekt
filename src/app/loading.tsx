import { Skeleton } from "@/components/ui/skeleton";

// Seitenmuster (docs/app-shell.md): Skeletons an der Stelle des Inhalts —
// hier die Blöcke der Vorschläge-Seite (ein Block pro Aktivität).
export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Skeleton className="mb-6 h-8 w-48" />
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    </div>
  );
}
