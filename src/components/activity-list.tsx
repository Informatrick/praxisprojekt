"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarClock, Plus } from "lucide-react";
import type { Activity } from "@/app/activities/actions";
import { ActivityCard } from "@/components/activity-card";
import { ActivityForm } from "@/components/activity-form";
import { Button } from "@/components/ui/button";

export function ActivityList({ activities }: { activities: Activity[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(a: Activity) {
    setEditing(a);
    setFormOpen(true);
  }

  function handleSaved() {
    setFormOpen(false);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Aktivitäten</h1>
        <Button onClick={openCreate}>
          <Plus className="size-4" aria-hidden />
          Neue Aktivität
        </Button>
      </header>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed px-6 py-16 text-center">
          <CalendarClock className="size-12 text-primary" aria-hidden />
          <p className="font-medium">Noch keine Aktivitäten — lege deine erste an!</p>
          <Button onClick={openCreate}>
            <Plus className="size-4" aria-hidden />
            Neue Aktivität
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {activities.map((a) => (
            <ActivityCard key={a.id} activity={a} onEdit={openEdit} />
          ))}
        </div>
      )}

      <ActivityForm
        open={formOpen}
        onOpenChange={setFormOpen}
        activity={editing}
        onSaved={handleSaved}
      />
    </div>
  );
}
