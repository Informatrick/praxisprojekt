import { describe, expect, it } from "vitest";
import { activitySchema } from "./activity";

const base = {
  name: "Joggen",
  tempMin: null,
  tempMax: null,
  noRain: false,
  windMax: null,
  timeFrom: null,
  timeTo: null,
  weekdays: [1, 2, 3, 4, 5, 6, 7],
  location: null,
};

describe("activitySchema", () => {
  it("akzeptiert eine gültige Aktivität mit einer Bedingung (AC-1)", () => {
    expect(
      activitySchema.safeParse({ ...base, noRain: true }).success
    ).toBe(true);
  });

  it("lehnt einen leeren Namen ab (AC-2)", () => {
    expect(
      activitySchema.safeParse({ ...base, name: "", noRain: true }).success
    ).toBe(false);
  });

  it("lehnt einen Namen über 80 Zeichen ab (AC-2)", () => {
    expect(
      activitySchema.safeParse({ ...base, name: "a".repeat(81), noRain: true })
        .success
    ).toBe(false);
  });

  it("lehnt eine Aktivität ohne jede Wetterbedingung ab (AC-3)", () => {
    const result = activitySchema.safeParse(base);
    expect(result.success).toBe(false);
  });

  it("akzeptiert Temperatur als einzige Bedingung (AC-1/AC-3)", () => {
    expect(activitySchema.safeParse({ ...base, tempMin: 5 }).success).toBe(true);
  });

  it("lehnt temp min >= max ab (AC-4)", () => {
    expect(
      activitySchema.safeParse({ ...base, tempMin: 20, tempMax: 20 }).success
    ).toBe(false);
    expect(
      activitySchema.safeParse({ ...base, tempMin: 25, tempMax: 10 }).success
    ).toBe(false);
  });

  it("akzeptiert temp min < max (AC-4)", () => {
    expect(
      activitySchema.safeParse({ ...base, tempMin: 5, tempMax: 25 }).success
    ).toBe(true);
  });

  it("lehnt negativen Wind ab (AC-4)", () => {
    expect(
      activitySchema.safeParse({ ...base, windMax: -1 }).success
    ).toBe(false);
  });

  it("lehnt Zeitfenster mit von >= bis ab (AC-5)", () => {
    expect(
      activitySchema.safeParse({
        ...base,
        noRain: true,
        timeFrom: "20:00",
        timeTo: "06:00",
      }).success
    ).toBe(false);
  });

  it("lehnt ein halbes Zeitfenster ab (nur von, kein bis) (AC-5)", () => {
    expect(
      activitySchema.safeParse({
        ...base,
        noRain: true,
        timeFrom: "06:00",
        timeTo: null,
      }).success
    ).toBe(false);
  });

  it("akzeptiert ein gültiges Zeitfenster (AC-5)", () => {
    expect(
      activitySchema.safeParse({
        ...base,
        noRain: true,
        timeFrom: "06:00",
        timeTo: "20:00",
      }).success
    ).toBe(true);
  });

  it("lehnt eine leere Wochentagsauswahl ab (AC-6)", () => {
    expect(
      activitySchema.safeParse({ ...base, noRain: true, weekdays: [] }).success
    ).toBe(false);
  });

  it("akzeptiert einen vollständigen Standort und lehnt einen halben ab", () => {
    expect(
      activitySchema.safeParse({
        ...base,
        noRain: true,
        location: { name: "Linz, AT", lat: 48.3, lon: 14.29 },
      }).success
    ).toBe(true);
    expect(
      activitySchema.safeParse({
        ...base,
        noRain: true,
        location: { name: "Linz, AT" },
      }).success
    ).toBe(false);
  });
});
