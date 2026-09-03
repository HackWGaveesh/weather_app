// MapLibre keeps accumulating longitude past ±180 as you pan across the
// antimeridian; Open-Meteo rejects anything outside the range with a 400.
export const normalizeLon = (lon: number) =>
  (((lon + 180) % 360) + 360) % 360 - 180;

export const clampLat = (lat: number) => Math.max(-90, Math.min(90, lat));

// ~110 m buckets, so nearby map clicks share a cache entry instead of each
// full-precision click becoming a unique upstream request.
export const roundCoord = (n: number) => Math.round(n * 1000) / 1000;

export function formatCoords(lat: number, lon: number) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(2)}°${ns}, ${Math.abs(lon).toFixed(2)}°${ew}`;
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
