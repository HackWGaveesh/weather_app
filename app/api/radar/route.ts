import { NextResponse } from "next/server";
import { cacheHeaders, REVALIDATE } from "@/lib/cache";
import { fetchRadarIndex } from "@/lib/rainviewer";
import type { ApiResult, RadarIndex } from "@/lib/types";

export async function GET() {
  try {
    const data = await fetchRadarIndex();
    return NextResponse.json<ApiResult<RadarIndex>>(
      { ok: true, data },
      { headers: cacheHeaders(REVALIDATE.radar) },
    );
  } catch {
    return NextResponse.json<ApiResult<never>>(
      { ok: false, error: { code: "UPSTREAM", message: "Radar feed offline." } },
      { status: 502 },
    );
  }
}
