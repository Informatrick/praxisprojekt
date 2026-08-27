import type { Activity } from "@/app/activities/actions";
import { WEEKDAYS } from "@/lib/validations/activity";

// Kurze, menschenlesbare Zusammenfassung der Bedingungen einer Aktivität
// für die Aktivitätskarte (AC-8).
export function conditionSummary(a: Activity): string[] {
  const parts: string[] = [];

  if (a.temp_min !== null && a.temp_max !== null) {
    parts.push(`${a.temp_min}–${a.temp_max} °C`);
  } else if (a.temp_min !== null) {
    parts.push(`ab ${a.temp_min} °C`);
  } else if (a.temp_max !== null) {
    parts.push(`bis ${a.temp_max} °C`);
  }

  if (a.no_rain) parts.push("kein Regen");
  if (a.wind_max !== null) parts.push(`Wind ≤ ${a.wind_max} km/h`);

  if (a.time_from && a.time_to) {
    parts.push(`${a.time_from.slice(0, 5)}–${a.time_to.slice(0, 5)} Uhr`);
  }

  parts.push(formatWeekdays(a.weekdays));

  parts.push(a.location_name ?? "Wohnort");

  return parts;
}

// Zusammenhängende Wochentagsbereiche kompakt darstellen (Mo–Fr, Sa+So …).
function formatWeekdays(days: number[]): string {
  const sorted = [...days].sort((x, y) => x - y);
  if (sorted.length === 7) return "täglich";
  const shorts = new Map<number, string>(WEEKDAYS.map((w) => [w.value, w.short]));
  return sorted.map((d) => shorts.get(d) ?? String(d)).join(", ");
}
