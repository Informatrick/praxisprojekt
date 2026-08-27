import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type GeocodeResult = {
  name: string;
  lat: number;
  lon: number;
};

// Ortssuche für die Vorschlagsliste (AC-12). Serverseitiger Proxy zur
// OpenWeatherMap Geocoding API — der Key bleibt auf dem Server.
// Nur für eingeloggte Nutzer (der Proxy-Matcher nimmt /api aus, deshalb
// prüft die Route selbst).
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENWEATHER_API_KEY fehlt — bitte in .env.local eintragen" },
      { status: 500 }
    );
  }

  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${apiKey}`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    return NextResponse.json(
      { error: "Die Ortssuche ist gerade nicht erreichbar" },
      { status: 502 }
    );
  }
  if (!res.ok) {
    return NextResponse.json(
      { error: "Die Ortssuche ist gerade nicht erreichbar" },
      { status: 502 }
    );
  }

  const data: Array<{
    name: string;
    state?: string;
    country: string;
    lat: number;
    lon: number;
  }> = await res.json();

  const results: GeocodeResult[] = data.map((r) => ({
    name: r.state
      ? `${r.name}, ${r.state}, ${r.country}`
      : `${r.name}, ${r.country}`,
    lat: r.lat,
    lon: r.lon,
  }));

  return NextResponse.json({ results });
}
