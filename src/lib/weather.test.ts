import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  coordinateKey,
  getForecast,
  roundCoordinate,
  WeatherUnavailableError,
} from "./weather";

const owmResponse = {
  list: [
    {
      dt: 1_000_000,
      main: { temp: 18.3 },
      wind: { speed: 5 }, // m/s
      pop: 0.4,
      rain: { "3h": 1.2 },
      snow: { "3h": 0.3 },
    },
  ],
  city: { timezone: 7200 },
};

function okFetch() {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify(owmResponse), { status: 200 })
  );
}

describe("roundCoordinate / coordinateKey", () => {
  it("rundet auf 2 Dezimalstellen (~1 km, AC-14)", () => {
    expect(roundCoordinate(48.2082)).toBe(48.21);
    expect(roundCoordinate(16.3738)).toBe(16.37);
  });

  it("nahe Orte teilen sich denselben Cache-Schlüssel (AC-12)", () => {
    expect(coordinateKey(48.2082, 16.3738)).toBe(coordinateKey(48.208, 16.374));
  });
});

describe("getForecast", () => {
  beforeEach(() => {
    vi.stubEnv("OPENWEATHER_API_KEY", "test-key");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sendet nur gerundete Koordinaten und den Key — keine Nutzerdaten (AC-14)", async () => {
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);

    await getForecast(48.2082, 16.3738);

    const url = new URL(fetchMock.mock.calls[0][0] as string);
    expect(url.searchParams.get("lat")).toBe("48.21");
    expect(url.searchParams.get("lon")).toBe("16.37");
    expect(url.searchParams.get("appid")).toBe("test-key");
    expect(url.searchParams.get("units")).toBe("metric");
    expect([...url.searchParams.keys()].sort()).toEqual([
      "appid",
      "lat",
      "lon",
      "units",
    ]);
  });

  it("cached 30 Minuten über den Daten-Cache des Frameworks (AC-12)", async () => {
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);

    await getForecast(48.21, 16.37);

    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      next: { revalidate: 1800 },
    });
  });

  it("normalisiert Blöcke: Wind m/s → km/h, pop → %, Regen + Schnee (AC-6)", async () => {
    vi.stubGlobal("fetch", okFetch());

    const result = await getForecast(48.21, 16.37);

    expect(result.timezoneOffsetSeconds).toBe(7200);
    expect(result.blocks).toHaveLength(1);
    const b = result.blocks[0];
    expect(b.start).toBe(1_000_000);
    expect(b.end).toBe(1_000_000 + 3 * 3600);
    expect(b.temp).toBe(18.3);
    expect(b.windKmh).toBeCloseTo(18);
    expect(b.rainProbability).toBeCloseTo(40);
    expect(b.precipitationMm).toBeCloseTo(1.5);
  });

  it("wirft bei Nicht-200 einen generischen Fehler ohne Details (AC-11, EC-3)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Invalid API key", { status: 401 }))
    );

    await expect(getForecast(48.21, 16.37)).rejects.toBeInstanceOf(
      WeatherUnavailableError
    );
  });

  it("wirft bei Netzwerkfehler einen generischen Fehler (AC-11)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNRESET")));

    await expect(getForecast(48.21, 16.37)).rejects.toBeInstanceOf(
      WeatherUnavailableError
    );
  });

  it("wirft ohne konfigurierten API-Key, statt eine kaputte Anfrage zu senden", async () => {
    vi.stubEnv("OPENWEATHER_API_KEY", "");
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);

    await expect(getForecast(48.21, 16.37)).rejects.toBeInstanceOf(
      WeatherUnavailableError
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
