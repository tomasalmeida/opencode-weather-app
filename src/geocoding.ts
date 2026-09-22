import type { FetchLike, GeocodeResult } from "./types.ts";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

export async function geocodeCity(
  name: string,
  fetchImpl: FetchLike = fetch,
): Promise<GeocodeResult | null> {
  const url = new URL(GEOCODING_URL);
  url.searchParams.set("name", name);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "es");
  url.searchParams.set("format", "json");

  const res = await fetchImpl(url);
  if (!res.ok) {
    throw new Error(`Geocoding falló con estado ${res.status}`);
  }
  const data: unknown = await res.json();
  if (typeof data !== "object" || data === null) return null;
  const results = (data as { results?: unknown }).results;
  if (!Array.isArray(results) || results.length === 0) return null;

  const first = results[0];
  if (typeof first !== "object" || first === null) return null;
  const r = first as Record<string, unknown>;
  const latitude = typeof r.latitude === "number" ? r.latitude : null;
  const longitude = typeof r.longitude === "number" ? r.longitude : null;
  const resultName = typeof r.name === "string" ? r.name : null;
  if (
    latitude === null ||
    longitude === null ||
    resultName === null ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }
  const country = typeof r.country === "string" ? r.country : undefined;
  return country === undefined
    ? { name: resultName, latitude, longitude }
    : { name: resultName, country, latitude, longitude };
}
