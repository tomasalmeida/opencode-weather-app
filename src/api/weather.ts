import type { FetchLike } from "../types/FetchLike.ts";
import type { DailyForecast } from "../types/Weather.ts";

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
  if (!res.ok) throw new Error(`Pronóstico falló con estado ${res.status}`);
  const data: unknown = await res.json();
  if (typeof data !== "object" || data === null) throw new Error("Respuesta de pronóstico inválida");
  const current = (data as { current?: unknown }).current;
  if (typeof current !== "object" || current === null) throw new Error("Respuesta de pronóstico sin datos actuales");
  const temp = (current as { temperature_2m?: unknown }).temperature_2m;
  if (typeof temp !== "number" || !Number.isFinite(temp)) throw new Error("Respuesta de pronóstico sin temperatura válida");
  return temp;
}

export async function fetchDailyForecast(
  latitude: number,
  longitude: number,
  fetchImpl: FetchLike = fetch,
): Promise<DailyForecast[]> {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("daily", "temperature_2m_min,temperature_2m_max");
  url.searchParams.set("forecast_days", "7");
  url.searchParams.set("timezone", "auto");
  const res = await fetchImpl(url);
  if (!res.ok) throw new Error(`Pronóstico de 7 días falló con estado ${res.status}`);
  const data: unknown = await res.json();
  if (typeof data !== "object" || data === null) throw new Error("Respuesta de pronóstico diario inválida");
  const daily = (data as { daily?: unknown }).daily;
  if (typeof daily !== "object" || daily === null) throw new Error("Respuesta de pronóstico diario sin datos");
  const values = daily as { time?: unknown[]; temperature_2m_min?: unknown[]; temperature_2m_max?: unknown[] };
  if (!Array.isArray(values.time) || !Array.isArray(values.temperature_2m_min) || !Array.isArray(values.temperature_2m_max) || values.time.length === 0 || values.time.length !== values.temperature_2m_min.length || values.time.length !== values.temperature_2m_max.length) {
    throw new Error("Respuesta de pronóstico diario incompleta");
  }
  const dates = values.time;
  const minimums = values.temperature_2m_min;
  const maximums = values.temperature_2m_max;
  return dates.map((date, index) => {
    const minimum = minimums[index];
    const maximum = maximums[index];
    if (typeof date !== "string" || typeof minimum !== "number" || !Number.isFinite(minimum) || typeof maximum !== "number" || !Number.isFinite(maximum)) throw new Error("Respuesta de pronóstico diario con datos inválidos");
    return { date, minimum, maximum };
  });
}
