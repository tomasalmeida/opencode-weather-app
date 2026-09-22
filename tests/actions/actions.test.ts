import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { addCity } from "../../src/actions/addCity.ts";
import { removeCity } from "../../src/actions/removeCity.ts";
import { setDefaultCity } from "../../src/actions/setDefaultCity.ts";
import type { AppState } from "../../src/types/AppState.ts";
import type { AskFn } from "../../src/presentation/input.ts";
import type { PrintFn } from "../../src/presentation/output.ts";
import type { ColorizeFn } from "../../src/utils/colors.ts";

const colorize: ColorizeFn = (text) => text;
const print = (lines: string[]): PrintFn => (line) => lines.push(line);
const askWith = (...answers: string[]): AskFn => async () => answers.shift() ?? "";

function state(): AppState {
  return { cities: [], defaultCityId: null, unit: "C" };
}

describe("addCity", () => {
  test("adds a city and makes the first city default", async () => {
    const dir = mkdtempSync(join(tmpdir(), "weather-actions-"));
    const path = join(dir, "config.json");
    const current = state();
    const lines: string[] = [];
    try {
      await addCity(
        current,
        async () => ({ name: "Ottawa", country: "Canadá", latitude: 45.4, longitude: -75.7 }),
        askWith("Ottawa"),
        print(lines),
        colorize,
        path,
      );
      expect(current.defaultCityId).toBe("45.4,-75.7");
      expect(current.cities).toHaveLength(1);
      expect(JSON.parse(readFileSync(path, "utf8"))).toEqual(current);
      expect(lines).toContain("  Ahora es la ciudad default.");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("does not add an unknown city", async () => {
    const current = state();
    const lines: string[] = [];
    await addCity(current, async () => null, askWith("Nowhere"), print(lines), colorize, "/tmp/unused-config.json");
    expect(current.cities).toEqual([]);
    expect(lines).toEqual(['  No se encontró la ciudad "Nowhere".']);
  });
});

describe("removeCity", () => {
  test("removes the selected city and clears its default", async () => {
    const current: AppState = {
      cities: [{ id: "1,2", name: "X", latitude: 1, longitude: 2 }],
      defaultCityId: "1,2",
      unit: "C",
    };
    await removeCity(current, askWith("1"), () => undefined, colorize);
    expect(current).toEqual({ cities: [], defaultCityId: null, unit: "C" });
  });
});

describe("setDefaultCity", () => {
  test("sets the selected city as default", async () => {
    const current: AppState = {
      cities: [
        { id: "1,2", name: "X", latitude: 1, longitude: 2 },
        { id: "3,4", name: "Y", latitude: 3, longitude: 4 },
      ],
      defaultCityId: null,
      unit: "C",
    };
    await setDefaultCity(current, askWith("2"), () => undefined, colorize);
    expect(current.defaultCityId).toBe("3,4");
  });
});
