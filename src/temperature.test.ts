import { describe, expect, test } from "bun:test";
import { celsiusToFahrenheit, formatTemperature } from "./temperature.ts";

describe("celsiusToFahrenheit", () => {
  test("freezing point", () => {
    expect(celsiusToFahrenheit(0)).toBe(32);
  });
  test("boiling point", () => {
    expect(celsiusToFahrenheit(100)).toBe(212);
  });
  test("negative crossover", () => {
    expect(celsiusToFahrenheit(-40)).toBe(-40);
  });
  test("typical value", () => {
    expect(celsiusToFahrenheit(18.5)).toBeCloseTo(65.3, 5);
  });
});

describe("formatTemperature", () => {
  test("formats Celsius with one decimal", () => {
    expect(formatTemperature(18.54, "C")).toBe("18.5 °C");
  });
  test("converts and formats Fahrenheit", () => {
    expect(formatTemperature(18.5, "F")).toBe("65.3 °F");
  });
  test("rounds to one decimal", () => {
    expect(formatTemperature(18.46, "C")).toBe("18.5 °C");
  });
});
