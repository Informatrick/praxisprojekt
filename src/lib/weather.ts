import type { ForecastBlock, LocationForecast } from "@/lib/slots";

// Forecast-Abruf + Adapter (PROJ-3, design.md → Verhalten & Zugriff).
// Läuft nur auf dem Server: der Key bleibt hier, die Anfrage enthält
// ausschließlich gerundete Koordinaten und den Key (AC-14).

/** Koordinaten werden auf 2 Dezimalstellen (~1 km) gerundet — Datenminimierung
 *  gegenüber OpenWeather und bessere Cache-Treffer für nahe Orte. */
export function roundCoordinate(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Cache-Schlüssel eines Standorts — identisch gerundete Koordinaten teilen sich einen Abruf. */
export function coordinateKey(lat: number, lon: number): string {
  return `${roundCoordinate(lat).toFixed(2)},${roundCoordinate(lon).toFixed(2)}`;
}

/** Wetterdaten dürfen höchstens 30 Minuten alt sein (AC-12). */
const FORECAST_REVALIDATE_SECONDS = 1800;

const BLOCK_SECONDS = 3 * 3600;

/** „Jetzt" in Unix-Sekunden — hier statt in der Seite, damit die reine
 *  Slot-Logik und die Render-Funktion frei von impuren Aufrufen bleiben. */
export function nowUnixSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/** Generischer Fehler für die UI (AC-11, EC-3) — Details stehen nur im Server-Log. */
export class WeatherUnavailableError extends Error {
  constructor() {
    super("Wetterdaten gerade nicht verfügbar");
    this.name = "WeatherUnavailableError";
  }
}

type OwmForecastResponse = {
  list: Array<{
    dt: number;
    main: { temp: number };
    wind: { speed: number }; // m/s bei units=metric
    pop?: number; // 0–1
    rain?: { "3h"?: number };
    snow?: { "3h"?: number };
  }>;
  city: { timezone: number };
};

/**
 * 5-Tage/3-Stunden-Forecast für einen Standort. Antworten werden vom
 * Daten-Cache des Frameworks 30 Minuten pro URL (= pro gerundeter Koordinate)
 * wiederverwendet; Fehler werden nicht gecacht.
 */
export async function getForecast(
  lat: number,
  lon: number
): Promise<LocationForecast> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    console.error("OPENWEATHER_API_KEY fehlt — bitte in .env.local eintragen");
    throw new WeatherUnavailableError();
  }

  const rlat = roundCoordinate(lat).toFixed(2);
  const rlon = roundCoordinate(lon).toFixed(2);
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${rlat}&lon=${rlon}&units=metric&appid=${apiKey}`;

  let res: Response;
  try {
    res = await fetch(url, {
      next: { revalidate: FORECAST_REVALIDATE_SECONDS },
    });
  } catch (err) {
    console.error("OpenWeatherMap-Forecast nicht erreichbar:", err);
    throw new WeatherUnavailableError();
  }
  if (!res.ok) {
    // auch ungültiger Key (401) und Rate-Limit (429) landen hier (EC-3)
    console.error("OpenWeatherMap-Forecast fehlgeschlagen, Status", res.status);
    throw new WeatherUnavailableError();
  }

  const data = (await res.json()) as OwmForecastResponse;

  const blocks: ForecastBlock[] = data.list.map((item) => ({
    start: item.dt,
    end: item.dt + BLOCK_SECONDS,
    temp: item.main.temp,
    windKmh: item.wind.speed * 3.6,
    rainProbability: (item.pop ?? 0) * 100,
    precipitationMm: (item.rain?.["3h"] ?? 0) + (item.snow?.["3h"] ?? 0),
  }));

  return { timezoneOffsetSeconds: data.city.timezone, blocks };
}
