import type { City } from "../types/City.ts";
import { formatTemperature } from "../utils/format.ts";
import type { TemperatureUnit } from "../types/Weather.ts";

export type PrintFn = (line: string) => void;

export function cityLabel(city: City): string {
  return city.country ? `${city.name}, ${city.country}` : city.name;
}

export function printCities(cities: City[], print: PrintFn): void {
  cities.forEach((city, index) => print(`  ${index + 1}. ${cityLabel(city)}`));
}

export function weatherLine(city: City, celsius: number, unit: TemperatureUnit): string {
  return `  ${cityLabel(city)}: ${formatTemperature(celsius, unit)}`;
}
