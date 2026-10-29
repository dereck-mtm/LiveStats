export type RecentPlay = {
  played_at: string;
  track: {
    id: string;
    name: string;
    duration_ms: number;
    artists: { name: string }[];
    album?: { images?: { url: string }[] };
    external_urls?: { spotify?: string };
  };
};

export type ListeningSession = {
  id: string;
  startedAt: string;
  endedAt: string;
  minutes: number;
  trackCount: number;
  headline: string;
  artists: string[];
};

export type HourHabit = {
  hour: number;
  label: string;
  count: number;
};

export type RepeatTrack = {
  id: string;
  name: string;
  artists: string;
  plays: number;
  imageUrl?: string;
  spotifyUrl?: string;
};

const TZ = "America/Los_Angeles";
const SESSION_GAP_MS = 30 * 60 * 1000;

function hourInTz(iso: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: false,
    timeZone: TZ,
  }).formatToParts(new Date(iso));
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  return hour === 24 ? 0 : hour;
}

function formatHourLabel(hour: number) {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: true,
  }).format(d);
}

/** Cluster recently-played items into sessions (gap > 30 min = new session). */
export function buildSessions(recent: RecentPlay[]): ListeningSession[] {
  if (!recent.length) return [];

  const sorted = [...recent].sort(
    (a, b) => +new Date(a.played_at) - +new Date(b.played_at),
  );

  const groups: RecentPlay[][] = [];
  let current: RecentPlay[] = [];

  for (const item of sorted) {
    if (!current.length) {
      current = [item];
      continue;
    }
    const prev = current[current.length - 1];
    const gap =
      +new Date(item.played_at) -
      (+new Date(prev.played_at) + (prev.track.duration_ms || 0));
    if (gap > SESSION_GAP_MS) {
      groups.push(current);
      current = [item];
    } else {
      current.push(item);
    }
  }
  if (current.length) groups.push(current);

  return groups
    .map((group, i) => {
      const startedAt = group[0].played_at;
      const last = group[group.length - 1];
      const endedAt = new Date(
        +new Date(last.played_at) + (last.track.duration_ms || 0),
      ).toISOString();
      const minutes = Math.max(
        1,
        Math.round(
          group.reduce((s, g) => s + (g.track.duration_ms || 0), 0) / 60000,
        ),
      );
      const artistCounts = new Map<string, number>();
      for (const g of group) {
        for (const a of g.track.artists) {
          artistCounts.set(a.name, (artistCounts.get(a.name) || 0) + 1);
        }
      }
      const artists = [...artistCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([name]) => name)
        .slice(0, 3);
      const headline =
        artists.length === 0
          ? "Listening session"
          : artists.length === 1
            ? `Mostly ${artists[0]}`
            : `${artists[0]} + ${artists[1]}`;

      return {
        id: `session-${i}-${startedAt}`,
        startedAt,
        endedAt,
        minutes,
        trackCount: group.length,
        headline,
        artists,
      };
    })
    .reverse()
    .slice(0, 8);
}

/** Plays by hour-of-day (PT). */
export function buildListeningClock(recent: RecentPlay[]): {
  hours: HourHabit[];
  peakLabel: string | null;
  peakCount: number;
} {
  const counts = Array.from({ length: 24 }, () => 0);
  for (const item of recent) {
    counts[hourInTz(item.played_at)] += 1;
  }
  const hours = counts.map((count, hour) => ({
    hour,
    label: formatHourLabel(hour),
    count,
  }));
  const peak = hours.reduce(
    (best, h) => (h.count > best.count ? h : best),
    hours[0],
  );
  return {
    hours,
    peakLabel: peak.count > 0 ? peak.label : null,
    peakCount: peak.count,
  };
}

/** Tracks that show up more than once in recently played. */
export function buildRepeats(recent: RecentPlay[]): RepeatTrack[] {
  const map = new Map<
    string,
    {
      id: string;
      name: string;
      artists: string;
      plays: number;
      imageUrl?: string;
      spotifyUrl?: string;
    }
  >();

  for (const item of recent) {
    const t = item.track;
    if (!t?.id) continue;
    const cur = map.get(t.id) || {
      id: t.id,
      name: t.name,
      artists: t.artists.map((a) => a.name).join(", "),
      plays: 0,
      imageUrl: t.album?.images?.[0]?.url,
      spotifyUrl: t.external_urls?.spotify,
    };
    cur.plays += 1;
    map.set(t.id, cur);
  }

  return [...map.values()]
    .filter((t) => t.plays >= 2)
    .sort((a, b) => b.plays - a.plays || a.name.localeCompare(b.name))
    .slice(0, 8);
}

export function formatSessionWhen(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(iso));
}
