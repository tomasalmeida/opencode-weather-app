import type { City } from "./City.ts";
import type { TemperatureUnit } from "./Weather.ts";

export type AppState = {
  cities: City[];
  defaultCityId: string | null;
  unit: TemperatureUnit;
};
