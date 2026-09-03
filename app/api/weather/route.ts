import { NextRequest, NextResponse } from "next/server";
import { cacheHeaders, REVALIDATE } from "@/lib/cache";
import { clampLat, isValidCoord, normalizeLon, roundCoord } from "@/lib/geo";
import { reverseGeocode } from "@/lib/geocoding";
import { fetchWeatherBundle, UpstreamError } from "@/lib/open-meteo";
import type { ApiResult, PlaceRef, WeatherBundle } from "@/lib/types";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const lat = clampLat(Number(params.get("lat")));
  const lon = normalizeLon(Number(params.get("lon")));

  if (!isValidCoord(lat, lon)) {
    return NextResponse.json<ApiResult<never>>(
      { ok: false, error: { code: "BAD_INPUT", message: "Invalid coordinates." } },
      { status: 400 },
    );
  }

  const name = params.get("name");

  try {
    const place: PlaceRef = name
      ? {
          lat: roundCoord(lat),
          lon: roundCoord(lon),
          name,
          admin: params.get("admin") ?? undefined,
          country: params.get("country") ?? undefined,
          source: "geocode",
        }
      : await reverseGeocode(lat, lon);

    const data = await fetchWeatherBundle(place);

    return NextResponse.json<ApiResult<WeatherBundle>>(
      { ok: true, data },
      { headers: cacheHeaders(REVALIDATE.forecast) },
    );
  } catch (error) {
    const status = error instanceof UpstreamError ? error.status : 502;
    const code = status === 429 ? "RATE_LIMITED" : status === 400 ? "BAD_INPUT" : "UPSTREAM";
    return NextResponse.json<ApiResult<never>>(
      {
        ok: false,
        error: {
          code,
          message:
            error instanceof Error ? error.message : "Weather service unavailable.",
        },
      },
      { status: status === 400 ? 400 : 502 },
    );
  }
}
