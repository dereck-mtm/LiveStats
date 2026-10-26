import { getRedirectUri, SPOTIFY_SCOPES } from "./config";
import type { SessionData } from "./session";

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API = "https://api.spotify.com/v1";

export type SpotifyImage = { url: string; height: number | null; width: number | null };

export type SpotifyArtist = {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  external_urls: { spotify: string };
  images: SpotifyImage[];
};

export type SpotifyTrack = {
  id: string;
  name: string;
  popularity: number;
  duration_ms: number;
  explicit?: boolean;
  external_urls: { spotify: string };
  artists: { id: string; name: string }[];
  album: {
    name: string;
    images: SpotifyImage[];
  };
};

export type PlayHistoryItem = {
  played_at: string;
  track: SpotifyTrack;
};

export type SpotifyProfile = {
  id: string;
  display_name: string;
  email?: string;
  images: SpotifyImage[];
  followers?: { total: number };
  country?: string;
  product?: string;
};

export function buildAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    response_type: "code",
    redirect_uri: getRedirectUri(),
    scope: SPOTIFY_SCOPES,
    state,
    show_dialog: "false",
  });
  return `https://accounts.spotify.com/authorize?${params}`;
}

export async function exchangeCode(code: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(),
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuth(),
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
  }>;
}

export async function refreshAccessToken(refreshToken: string) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuth(),
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Refresh failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  }>;
}

function basicAuth() {
  const id = process.env.SPOTIFY_CLIENT_ID!;
  const secret = process.env.SPOTIFY_CLIENT_SECRET!;
  return `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`;
}

async function spotifyFetch<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify ${path}: ${res.status} ${text}`);
  }

  return res.json() as Promise<T>;
}

export async function getProfile(accessToken: string) {
  return spotifyFetch<SpotifyProfile>("/me", accessToken);
}

export async function getTopArtists(
  accessToken: string,
  timeRange: "short_term" | "medium_term" | "long_term" = "medium_term",
) {
  return spotifyFetch<{ items: SpotifyArtist[] }>(
    `/me/top/artists?limit=10&time_range=${timeRange}`,
    accessToken,
  );
}

export async function getTopTracks(
  accessToken: string,
  timeRange: "short_term" | "medium_term" | "long_term" = "medium_term",
) {
  return spotifyFetch<{ items: SpotifyTrack[] }>(
    `/me/top/tracks?limit=10&time_range=${timeRange}`,
    accessToken,
  );
}

export async function getRecentlyPlayed(accessToken: string) {
  return spotifyFetch<{ items: PlayHistoryItem[] }>(
    "/me/player/recently-played?limit=20",
    accessToken,
  );
}

export async function ensureFreshSession(
  session: SessionData,
): Promise<SessionData> {
  if (Date.now() < session.expiresAt - 60_000) return session;

  const refreshed = await refreshAccessToken(session.refreshToken);
  return {
    ...session,
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token || session.refreshToken,
    expiresAt: Date.now() + refreshed.expires_in * 1000,
  };
}
