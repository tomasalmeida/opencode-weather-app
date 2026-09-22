import type { AppState } from "../types/AppState.ts";
import type { PrintFn } from "../presentation/output.ts";
import { printCities } from "../presentation/output.ts";

export function listCities(state: AppState, print: PrintFn): void {
  printCities(state.cities, print);
}
