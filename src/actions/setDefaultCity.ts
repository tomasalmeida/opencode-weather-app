import type { AppState } from "../types/AppState.ts";
import type { AskFn } from "../presentation/input.ts";
import type { PrintFn } from "../presentation/output.ts";
import { cityLabel, printCities } from "../presentation/output.ts";
import type { ColorizeFn } from "../utils/colors.ts";

export async function setDefaultCity(state: AppState, ask: AskFn, print: PrintFn, colorize: ColorizeFn): Promise<void> {
  if (state.cities.length === 0) {
    print(colorize("  No hay ciudades guardadas. Usa la opción 3 para agregar una.", "red"));
    return;
  }
  printCities(state.cities, print);
  const index = Number((await ask("  Número de la ciudad default: ")).trim()) - 1;
  if (!Number.isInteger(index) || index < 0 || index >= state.cities.length) {
    print(colorize("  Opción inválida.", "red"));
    return;
  }
  const city = state.cities[index];
  if (city === undefined) return;
  state.defaultCityId = city.id;
  print(colorize(`  Ciudad default: ${cityLabel(city)}`, "green"));
}
