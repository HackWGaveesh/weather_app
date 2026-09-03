// MapLibre keeps accumulating longitude past ±180 as you pan across the
// antimeridian; Open-Meteo rejects anything outside the range with a 400.
export const normalizeLon = (lon: number) =>
  (((lon + 180) % 360) + 360) % 360 - 180;

export const clampLat = (lat: number) => Math.max(-90, Math.min(90, lat));

// ~110 m buckets, so nearby map clicks share a cache entry instead of each
// full-precision click becoming a unique upstream request.
export const roundCoord = (n: number) => Math.round(n * 1000) / 1000;

export function formatCoords(lat: number, lon: number, decimals = 2) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(decimals)}°${ns}, ${Math.abs(lon).toFixed(decimals)}°${ew}`;
}

export function formatAccuracy(radiusM: number) {
  return radiusM >= 1000
    ? `${(radiusM / 1000).toFixed(radiusM >= 10_000 ? 0 : 1)} km`
    : `${Math.round(radiusM)} m`;
}

export function isValidCoord(lat: number, lon: number) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}
