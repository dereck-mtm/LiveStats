import { NextRequest, NextResponse } from "next/server";
import {
  getClientCredentialsToken,
  searchTracks,
} from "@/lib/spotify";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() || "";
  if (q.length < 2) {
    return NextResponse.json({ items: [] });
  }
  if (
    !process.env.SPOTIFY_CLIENT_ID ||
    !process.env.SPOTIFY_CLIENT_SECRET
  ) {
    return NextResponse.json(
      { error: "Search is not configured." },
      { status: 503 },
    );
  }

  try {
    const { access_token } = await getClientCredentialsToken();
    const data = await searchTracks(access_token, q);
    const items = (data.tracks?.items || []).map((t) => ({
      id: t.id,
      name: t.name,
      artists: t.artists.map((a) => a.name).join(", "),
      albumImage: t.album?.images?.[0]?.url,
      spotifyUrl: t.external_urls?.spotify,
    }));
    return NextResponse.json({ items });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
