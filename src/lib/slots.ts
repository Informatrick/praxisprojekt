// Slot-Berechnung für die Vorschläge-Seite (PROJ-3, design.md → Verhalten & Zugriff).
// Reine Funktionen ohne I/O, damit jede Regel einzeln testbar ist.
// Alle Zeitrechnung läuft in der lokalen Zeit des Standorts (EC-6): der
// Zeitzonen-Offset kommt aus der Forecast-Antwort und wird hier nur verrechnet.

export type ForecastBlock = {
  /** Unix-Sekunden (UTC), Beginn des 3h-Blocks */
  start: number;
  /** Unix-Sekunden, Ende des Blocks (start + 3h) */
  end: number;
  /** Temperatur in °C */
  temp: number;
  /** Windgeschwindigkeit in km/h (Umrechnung passiert im Adapter) */
  windKmh: number;
  /** Regenwahrscheinlichkeit in Prozent (0–100) */
  rainProbability: number;
  /** prognostizierte Regen- + Schneemenge in mm pro 3h */
  precipitationMm: number;
};

export type LocationForecast = {
  /** Offset des Orts gegenüber UTC in Sekunden (aus der Forecast-Antwort) */
  timezoneOffsetSeconds: number;
  /** die 3h-Blöcke, aufsteigend sortiert */
  blocks: ForecastBlock[];
};

/** Die Bedingungen einer Aktivität — Feldnamen wie in der Tabelle `activities`. */
export type SlotConditions = {
  temp_min: number | null;
  temp_max: number | null;
  no_rain: boolean;
  wind_max: number | null;
  /** "HH:MM" oder "HH:MM:SS", lokale Zeit des Standorts; null = ganzer Tag (AC-5) */
  time_from: string | null;
  time_to: string | null;
  /** ISO-Wochentage 1–7 (Mo=1) */
  weekdays: number[];
};

export type Slot = {
  /** Unix-Sekunden; bei laufendem Slot bereits auf „jetzt" gesetzt (AC-7) */
  start: number;
  end: number;
  /** läuft gerade → Anzeige „Jetzt bis X Uhr" (AC-7) */
  isNow: boolean;
  /** Temperaturspanne über die beteiligten Blöcke (AC-6) */
  tempMin: number;
  tempMax: number;
  windMaxKmh: number;
  rainProbabilityMax: number;
};

const DAY = 86400;

/** „Kein Regen" fällt durch ab > 30 % Wahrscheinlichkeit oder Niederschlagsmenge (AC-4). */
export const RAIN_PROBABILITY_LIMIT = 30;

/** Lokaler Tagesindex (Tage seit 1970-01-01) eines Zeitstempels am Standort. */
export function localDayIndex(t: number, offsetSeconds: number): number {
  return Math.floor((t + offsetSeconds) / DAY);
}

/** ISO-Wochentag (Mo=1 … So=7) eines lokalen Tagesindex; 1970-01-01 war ein Donnerstag. */
export function isoWeekday(dayIndex: number): number {
  return ((dayIndex + 3) % 7) + 1;
}

function parseTimeSeconds(time: string): number {
  const [h, m, s] = time.split(":").map(Number);
  return h * 3600 + (m ?? 0) * 60 + (s ?? 0);
}

/**
 * Erfüllt ein einzelner 3h-Block alle gesetzten Bedingungen? (AC-3)
 * Grenzwerte sind inklusive: exakt min/max gilt als erfüllt (EC-5).
 */
export function blockPasses(
  block: ForecastBlock,
  conditions: SlotConditions
): boolean {
  if (conditions.temp_min !== null && block.temp < conditions.temp_min) {
    return false;
  }
  if (conditions.temp_max !== null && block.temp > conditions.temp_max) {
    return false;
  }
  if (
    conditions.no_rain &&
    (block.rainProbability > RAIN_PROBABILITY_LIMIT ||
      block.precipitationMm > 0)
  ) {
    return false;
  }
  if (conditions.wind_max !== null && block.windKmh > conditions.wind_max) {
    return false;
  }
  return true;
}

type Interval = {
  start: number;
  end: number;
  /** lokaler Tagesindex — verschmolzen wird nur innerhalb desselben Tags */
  day: number;
  blocks: ForecastBlock[];
};

/**
 * Die passenden Zeitfenster einer Aktivität über den Forecast-Horizont.
 *
 * Regeln (design.md):
 * 1. Nur Blöcke, die alle gesetzten Bedingungen erfüllen (AC-3, EC-5).
 * 2. Überschneidung mit dem Zeitfenster genügt; angezeigt wird die Schnittmenge
 *    (AC-2, EC-1). Kein Zeitfenster → ganzer Tag (AC-5). Wochentage in lokaler
 *    Zeit des Standorts (EC-6); ein Block über Mitternacht wird gegen beide
 *    Tage geschnitten.
 * 3. Benachbarte passende Blöcke desselben Tags verschmelzen; nichts jenseits
 *    des Forecast-Horizonts (EC-2, harte Grenze durch die Blockliste selbst).
 * 4. Slots, deren Ende ≤ jetzt liegt, entfallen; ein laufender Slot beginnt
 *    bei „jetzt" (AC-7).
 * 5. Wetterwerte je Slot aus den beteiligten Blöcken (AC-6).
 */
export function computeSlots(
  conditions: SlotConditions,
  forecast: LocationForecast,
  now: number
): Slot[] {
  const offset = forecast.timezoneOffsetSeconds;
  const windowFrom = conditions.time_from
    ? parseTimeSeconds(conditions.time_from)
    : 0;
  const windowTo = conditions.time_to
    ? parseTimeSeconds(conditions.time_to)
    : DAY;

  const intervals: Interval[] = [];
  for (const block of forecast.blocks) {
    if (!blockPasses(block, conditions)) continue;

    const firstDay = localDayIndex(block.start, offset);
    const lastDay = localDayIndex(block.end - 1, offset);
    for (let day = firstDay; day <= lastDay; day++) {
      if (!conditions.weekdays.includes(isoWeekday(day))) continue;

      const dayStartUtc = day * DAY - offset;
      const start = Math.max(block.start, dayStartUtc + windowFrom);
      const end = Math.min(block.end, dayStartUtc + windowTo);
      if (start < end) {
        intervals.push({ start, end, day, blocks: [block] });
      }
    }
  }

  intervals.sort((a, b) => a.start - b.start);
  const merged: Interval[] = [];
  for (const interval of intervals) {
    const last = merged[merged.length - 1];
    if (last && last.day === interval.day && interval.start <= last.end) {
      last.end = Math.max(last.end, interval.end);
      last.blocks.push(...interval.blocks);
    } else {
      merged.push({ ...interval, blocks: [...interval.blocks] });
    }
  }

  const slots: Slot[] = [];
  for (const interval of merged) {
    if (interval.end <= now) continue; // komplett vorbei (AC-7)
    const isNow = interval.start <= now;
    slots.push({
      start: isNow ? now : interval.start,
      end: interval.end,
      isNow,
      tempMin: Math.min(...interval.blocks.map((b) => b.temp)),
      tempMax: Math.max(...interval.blocks.map((b) => b.temp)),
      windMaxKmh: Math.max(...interval.blocks.map((b) => b.windKmh)),
      rainProbabilityMax: Math.max(
        ...interval.blocks.map((b) => b.rainProbability)
      ),
    });
  }
  return slots;
}
