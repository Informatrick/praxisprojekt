import { Skeleton } from "@/components/ui/skeleton";

// Seitenmuster (docs/app-shell.md): Skeletons an der Stelle des Inhalts.
export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Skeleton className="mb-6 h-8 w-48" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}
