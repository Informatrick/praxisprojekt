"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Download, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import {
  deleteAccount,
  getExportData,
  updateProfile,
  type ProfileActionState,
} from "@/app/profile/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LocationSearch,
  type SelectedLocation,
} from "@/components/location-search";

const initialState: ProfileActionState = {};

export function ProfileForm({
  initialDisplayName,
  initialLocation,
}: {
  initialDisplayName: string;
  initialLocation: SelectedLocation | null;
}) {
  const [state, formAction, pending] = useActionState(
    updateProfile,
    initialState
  );

  useEffect(() => {
    if (state.success) {
      toast.success(state.success);
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profildaten</CardTitle>
        <CardDescription>
          Anzeigename und Wohnort — der Wohnort ist der Standard-Standort für
          deine Vorschläge.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* EC-4: Bei Fehlern bleiben die Eingaben im Formular erhalten */}
        {state.error && (
          <Alert variant="destructive" className="mb-4">
            <TriangleAlert className="size-4" aria-hidden />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        <form action={formAction} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="displayName">Anzeigename</Label>
            <Input
              id="displayName"
              name="displayName"
              defaultValue={initialDisplayName}
              maxLength={50}
              aria-invalid={!!state.fieldErrors?.displayName}
            />
            {state.fieldErrors?.displayName && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.displayName[0]}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Wohnort</Label>
            <LocationSearch defaultLocation={initialLocation} />
            <p className="text-sm text-muted-foreground">
              Tippen und aus den Vorschlägen wählen — so kennen wir die
              Koordinaten für den Wetterbericht.
            </p>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Wird gespeichert …" : "Speichern"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function ExportSection() {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const result = await getExportData();
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      const blob = new Blob([JSON.stringify(result.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "activityslot-datenexport.json";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Dein Datenexport wurde heruntergeladen.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meine Daten</CardTitle>
        <CardDescription>
          Lade eine Kopie aller Daten herunter, die wir über dich gespeichert
          haben (JSON).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          type="button"
          variant="outline"
          onClick={handleExport}
          disabled={exporting}
        >
          <Download className="size-4" aria-hidden />
          {exporting ? "Wird erstellt …" : "Daten exportieren"}
        </Button>
      </CardContent>
    </Card>
  );
}

export function DangerZone() {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteAccount();
      if (result?.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle>Konto löschen</CardTitle>
        <CardDescription>
          Löscht dein Konto und alle deine Daten unwiderruflich — Profil und
          Aktivitäten eingeschlossen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isPending}>
              <Trash2 className="size-4" aria-hidden />
              {isPending ? "Wird gelöscht …" : "Konto löschen"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Konto wirklich löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Dein Konto und alle deine Daten werden unwiderruflich gelöscht.
                Das lässt sich nicht rückgängig machen.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Endgültig löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
