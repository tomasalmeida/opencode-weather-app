import { configPath } from "./src/config.ts";
import { geocodeCity } from "./src/geocoding.ts";
import { fetchDailyForecast, fetchForecast } from "./src/weather.ts";
import { runCli } from "./src/cli.ts";

try {
  await runCli(configPath(), {
    geocode: (name) => geocodeCity(name),
    forecast: (latitude, longitude) => fetchForecast(latitude, longitude),
    dailyForecast: (latitude, longitude) => fetchDailyForecast(latitude, longitude),
  });
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
