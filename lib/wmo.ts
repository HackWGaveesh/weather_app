export type WeatherTheme =
  | "clear-day"
  | "clear-night"
  | "partly-day"
  | "partly-night"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "freezing"
  | "snow"
  | "showers"
  | "thunder";

export type GlyphName =
  | "sun"
  | "moon"
  | "cloud-sun"
  | "cloud-moon"
  | "cloud"
  | "fog"
  | "drizzle"
  | "rain"
  | "freezing"
  | "snow"
  | "showers"
  | "thunder"
  | "hail";

export type Severity = 0 | 1 | 2 | 3;

interface WmoEntry {
  label: string;
  nightLabel?: string;
  icon: GlyphName;
  nightIcon?: GlyphName;
  theme: WeatherTheme;
  nightTheme?: WeatherTheme;
  severity: Severity;
}

const WMO: Record<number, WmoEntry> = {
  0: { label: "Sunny", nightLabel: "Clear", icon: "sun", nightIcon: "moon", theme: "clear-day", nightTheme: "clear-night", severity: 0 },
  1: { label: "Mainly Sunny", nightLabel: "Mainly Clear", icon: "sun", nightIcon: "moon", theme: "clear-day", nightTheme: "clear-night", severity: 0 },
  2: { label: "Partly Cloudy", icon: "cloud-sun", nightIcon: "cloud-moon", theme: "partly-day", nightTheme: "partly-night", severity: 0 },
  3: { label: "Cloudy", icon: "cloud", theme: "cloudy", severity: 0 },
  45: { label: "Foggy", icon: "fog", theme: "fog", severity: 1 },
  48: { label: "Rime Fog", icon: "fog", theme: "fog", severity: 1 },
  51: { label: "Light Drizzle", icon: "drizzle", theme: "drizzle", severity: 1 },
  53: { label: "Drizzle", icon: "drizzle", theme: "drizzle", severity: 1 },
  55: { label: "Heavy Drizzle", icon: "drizzle", theme: "drizzle", severity: 1 },
  56: { label: "Light Freezing Drizzle", icon: "freezing", theme: "freezing", severity: 2 },
  57: { label: "Freezing Drizzle", icon: "freezing", theme: "freezing", severity: 2 },
  61: { label: "Light Rain", icon: "rain", theme: "rain", severity: 1 },
  63: { label: "Rain", icon: "rain", theme: "rain", severity: 2 },
  65: { label: "Heavy Rain", icon: "rain", theme: "rain", severity: 3 },
  66: { label: "Light Freezing Rain", icon: "freezing", theme: "freezing", severity: 2 },
  67: { label: "Freezing Rain", icon: "freezing", theme: "freezing", severity: 3 },
  71: { label: "Light Snow", icon: "snow", theme: "snow", severity: 1 },
  73: { label: "Snow", icon: "snow", theme: "snow", severity: 2 },
  75: { label: "Heavy Snow", icon: "snow", theme: "snow", severity: 3 },
  77: { label: "Snow Grains", icon: "snow", theme: "snow", severity: 1 },
  80: { label: "Light Showers", icon: "showers", theme: "showers", severity: 1 },
  81: { label: "Showers", icon: "showers", theme: "showers", severity: 2 },
  82: { label: "Heavy Showers", icon: "showers", theme: "showers", severity: 3 },
  85: { label: "Light Snow Showers", icon: "snow", theme: "snow", severity: 2 },
  86: { label: "Snow Showers", icon: "snow", theme: "snow", severity: 3 },
  95: { label: "Thunderstorm", icon: "thunder", theme: "thunder", severity: 3 },
  96: { label: "Thunderstorm with Hail", icon: "hail", theme: "thunder", severity: 3 },
  99: { label: "Severe Thunderstorm with Hail", icon: "hail", theme: "thunder", severity: 3 },
};

const FALLBACK: WmoEntry = {
  label: "Unknown",
  icon: "cloud",
  theme: "cloudy",
  severity: 0,
};

export interface WeatherDescription {
  label: string;
  icon: GlyphName;
  theme: WeatherTheme;
  severity: Severity;
}

export function describeWeather(code: number, isDay: boolean): WeatherDescription {
  const e = WMO[code] ?? FALLBACK;
  return {
    label: isDay ? e.label : e.nightLabel ?? e.label,
    icon: isDay ? e.icon : e.nightIcon ?? e.icon,
    theme: isDay ? e.theme : e.nightTheme ?? e.theme,
    severity: e.severity,
  };
}
