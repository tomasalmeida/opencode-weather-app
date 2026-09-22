import type { TemperatureUnit } from "./types.ts";

export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

export function formatTemperature(
  celsius: number,
  unit: TemperatureUnit,
): string {
  const value = unit === "C" ? celsius : celsiusToFahrenheit(celsius);
  const rounded = Math.round(value * 10) / 10;
  return `${rounded.toFixed(1)} °${unit}`;
}
