import { NextRequest, NextResponse } from "next/server";
import {
  addRecommendation,
  listRecommendations,
} from "@/lib/recommendations";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await listRecommendations();
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  let body: {
    trackId?: string;
    trackName?: string;
    artists?: string;
    albumImage?: string;
    spotifyUrl?: string;
    fromName?: string;
    note?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.trackId || !body.trackName || !body.artists) {
    return NextResponse.json(
      { error: "Pick a song before sending." },
      { status: 400 },
    );
  }

  const item = await addRecommendation({
    trackId: String(body.trackId).slice(0, 64),
    trackName: String(body.trackName).slice(0, 120),
    artists: String(body.artists).slice(0, 160),
    albumImage: body.albumImage ? String(body.albumImage).slice(0, 500) : undefined,
    spotifyUrl: body.spotifyUrl ? String(body.spotifyUrl).slice(0, 300) : undefined,
    fromName: String(body.fromName || "").slice(0, 40),
    note: String(body.note || "").slice(0, 160),
  });

  return NextResponse.json({ item }, { status: 201 });
}
