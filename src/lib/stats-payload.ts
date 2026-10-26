import {
  artistAffinityChart,
  crossPeriodArtists,
  explicitMix,
  getRangeBundle,
  getSnapshotMeta,
  RANGE_LABEL,
  summaryStats,
  trackDurationChart,
} from "@/lib/analytics";
import { isStatsRange, type StatsRange } from "@/lib/load-stats";
import {
  getProfile,
  getRecentlyPlayed,
  getTopArtists,
  getTopTracks,
  refreshAccessToken,
} from "@/lib/spotify";

export type StatsPayload = {
  range: StatsRange;
  rangeLabel: string;
  source: "live" | "snapshot";
  fetchedAt: string;
  nextRefreshSec: number;
  profile: {
    display_name: string;
    images: { url: string; height?: number | null; width?: number | null }[];
  };
  summary: ReturnType<typeof summaryStats>;
  affinity: ReturnType<typeof artistAffinityChart>;
  durations: ReturnType<typeof trackDurationChart>;
  sticky: ReturnType<typeof crossPeriodArtists>;
  mix: ReturnType<typeof explicitMix>;
  artists: ReturnType<typeof getRangeBundle>["artists"];
  tracks: ReturnType<typeof getRangeBundle>["tracks"];
};

const REFRESH_SECONDS = 600;

function fromSnapshot(range: StatsRange): StatsPayload {
  const meta = getSnapshotMeta();
  const bundle = getRangeBundle(range);
  return {
    range,
    rangeLabel: RANGE_LABEL[range],
    source: "snapshot",
    fetchedAt: meta.fetchedAt,
    nextRefreshSec: REFRESH_SECONDS,
    profile: meta.profile,
    summary: summaryStats(range),
    affinity: artistAffinityChart(range),
    durations: trackDurationChart(range),
    sticky: crossPeriodArtists(),
    mix: explicitMix(range),
    artists: bundle.artists,
    tracks: bundle.tracks,
  };
}

async function fromLive(range: StatsRange): Promise<StatsPayload | null> {
  const refresh = process.env.SPOTIFY_REFRESH_TOKEN?.trim();
  if (
    !refresh ||
    !process.env.SPOTIFY_CLIENT_ID ||
    !process.env.SPOTIFY_CLIENT_SECRET
  ) {
    return null;
  }

  try {
    const tokens = await refreshAccessToken(refresh);
    const token = tokens.access_token;
    const [profile, artistsRes, tracksRes] = await Promise.all([
      getProfile(token),
      getTopArtists(token, range),
      getTopTracks(token, range),
    ]);
    await getRecentlyPlayed(token).catch(() => null);

    // Build chart inputs from live lists (rank-based affinity)
    const artists = artistsRes.items.map((a) => ({
      ...a,
      genres: a.genres ?? [],
      popularity: a.popularity ?? 0,
    }));
    const tracks = tracksRes.items.map((t) => ({
      ...t,
      popularity: t.popularity ?? 0,
      duration_ms: t.duration_ms ?? 0,
    }));

    const affinity = artists.map((a, i) => ({
      name: a.name.length > 14 ? a.name.slice(0, 13) + "…" : a.name,
      fullName: a.name,
      affinity: Math.max(artists.length - i, 1),
      rank: i + 1,
    }));
    const durations = tracks.map((t, i) => ({
      name: t.name.length > 16 ? t.name.slice(0, 15) + "…" : t.name,
      fullName: t.name,
      minutes: Math.round((t.duration_ms / 60000) * 10) / 10,
      rank: i + 1,
    }));
    const explicit = tracks.filter((t) => t.explicit).length;
    const mix = [
      { name: "Explicit", value: explicit },
      { name: "Clean", value: tracks.length - explicit },
    ].filter((d) => d.value > 0);

    const totalMin = Math.round(
      tracks.reduce((s, t) => s + t.duration_ms, 0) / 60000,
    );

    return {
      range,
      rangeLabel: RANGE_LABEL[range],
      source: "live",
      fetchedAt: new Date().toISOString(),
      nextRefreshSec: REFRESH_SECONDS,
      profile: {
        display_name: profile.display_name,
        images: profile.images || [],
      },
      summary: {
        topArtistCount: artists.length,
        topTrackCount: tracks.length,
        topCatalogMinutes: totalMin,
        trackArtistSpread: new Set(tracks.flatMap((t) => t.artists.map((a) => a.name)))
          .size,
        stickyArtists: crossPeriodArtists().filter((a) => a.windows >= 2).length,
      },
      affinity,
      durations,
      sticky: crossPeriodArtists(),
      mix,
      artists,
      tracks,
    };
  } catch {
    return null;
  }
}

export async function buildStatsPayload(
  rangeInput?: string,
): Promise<StatsPayload> {
  const range: StatsRange = isStatsRange(rangeInput)
    ? rangeInput
    : "medium_term";
  const live = await fromLive(range);
  return live ?? fromSnapshot(range);
}

export { REFRESH_SECONDS };
