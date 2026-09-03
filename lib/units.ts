import type { SpeedUnit, TempUnit } from "./types";

export const cToF = (c: number) => (c * 9) / 5 + 32;
export const kmhToMph = (k: number) => k * 0.621371;
export const mmToIn = (mm: number) => mm / 25.4;

export function formatTemp(celsius: number, unit: TempUnit, withUnit = false) {
  const v = unit === "C" ? celsius : cToF(celsius);
  return `${Math.round(v)}${withUnit ? `°${unit}` : "°"}`;
}

export function tempValue(celsius: number, unit: TempUnit) {
  return Math.round(unit === "C" ? celsius : cToF(celsius));
}

export function formatSpeed(kmh: number, unit: SpeedUnit) {
  const v = unit === "kmh" ? kmh : kmhToMph(kmh);
  return `${Math.round(v)} ${unit === "kmh" ? "km/h" : "mph"}`;
}

const COMPASS = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
];

export function degToCompass(deg: number) {
  return COMPASS[Math.round(deg / 22.5) % 16];
}

// Open-Meteo returns local wall-clock strings with no offset ("2026-09-03T11:15"),
// already in the target location's timezone — so they are formatted as literal
// components rather than passed through Date, which would re-apply the browser's zone.
export function hourLabel(isoLocal: string) {
  const hh = isoLocal.slice(11, 13);
  const h = Number(hh);
  const suffix = h < 12 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${suffix}`;
}

export function timeLabel(isoLocal: string) {
  const hh = Number(isoLocal.slice(11, 13));
  const mm = isoLocal.slice(14, 16);
  const suffix = hh < 12 ? "am" : "pm";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${mm} ${suffix}`;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function weekdayLabel(isoDate: string, index: number) {
  if (index === 0) return "Today";
  const [y, m, d] = isoDate.split("-").map(Number);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

export function dayMonthLabel(isoDate: string) {
  const [, m, d] = isoDate.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[m - 1]}`;
}
