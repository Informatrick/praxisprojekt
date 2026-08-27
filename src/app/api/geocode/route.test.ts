import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getUserMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: getUserMock } }),
}));

import { GET } from "./route";

function makeRequest(q?: string) {
  const url =
    q === undefined
      ? "http://localhost:3000/api/geocode"
      : `http://localhost:3000/api/geocode?q=${encodeURIComponent(q)}`;
  return new NextRequest(url);
}

describe("GET /api/geocode (AC-12, EC-3)", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.stubEnv("OPENWEATHER_API_KEY", "test-key");
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } } });
  });

  it("lehnt nicht angemeldete Anfragen ab (401)", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await GET(makeRequest("Linz"));
    expect(res.status).toBe(401);
  });

  it("liefert eine leere Liste bei weniger als 2 Zeichen", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res = await GET(makeRequest("L"));
    const body = await res.json();
    expect(body.results).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("mappt OWM-Treffer auf 'Name, Land' bzw. 'Name, Region, Land'", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { name: "Linz", country: "AT", lat: 48.3, lon: 14.29 },
          {
            name: "Neustadt",
            state: "Rheinland-Pfalz",
            country: "DE",
            lat: 49.35,
            lon: 8.14,
          },
        ],
      })
    );
    const res = await GET(makeRequest("Linz"));
    const body = await res.json();
    expect(body.results).toEqual([
      { name: "Linz, AT", lat: 48.3, lon: 14.29 },
      { name: "Neustadt, Rheinland-Pfalz, DE", lat: 49.35, lon: 8.14 },
    ]);
  });

  it("gibt 502 zurück, wenn OWM nicht erreichbar ist", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const res = await GET(makeRequest("Linz"));
    expect(res.status).toBe(502);
  });

  it("gibt 500 zurück, wenn der API-Key fehlt", async () => {
    vi.stubEnv("OPENWEATHER_API_KEY", "");
    const res = await GET(makeRequest("Linz"));
    expect(res.status).toBe(500);
  });
});
