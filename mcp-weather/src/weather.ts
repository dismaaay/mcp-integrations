/**
 * Core weather logic — pure functions over the Open-Meteo HTTP API.
 *
 * Kept deliberately free of any MCP imports so it can be unit-tested and
 * reused on its own. The MCP transport wiring lives in index.ts.
 *
 * Open-Meteo is free for non-commercial use and requires NO API key.
 * Docs: https://open-meteo.com/en/docs
 */

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export interface GeoResult {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface CurrentWeather {
  location: string;
  temperatureC: number;
  apparentTemperatureC: number;
  relativeHumidity: number;
  windSpeedKmh: number;
  conditions: string;
  isDay: boolean;
  observedAt: string;
}

export interface ForecastDay {
  date: string;
  minC: number;
  maxC: number;
  conditions: string;
  precipitationMm: number;
  precipitationProbabilityPct: number | null;
}

/** WMO weather interpretation codes → human-readable conditions. */
const WMO_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snowfall",
  73: "Moderate snowfall",
  75: "Heavy snowfall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

export function describeWeatherCode(code: number): string {
  return WMO_CODES[code] ?? `Unknown (code ${code})`;
}

/** Fetch JSON with a timeout and a clear error message on failure. */
async function fetchJson(url: string, timeoutMs = 10_000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "mcp-weather/1.0 (+https://github.com)" },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
    }
    return await res.json();
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms: ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** Resolve a place name to coordinates. Throws if nothing is found. */
export async function geocode(name: string): Promise<GeoResult> {
  if (!name || !name.trim()) {
    throw new Error("Location name must not be empty.");
  }
  const url = `${GEOCODE_URL}?name=${encodeURIComponent(name.trim())}&count=1&language=en&format=json`;
  const data = await fetchJson(url);
  const hit = data?.results?.[0];
  if (!hit) {
    throw new Error(`No location found for "${name}". Try a more specific name.`);
  }
  return {
    name: hit.name,
    country: hit.country ?? "",
    admin1: hit.admin1,
    latitude: hit.latitude,
    longitude: hit.longitude,
    timezone: hit.timezone ?? "auto",
  };
}

function formatLocation(g: GeoResult): string {
  return [g.name, g.admin1, g.country].filter(Boolean).join(", ");
}

/** Current conditions for a place name. */
export async function getCurrentWeather(location: string): Promise<CurrentWeather> {
  const geo = await geocode(location);
  const params = new URLSearchParams({
    latitude: String(geo.latitude),
    longitude: String(geo.longitude),
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,is_day,weather_code,wind_speed_10m",
    timezone: "auto",
  });
  const data = await fetchJson(`${FORECAST_URL}?${params}`);
  const c = data.current;
  return {
    location: formatLocation(geo),
    temperatureC: c.temperature_2m,
    apparentTemperatureC: c.apparent_temperature,
    relativeHumidity: c.relative_humidity_2m,
    windSpeedKmh: c.wind_speed_10m,
    conditions: describeWeatherCode(c.weather_code),
    isDay: c.is_day === 1,
    observedAt: c.time,
  };
}

/** Multi-day daily forecast for a place name (1–16 days). */
export async function getForecast(
  location: string,
  days = 7,
): Promise<{ location: string; days: ForecastDay[] }> {
  const clamped = Math.min(Math.max(Math.trunc(days), 1), 16);
  const geo = await geocode(location);
  const params = new URLSearchParams({
    latitude: String(geo.latitude),
    longitude: String(geo.longitude),
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max",
    forecast_days: String(clamped),
    timezone: "auto",
  });
  const data = await fetchJson(`${FORECAST_URL}?${params}`);
  const d = data.daily;
  const out: ForecastDay[] = d.time.map((date: string, i: number) => ({
    date,
    minC: d.temperature_2m_min[i],
    maxC: d.temperature_2m_max[i],
    conditions: describeWeatherCode(d.weather_code[i]),
    precipitationMm: d.precipitation_sum[i],
    precipitationProbabilityPct: d.precipitation_probability_max?.[i] ?? null,
  }));
  return { location: formatLocation(geo), days: out };
}
