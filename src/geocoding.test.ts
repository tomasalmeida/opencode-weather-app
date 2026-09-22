import { describe, expect, test } from "bun:test";
import { geocodeCity } from "./geocoding.ts";
import type { FetchLike } from "./types.ts";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("geocodeCity", () => {
  test("parses first result", async () => {
    const fetchImpl: FetchLike = async () =>
      jsonResponse({
        results: [
          {
            name: "Ottawa",
            country: "Canadá",
            latitude: 45.41117,
            longitude: -75.69812,
          },
        ],
      });
    const result = await geocodeCity("Ottawa", fetchImpl);
    expect(result).toEqual({
      name: "Ottawa",
      country: "Canadá",
      latitude: 45.41117,
      longitude: -75.69812,
    });
  });

  test("returns null when no results", async () => {
    const fetchImpl: FetchLike = async () => jsonResponse({ results: [] });
    expect(await geocodeCity("Nowhere", fetchImpl)).toBeNull();
  });

  test("throws on HTTP error", async () => {
    const fetchImpl: FetchLike = async () => jsonResponse({}, 500);
    await expect(geocodeCity("Ottawa", fetchImpl)).rejects.toThrow(/500/);
  });

  test("builds URL with required params", async () => {
    let seen: URL | undefined;
    const fetchImpl: FetchLike = async (input) => {
      seen = new URL(typeof input === "string" ? input : input.toString());
      return jsonResponse({ results: [] });
    };
    await geocodeCity("Ottawa", fetchImpl);
    expect(seen).toBeDefined();
    if (seen === undefined) return;
    expect(seen.origin + seen.pathname).toBe(
      "https://geocoding-api.open-meteo.com/v1/search",
    );
    expect(seen.searchParams.get("name")).toBe("Ottawa");
    expect(seen.searchParams.get("count")).toBe("1");
    expect(seen.searchParams.get("language")).toBe("es");
    expect(seen.searchParams.get("format")).toBe("json");
  });
});
