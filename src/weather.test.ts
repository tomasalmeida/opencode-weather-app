import { describe, expect, test } from "bun:test";
import { fetchDailyForecast, fetchForecast } from "./weather.ts";
import type { FetchLike } from "./types.ts";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

describe("fetchForecast", () => {
  test("returns current temperature in Celsius", async () => {
    const fetchImpl: FetchLike = async () =>
      jsonResponse({ current: { temperature_2m: 15.3 } });
    expect(await fetchForecast(45.41117, -75.69812, fetchImpl)).toBe(15.3);
  });

  test("passes coordinates and current param", async () => {
    let seen: URL | undefined;
    const fetchImpl: FetchLike = async (input) => {
      seen = new URL(typeof input === "string" ? input : input.toString());
      return jsonResponse({ current: { temperature_2m: 1 } });
    };
    await fetchForecast(45.41117, -75.69812, fetchImpl);
    expect(seen).toBeDefined();
    if (seen === undefined) return;
    expect(seen.origin + seen.pathname).toBe(
      "https://api.open-meteo.com/v1/forecast",
    );
    expect(seen.searchParams.get("latitude")).toBe("45.41117");
    expect(seen.searchParams.get("longitude")).toBe("-75.69812");
    expect(seen.searchParams.get("current")).toBe("temperature_2m");
  });

  test("throws when temperature missing", async () => {
    const fetchImpl: FetchLike = async () => jsonResponse({ current: {} });
    await expect(fetchForecast(1, 2, fetchImpl)).rejects.toThrow(/temperatura/);
  });

  test("throws on HTTP error", async () => {
    const fetchImpl: FetchLike = async () => jsonResponse({}, 503);
    await expect(fetchForecast(1, 2, fetchImpl)).rejects.toThrow(/503/);
  });
});

describe("fetchDailyForecast", () => {
  test("returns daily minimum and maximum temperatures", async () => {
    const fetchImpl: FetchLike = async () =>
      jsonResponse({
        daily: {
          time: ["2026-09-23", "2026-09-24"],
          temperature_2m_min: [8.1, 9.2],
          temperature_2m_max: [17.4, 19.5],
        },
      });
    expect(await fetchDailyForecast(45.41117, -75.69812, fetchImpl)).toEqual([
      { date: "2026-09-23", minimum: 8.1, maximum: 17.4 },
      { date: "2026-09-24", minimum: 9.2, maximum: 19.5 },
    ]);
  });

  test("passes coordinates and daily forecast parameters", async () => {
    let seen: URL | undefined;
    const fetchImpl: FetchLike = async (input) => {
      seen = new URL(typeof input === "string" ? input : input.toString());
      return jsonResponse({
        daily: {
          time: ["2026-09-23"],
          temperature_2m_min: [1],
          temperature_2m_max: [2],
        },
      });
    };
    await fetchDailyForecast(45.41117, -75.69812, fetchImpl);
    expect(seen).toBeDefined();
    if (seen === undefined) return;
    expect(seen.origin + seen.pathname).toBe(
      "https://api.open-meteo.com/v1/forecast",
    );
    expect(seen.searchParams.get("latitude")).toBe("45.41117");
    expect(seen.searchParams.get("longitude")).toBe("-75.69812");
    expect(seen.searchParams.get("daily")).toBe(
      "temperature_2m_min,temperature_2m_max",
    );
    expect(seen.searchParams.get("forecast_days")).toBe("7");
    expect(seen.searchParams.get("timezone")).toBe("auto");
  });

  test("throws when daily arrays are incomplete", async () => {
    const fetchImpl: FetchLike = async () =>
      jsonResponse({
        daily: {
          time: ["2026-09-23"],
          temperature_2m_min: [1],
          temperature_2m_max: [],
        },
      });
    await expect(fetchDailyForecast(1, 2, fetchImpl)).rejects.toThrow(/incompleta/);
  });

  test("throws on HTTP error", async () => {
    const fetchImpl: FetchLike = async () => jsonResponse({}, 503);
    await expect(fetchDailyForecast(1, 2, fetchImpl)).rejects.toThrow(/503/);
  });
});
