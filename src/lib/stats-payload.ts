import {
  crossPeriodArtists,
  getRangeBundle,
  getSnapshotMeta,
  getSnapshotRecent,
  RANGE_LABEL,
  summaryStats,
} from "@/lib/analytics";
import {
  buildListeningClock,
  buildRepeats,
  buildSessions,
  type RecentPlay,
} from "@/lib/listening-insights";
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
  summary: {
    topArtistCount: number;
    topTrackCount: number;
    alwaysOnCount: number;
    sessionCount: number;
    peakHourLabel: string | null;
  };
  /** Artists that appear across multiple time windows — "always in rotation". */
  alwaysOn: ReturnType<typeof crossPeriodArtists>;
  artists: ReturnType<typeof getRangeBundle>["artists"];
  tracks: ReturnType<typeof getRangeBundle>["tracks"];
  sessions: ReturnType<typeof buildSessions>;
  clock: ReturnType<typeof buildListeningClock>;
  repeats: ReturnType<typeof buildRepeats>;
};

const REFRESH_SECONDS = 600;

function normalizeRecent(
  items: {
    played_at?: string;
    track?: RecentPlay["track"] | null;
  }[],
): RecentPlay[] {
  return items
    .filter((i): i is RecentPlay => Boolean(i?.played_at && i?.track?.id))
    .map((i) => ({
      played_at: i.played_at,
      track: {
        id: i.track.id,
        name: i.track.name,
        duration_ms: i.track.duration_ms ?? 0,
        artists: i.track.artists || [],
        album: i.track.album,
        external_urls: i.track.external_urls,
      },
    }));
}

function buildInsights(recent: RecentPlay[]) {
  const sessions = buildSessions(recent);
  const clock = buildListeningClock(recent);
  const repeats = buildRepeats(recent);
  return { sessions, clock, repeats };
}

function fromSnapshot(range: StatsRange): StatsPayload {
  const meta = getSnapshotMeta();
  const bundle = getRangeBundle(range);
  const alwaysOn = crossPeriodArtists();
  const recent = normalizeRecent(getSnapshotRecent());
  const insights = buildInsights(recent);
  const base = summaryStats(range);

  return {
    range,
    rangeLabel: RANGE_LABEL[range],
    source: "snapshot",
    fetchedAt: meta.fetchedAt,
    nextRefreshSec: REFRESH_SECONDS,
    profile: meta.profile,
    summary: {
      topArtistCount: base.topArtistCount,
      topTrackCount: base.topTrackCount,
      alwaysOnCount: alwaysOn.filter((a) => a.windows >= 2).length,
      sessionCount: insights.sessions.length,
      peakHourLabel: insights.clock.peakLabel,
    },
    alwaysOn,
    artists: bundle.artists,
    tracks: bundle.tracks,
    ...insights,
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
    const [profile, artistsRes, tracksRes, recentRes] = await Promise.all([
      getProfile(token),
      getTopArtists(token, range),
      getTopTracks(token, range),
      getRecentlyPlayed(token).catch(() => ({ items: [] as Awaited<
        ReturnType<typeof getRecentlyPlayed>
      >["items"] })),
    ]);

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

    const recent = normalizeRecent(recentRes.items || []);
    const insights = buildInsights(recent);
    const alwaysOn = crossPeriodArtists();

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
        alwaysOnCount: alwaysOn.filter((a) => a.windows >= 2).length,
        sessionCount: insights.sessions.length,
        peakHourLabel: insights.clock.peakLabel,
      },
      alwaysOn,
      artists,
      tracks,
      ...insights,
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
