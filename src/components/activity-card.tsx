"use client";

import { useState, useTransition } from "react";
import { MapPin, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteActivity, type Activity } from "@/app/activities/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { conditionSummary } from "@/lib/activity-format";

export function ActivityCard({
  activity,
  onEdit,
}: {
  activity: Activity;
  onEdit: (a: Activity) => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteActivity(activity.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Aktivität gelöscht.");
      }
      setConfirmOpen(false);
    });
  }

  const summary = conditionSummary(activity);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <CardTitle className="text-lg">{activity.name}</CardTitle>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="sm"
            aria-label={`${activity.name} bearbeiten`}
            onClick={() => onEdit(activity)}
          >
            <Pencil className="size-4" aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={`${activity.name} löschen`}
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5">
          {summary.map((part, i) => (
            <Badge key={i} variant="secondary" className="font-normal">
              {i === summary.length - 1 ? (
                <MapPin className="mr-1 size-3" aria-hidden />
              ) : null}
              {part}
            </Badge>
          ))}
        </div>
      </CardContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aktivität wirklich löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              „{activity.name}“ wird dauerhaft entfernt. Das lässt sich nicht
              rückgängig machen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Wird gelöscht …" : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
