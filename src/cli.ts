import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import type { AppState, City, GeocodeFn, ForecastFn, GeocodeResult } from "./types.ts";
import { loadState, saveState } from "./storage.ts";
import { formatTemperature } from "./temperature.ts";

const LINE = "═".repeat(40);

type PrintFn = (line: string) => void;
type AskFn = (question: string) => Promise<string>;

export type CliServices = {
  geocode: GeocodeFn;
  forecast: ForecastFn;
  ask?: AskFn;
  print?: PrintFn;
};

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function cityId(latitude: number, longitude: number): string {
  return `${latitude},${longitude}`;
}

function printMenu(print: PrintFn, state: AppState): void {
  print(LINE);
  print("         WEATHER CLI");
  print(LINE);
  print("  1. Clima de ciudad default");
  print(`  2. Clima de todas las ciudades (${state.cities.length})`);
  print("  3. Buscar y agregar ciudad");
  print("  4. Eliminar ciudad");
  print("  5. Establecer ciudad default");
  print(`  8. Ajustes (${state.unit === "C" ? "°C" : "°F"})`);
  print("  9. Salir");
  print(LINE);
}

function label(city: City): string {
  return city.country ? `${city.name}, ${city.country}` : city.name;
}

function listCities(state: AppState, print: PrintFn): void {
  state.cities.forEach((city, index) => {
    print(`  ${index + 1}. ${label(city)}`);
  });
}

async function printWeather(
  state: AppState,
  city: City,
  services: CliServices,
  print: PrintFn,
): Promise<void> {
  const celsius = await services.forecast(city.latitude, city.longitude);
  print(`  ${label(city)}: ${formatTemperature(celsius, state.unit)}`);
}

async function actionDefaultWeather(
  state: AppState,
  services: CliServices,
  print: PrintFn,
): Promise<void> {
  const city = state.cities.find((c) => c.id === state.defaultCityId);
  if (city === undefined) {
    print("  No hay ciudad default. Usa la opción 5 para establecer una.");
    return;
  }
  await printWeather(state, city, services, print);
}

async function actionAllWeather(
  state: AppState,
  services: CliServices,
  print: PrintFn,
): Promise<void> {
  if (state.cities.length === 0) {
    print("  No hay ciudades guardadas. Usa la opción 3 para agregar una.");
    return;
  }
  for (const city of state.cities) {
    await printWeather(state, city, services, print);
  }
}

async function actionAddCity(
  state: AppState,
  services: CliServices,
  ask: AskFn,
  print: PrintFn,
  configPath: string,
): Promise<void> {
  const name = (await ask("  Nombre de la ciudad: ")).trim();
  if (name === "") {
    print("  Debes ingresar un nombre.");
    return;
  }
  const place: GeocodeResult | null = await services.geocode(name);
  if (place === null) {
    print(`  No se encontró la ciudad "${name}".`);
    return;
  }
  const id = cityId(place.latitude, place.longitude);
  if (state.cities.some((c) => c.id === id)) {
    print(`  "${place.name}" ya está guardada.`);
    return;
  }
  const city: City =
    place.country === undefined
      ? { id, name: place.name, latitude: place.latitude, longitude: place.longitude }
      : {
          id,
          name: place.name,
          country: place.country,
          latitude: place.latitude,
          longitude: place.longitude,
        };
  state.cities.push(city);
  const becameDefault = state.defaultCityId === null;
  if (becameDefault) state.defaultCityId = id;
  saveState(configPath, state);
  print(`  Ciudad agregada: ${label(city)}`);
  if (becameDefault) print("  Ahora es la ciudad default.");
}

async function actionDeleteCity(
  state: AppState,
  ask: AskFn,
  print: PrintFn,
): Promise<void> {
  if (state.cities.length === 0) {
    print("  No hay ciudades guardadas.");
    return;
  }
  listCities(state, print);
  const input = (await ask("  Número de la ciudad a eliminar: ")).trim();
  const index = Number(input) - 1;
  if (!Number.isInteger(index) || index < 0 || index >= state.cities.length) {
    print("  Opción inválida.");
    return;
  }
  const removed = state.cities[index];
  if (removed === undefined) return;
  state.cities.splice(index, 1);
  if (state.defaultCityId === removed.id) state.defaultCityId = null;
  print(`  Ciudad eliminada: ${label(removed)}`);
}

