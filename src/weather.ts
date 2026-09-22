import type { FetchLike } from "./types.ts";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export async function fetchForecast(
  latitude: number,
  longitude: number,
  fetchImpl: FetchLike = fetch,
): Promise<number> {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("current", "temperature_2m");

  const res = await fetchImpl(url);
  if (!res.ok) {
    throw new Error(`Pronóstico falló con estado ${res.status}`);
  }
  const data: unknown = await res.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Respuesta de pronóstico inválida");
  }
  const current = (data as { current?: unknown }).current;
  if (typeof current !== "object" || current === null) {
    throw new Error("Respuesta de pronóstico sin datos actuales");
  }
  const temp = (current as { temperature_2m?: unknown }).temperature_2m;
  if (typeof temp !== "number" || !Number.isFinite(temp)) {
    throw new Error("Respuesta de pronóstico sin temperatura válida");
  }
  return temp;
}
