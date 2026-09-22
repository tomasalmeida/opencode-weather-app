import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DEFAULT_STATE, loadState, parseState, saveState } from "./storage.ts";

function tempConfigPath(): { dir: string; path: string } {
  const dir = mkdtempSync(join(tmpdir(), "weather-cli-"));
  return { dir, path: join(dir, "config.json") };
}

describe("loadState", () => {
  test("returns defaults when file does not exist", () => {
    const { dir, path } = tempConfigPath();
    try {
      const state = loadState(path);
      expect(state).toEqual(DEFAULT_STATE);
      expect(state.unit).toBe("C");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("round-trips saved state", () => {
    const { dir, path } = tempConfigPath();
    try {
      const state = {
        cities: [
          {
            id: "45.41117,-75.69812",
            name: "Ottawa",
            country: "Canadá",
            latitude: 45.41117,
            longitude: -75.69812,
          },
        ],
        defaultCityId: "45.41117,-75.69812",
        unit: "F" as const,
      };
      saveState(path, state);
      expect(loadState(path)).toEqual(state);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("throws on invalid JSON", () => {
    const { dir, path } = tempConfigPath();
    try {
      writeFileSync(path, "not json", "utf8");
      expect(() => loadState(path)).toThrow(/JSON válido/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("parseState", () => {
  test("rejects unknown unit", () => {
    expect(parseState({ cities: [], defaultCityId: null, unit: "K" })).toBeNull();
  });

  test("rejects malformed city entries", () => {
    expect(
      parseState({ cities: [{ name: "x" }], defaultCityId: null, unit: "C" }),
    ).toBeNull();
  });

  test("clears defaultCityId when it points to a missing city", () => {
    const state = parseState({
      cities: [],
      defaultCityId: "ghost",
      unit: "C",
    });
    expect(state).not.toBeNull();
    expect(state?.defaultCityId).toBeNull();
  });

  test("keeps valid defaultCityId", () => {
    const state = parseState({
      cities: [
        { id: "1,2", name: "X", latitude: 1, longitude: 2 },
      ],
      defaultCityId: "1,2",
      unit: "C",
    });
    expect(state?.defaultCityId).toBe("1,2");
  });
});