async function actionSetDefault(
  state: AppState,
  ask: AskFn,
  print: PrintFn,
): Promise<void> {
  if (state.cities.length === 0) {
    print("  No hay ciudades guardadas. Usa la opción 3 para agregar una.");
    return;
  }
  listCities(state, print);
  const input = (await ask("  Número de la ciudad default: ")).trim();
  const index = Number(input) - 1;
  if (!Number.isInteger(index) || index < 0 || index >= state.cities.length) {
    print("  Opción inválida.");
    return;
  }
  const city = state.cities[index];
  if (city === undefined) return;
  state.defaultCityId = city.id;
  print(`  Ciudad default: ${label(city)}`);
}

async function actionSettings(
  state: AppState,
  ask: AskFn,
  print: PrintFn,
): Promise<void> {
  print(`  Unidad actual: °${state.unit}`);
  const input = (await ask("  Nueva unidad (C/F): ")).trim().toUpperCase();
  if (input !== "C" && input !== "F") {
    print("  Opción inválida; se mantiene la unidad actual.");
    return;
  }
  state.unit = input;
  print(`  Unidad guardada: °${state.unit}`);
}

// Lines are queued so piped/scripted input is not dropped between questions.
function createStdinAsk(): { ask: AskFn; close: () => void } {
  const rl = createInterface({ input: stdin, output: stdout });
  const queue: string[] = [];
  const waiters: Array<{
    resolve: (line: string) => void;
    reject: (err: Error) => void;
  }> = [];
  let ended = false;

  rl.on("line", (line) => {
    const waiter = waiters.shift();
    if (waiter !== undefined) waiter.resolve(line);
    else queue.push(line);
  });
  rl.on("close", () => {
    ended = true;
    for (const waiter of waiters.splice(0)) {
      waiter.reject(new Error("stdin closed"));
    }
  });

  const ask: AskFn = (question) => {
    stdout.write(question);
    const queued = queue.shift();
    if (queued !== undefined) return Promise.resolve(queued);
    if (ended) return Promise.reject(new Error("stdin closed"));
    return new Promise((resolve, reject) => waiters.push({ resolve, reject }));
  };
  return { ask, close: () => rl.close() };
}

export async function runCli(
  configPath: string,
  services: CliServices,
): Promise<void> {
  const print: PrintFn = services.print ?? ((line) => console.log(line));
  const stdinAsk = services.ask === undefined ? createStdinAsk() : null;
  const ask: AskFn = services.ask ?? stdinAsk!.ask;

  let state: AppState;
  try {
    state = loadState(configPath);
  } catch (err) {
    print(`  Error: ${errorMessage(err)}`);
    stdinAsk?.close();
    return;
  }

  try {
    for (;;) {
      print("");
      printMenu(print, state);
      let choice: string;
      try {
        choice = (await ask("  Selecciona una opción: ")).trim();
      } catch {
        break; // stdin closed (piped input exhausted)
      }

      try {
        if (choice === "1") {
          await actionDefaultWeather(state, services, print);
        } else if (choice === "2") {
          await actionAllWeather(state, services, print);
        } else if (choice === "3") {
          await actionAddCity(state, services, ask, print, configPath);
        } else if (choice === "4") {
          await actionDeleteCity(state, ask, print);
          saveState(configPath, state);
        } else if (choice === "5") {
          await actionSetDefault(state, ask, print);
          saveState(configPath, state);
        } else if (choice === "8") {
          await actionSettings(state, ask, print);
          saveState(configPath, state);
        } else if (choice === "9") {
          break;
        } else {
          print("  Opción inválida.");
        }
      } catch (err) {
        print(`  Error: ${errorMessage(err)}`);
      }
    }
  } finally {
    stdinAsk?.close();
  }
}
