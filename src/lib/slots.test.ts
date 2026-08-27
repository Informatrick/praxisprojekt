import { describe, expect, it } from "vitest";
import {
  blockPasses,
  computeSlots,
  isoWeekday,
  localDayIndex,
  type ForecastBlock,
  type LocationForecast,
  type SlotConditions,
} from "./slots";

const DAY = 86400;
const HOUR = 3600;

// Tag 4 seit 1970-01-01 = Montag, 5. Jänner 1970 — fester, nachrechenbarer Anker.
const MONDAY = 4;

function block(
  startDay: number,
  startHour: number,
  overrides: Partial<ForecastBlock> = {}
): ForecastBlock {
  const start = startDay * DAY + startHour * HOUR;
  return {
    start,
    end: start + 3 * HOUR,
    temp: 20,
    windKmh: 10,
    rainProbability: 0,
    precipitationMm: 0,
    ...overrides,
  };
}

function forecast(
  blocks: ForecastBlock[],
  timezoneOffsetSeconds = 0
): LocationForecast {
  return { timezoneOffsetSeconds, blocks };
}

const anyDay: SlotConditions = {
  temp_min: null,
  temp_max: null,
  no_rain: false,
  wind_max: null,
  time_from: null,
  time_to: null,
  weekdays: [1, 2, 3, 4, 5, 6, 7],
};

describe("localDayIndex / isoWeekday", () => {
  it("kennt den Wochentag: Tag 4 (5.1.1970) war ein Montag (EC-6)", () => {
    expect(isoWeekday(MONDAY)).toBe(1);
    expect(isoWeekday(MONDAY + 6)).toBe(7);
  });

  it("rechnet den Tagesindex in der lokalen Zeit des Standorts (EC-6)", () => {
    // 23:00 UTC am Tag 4 ist mit Offset +2h bereits Tag 5 vor Ort
    expect(localDayIndex(MONDAY * DAY + 23 * HOUR, 2 * HOUR)).toBe(MONDAY + 1);
    expect(localDayIndex(MONDAY * DAY + 23 * HOUR, 0)).toBe(MONDAY);
  });
});

describe("blockPasses (AC-3, AC-4, EC-5)", () => {
  it("Grenzwerte sind inklusive: exakt temp_min/temp_max erfüllt (EC-5)", () => {
    const c = { ...anyDay, temp_min: 5, temp_max: 30 };
    expect(blockPasses(block(MONDAY, 9, { temp: 5 }), c)).toBe(true);
    expect(blockPasses(block(MONDAY, 9, { temp: 30 }), c)).toBe(true);
    expect(blockPasses(block(MONDAY, 9, { temp: 4.9 }), c)).toBe(false);
    expect(blockPasses(block(MONDAY, 9, { temp: 30.1 }), c)).toBe(false);
  });

  it("„kein Regen“: über 30 % Wahrscheinlichkeit oder Menge fällt durch (AC-4)", () => {
    const c = { ...anyDay, no_rain: true };
    expect(blockPasses(block(MONDAY, 9, { rainProbability: 30 }), c)).toBe(true);
    expect(blockPasses(block(MONDAY, 9, { rainProbability: 31 }), c)).toBe(false);
    expect(
      blockPasses(
        block(MONDAY, 9, { rainProbability: 10, precipitationMm: 0.2 }),
        c
      )
    ).toBe(false);
  });

  it("Wind: exakt wind_max erfüllt, darüber nicht (EC-5)", () => {
    const c = { ...anyDay, wind_max: 20 };
    expect(blockPasses(block(MONDAY, 9, { windKmh: 20 }), c)).toBe(true);
    expect(blockPasses(block(MONDAY, 9, { windKmh: 20.5 }), c)).toBe(false);
  });

  it("nicht gesetzte Bedingungen werden ignoriert", () => {
    expect(
      blockPasses(
        block(MONDAY, 9, { temp: -20, windKmh: 90, rainProbability: 100 }),
        anyDay
      )
    ).toBe(true);
  });
});

