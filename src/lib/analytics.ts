import { publicStats } from "@/data/public-stats";
import type { StatsRange } from "./load-stats";

type Artist = {
  id: string;
  name: string;
  images?: { url: string; height?: number | null; width?: number | null }[];
  external_urls?: { spotify: string };
  genres?: string[];
  popularity?: number;
};

type Track = {
  id: string;
  name: string;
  duration_ms: number;
  explicit?: boolean;
  popularity?: number;
  artists: { name: string }[];
  album?: {
    name: string;
    images?: { url: string; height?: number | null; width?: number | null }[];
    release_date?: string;
  };
  external_urls?: { spotify: string };
};

type Snapshot = {
  fetchedAt: string;
  profile: {
    id?: string;
    display_name: string;
    images: { url: string; height?: number | null; width?: number | null }[];
  };
  short_term: { artists: Artist[]; tracks: Track[] };
  medium_term: { artists: Artist[]; tracks: Track[] };
  long_term: { artists: Artist[]; tracks: Track[] };
  recent: unknown[];
};

const snap = publicStats as unknown as Snapshot;

export function getSnapshotMeta() {
  return {
    fetchedAt: snap.fetchedAt,
    profile: snap.profile,
  };
}

export function getRangeBundle(range: StatsRange) {
  const bucket = snap[range];
  return {
    artists: bucket?.artists ?? [],
    tracks: bucket?.tracks ?? [],
  };
}

/** Affinity score from list rank (1st = 10 … 10th = 1). */
export function affinityFromRank(index: number, size = 10) {
  return Math.max(size - index, 1);
}

export function artistAffinityChart(range: StatsRange) {
  const artists = getRangeBundle(range).artists;
  return artists.map((a, i) => ({
    name: a.name.length > 14 ? a.name.slice(0, 13) + "…" : a.name,
    fullName: a.name,
    affinity: affinityFromRank(i, artists.length),
    rank: i + 1,
  }));
}

export function trackDurationChart(range: StatsRange) {
  const tracks = getRangeBundle(range).tracks;
  return tracks.map((t, i) => ({
    name: t.name.length > 18 ? t.name.slice(0, 17) + "…" : t.name,
    fullName: t.name,
    minutes: Math.round((t.duration_ms / 60000) * 10) / 10,
    rank: i + 1,
  }));
}

export function explicitMix(range: StatsRange) {
  const tracks = getRangeBundle(range).tracks;
  const explicit = tracks.filter((t) => t.explicit).length;
  const clean = tracks.length - explicit;
  return [
    { name: "Explicit", value: explicit },
    { name: "Clean", value: clean },
  ].filter((d) => d.value > 0);
}

/** Artists appearing in multiple time windows — retention signal. */
export function crossPeriodArtists() {
  const windows: StatsRange[] = ["short_term", "medium_term", "long_term"];
  const map = new Map<
    string,
    { name: string; windows: string[]; bestRank: number }
  >();

  for (const w of windows) {
    getRangeBundle(w).artists.forEach((a, i) => {
      const cur = map.get(a.id) || {
        name: a.name,
        windows: [],
        bestRank: i + 1,
      };
      cur.windows.push(w);
      cur.bestRank = Math.min(cur.bestRank, i + 1);
      map.set(a.id, cur);
    });
  }

  return [...map.values()]
    .map((a) => ({
      name: a.name.length > 14 ? a.name.slice(0, 13) + "…" : a.name,
      fullName: a.name,
      windows: a.windows.length,
      bestRank: a.bestRank,
      labels: a.windows
        .map((w) =>
          w === "short_term" ? "4w" : w === "medium_term" ? "6m" : "all",
        )
        .join("+"),
    }))
    .sort((a, b) => b.windows - a.windows || a.bestRank - b.bestRank);
}

export function summaryStats(range: StatsRange) {
  const { artists, tracks } = getRangeBundle(range);
  const totalMin = Math.round(
    tracks.reduce((s, t) => s + t.duration_ms, 0) / 60000,
  );
  const uniqueArtistsOnTracks = new Set(
    tracks.flatMap((t) => t.artists.map((a) => a.name)),
  ).size;
  const multiWindow = crossPeriodArtists().filter((a) => a.windows >= 2).length;

  return {
    topArtistCount: artists.length,
    topTrackCount: tracks.length,
    topCatalogMinutes: totalMin,
    trackArtistSpread: uniqueArtistsOnTracks,
    stickyArtists: multiWindow,
  };
}

export const RANGE_LABEL: Record<StatsRange, string> = {
  short_term: "Last 4 weeks",
  medium_term: "Last 6 months",
  long_term: "All time",
};
