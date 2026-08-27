import { z } from "zod";
import { locationSchema } from "./auth";

// ISO-Wochentage: 1 = Montag … 7 = Sonntag
export const WEEKDAYS = [
  { value: 1, short: "Mo", label: "Montag" },
  { value: 2, short: "Di", label: "Dienstag" },
  { value: 3, short: "Mi", label: "Mittwoch" },
  { value: 4, short: "Do", label: "Donnerstag" },
  { value: 5, short: "Fr", label: "Freitag" },
  { value: 6, short: "Sa", label: "Samstag" },
  { value: 7, short: "So", label: "Sonntag" },
] as const;

const optionalTemp = z
  .number()
  .int()
  .min(-50, "Temperatur muss über −50 °C liegen")
  .max(60, "Temperatur muss unter 60 °C liegen")
  .nullable();

// "HH:MM" oder null
const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Ungültige Uhrzeit")
  .nullable();

export const activitySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Bitte einen Namen eingeben")
      .max(80, "Der Name darf höchstens 80 Zeichen haben"),
    tempMin: optionalTemp,
    tempMax: optionalTemp,
    noRain: z.boolean(),
    windMax: z
      .number()
      .min(0, "Wind darf nicht negativ sein")
      .nullable(),
    timeFrom: timeString,
    timeTo: timeString,
    weekdays: z
      .array(z.number().int().min(1).max(7))
      .min(1, "Bitte mindestens einen Wochentag wählen"),
    location: locationSchema.nullable(),
  })
  // AC-3: mindestens eine Wetterbedingung
  .refine(
    (v) =>
      v.tempMin !== null ||
      v.tempMax !== null ||
      v.noRain === true ||
      v.windMax !== null,
    {
      error: "Setze mindestens eine Wetterbedingung (Temperatur, kein Regen oder Wind)",
      path: ["conditions"],
    }
  )
  // AC-4: temp min < max wenn beide gesetzt
  .refine(
    (v) => v.tempMin === null || v.tempMax === null || v.tempMin < v.tempMax,
    { error: "Die Mindesttemperatur muss unter der Höchsttemperatur liegen", path: ["tempMax"] }
  )
  // AC-5: Zeitfenster nur zusammen und von < bis (kein Mitternachtssprung)
  .refine((v) => (v.timeFrom === null) === (v.timeTo === null), {
    error: "Bitte Von- und Bis-Zeit gemeinsam setzen",
    path: ["timeTo"],
  })
  .refine(
    (v) => v.timeFrom === null || v.timeTo === null || v.timeFrom < v.timeTo,
    { error: "Die Von-Zeit muss vor der Bis-Zeit liegen", path: ["timeTo"] }
  );

export type ActivityInput = z.infer<typeof activitySchema>;
