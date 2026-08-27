import Link from "next/link";
import { CloudSun } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AccountMenu } from "@/components/account-menu";

// App-Rahmen (docs/app-shell.md): Logo links, Konto-Menü rechts.
// PROJ-1 liefert den Header ohne Navigationslinks — die ergänzt PROJ-2
// als Shell-Owner. Abgemeldet wird kein Header gezeigt.
export async function AppHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md text-lg font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
        >
          <CloudSun className="size-6 text-primary" aria-hidden />
          ActivitySlot
        </Link>
        <AccountMenu
          email={user.email ?? ""}
          displayName={profile?.display_name ?? null}
        />
      </div>
    </header>
  );
}
