#!/usr/bin/env node
/**
 * Refresh src/data/public-stats.json from Spotify.
 *
 * Usage:
 *   SPOTIFY_ACCESS_TOKEN=... node scripts/sync-spotify.mjs
 * or
 *   SPOTIFY_CLIENT_ID=... SPOTIFY_CLIENT_SECRET=... SPOTIFY_REFRESH_TOKEN=... node scripts/sync-spotify.mjs
 */
import { writeFileSync } from "fs";
import { resolve } from "path";

async function getAccessToken() {
  if (process.env.SPOTIFY_ACCESS_TOKEN) return process.env.SPOTIFY_ACCESS_TOKEN;
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  const refresh = process.env.SPOTIFY_REFRESH_TOKEN;
  if (!id || !secret || !refresh) {
    throw new Error(
      "Set SPOTIFY_ACCESS_TOKEN or CLIENT_ID + CLIENT_SECRET + REFRESH_TOKEN",
    );
  }
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refresh,
  });
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
    },
    body,
  });
  if (!res.ok) throw new Error(`token refresh failed: ${await res.text()}`);
  const json = await res.json();
  return json.access_token;
}

async function api(token, path) {
  const res = await fetch(`https://api.spotify.com${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${path} -> ${res.status} ${text}`);
  }
  return res.json();
}

function normalizeArtist(a) {
  return {
    ...a,
    genres: a.genres ?? [],
    popularity: a.popularity ?? 0,
  };
}

function normalizeTrack(t) {
  return {
    ...t,
    popularity: t.popularity ?? 0,
    duration_ms: t.duration_ms ?? 0,
  };
}

const token = await getAccessToken();
const ranges = ["short_term", "medium_term", "long_term"];
const profile = await api(token, "/v1/me");
const snapshot = {
  fetchedAt: new Date().toISOString(),
  profile: {
    id: profile.id,
    display_name: profile.display_name,
    images: profile.images || [],
  },
  recent: [],
};

for (const range of ranges) {
  const [artists, tracks] = await Promise.all([
    api(token, `/v1/me/top/artists?time_range=${range}&limit=10`),
    api(token, `/v1/me/top/tracks?time_range=${range}&limit=10`),
  ]);
  snapshot[range] = {
    artists: (artists.items || []).map(normalizeArtist),
    tracks: (tracks.items || []).map(normalizeTrack),
  };
}

try {
  const recent = await api(token, "/v1/me/player/recently-played?limit=20");
  snapshot.recent = recent.items || [];
} catch {
  snapshot.recent = [];
}

const jsonOut = resolve("src/data/public-stats.json");
const tsOut = resolve("src/data/public-stats.ts");
const body = JSON.stringify(snapshot, null, 2);
writeFileSync(jsonOut, body);
writeFileSync(
  tsOut,
  `/* Auto-generated listening snapshot — do not edit by hand */\nexport const publicStats = ${body} as const;\n`,
);
console.log("Wrote", jsonOut);
console.log("Wrote", tsOut);
console.log(
  "User:",
  snapshot.profile.display_name,
  "| medium artists:",
  snapshot.medium_term.artists.map((a) => a.name).join(", "),
);
