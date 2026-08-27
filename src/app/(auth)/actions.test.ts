import { beforeEach, describe, expect, it, vi } from "vitest";

const { supabaseMock, redirectMock } = vi.hoisted(() => {
  const supabaseMock = {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      updateUser: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
    rpc: vi.fn(),
  };
  const redirectMock = vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  });
  return { supabaseMock, redirectMock };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => supabaseMock,
}));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("next/headers", () => ({
  headers: async () => new Map([["origin", "http://localhost:3000"]]),
}));

import { login, register } from "./actions";

function form(entries: Record<string, string>): FormData {
  const fd = new FormData();
  Object.entries(entries).forEach(([k, v]) => fd.append(k, v));
  return fd;
}

describe("login action (AC-13, AC-14, AC-3, EC-6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMock.rpc.mockResolvedValue({ data: null, error: null });
  });

  it("blockt ein gesperrtes Konto vor dem Anmeldeversuch (AC-13)", async () => {
    supabaseMock.rpc.mockImplementation(async (fn: string) =>
      fn === "login_locked_until"
        ? { data: new Date(Date.now() + 10 * 60_000).toISOString(), error: null }
        : { data: null, error: null }
    );
    const result = await login({}, form({ email: "a@b.de", password: "x" }));
    expect(result.error).toMatch(/Zu viele Fehlversuche/);
    expect(supabaseMock.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("liefert für unbekannte Adresse und falsches Passwort dieselbe Meldung und zählt den Fehlversuch (AC-14)", async () => {
    supabaseMock.auth.signInWithPassword.mockResolvedValue({
      error: { code: "invalid_credentials", message: "Invalid login credentials" },
    });
    const result = await login(
      {},
      form({ email: "a@b.de", password: "falsch" })
    );
    expect(result.error).toBe("E-Mail-Adresse oder Passwort ist falsch.");
    expect(result.error).not.toMatch(/existiert|unbekannt|not found/i);
    expect(supabaseMock.rpc).toHaveBeenCalledWith("record_failed_login", {
      p_email: "a@b.de",
    });
  });

  it("meldet die Sperre, sobald der 5. Fehlversuch sie auslöst (AC-13)", async () => {
    supabaseMock.auth.signInWithPassword.mockResolvedValue({
      error: { code: "invalid_credentials", message: "Invalid login credentials" },
    });
    supabaseMock.rpc.mockImplementation(async (fn: string) =>
      fn === "record_failed_login"
        ? { data: new Date(Date.now() + 15 * 60_000).toISOString(), error: null }
        : { data: null, error: null }
    );
    const result = await login({}, form({ email: "a@b.de", password: "x" }));
    expect(result.error).toMatch(/Zu viele Fehlversuche/);
  });

  it("zeigt bei unbestätigtem Konto den Bestätigungs-Hinweis (AC-3)", async () => {
    supabaseMock.auth.signInWithPassword.mockResolvedValue({
      error: { code: "email_not_confirmed", message: "Email not confirmed" },
    });
    const result = await login({}, form({ email: "a@b.de", password: "x" }));
    expect(result.error).toMatch(/bestätige/i);
  });

  it("setzt bei Erfolg den Zähler zurück und leitet zur Startseite (AC-5)", async () => {
    supabaseMock.auth.signInWithPassword.mockResolvedValue({ error: null });
    await expect(
      login({}, form({ email: "a@b.de", password: "richtig123" }))
    ).rejects.toThrow("REDIRECT:/");
    expect(supabaseMock.rpc).toHaveBeenCalledWith("clear_login_throttle", {
      p_email: "a@b.de",
    });
  });
});

describe("register action (AC-1, AC-2, EC-1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("legt ein Konto an und antwortet neutral (AC-1)", async () => {
    supabaseMock.auth.signUp.mockResolvedValue({ error: null });
    const result = await register(
      {},
      form({ email: "neu@b.de", password: "12345678" })
    );
    expect(result.success).toMatch(/Postfach/);
  });

  it("lehnt ein zu kurzes Passwort ab, ohne Supabase aufzurufen (AC-2)", async () => {
    const result = await register(
      {},
      form({ email: "neu@b.de", password: "1234567" })
    );
    expect(result.fieldErrors?.password?.[0]).toMatch(/mindestens 8/);
    expect(supabaseMock.auth.signUp).not.toHaveBeenCalled();
  });

  it("antwortet bei bereits registrierter Adresse mit derselben neutralen Meldung (EC-1)", async () => {
    supabaseMock.auth.signUp.mockResolvedValue({
      error: { code: "user_already_exists", message: "User already registered" },
    });
    const result = await register(
      {},
      form({ email: "da@b.de", password: "12345678" })
    );
    expect(result.success).toMatch(/Postfach/);
    expect(result.error).toBeUndefined();
  });
});
