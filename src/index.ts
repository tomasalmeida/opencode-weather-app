import { geocodeCity } from "./api/geocoding.ts";
import { fetchDailyForecast, fetchForecast } from "./api/weather.ts";
import { configPath } from "./utils/config.ts";
import { runCli } from "./presentation/menu.ts";

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
