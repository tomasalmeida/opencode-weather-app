import { describe, expect, test } from "bun:test";
import { cityLabel, printCities, weatherLine } from "../../src/presentation/output.ts";

const city = { id: "1,2", name: "Ottawa", country: "Canadá", latitude: 1, longitude: 2 };

describe("presentation output", () => {
  test("formats a city label", () => {
    expect(cityLabel(city)).toBe("Ottawa, Canadá");
  });

  test("prints numbered cities", () => {
    const lines: string[] = [];
    printCities([city], (line) => lines.push(line));
    expect(lines).toEqual(["  1. Ottawa, Canadá"]);
  });

  test("formats weather using the selected unit", () => {
    expect(weatherLine(city, 0, "F")).toBe("  Ottawa, Canadá: 32.0 °F");
  });
});
