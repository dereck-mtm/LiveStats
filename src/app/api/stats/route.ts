import { NextRequest, NextResponse } from "next/server";
import { buildStatsPayload, REFRESH_SECONDS } from "@/lib/stats-payload";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const range = request.nextUrl.searchParams.get("range") || undefined;
  const payload = await buildStatsPayload(range);

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": `s-maxage=${REFRESH_SECONDS}, stale-while-revalidate=60`,
    },
  });
}
