import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAppUrl } from "@/lib/config";
import { setSession } from "@/lib/session";
import { exchangeCode, getProfile } from "@/lib/spotify";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const appUrl = getAppUrl();

  if (error) {
    return NextResponse.redirect(
      `${appUrl}/?error=${encodeURIComponent(error)}`,
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/?error=missing_code`);
  }

  const jar = await cookies();
  const expected = jar.get("livestats_oauth_state")?.value;
  jar.delete("livestats_oauth_state");

  if (!expected || expected !== state) {
    return NextResponse.redirect(`${appUrl}/?error=invalid_state`);
  }

  try {
    const tokens = await exchangeCode(code);
    const profile = await getProfile(tokens.access_token);

    await setSession({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
      displayName: profile.display_name || profile.id,
      imageUrl: profile.images?.[0]?.url,
    });

    return NextResponse.redirect(`${appUrl}/dashboard`);
  } catch (e) {
    const message = e instanceof Error ? e.message : "auth_failed";
    return NextResponse.redirect(
      `${appUrl}/?error=${encodeURIComponent(message.slice(0, 120))}`,
    );
  }
}
