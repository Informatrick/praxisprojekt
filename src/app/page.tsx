import Link from "next/link";
import { redirect } from "next/navigation";
import { CloudSun } from "lucide-react";
import { listActivities, type Activity } from "@/app/activities/actions";
import { ActivitySuggestions } from "@/components/activity-suggestions";
import { ForecastError } from "@/components/forecast-error";
import { Button } from "@/components/ui/button";
import { computeSlots, type LocationForecast } from "@/lib/slots";
import { coordinateKey, getForecast, nowUnixSeconds } from "@/lib/weather";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Vorschläge — ActivitySlot" };

// Vorschläge-Seite (PROJ-3): serverseitig gerendert; Aktivitäten + Profil
// werden bei jedem Aufruf frisch gelesen (EC-4) — nur der Forecast-Abruf in
// weather.ts ist 30 Minuten gecacht. Der Routen-Schutz liegt im Proxy;
// die Sitzung wird hier zusätzlich geprüft (AC-13).

type ResolvedLocation = { name: string; lat: number; lon: number } | null;

function resolveLocation(
  activity: Activity,
  profile: { home_location_name: string | null; home_lat: number | null; home_lon: number | null } | null
): ResolvedLocation {
  if (activity.location_lat !== null && activity.location_lon !== null) {
    return {
      name: activity.location_name ?? "",
      lat: activity.location_lat,
      lon: activity.location_lon,
    };
  }
  if (profile && profile.home_lat !== null && profile.home_lon !== null) {
    return {
      name: profile.home_location_name ?? "",
      lat: profile.home_lat,
      lon: profile.home_lon,
    };
  }
  return null;
}

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [activities, { data: profile }] = await Promise.all([
    listActivities(),
    supabase
      .from("profiles")
      .select("home_location_name, home_lat, home_lon")
      .eq("id", user.id)
      .single(),
  ]);

  let content: React.ReactNode;

  if (activities.length === 0) {
    // Leerzustand (AC-10)
    content = (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed px-6 py-16 text-center">
        <CloudSun className="size-12 text-primary" aria-hidden />
        <div className="space-y-1">
          <p className="font-medium">Noch keine Aktivitäten</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Lege deine erste Aktivität mit Wetterbedingungen an — danach siehst
            du hier, wann sie in den nächsten 5 Tagen passt.
          </p>
        </div>
        <Button asChild>
          <Link href="/activities">Neue Aktivität</Link>
        </Button>
      </div>
    );
  } else {
    const resolved = activities.map((activity) => ({
      activity,
      location: resolveLocation(activity, profile),
    }));

    // Pro einzigartiger (gerundeter) Koordinate genau ein Forecast-Abruf.
    const uniqueLocations = new Map<string, { lat: number; lon: number }>();
    for (const { location } of resolved) {
      if (location) {
        uniqueLocations.set(coordinateKey(location.lat, location.lon), location);
      }
    }

    // Datenbeschaffung getrennt vom JSX: scheitert ein Abruf, zeigt die ganze
    // Seite den Fehlerzustand (AC-11 / EC-3) — keine veralteten Daten.
    let forecasts: Map<string, LocationForecast> | null = null;
    try {
      forecasts = new Map(
        await Promise.all(
          [...uniqueLocations.entries()].map(
            async ([key, { lat, lon }]) =>
              [key, await getForecast(lat, lon)] as const
          )
        )
      );
    } catch {
      forecasts = null;
    }

    if (forecasts === null) {
      content = <ForecastError />;
    } else {
      const loaded = forecasts;
      const now = nowUnixSeconds();
      content = (
        <div className="space-y-4">
          {resolved.map(({ activity, location }) => {
            const forecast = location
              ? loaded.get(coordinateKey(location.lat, location.lon))
              : undefined;
            return (
              <ActivitySuggestions
                key={activity.id}
                activity={activity}
                locationName={location?.name ?? null}
                slots={forecast ? computeSlots(activity, forecast, now) : []}
                timezoneOffsetSeconds={forecast?.timezoneOffsetSeconds ?? 0}
                now={now}
              />
            );
          })}
        </div>
      );
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Vorschläge</h1>
      </header>
      {content}
    </div>
  );
}
