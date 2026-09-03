export type TempUnit = "C" | "F";
export type SpeedUnit = "kmh" | "mph";

export interface PlaceRef {
  lat: number;
  lon: number;
  name: string;
  admin?: string;
  country?: string;
  countryCode?: string;
  timezone?: string;
  population?: number;
  source: "geocode" | "reverse" | "map" | "geolocate" | "preset";
}

export interface CurrentConditions {
  time: string;
  isDay: boolean;
  tempC: number;
  feelsLikeC: number;
  humidity: number;
  precipMm: number;
  code: number;
  cloudCover: number;
  pressureHpa: number;
  windKmh: number;
  windDeg: number;
  gustKmh: number;
}

export interface HourPoint {
  time: string;
  tempC: number;
  code: number;
  precipProb: number;
  windKmh: number;
  isDay: boolean;
}

export interface DayPoint {
  date: string;
  code: number;
  maxC: number;
  minC: number;
  sunrise: string;
  sunset: string;
  uvMax: number;
  precipSum: number;
  precipProb: number;
  windMaxKmh: number;
}

export interface AirQuality {
  europeanAqi: number | null;
  usAqi: number | null;
  pm25: number | null;
  pm10: number | null;
  ozone: number | null;
  no2: number | null;
  so2: number | null;
  co: number | null;
  uvIndex: number | null;
}

export interface WeatherBundle {
  place: PlaceRef;
  timezone: string;
  utcOffsetSeconds: number;
  elevation: number | null;
  current: CurrentConditions;
  hourly: HourPoint[];
  daily: DayPoint[];
  air: AirQuality | null;
  fetchedAt: string;
}

export interface RadarFrame {
  time: number;
  tileUrl: string;
}

export interface RadarIndex {
  frames: RadarFrame[];
  generated: number;
}

export type ApiErrorCode =
  | "RATE_LIMITED"
  | "UPSTREAM"
  | "BAD_INPUT"
  | "NOT_FOUND";

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ApiErrorCode; message: string } };
