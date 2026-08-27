"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";

export type AuthActionState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: string;
};

// Eine Meldung für "E-Mail unbekannt", "Passwort falsch" und "Konto gelöscht" —
// nie verraten, ob ein Konto existiert (AC-14, EC-6).
const GENERIC_LOGIN_ERROR = "E-Mail-Adresse oder Passwort ist falsch.";
const NEUTRAL_REGISTER_SUCCESS =
  "Fast geschafft — prüfe dein Postfach und bestätige deine E-Mail-Adresse.";
const NEUTRAL_RESET_SUCCESS =
  "Wenn ein Konto mit dieser Adresse existiert, haben wir dir einen Link zum Zurücksetzen geschickt.";

function lockMessage(lockedUntil: string): string {
  const minutes = Math.max(
    1,
    Math.ceil((new Date(lockedUntil).getTime() - Date.now()) / 60_000)
  );
  return `Zu viele Fehlversuche. Versuche es in ${minutes} Minute${minutes === 1 ? "" : "n"} erneut.`;
}

async function getOrigin(): Promise<string> {
  const h = await headers();
  return h.get("origin") ?? `http://localhost:3000`;
}

export async function register(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: z_fieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const origin = await getOrigin();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: `${origin}/auth/confirm?next=/` },
  });

  // Bereits registrierte Adresse: dieselbe neutrale Meldung wie sonst (EC-1) —
  // mit aktivierter E-Mail-Bestätigung meldet Supabase hier ohnehin keinen Fehler.
  if (error && error.code !== "user_already_exists") {
    return {
      error:
        "Die Registrierung hat gerade nicht geklappt. Bitte versuche es erneut.",
    };
  }
  return { success: NEUTRAL_REGISTER_SUCCESS };
}

export async function login(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: z_fieldErrors(parsed.error) };
  }
  const { email, password } = parsed.data;

  const supabase = await createClient();

  // Konto-Throttle (AC-13): vor dem Anmeldeversuch prüfen.
  const { data: lockedUntil } = await supabase.rpc("login_locked_until", {
    p_email: email,
  });
  if (lockedUntil) {
    return { error: lockMessage(lockedUntil) };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // AC-3: unbestätigtes Konto bekommt den Bestätigungs-Hinweis.
    if (error.code === "email_not_confirmed") {
      return {
        error:
          "Bitte bestätige zuerst deine E-Mail-Adresse — wir haben dir dazu einen Link geschickt.",
      };
    }
    // Fehlversuch zählen; ab dem 5. im 15-Minuten-Fenster ist das Konto gesperrt.
    const { data: nowLocked } = await supabase.rpc("record_failed_login", {
      p_email: email,
    });
    if (nowLocked) {
      return { error: lockMessage(nowLocked) };
    }
    return { error: GENERIC_LOGIN_ERROR };
  }

  await supabase.rpc("clear_login_throttle", { p_email: email });
  redirect("/");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { fieldErrors: z_fieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const origin = await getOrigin();
  // Fehler werden bewusst nicht unterschieden — immer dieselbe neutrale
  // Bestätigung, ob das Konto existiert oder nicht (AC-9, AC-14).
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  });
  return { success: NEUTRAL_RESET_SUCCESS };
}

export async function updatePassword(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: z_fieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error:
        "Dieser Link ist abgelaufen oder wurde schon benutzt. Bitte fordere einen neuen an.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return {
      error:
        "Das Passwort konnte nicht gesetzt werden. Bitte fordere einen neuen Link an.",
    };
  }
  redirect("/");
}

// zod v4: flatten liefert { fieldErrors } — kleine Hilfsfunktion, damit die
// Actions einheitlich zurückgeben.
function z_fieldErrors(error: {
  flatten: () => { fieldErrors: Record<string, string[] | undefined> };
}): Record<string, string[] | undefined> {
  return error.flatten().fieldErrors;
}