describe("computeSlots — Zeitfenster & Verschmelzen (AC-2, AC-5, EC-1)", () => {
  it("schneidet auf das Zeitfenster zu und verschmilzt benachbarte Blöcke (AC-2)", () => {
    const c = { ...anyDay, time_from: "17:00", time_to: "20:00", weekdays: [1] };
    const slots = computeSlots(
      c,
      forecast([block(MONDAY, 15), block(MONDAY, 18)]),
      0
    );
    expect(slots).toHaveLength(1);
    expect(slots[0].start).toBe(MONDAY * DAY + 17 * HOUR);
    expect(slots[0].end).toBe(MONDAY * DAY + 20 * HOUR);
  });

  it("ein Zeitfenster kürzer als 3 h bekommt trotzdem einen Slot (EC-1)", () => {
    const c = { ...anyDay, time_from: "17:00", time_to: "19:00", weekdays: [1] };
    const slots = computeSlots(c, forecast([block(MONDAY, 15)]), 0);
    expect(slots).toHaveLength(1);
    expect(slots[0].start).toBe(MONDAY * DAY + 17 * HOUR);
    expect(slots[0].end).toBe(MONDAY * DAY + 18 * HOUR);
  });

  it("ein durchfallender Block trennt zwei Slots (AC-3)", () => {
    const c = { ...anyDay, temp_min: 10, weekdays: [1] };
    const slots = computeSlots(
      c,
      forecast([
        block(MONDAY, 9),
        block(MONDAY, 12, { temp: 5 }),
        block(MONDAY, 15),
      ]),
      0
    );
    expect(slots.map((s) => [s.start, s.end])).toEqual([
      [MONDAY * DAY + 9 * HOUR, MONDAY * DAY + 12 * HOUR],
      [MONDAY * DAY + 15 * HOUR, MONDAY * DAY + 18 * HOUR],
    ]);
  });

  it("ohne Zeitfenster zählt der ganze Tag; abgewählte Wochentage nie (AC-5)", () => {
    const slots = computeSlots(
      { ...anyDay, weekdays: [2] },
      forecast([block(MONDAY, 9)]),
      0
    );
    expect(slots).toHaveLength(0);
  });

  it("verschmilzt nie über die Tagesgrenze: pro Ortstag ein Slot", () => {
    // Block 23–2 Uhr: Montag-Anteil 23–24, Dienstag-Anteil 0–2 — zwei Slots
    const slots = computeSlots(
      { ...anyDay, weekdays: [1, 2] },
      forecast([block(MONDAY, 23)]),
      0
    );
    expect(slots.map((s) => [s.start, s.end])).toEqual([
      [MONDAY * DAY + 23 * HOUR, (MONDAY + 1) * DAY],
      [(MONDAY + 1) * DAY, (MONDAY + 1) * DAY + 2 * HOUR],
    ]);
  });

  it("ein Mitternachts-Block zählt nur für erlaubte Wochentage (design Regel 2)", () => {
    const slots = computeSlots(
      { ...anyDay, weekdays: [1] },
      forecast([block(MONDAY, 23)]),
      0
    );
    expect(slots).toHaveLength(1);
    expect(slots[0].end).toBe((MONDAY + 1) * DAY);
  });
});

describe("computeSlots — Heute-Regel (AC-7)", () => {
  it("vergangene Slots entfallen, ein laufender beginnt bei „jetzt“", () => {
    const now = MONDAY * DAY + 16 * HOUR;
    const slots = computeSlots(
      { ...anyDay, weekdays: [1] },
      forecast([block(MONDAY, 9), block(MONDAY, 15)]),
      now
    );
    expect(slots).toHaveLength(1);
    expect(slots[0].isNow).toBe(true);
    expect(slots[0].start).toBe(now);
    expect(slots[0].end).toBe(MONDAY * DAY + 18 * HOUR);
  });

  it("ein zukünftiger Slot bleibt unverändert und ist nicht „jetzt“", () => {
    const slots = computeSlots(
      { ...anyDay, weekdays: [1] },
      forecast([block(MONDAY, 15)]),
      MONDAY * DAY + 9 * HOUR
    );
    expect(slots[0].isNow).toBe(false);
    expect(slots[0].start).toBe(MONDAY * DAY + 15 * HOUR);
  });
});

describe("computeSlots — Wetterwerte je Slot (AC-6)", () => {
  it("aggregiert Temperaturspanne, max. Wind und max. Regenwahrscheinlichkeit", () => {
    const slots = computeSlots(
      { ...anyDay, weekdays: [1] },
      forecast([
        block(MONDAY, 9, { temp: 18, windKmh: 10, rainProbability: 10 }),
        block(MONDAY, 12, { temp: 21, windKmh: 12, rainProbability: 30 }),
      ]),
      0
    );
    expect(slots).toHaveLength(1);
    expect(slots[0].tempMin).toBe(18);
    expect(slots[0].tempMax).toBe(21);
    expect(slots[0].windMaxKmh).toBe(12);
    expect(slots[0].rainProbabilityMax).toBe(30);
  });
});

describe("computeSlots — lokale Zeit des Standorts (EC-6)", () => {
  it("prüft Wochentag und Zeitfenster in der Ortszeit, nicht in UTC", () => {
    // UTC: Sonntag 22:00–1:00 · Ortszeit (+2h): Montag 0:00–3:00
    const b = block(MONDAY - 1, 22);
    const slots = computeSlots(
      { ...anyDay, weekdays: [1] },
      forecast([b], 2 * HOUR),
      0
    );
    expect(slots).toHaveLength(1);
    expect(slots[0].start).toBe(b.start);
    expect(slots[0].end).toBe(b.end);
  });

  it("der Forecast-Horizont ist die harte Grenze (EC-2)", () => {
    // nur ein Block → nie ein Slot jenseits seines Endes
    const slots = computeSlots(
      { ...anyDay, weekdays: [1] },
      forecast([block(MONDAY, 15)]),
      0
    );
    expect(slots[0].end).toBeLessThanOrEqual(MONDAY * DAY + 18 * HOUR);
  });
});
