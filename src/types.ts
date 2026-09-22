export type TemperatureUnit = "C" | "F";

export type City = {
  id: string;
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
};

export type AppState = {
  cities: City[];
  defaultCityId: string | null;
  unit: TemperatureUnit;
};

export type GeocodeResult = {
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
};

export type GeocodeFn = (name: string) => Promise<GeocodeResult | null>;
export type ForecastFn = (
  latitude: number,
  longitude: number,
) => Promise<number>;

export type DailyForecast = {
  date: string;
  minimum: number;
  maximum: number;
};

export type DailyForecastFn = (
  latitude: number,
  longitude: number,
) => Promise<DailyForecast[]>;

export type FetchLike = (
  input: string | URL | Request,
) => Promise<Response>;
