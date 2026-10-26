import { publicStats } from "@/data/public-stats";
import { demoArtists, demoProfile, demoRecent, demoTracks } from "./demo-data";
import { getSession, setSession } from "./session";
import {
  ensureFreshSession,
  getProfile,
  getRecentlyPlayed,
  getTopArtists,
  getTopTracks,
  refreshAccessToken,
  type PlayHistoryItem,
  type SpotifyArtist,
  type SpotifyProfile,
  type SpotifyTrack,
} from "./spotify";

export type StatsRange = "short_term" | "medium_term" | "long_term";

export type LoadedStats = {
  mode: "live" | "demo";
  source: "public-token" | "snapshot" | "owner-session" | "demo";
  profile: Pick<SpotifyProfile, "display_name" | "images">;
  artists: SpotifyArtist[];
  tracks: SpotifyTrack[];
  recent: PlayHistoryItem[];
  error: string | null;
  fetchedAt?: string;
};

export function isStatsRange(value: string | undefined): value is StatsRange {
  return (
    value === "short_term" ||
    value === "medium_term" ||
    value === "long_term"
  );
}

async function fetchBundle(accessToken: string, range: StatsRange) {
  const [profile, topArtists, topTracks, recently] = await Promise.all([
    getProfile(accessToken),
    getTopArtists(accessToken, range),
    getTopTracks(accessToken, range),
    getRecentlyPlayed(accessToken).catch(() => ({ items: [] as PlayHistoryItem[] })),
  ]);
  return {
    profile,
    artists: topArtists.items,
    tracks: topTracks.items,
    recent: recently.items,
  };
}

function fromSnapshot(range: StatsRange): LoadedStats | null {
  const snap = publicStats as unknown as {
    fetchedAt?: string;
    profile?: { display_name?: string; images?: SpotifyProfile["images"] };
    short_term?: { artists?: SpotifyArtist[]; tracks?: SpotifyTrack[] };
    medium_term?: { artists?: SpotifyArtist[]; tracks?: SpotifyTrack[] };
    long_term?: { artists?: SpotifyArtist[]; tracks?: SpotifyTrack[] };
    recent?: PlayHistoryItem[];
  };

  const bucket = snap[range];
  if (!bucket?.artists?.length && !bucket?.tracks?.length) return null;

  const artists = (bucket.artists || []).map((a) => ({
    ...a,
    genres: a.genres ?? [],
    popularity: a.popularity ?? 0,
  }));
  const tracks = (bucket.tracks || []).map((t) => ({
    ...t,
    popularity: t.popularity ?? 0,
    duration_ms: t.duration_ms ?? 0,
  }));

  return {
    mode: "live",
    source: "snapshot",
    profile: {
      display_name: snap.profile?.display_name || "dereck",
      images: snap.profile?.images || [],
    },
    artists,
    tracks,
    recent: snap.recent || [],
    error: null,
    fetchedAt: snap.fetchedAt,
  };
}

/** Public site: live refresh token → saved snapshot of your data → owner session → demo. */
export async function loadPublicStats(
  range: StatsRange = "medium_term",
): Promise<LoadedStats> {
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN?.trim();

  if (
    refreshToken &&
    process.env.SPOTIFY_CLIENT_ID &&
    process.env.SPOTIFY_CLIENT_SECRET
  ) {
    try {
      const tokens = await refreshAccessToken(refreshToken);
      const bundle = await fetchBundle(tokens.access_token, range);
      return {
        mode: "live",
        source: "public-token",
        profile: bundle.profile,
        artists: bundle.artists,
        tracks: bundle.tracks,
        recent: bundle.recent,
        error: null,
      };
    } catch (e) {
      const snap = fromSnapshot(range);
      if (snap) {
        return {
          ...snap,
          error:
            e instanceof Error
              ? `Live refresh failed (${e.message}); showing saved snapshot.`
              : "Live refresh failed; showing saved snapshot.",
        };
      }
    }
  }

  const snap = fromSnapshot(range);
  if (snap) return snap;

  const session = await getSession();
  if (session) {
    try {
      const fresh = await ensureFreshSession(session);
      if (fresh.accessToken !== session.accessToken) {
        await setSession(fresh);
      }
      const bundle = await fetchBundle(fresh.accessToken, range);
      return {
        mode: "live",
        source: "owner-session",
        profile: {
          display_name: fresh.displayName,
          images: fresh.imageUrl
            ? [{ url: fresh.imageUrl, height: null, width: null }]
            : [],
        },
        artists: bundle.artists,
        tracks: bundle.tracks,
        recent: bundle.recent,
        error: null,
      };
    } catch (e) {
      return {
        mode: "demo",
        source: "demo",
        profile: demoProfile,
        artists: demoArtists,
        tracks: demoTracks,
        recent: demoRecent,
        error: e instanceof Error ? e.message : "Failed to load Spotify data",
      };
    }
  }

  return {
    mode: "demo",
    source: "demo",
    profile: demoProfile,
    artists: demoArtists,
    tracks: demoTracks,
    recent: demoRecent,
    error: null,
  };
}
