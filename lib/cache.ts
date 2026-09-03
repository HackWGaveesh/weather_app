export const REVALIDATE = {
  forecast: 900, // Open-Meteo's current.interval for forecast
  airQuality: 3600,
  geocode: 86400,
  reverse: 86400,
  radar: 120,
} as const;

export function cacheHeaders(seconds: number) {
  return {
    "Cache-Control": `public, s-maxage=${seconds}, stale-while-revalidate=${seconds * 4}`,
  };
}
