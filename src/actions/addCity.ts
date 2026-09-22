import type { AppState } from "../types/AppState.ts";
import type { GeocodeFn } from "../types/Weather.ts";
import type { AskFn } from "../presentation/input.ts";
import type { PrintFn } from "../presentation/output.ts";
import { cityLabel } from "../presentation/output.ts";
import type { ColorizeFn } from "../utils/colors.ts";
import { saveState } from "../storage/settingsStorage.ts";

export async function addCity(state: AppState, geocode: GeocodeFn, ask: AskFn, print: PrintFn, colorize: ColorizeFn, path: string): Promise<void> {
  const name = (await ask("  Nombre de la ciudad: ")).trim();
  if (name === "") {
    print(colorize("  Debes ingresar un nombre.", "red"));
    return;
  }
  const place = await geocode(name);
  if (place === null) {
    print(colorize(`  No se encontró la ciudad "${name}".`, "red"));
    return;
  }
  const id = `${place.latitude},${place.longitude}`;
  if (state.cities.some((city) => city.id === id)) {
    print(colorize(`  "${place.name}" ya está guardada.`, "red"));
    return;
  }
  const city = place.country === undefined ? { id, name: place.name, latitude: place.latitude, longitude: place.longitude } : { id, name: place.name, country: place.country, latitude: place.latitude, longitude: place.longitude };
  state.cities.push(city);
  const becameDefault = state.defaultCityId === null;
  if (becameDefault) state.defaultCityId = id;
  saveState(path, state);
  print(colorize(`  Ciudad agregada: ${cityLabel(city)}`, "green"));
  if (becameDefault) print(colorize("  Ahora es la ciudad default.", "green"));
}
