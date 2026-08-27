import { Badge } from "@/components/ui/badge";
import { localDayIndex, type Slot } from "@/lib/slots";

// Ein vorgeschlagenes Zeitfenster (AC-2, AC-6, AC-7): Tag + Uhrzeit in der
// lokalen Zeit des Standorts, darunter kompakt die Wetterwerte des Zeitraums.

type SlotCardProps = {
  slot: Slot;
  timezoneOffsetSeconds: number;
  /** Unix-Sekunden „jetzt" — für Heute/Morgen relativ zur Ortszeit */
  now: number;
};

const WEEKDAY_FORMAT = new Intl.DateTimeFormat("de-AT", {
  weekday: "short",
  timeZone: "UTC",
});

// Zeitstempel um den Orts-Offset verschieben und in UTC formatieren/lesen —
// das ergibt genau die lokale Zeit des Standorts (EC-6), ohne Datums-Bibliothek.
function shifted(t: number, offsetSeconds: number): Date {
  return new Date((t + offsetSeconds) * 1000);
}

function dayLabel(slot: Slot, offsetSeconds: number, now: number): string {
  const diff = localDayIndex(slot.start, offsetSeconds) - localDayIndex(now, offsetSeconds);
  if (diff === 0) return "Heute";
  if (diff === 1) return "Morgen";
  return WEEKDAY_FORMAT.format(shifted(slot.start, offsetSeconds));
}

function timeLabel(t: number, offsetSeconds: number, isEnd: boolean): string {
  const d = shifted(t, offsetSeconds);
  let hours = d.getUTCHours();
  const minutes = d.getUTCMinutes();
  // Ein Slot endet nie nach Mitternacht (Zeitfenster gehen nicht über
  // Mitternacht; Tagesgrenze = 24 Uhr): 0:00 als Ende heißt 24 Uhr.
  if (isEnd && hours === 0 && minutes === 0) hours = 24;
  return minutes === 0
    ? String(hours)
    : `${hours}:${String(minutes).padStart(2, "0")}`;
}

export function SlotCard({ slot, timezoneOffsetSeconds, now }: SlotCardProps) {
  const from = timeLabel(slot.start, timezoneOffsetSeconds, false);
  const to = timeLabel(slot.end, timezoneOffsetSeconds, true);
  const title = slot.isNow
    ? `Jetzt bis ${to} Uhr`
    : `${dayLabel(slot, timezoneOffsetSeconds, now)} ${from}–${to} Uhr`;

  const temp =
    Math.round(slot.tempMin) === Math.round(slot.tempMax)
      ? `${Math.round(slot.tempMin)} °C`
      : `${Math.round(slot.tempMin)}–${Math.round(slot.tempMax)} °C`;

  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{title}</span>
        {slot.isNow && (
          <Badge className="bg-accent text-accent-foreground">Jetzt</Badge>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {temp} · Wind {Math.round(slot.windMaxKmh)} km/h · Regen{" "}
        {Math.round(slot.rainProbabilityMax)} %
      </p>
    </div>
  );
}
