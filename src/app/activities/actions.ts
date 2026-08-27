"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { activitySchema } from "@/lib/validations/activity";

export type Activity = {
  id: string;
  name: string;
  temp_min: number | null;
  temp_max: number | null;
  no_rain: boolean;
  wind_max: number | null;
  time_from: string | null;
  time_to: string | null;
  weekdays: number[];
  location_name: string | null;
  location_lat: number | null;
  location_lon: number | null;
};

export type ActivityActionState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: string;
};

// Rohwerte aus dem Formular in das Zod-Schema übersetzen.
// Leere Strings → null; Zahlen geparst; Zeitfenster/Standort optional.
function parseForm(formData: FormData) {
  const num = (key: string) => {
    const v = formData.get(key);
    return typeof v === "string" && v.trim() !== "" ? Number(v) : null;
  };
  const str = (key: string) => {
    const v = formData.get(key);
    return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
  };
  const locName = str("locationName");
  const locLat = num("locationLat");
  const locLon = num("locationLon");

  return {
    name: (formData.get("name") as string) ?? "",
    tempMin: num("tempMin"),
    tempMax: num("tempMax"),
    noRain: formData.get("noRain") === "on" || formData.get("noRain") === "true",
    windMax: num("windMax"),
    timeFrom: str("timeFrom"),
    timeTo: str("timeTo"),
    weekdays: formData
      .getAll("weekdays")
      .map((d) => Number(d))
      .filter((n) => Number.isInteger(n)),
    location:
      locName && locLat !== null && locLon !== null
        ? { name: locName, lat: locLat, lon: locLon }
        : null,
  };
}

function toRow(input: ReturnType<typeof parseForm>) {
  return {
    name: input.name.trim(),
    temp_min: input.tempMin,
    temp_max: input.tempMax,
    no_rain: input.noRain,
    wind_max: input.windMax,
    time_from: input.timeFrom,
    time_to: input.timeTo,
    weekdays: input.weekdays,
    location_name: input.location?.name ?? null,
    location_lat: input.location?.lat ?? null,
    location_lon: input.location?.lon ?? null,
  };
}

export async function createActivity(
  _prev: ActivityActionState,
  formData: FormData
): Promise<ActivityActionState> {
  const parsed = activitySchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Nicht angemeldet." };
  }

  const { error } = await supabase
    .from("activities")
    .insert({ ...toRow(parseForm(formData)), user_id: user.id });
  if (error) {
    return { error: "Speichern fehlgeschlagen. Bitte versuche es erneut." };
  }

  revalidatePath("/activities");
  return { success: "Aktivität angelegt." };
}

export async function updateActivity(
  _prev: ActivityActionState,
  formData: FormData
): Promise<ActivityActionState> {
  const id = formData.get("id");
  if (typeof id !== "string" || id === "") {
    return { error: "Ungültige Aktivität." };
  }

  const parsed = activitySchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Nicht angemeldet." };
  }

  // RLS begrenzt zusätzlich auf die eigene Zeile; select() zeigt, ob eine Zeile
  // betroffen war (EC-5: inzwischen gelöscht → 0 Zeilen).
  const { data, error } = await supabase
    .from("activities")
    .update(toRow(parseForm(formData)))
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id");
  if (error) {
    return { error: "Speichern fehlgeschlagen. Bitte versuche es erneut." };
  }
  if (!data || data.length === 0) {
    return { error: "Diese Aktivität existiert nicht mehr." };
  }

  revalidatePath("/activities");
  return { success: "Aktivität gespeichert." };
}

export async function deleteActivity(
  id: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Nicht angemeldet." };
  }

  const { data, error } = await supabase
    .from("activities")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id");
  if (error) {
    return { error: "Löschen fehlgeschlagen. Bitte versuche es erneut." };
  }
  if (!data || data.length === 0) {
    // EC-5: war in einem anderen Tab schon weg
    return { error: "Diese Aktivität existiert nicht mehr." };
  }

  revalidatePath("/activities");
  return { success: true };
}

export async function listActivities(): Promise<Activity[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  const { data } = await supabase
    .from("activities")
    .select(
      "id, name, temp_min, temp_max, no_rain, wind_max, time_from, time_to, weekdays, location_name, location_lat, location_lon"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (data as Activity[]) ?? [];
}
