import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Skeleton className="mb-2 h-8 w-32" />
      <Skeleton className="mb-6 h-4 w-56" />
      <div className="grid gap-6 md:max-w-xl">
        <Skeleton className="h-72 w-full rounded-lg" />
        <Skeleton className="h-36 w-full rounded-lg" />
        <Skeleton className="h-36 w-full rounded-lg" />
      </div>
    </div>
  );
}
