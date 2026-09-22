import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { AppState, City, TemperatureUnit } from "./types.ts";

export const DEFAULT_STATE: AppState = {
  cities: [],
  defaultCityId: null,
  unit: "C",
};

function isUnit(value: unknown): value is TemperatureUnit {
  return value === "C" || value === "F";
}

function parseCity(value: unknown): City | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  const id = typeof v.id === "string" ? v.id : null;
  const name = typeof v.name === "string" ? v.name : null;
  const latitude = typeof v.latitude === "number" ? v.latitude : null;
  const longitude = typeof v.longitude === "number" ? v.longitude : null;
  if (id === null || name === null) return null;
  if (latitude === null || longitude === null) return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const country = typeof v.country === "string" ? v.country : undefined;
  return country === undefined
    ? { id, name, latitude, longitude }
    : { id, name, country, latitude, longitude };
}

export function parseState(raw: unknown): AppState | null {
  if (typeof raw !== "object" || raw === null) return null;
  const v = raw as Record<string, unknown>;
  if (!Array.isArray(v.cities)) return null;
  if (!isUnit(v.unit)) return null;
  const defaultId = v.defaultCityId;
  if (defaultId !== null && typeof defaultId !== "string") return null;

  const cities: City[] = [];
  for (const entry of v.cities) {
    const city = parseCity(entry);
    if (city === null) return null;
    cities.push(city);
  }

  const defaultCityId =
    defaultId !== null && cities.some((c) => c.id === defaultId)
      ? defaultId
      : null;

  return { cities, defaultCityId, unit: v.unit };
}

export function loadState(path: string): AppState {
  if (!existsSync(path)) return { ...DEFAULT_STATE, cities: [] };
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch (err) {
    throw new Error(
      `No se pudo leer la configuración en ${path}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(
      `La configuración en ${path} no es JSON válido; bórrala o corrígela.`,
    );
  }
  const state = parseState(parsed);
  if (state === null) {
    throw new Error(
      `La configuración en ${path} tiene un formato inválido; bórrala o corrígela.`,
    );
  }
  return state;
}

export function saveState(path: string, state: AppState): void {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  renameSync(tmp, path);
}
