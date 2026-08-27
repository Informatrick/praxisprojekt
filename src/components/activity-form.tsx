"use client";

import { useActionState, useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";
import {
  createActivity,
  updateActivity,
  type Activity,
  type ActivityActionState,
} from "@/app/activities/actions";
import { WEEKDAYS } from "@/lib/validations/activity";
import {
  LocationSearch,
  type SelectedLocation,
} from "@/components/location-search";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const initialState: ActivityActionState = {};

export function ActivityForm({
  open,
  onOpenChange,
  activity,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: Activity | null;
  onSaved: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {/* Der key initialisiert die Felder bei jedem Öffnen/Wechsel frisch —
            ohne setState-im-Effect. */}
        {open && (
          <ActivityFormBody
            key={activity?.id ?? "new"}
            activity={activity}
            onOpenChange={onOpenChange}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ActivityFormBody({
  activity,
  onOpenChange,
  onSaved,
}: {
  activity: Activity | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const action = activity ? updateActivity : createActivity;
  const [state, formAction, pending] = useActionState(action, initialState);

  const [weekdays, setWeekdays] = useState<number[]>(
    activity?.weekdays ?? [1, 2, 3, 4, 5, 6, 7]
  );
  const [noRain, setNoRain] = useState<boolean>(activity?.no_rain ?? false);

  // Nach Erfolg: Liste neu laden und schließen.
  useEffect(() => {
    if (state.success) {
      onSaved();
    }
  }, [state, onSaved]);

  const defaultLocation: SelectedLocation | null =
    activity?.location_name &&
    activity.location_lat !== null &&
    activity.location_lon !== null
      ? {
          name: activity.location_name,
          lat: activity.location_lat,
          lon: activity.location_lon,
        }
      : null;

  function toggleDay(day: number) {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {activity ? "Aktivität bearbeiten" : "Neue Aktivität"}
        </DialogTitle>
        <DialogDescription>
          Setze mindestens eine Wetterbedingung. Ohne Standort gilt dein Wohnort
          aus dem Profil.
        </DialogDescription>
      </DialogHeader>

      <form action={formAction} className="space-y-5" noValidate>
        {activity && <input type="hidden" name="id" value={activity.id} />}
        <input type="hidden" name="noRain" value={noRain ? "true" : "false"} />
        {weekdays.map((d) => (
          <input key={d} type="hidden" name="weekdays" value={d} />
        ))}

        {state.error && (
          <p className="flex items-center gap-2 text-sm text-destructive">
            <TriangleAlert className="size-4" aria-hidden />
            {state.error}
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={activity?.name ?? ""}
            maxLength={80}
            placeholder="z. B. Joggen"
            aria-invalid={!!state.fieldErrors?.name}
          />
          {state.fieldErrors?.name && (
            <p className="text-sm text-destructive">
              {state.fieldErrors.name[0]}
            </p>
          )}
        </div>

        <fieldset className="space-y-4 rounded-lg border p-4">
          <legend className="px-1 text-sm font-medium">Wetterbedingungen</legend>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="tempMin">Temperatur min (°C)</Label>
              <Input
                id="tempMin"
                name="tempMin"
                type="number"
                inputMode="numeric"
                defaultValue={activity?.temp_min ?? ""}
                placeholder="z. B. 5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tempMax">Temperatur max (°C)</Label>
              <Input
                id="tempMax"
                name="tempMax"
                type="number"
                inputMode="numeric"
                defaultValue={activity?.temp_max ?? ""}
                placeholder="z. B. 30"
              />
            </div>
          </div>
          {state.fieldErrors?.tempMax && (
            <p className="text-sm text-destructive">
              {state.fieldErrors.tempMax[0]}
            </p>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="noRain">Kein Regen</Label>
            <Switch id="noRain" checked={noRain} onCheckedChange={setNoRain} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="windMax">Wind max (km/h)</Label>
            <Input
              id="windMax"
              name="windMax"
              type="number"
              inputMode="numeric"
              min={0}
              defaultValue={activity?.wind_max ?? ""}
              placeholder="z. B. 20"
            />
          </div>

          {state.fieldErrors?.conditions && (
            <p className="text-sm text-destructive">
              {state.fieldErrors.conditions[0]}
            </p>
          )}
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="timeFrom">Von (Uhrzeit)</Label>
            <Input
              id="timeFrom"
              name="timeFrom"
              type="time"
              defaultValue={activity?.time_from?.slice(0, 5) ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timeTo">Bis (Uhrzeit)</Label>
            <Input
              id="timeTo"
              name="timeTo"
              type="time"
              defaultValue={activity?.time_to?.slice(0, 5) ?? ""}
            />
          </div>
        </div>
        {state.fieldErrors?.timeTo && (
          <p className="text-sm text-destructive">
            {state.fieldErrors.timeTo[0]}
          </p>
        )}

        <div className="space-y-2">
          <Label>Wochentage</Label>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAYS.map((w) => (
              <button
                key={w.value}
                type="button"
                onClick={() => toggleDay(w.value)}
                aria-pressed={weekdays.includes(w.value)}
                className={cn(
                  "min-w-11 rounded-md border px-2 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                  weekdays.includes(w.value)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {w.short}
              </button>
            ))}
          </div>
          {state.fieldErrors?.weekdays && (
            <p className="text-sm text-destructive">
              {state.fieldErrors.weekdays[0]}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Standort (optional)</Label>
          <LocationSearch defaultLocation={defaultLocation} />
          <p className="text-sm text-muted-foreground">
            Leer lassen = dein Wohnort aus dem Profil. Ohne beides gibt es keine
            Vorschläge.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Abbrechen
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Wird gespeichert …" : "Speichern"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
