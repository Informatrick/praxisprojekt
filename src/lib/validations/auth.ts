import { z } from "zod";

// E-Mail wird vor der Prüfung normalisiert (trim + lowercase) — dieselbe
// Normalisierung wie in den Throttle-Funktionen der Datenbank.
const emailSchema = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
  z.email("Bitte eine gültige E-Mail-Adresse eingeben")
);

export const registerSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(8, "Das Passwort muss mindestens 8 Zeichen haben"),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Bitte das Passwort eingeben"),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Das Passwort muss mindestens 8 Zeichen haben"),
});

// Ein Ort ist entweder vollständig (Name + Koordinaten aus der Vorschlagsliste)
// oder gar nicht gesetzt — nie unaufgelöster Freitext (EC-3).
export const locationSchema = z.object({
  name: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .max(50, "Der Anzeigename darf höchstens 50 Zeichen haben"),
  location: locationSchema.nullable(),
});

export type LocationInput = z.infer<typeof locationSchema>;
