import { REVALIDATE } from "./cache";
import { formatCoords, roundCoord } from "./geo";
import type { PlaceRef } from "./types";

const SEARCH_URL = "https://geocoding-api.open-meteo.com/v1/search";
const REVERSE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

interface RawGeoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string;
  timezone?: string;
  population?: number;
}

export async function searchPlaces(query: string): Promise<PlaceRef[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const params = new URLSearchParams({
    name: q,
    count: "8",
    language: "en",
    format: "json",
  });

  const res = await fetch(`${SEARCH_URL}?${params}`, {
    next: { revalidate: REVALIDATE.geocode },
  });
  if (!res.ok) return [];

  // A zero-result response omits the `results` key entirely rather than
  // returning an empty array.
  const data = (await res.json()) as { results?: RawGeoResult[] };
  const results = data.results ?? [];

  return results
    .map((r) => ({
      lat: r.latitude,
      lon: r.longitude,
      name: r.name,
      admin: r.admin1,
      country: r.country,
      countryCode: r.country_code,
      timezone: r.timezone,
      population: r.population,
      source: "geocode" as const,
    }))
    .sort((a, b) => (b.population ?? 0) - (a.population ?? 0));
}

interface RawReverse {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryName?: string;
  countryCode?: string;
  continent?: string;
}

async function reverseViaNominatim(lat: number, lon: number) {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: "jsonv2",
    zoom: "10",
  });
  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: { "User-Agent": "global-weather-explorer/1.0 (demo app)" },
    next: { revalidate: REVALIDATE.reverse },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    name?: string;
    display_name?: string;
    address?: { country?: string; country_code?: string };
  };
  const name = data.name || data.display_name?.split(",")[0];
  if (!name) return null;
  return {
    name,
    country: data.address?.country,
    countryCode: data.address?.country_code?.toUpperCase(),
  };
}

// Weather exists for every coordinate on Earth; only the name is uncertain.
// This never throws — it degrades through region, continent, then coordinates.
export async function reverseGeocode(lat: number, lon: number): Promise<PlaceRef> {
  const rounded = { lat: roundCoord(lat), lon: roundCoord(lon) };
  const fallback: PlaceRef = {
    ...rounded,
    name: formatCoords(lat, lon),
    source: "map",
  };

  try {
    const params = new URLSearchParams({
      latitude: String(rounded.lat),
      longitude: String(rounded.lon),
      localityLanguage: "en",
    });
    const res = await fetch(`${REVERSE_URL}?${params}`, {
      next: { revalidate: REVALIDATE.reverse },
    });

    if (res.ok) {
      const d = (await res.json()) as RawReverse;
      const name =
        d.city || d.locality || d.principalSubdivision || d.countryName || d.continent;
      if (name) {
        return {
          ...rounded,
          name,
          admin: d.principalSubdivision || undefined,
          country: d.countryName || d.continent || undefined,
          countryCode: d.countryCode || undefined,
          source: "map",
        };
      }
    }
  } catch {
    // fall through to Nominatim
  }

  try {
    const alt = await reverseViaNominatim(rounded.lat, rounded.lon);
    if (alt) return { ...rounded, ...alt, source: "map" };
  } catch {
    // fall through to coordinates
  }

  return fallback;
}
