import { REVALIDATE } from "./cache";
import { roundCoord } from "./geo";
import type {
  AirQuality,
  CurrentConditions,
  DayPoint,
  HourPoint,
  PlaceRef,
  WeatherBundle,
} from "./types";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";

const CURRENT_VARS = [
  "temperature_2m",
  "relative_humidity_2m",
  "apparent_temperature",
  "is_day",
  "precipitation",
  "weather_code",
  "cloud_cover",
  "surface_pressure",
  "wind_speed_10m",
  "wind_direction_10m",
  "wind_gusts_10m",
].join(",");

const HOURLY_VARS = [
  "temperature_2m",
  "weather_code",
  "precipitation_probability",
  "wind_speed_10m",
  "is_day",
].join(",");

const DAILY_VARS = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "sunrise",
  "sunset",
  "uv_index_max",
  "precipitation_sum",
  "precipitation_probability_max",
  "wind_speed_10m_max",
].join(",");

interface RawForecast {
  timezone: string;
  utc_offset_seconds: number;
  elevation: number | null;
  current: Record<string, number | string>;
  hourly: Record<string, (number | string | null)[]>;
  daily: Record<string, (number | string | null)[]>;
}

const num = (v: unknown, fallback = 0) =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

const nullableNum = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

export class UpstreamError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function getJson<T>(url: string, revalidate: number): Promise<T> {
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) {
    let reason = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { reason?: string };
      if (body?.reason) reason = body.reason;
    } catch {
      // non-JSON error body; the status alone is the message
    }
    throw new UpstreamError(reason, res.status);
  }
  return (await res.json()) as T;
}

function buildForecastUrl(lat: number, lon: number) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: CURRENT_VARS,
    hourly: HOURLY_VARS,
    daily: DAILY_VARS,
    timezone: "auto",
    forecast_days: "7",
  });
  return `${FORECAST_URL}?${params}`;
}

function buildAirQualityUrl(lat: number, lon: number) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current:
      "european_aqi,us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide,uv_index",
    timezone: "auto",
  });
  return `${AIR_QUALITY_URL}?${params}`;
}

function normalizeCurrent(raw: RawForecast): CurrentConditions {
  const c = raw.current ?? {};
  return {
    time: String(c.time ?? ""),
    isDay: num(c.is_day, 1) === 1,
    tempC: num(c.temperature_2m),
    feelsLikeC: num(c.apparent_temperature, num(c.temperature_2m)),
    humidity: num(c.relative_humidity_2m),
    precipMm: num(c.precipitation),
    code: num(c.weather_code),
    cloudCover: num(c.cloud_cover),
    pressureHpa: num(c.surface_pressure),
    windKmh: num(c.wind_speed_10m),
    windDeg: num(c.wind_direction_10m),
    gustKmh: num(c.wind_gusts_10m),
  };
}

// Open-Meteo returns hourly/daily as parallel arrays keyed by variable name,
// not as arrays of objects — these zip them into records.
function normalizeHourly(raw: RawForecast, nowLocal: string): HourPoint[] {
  const h = raw.hourly ?? {};
  const times = (h.time ?? []) as string[];
  const currentHour = nowLocal.slice(0, 13);
  const startIndex = Math.max(
    0,
    times.findIndex((t) => t.slice(0, 13) >= currentHour),
  );
  return times.slice(startIndex, startIndex + 48).map((time, i) => {
    const idx = startIndex + i;
    return {
      time,
      tempC: num(h.temperature_2m?.[idx]),
      code: num(h.weather_code?.[idx]),
      precipProb: num(h.precipitation_probability?.[idx]),
      windKmh: num(h.wind_speed_10m?.[idx]),
      isDay: num(h.is_day?.[idx], 1) === 1,
    };
  });
}

function normalizeDaily(raw: RawForecast): DayPoint[] {
  const d = raw.daily ?? {};
  const dates = (d.time ?? []) as string[];
  return dates.map((date, i) => ({
    date,
    code: num(d.weather_code?.[i]),
    maxC: num(d.temperature_2m_max?.[i]),
    minC: num(d.temperature_2m_min?.[i]),
    sunrise: String(d.sunrise?.[i] ?? ""),
    sunset: String(d.sunset?.[i] ?? ""),
    uvMax: num(d.uv_index_max?.[i]),
    precipSum: num(d.precipitation_sum?.[i]),
    precipProb: num(d.precipitation_probability_max?.[i]),
    windMaxKmh: num(d.wind_speed_10m_max?.[i]),
  }));
}

async function fetchAirQuality(lat: number, lon: number): Promise<AirQuality | null> {
  try {
    const raw = await getJson<{ current?: Record<string, number> }>(
      buildAirQualityUrl(lat, lon),
      REVALIDATE.airQuality,
    );
    const c = raw.current ?? {};
    return {
      europeanAqi: nullableNum(c.european_aqi),
      usAqi: nullableNum(c.us_aqi),
      pm25: nullableNum(c.pm2_5),
      pm10: nullableNum(c.pm10),
      ozone: nullableNum(c.ozone),
      no2: nullableNum(c.nitrogen_dioxide),
      so2: nullableNum(c.sulphur_dioxide),
      co: nullableNum(c.carbon_monoxide),
      uvIndex: nullableNum(c.uv_index),
    };
  } catch {
    // Air quality is supplementary — its card degrades, the page still renders.
    return null;
  }
}

export async function fetchWeatherBundle(
  place: PlaceRef,
): Promise<WeatherBundle> {
  const lat = roundCoord(place.lat);
  const lon = roundCoord(place.lon);

  const [forecast, air] = await Promise.all([
    getJson<RawForecast>(buildForecastUrl(lat, lon), REVALIDATE.forecast),
    fetchAirQuality(lat, lon),
  ]);

  const current = normalizeCurrent(forecast);

  return {
    place,
    timezone: forecast.timezone ?? "UTC",
    utcOffsetSeconds: num(forecast.utc_offset_seconds),
    elevation: nullableNum(forecast.elevation),
    current,
    hourly: normalizeHourly(forecast, current.time),
    daily: normalizeDaily(forecast),
    air,
    fetchedAt: new Date().toISOString(),
  };
}
