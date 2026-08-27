"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validations/auth";

export type ProfileActionState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: string;
};

// Profil aktualisieren (AC-11, AC-12). Der Ort kommt als aufgelöster Treffer
// aus der LocationSearch (hidden fields) — nie als Freitext.
export async function updateProfile(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Nicht angemeldet." };
  }

  const rawName = formData.get("locationName");
  const rawLat = formData.get("locationLat");
  const rawLon = formData.get("locationLon");
  const hasLocation =
    typeof rawName === "string" &&
    rawName.length > 0 &&
    typeof rawLat === "string" &&
    rawLat.length > 0 &&
    typeof rawLon === "string" &&
    rawLon.length > 0;

  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName") ?? "",
    location: hasLocation
      ? { name: rawName, lat: Number(rawLat), lon: Number(rawLon) }
      : null,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { displayName, location } = parsed.data;
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName === "" ? null : displayName,
      home_location_name: location?.name ?? null,
      home_lat: location?.lat ?? null,
      home_lon: location?.lon ?? null,
    })
    .eq("id", user.id);

  if (error) {
    // EC-4: Fehlermeldung zurückgeben — die Eingaben bleiben im Formular erhalten.
    return {
      error: "Speichern fehlgeschlagen. Bitte versuche es erneut.",
    };
  }
  return { success: "Profil gespeichert." };
}

// Daten-Export (AC-16): alle über den Nutzer gespeicherten Daten als JSON.
// Wird von der Profilseite als Datei-Download ausgelöst.
export async function getExportData(): Promise<
  { data: Record<string, unknown> } | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Nicht angemeldet." };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, home_location_name, home_lat, home_lon, created_at, updated_at")
    .eq("id", user.id)
    .single();
  if (error) {
    return { error: "Export fehlgeschlagen. Bitte versuche es erneut." };
  }

  // AC-13 (PROJ-2): Aktivitäten des Nutzers in den Export aufnehmen.
  const { data: activities, error: activitiesError } = await supabase
    .from("activities")
    .select(
      "name, temp_min, temp_max, no_rain, wind_max, time_from, time_to, weekdays, location_name, location_lat, location_lon, created_at, updated_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (activitiesError) {
    return { error: "Export fehlgeschlagen. Bitte versuche es erneut." };
  }

  return {
    data: {
      exportiert_am: new Date().toISOString(),
      konto: {
        email: user.email,
        registriert_am: user.created_at,
      },
      profil: {
        anzeigename: profile.display_name,
        wohnort: profile.home_location_name,
        wohnort_koordinaten:
          profile.home_lat !== null
            ? { lat: profile.home_lat, lon: profile.home_lon }
            : null,
        angelegt_am: profile.created_at,
        geaendert_am: profile.updated_at,
      },
      aktivitaeten: activities ?? [],
    },
  };
}

// Konto löschen (AC-15): die Security-Definer-Funktion löscht den eigenen
// Auth-Nutzer; Profil (und künftig Aktivitäten) folgen per Kaskade.
export async function deleteAccount(): Promise<{ error: string } | never> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Nicht angemeldet." };
  }

  const { error } = await supabase.rpc("delete_user");
  if (error) {
    return {
      error: "Das Konto konnte nicht gelöscht werden. Bitte versuche es erneut.",
    };
  }

  // Sitzung lokal beenden — der Auth-Nutzer existiert nicht mehr.
  await supabase.auth.signOut();
  redirect("/login");
}
