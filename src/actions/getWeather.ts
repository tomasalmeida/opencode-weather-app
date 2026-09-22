import type { AppState } from "../types/AppState.ts";
import type { City } from "../types/City.ts";
import type { ForecastFn } from "../types/Weather.ts";
import type { ColorizeFn } from "../utils/colors.ts";
import type { PrintFn } from "../presentation/output.ts";
import { cityLabel, weatherLine } from "../presentation/output.ts";
import { formatTemperature } from "../utils/format.ts";

export async function printWeather(state: AppState, city: City, forecast: ForecastFn, print: PrintFn, colorize: ColorizeFn): Promise<void> {
  print(colorize(weatherLine(city, await forecast(city.latitude, city.longitude), state.unit), "yellow"));
}

export async function getDefaultWeather(state: AppState, forecast: ForecastFn, print: PrintFn, colorize: ColorizeFn): Promise<void> {
  const city = state.cities.find((item) => item.id === state.defaultCityId);
  if (city === undefined) {
    print(colorize("  No hay ciudad default. Usa la opción 5 para establecer una.", "red"));
    return;
  }
  await printWeather(state, city, forecast, print, colorize);
}

export async function getAllWeather(state: AppState, forecast: ForecastFn, print: PrintFn, colorize: ColorizeFn): Promise<void> {
  if (state.cities.length === 0) {
    print(colorize("  No hay ciudades guardadas. Usa la opción 3 para agregar una.", "red"));
    return;
  }
  for (const city of state.cities) await printWeather(state, city, forecast, print, colorize);
}

export async function getSevenDayForecast(state: AppState, dailyForecast: (latitude: number, longitude: number) => Promise<Array<{ date: string; minimum: number; maximum: number }>>, print: PrintFn, colorize: ColorizeFn): Promise<void> {
  const city = state.cities.find((item) => item.id === state.defaultCityId);
  if (city === undefined) {
    print(colorize("  No hay ciudad default. Usa la opción 5 para establecer una.", "red"));
    return;
  }
  print(colorize(`  Pronóstico de 7 días para ${cityLabel(city)}:`, "yellow"));
  for (const day of await dailyForecast(city.latitude, city.longitude)) {
    print(colorize(`  ${day.date}: mínima ${formatTemperature(day.minimum, state.unit)}, máxima ${formatTemperature(day.maximum, state.unit)}`, "yellow"));
  }
}
