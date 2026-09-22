import { stdout } from "node:process";
import type { AppState } from "../types/AppState.ts";
import type { DailyForecastFn, ForecastFn, GeocodeFn } from "../types/Weather.ts";
import { loadState } from "../storage/citiesStorage.ts";
import { saveState } from "../storage/settingsStorage.ts";
import { MENU_LINE } from "../utils/constants.ts";
import { ansiColorize, noColor, type ColorizeFn } from "../utils/colors.ts";
import { createStdinAsk, type AskFn } from "./input.ts";
import type { PrintFn } from "./output.ts";
import { addCity } from "../actions/addCity.ts";
import { getAllWeather, getDefaultWeather, getSevenDayForecast } from "../actions/getWeather.ts";
import { removeCity } from "../actions/removeCity.ts";
import { setDefaultCity } from "../actions/setDefaultCity.ts";

export type CliServices = {
  geocode: GeocodeFn;
  forecast: ForecastFn;
  dailyForecast: DailyForecastFn;
  ask?: AskFn;
  print?: PrintFn;
  colorize?: ColorizeFn;
};

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function printMenu(print: PrintFn, state: AppState, colorize: ColorizeFn): void {
  print(colorize(MENU_LINE, "cyan"));
  print(colorize("         WEATHER CLI", "cyan"));
  print(colorize(MENU_LINE, "cyan"));
  print(colorize("  1. Clima de ciudad default", "cyan"));
  print(colorize(`  2. Clima de todas las ciudades (${state.cities.length})`, "cyan"));
  print(colorize("  3. Buscar y agregar ciudad", "cyan"));
  print(colorize("  4. Eliminar ciudad", "cyan"));
  print(colorize("  5. Establecer ciudad default", "cyan"));
  print(colorize("  6. Pronóstico de 7 días", "cyan"));
  print(colorize(`  8. Ajustes (${state.unit === "C" ? "°C" : "°F"})`, "cyan"));
  print(colorize("  9. Salir", "cyan"));
  print(colorize(MENU_LINE, "cyan"));
}

export async function runCli(configPath: string, services: CliServices): Promise<void> {
  const print: PrintFn = services.print ?? ((line) => console.log(line));
  const colorize = services.colorize ?? (services.print === undefined && stdout.isTTY ? ansiColorize : noColor);
  const stdinAsk = services.ask === undefined ? createStdinAsk() : null;
  const ask = services.ask ?? stdinAsk!.ask;
  let state: AppState;
  try {
    state = loadState(configPath);
  } catch (err) {
    print(colorize(`  Error: ${errorMessage(err)}`, "red"));
    stdinAsk?.close();
    return;
  }
  try {
    for (;;) {
      print("");
      printMenu(print, state, colorize);
      let choice: string;
      try {
        choice = (await ask("  Selecciona una opción: ")).trim();
      } catch {
        break;
      }
      try {
        if (choice === "1") await getDefaultWeather(state, services.forecast, print, colorize);
        else if (choice === "2") await getAllWeather(state, services.forecast, print, colorize);
        else if (choice === "3") await addCity(state, services.geocode, ask, print, colorize, configPath);
        else if (choice === "4") { await removeCity(state, ask, print, colorize); saveState(configPath, state); }
        else if (choice === "5") { await setDefaultCity(state, ask, print, colorize); saveState(configPath, state); }
        else if (choice === "6") await getSevenDayForecast(state, services.dailyForecast, print, colorize);
        else if (choice === "8") await updateSettings(state, ask, print, colorize, configPath);
        else if (choice === "9") break;
        else print(colorize("  Opción inválida.", "red"));
      } catch (err) {
        print(colorize(`  Error: ${errorMessage(err)}`, "red"));
      }
    }
  } finally {
    stdinAsk?.close();
  }
}

async function updateSettings(state: AppState, ask: AskFn, print: PrintFn, colorize: ColorizeFn, path: string): Promise<void> {
  print(`  Unidad actual: °${state.unit}`);
  const input = (await ask("  Nueva unidad (C/F): ")).trim().toUpperCase();
  if (input !== "C" && input !== "F") {
    print(colorize("  Opción inválida; se mantiene la unidad actual.", "red"));
    return;
  }
  state.unit = input;
  saveState(path, state);
  print(colorize(`  Unidad guardada: °${state.unit}`, "green"));
}
