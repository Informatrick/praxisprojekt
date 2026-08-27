import Link from "next/link";
import { CalendarX2, MapPin, MapPinOff } from "lucide-react";
import type { Activity } from "@/app/activities/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { conditionSummary } from "@/lib/activity-format";
import { SlotCard } from "@/components/slot-card";
import type { Slot } from "@/lib/slots";

// Ein Block pro Aktivität auf der Vorschläge-Seite (AC-1) mit den drei Fällen
// aus design.md: Slots (A), keine Slots (B, AC-9), kein Standort (C, AC-8).

export type ActivitySuggestionsProps = {
  activity: Activity;
  /** aufgelöster Standortname; null = weder eigener Ort noch Wohnort (Fall C) */
  locationName: string | null;
  slots: Slot[];
  timezoneOffsetSeconds: number;
  now: number;
};

export function ActivitySuggestions({
  activity,
  locationName,
  slots,
  timezoneOffsetSeconds,
  now,
}: ActivitySuggestionsProps) {
  // Zusammenfassung ohne den Standort-Teil (letztes Element) — der aufgelöste
  // Ort steht daneben mit Icon, damit klar ist, wofür gerechnet wurde.
  const conditions = conditionSummary(activity).slice(0, -1).join(" · ");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{activity.name}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {conditions}
          {locationName && (
            <>
              {" · "}
              <MapPin className="inline size-3.5 align-[-2px]" aria-hidden />{" "}
              {locationName}
              {activity.location_name === null && " (Wohnort)"}
            </>
          )}
        </p>
      </CardHeader>
      <CardContent>
        {locationName === null ? (
          <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-4">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPinOff className="size-4 shrink-0" aria-hidden />
              Kein Standort — ohne Ort kann die App keine Zeitfenster
              berechnen.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/profile">Wohnort im Profil festlegen</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/activities">Ort an der Aktivität setzen</Link>
              </Button>
            </div>
          </div>
        ) : slots.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarX2 className="size-4 shrink-0" aria-hidden />
            Kein passendes Zeitfenster in den nächsten 5 Tagen
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {slots.map((slot) => (
              <SlotCard
                key={slot.start}
                slot={slot}
                timezoneOffsetSeconds={timezoneOffsetSeconds}
                now={now}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
