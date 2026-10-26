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
  source: "public-token" | "owner-session" | "demo";
  profile: Pick<SpotifyProfile, "display_name" | "images">;
  artists: SpotifyArtist[];
  tracks: SpotifyTrack[];
  recent: PlayHistoryItem[];
  error: string | null;
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
    getRecentlyPlayed(accessToken),
  ]);
  return {
    profile,
    artists: topArtists.items,
    tracks: topTracks.items,
    recent: recently.items,
  };
}

/** Public site: prefer owner's refresh token in env so visitors see YOUR stats. */
export async function loadPublicStats(
  range: StatsRange = "medium_term",
): Promise<LoadedStats> {
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN?.trim();

  if (refreshToken && process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
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
      return {
        mode: "demo",
        source: "demo",
        profile: demoProfile,
        artists: demoArtists,
        tracks: demoTracks,
        recent: demoRecent,
        error:
          e instanceof Error
            ? `Could not load your Spotify data: ${e.message}`
            : "Could not load your Spotify data",
      };
    }
  }

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
