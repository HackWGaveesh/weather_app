import { NextRequest, NextResponse } from "next/server";
import { cacheHeaders, REVALIDATE } from "@/lib/cache";
import { searchPlaces } from "@/lib/geocoding";
import type { ApiResult, PlaceRef } from "@/lib/types";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";

  try {
    const data = await searchPlaces(q);
    return NextResponse.json<ApiResult<PlaceRef[]>>(
      { ok: true, data },
      { headers: cacheHeaders(REVALIDATE.geocode) },
    );
  } catch {
    return NextResponse.json<ApiResult<never>>(
      { ok: false, error: { code: "UPSTREAM", message: "Search unavailable." } },
      { status: 502 },
    );
  }
}
