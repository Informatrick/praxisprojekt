import { createClient } from "@/lib/supabase/server";
import {
  DangerZone,
  ExportSection,
  ProfileForm,
} from "@/components/profile-form";

export const metadata = { title: "Profil — WetterSlot" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    // Der Proxy leitet Nicht-Angemeldete bereits um; doppelte Kontrolle.
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, home_location_name, home_lat, home_lon")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Profil</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </header>
      <div className="grid gap-6 md:max-w-xl">
        <ProfileForm
          initialDisplayName={profile?.display_name ?? ""}
          initialLocation={
            profile?.home_location_name != null &&
            profile.home_lat != null &&
            profile.home_lon != null
              ? {
                  name: profile.home_location_name,
                  lat: profile.home_lat,
                  lon: profile.home_lon,
                }
              : null
          }
        />
        <ExportSection />
        <DangerZone />
      </div>
    </div>
  );
}
