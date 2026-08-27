import { describe, expect, it } from "vitest";
import {
  loginSchema,
  profileSchema,
  registerSchema,
  resetPasswordSchema,
} from "./auth";

describe("registerSchema (AC-1, AC-2)", () => {
  it("akzeptiert gültige E-Mail und Passwort mit 8 Zeichen", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "12345678",
    });
    expect(result.success).toBe(true);
  });

  it("lehnt ein Passwort mit weniger als 8 Zeichen ab (AC-2)", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "1234567",
    });
    expect(result.success).toBe(false);
  });

  it("lehnt eine ungültige E-Mail-Adresse ab", () => {
    const result = registerSchema.safeParse({
      email: "keine-mail",
      password: "12345678",
    });
    expect(result.success).toBe(false);
  });

  it("normalisiert die E-Mail (trim + lowercase)", () => {
    const result = registerSchema.safeParse({
      email: "  Test@Example.COM  ",
      password: "12345678",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("test@example.com");
    }
  });
});

describe("loginSchema", () => {
  it("verlangt E-Mail und ein nicht-leeres Passwort", () => {
    expect(
      loginSchema.safeParse({ email: "a@b.de", password: "" }).success
    ).toBe(false);
    expect(
      loginSchema.safeParse({ email: "a@b.de", password: "x" }).success
    ).toBe(true);
  });
});

describe("resetPasswordSchema (AC-10)", () => {
  it("verlangt mindestens 8 Zeichen", () => {
    expect(resetPasswordSchema.safeParse({ password: "1234567" }).success).toBe(
      false
    );
    expect(
      resetPasswordSchema.safeParse({ password: "12345678" }).success
    ).toBe(true);
  });
});

describe("profileSchema (AC-11, AC-12)", () => {
  it("akzeptiert Anzeigename bis 50 Zeichen, lehnt 51 ab", () => {
    expect(
      profileSchema.safeParse({ displayName: "a".repeat(50), location: null })
        .success
    ).toBe(true);
    expect(
      profileSchema.safeParse({ displayName: "a".repeat(51), location: null })
        .success
    ).toBe(false);
  });

  it("akzeptiert einen vollständigen Ort", () => {
    const result = profileSchema.safeParse({
      displayName: "Erich",
      location: { name: "Linz, AT", lat: 48.3, lon: 14.29 },
    });
    expect(result.success).toBe(true);
  });

  it("lehnt einen unvollständigen Ort ab (EC-3: nie unaufgelöster Freitext)", () => {
    const result = profileSchema.safeParse({
      displayName: "Erich",
      location: { name: "Linz, AT" },
    });
    expect(result.success).toBe(false);
  });

  it("akzeptiert ein leeres Profil (alles optional)", () => {
    expect(
      profileSchema.safeParse({ displayName: "", location: null }).success
    ).toBe(true);
  });
});
