import type { AppState } from "../types/AppState.ts";
import type { AskFn } from "../presentation/input.ts";
import type { PrintFn } from "../presentation/output.ts";
import { cityLabel, printCities } from "../presentation/output.ts";
import type { ColorizeFn } from "../utils/colors.ts";

export async function removeCity(state: AppState, ask: AskFn, print: PrintFn, colorize: ColorizeFn): Promise<void> {
  if (state.cities.length === 0) {
    print(colorize("  No hay ciudades guardadas.", "red"));
    return;
  }
  printCities(state.cities, print);
  const index = Number((await ask("  Número de la ciudad a eliminar: ")).trim()) - 1;
  if (!Number.isInteger(index) || index < 0 || index >= state.cities.length) {
    print(colorize("  Opción inválida.", "red"));
    return;
  }
  const removed = state.cities[index];
  if (removed === undefined) return;
  state.cities.splice(index, 1);
  if (state.defaultCityId === removed.id) state.defaultCityId = null;
  print(colorize(`  Ciudad eliminada: ${cityLabel(removed)}`, "green"));
}
