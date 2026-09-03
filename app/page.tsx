import { AppShell } from "@/components/AppShell";
import { clampLat, isValidCoord, normalizeLon } from "@/lib/geo";
import { reverseGeocode } from "@/lib/geocoding";
import { fetchWeatherBundle } from "@/lib/open-meteo";
import { DEFAULT_PLACE } from "@/lib/presets";
import type { PlaceRef, WeatherBundle } from "@/lib/types";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    lat?: string;
    lon?: string;
    name?: string;
    admin?: string;
    country?: string;
  }>;
}) {
  const params = await searchParams;
  const lat = clampLat(Number(params.lat));
  const lon = normalizeLon(Number(params.lon));
  const hasCoords = params.lat !== undefined && isValidCoord(lat, lon);

  let place: PlaceRef = DEFAULT_PLACE;
  if (hasCoords) {
    place = params.name
      ? {
          lat,
          lon,
          name: params.name,
          admin: params.admin,
          country: params.country,
          source: "geocode",
        }
      : await reverseGeocode(lat, lon);
  }

  let bundle: WeatherBundle | null = null;
  try {
    bundle = await fetchWeatherBundle(place);
  } catch {
    // The client retries and renders its own error state.
  }

  return (
    <AppShell
      initialBundle={bundle}
      initialSelection={{
        lat: place.lat,
        lon: place.lon,
        name: place.name,
        admin: place.admin,
        country: place.country,
      }}
    />
  );
}
