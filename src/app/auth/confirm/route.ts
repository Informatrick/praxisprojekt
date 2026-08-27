import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Löst Bestätigungs- und Reset-Links ein (AC-4, AC-10).
// Unterstützt beide Supabase-Linkformen: token_hash (angepasste Mail-Templates)
// und code (Standard-Templates, PKCE-Redirect). Abgelaufene oder schon benutzte
// Links landen mit klarer Meldung auf der Login-Seite (EC-2).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  let next = searchParams.get("next") ?? "/";
  if (!next.startsWith("/")) {
    next = "/"; // nie auf fremde Hosts weiterleiten
  }

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=invalid-link", request.url)
  );
}
