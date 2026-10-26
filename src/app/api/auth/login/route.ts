import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasSpotifyCredentials } from "@/lib/config";
import { buildAuthUrl } from "@/lib/spotify";

export async function GET() {
  if (!hasSpotifyCredentials()) {
    return NextResponse.redirect(
      new URL("/?demo=1", process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:43127"),
    );
  }

  const state = randomBytes(16).toString("hex");
  const jar = await cookies();
  jar.set("livestats_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return NextResponse.redirect(buildAuthUrl(state));
}
