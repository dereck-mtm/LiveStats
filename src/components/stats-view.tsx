import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { TimeRangeTabs } from "@/components/time-range-tabs";
import type { LoadedStats, StatsRange } from "@/lib/load-stats";
import type { PlayHistoryItem, SpotifyArtist, SpotifyTrack } from "@/lib/spotify";

function formatDuration(ms: number) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatPlayedAt(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  }).format(new Date(iso));
}

function topGenresFrom(artists: SpotifyArtist[]) {
  const genreSet = new Map<string, number>();
  for (const artist of artists) {
    for (const genre of artist.genres.slice(0, 3)) {
      genreSet.set(genre, (genreSet.get(genre) || 0) + 1);
    }
  }
  return [...genreSet.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name]) => name);
}

export function StatsView({
  stats,
  range,
  showOwnerLink,
}: {
  stats: LoadedStats;
  range: StatsRange;
  showOwnerLink?: boolean;
}) {
  const displayName = stats.profile.display_name;
  const imageUrl = stats.profile.images[0]?.url;
  const artists = stats.artists;
  const tracks = stats.tracks;
  const recent = stats.recent;
  const topGenres = topGenresFrom(artists);
  const isPublicLive = stats.source === "public-token";

  return (
    <main className="relative min-h-screen overflow-hidden bg-ink">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 80% 0%, rgba(198,242,74,0.16), transparent 60%), radial-gradient(ellipse 40% 50% at 0% 20%, rgba(255,107,74,0.1), transparent 55%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-8 sm:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-fog"
          >
            LiveStats
          </Link>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                stats.mode === "live"
                  ? "bg-lime/15 text-lime"
                  : "bg-white/10 text-mist"
              }`}
            >
              {isPublicLive
                ? "Live from Spotify"
                : stats.source === "owner-session"
                  ? "Owner preview"
                  : "Sample data"}
            </span>
            {showOwnerLink && (
              <Link
                href="/owner"
                className="text-sm text-mist transition hover:text-fog"
              >
                Owner
              </Link>
            )}
          </div>
        </header>

        <section className="mt-12 flex flex-wrap items-end justify-between gap-6">
          <div className="flex items-center gap-4">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt=""
                width={72}
                height={72}
                className="h-[72px] w-[72px] rounded-full object-cover ring-2 ring-lime/40"
                unoptimized
              />
            ) : (
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-ink-soft text-2xl font-bold text-lime">
                {displayName.slice(0, 1)}
              </div>
            )}
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-mist">
                Listening habits
              </p>
              <h1 className="mt-1 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight text-fog sm:text-5xl">
                {displayName}
              </h1>
              <p className="mt-2 max-w-md text-sm text-mist">
                Top artists, tracks, and recent plays from Spotify — built to
                share.
              </p>
            </div>
          </div>
          <Suspense
            fallback={
              <div className="h-10 w-56 animate-pulse rounded-full bg-white/5" />
            }
          >
            <TimeRangeTabs range={range} />
          </Suspense>
        </section>

        {stats.mode === "demo" && !stats.error && (
          <p className="mt-6 rounded-xl border border-lime/25 bg-lime/10 px-4 py-3 text-sm text-fog">
            This is sample data until the owner connects Spotify once.{" "}
            <Link href="/owner" className="font-semibold text-lime underline">
              Connect your account
            </Link>{" "}
            so visitors see your real listening stats.
          </p>
        )}

        {stats.error && (
          <p className="mt-6 rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm">
            {stats.error}
          </p>
        )}

        {topGenres.length > 0 && (
          <p className="mt-8 text-sm text-mist">
            Genre lean:{" "}
            <span className="text-fog">{topGenres.join(" · ")}</span>
          </p>
        )}

        <section className="mt-12 grid gap-12 lg:grid-cols-2">
          <ArtistList artists={artists} />
          <TrackList tracks={tracks} />
        </section>

        <RecentList recent={recent} />
      </div>
    </main>
  );
}

function ArtistList({ artists }: { artists: SpotifyArtist[] }) {
  return (
    <div>
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-fog">
        Top artists
      </h2>
      <ol className="mt-6 space-y-3">
        {artists.map((artist, index) => (
          <li key={artist.id} className="flex items-center gap-4">
            <span className="w-6 text-sm tabular-nums text-mist">{index + 1}</span>
            {artist.images[0]?.url ? (
              <Image
                src={artist.images[0].url}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-soft text-sm font-semibold text-lime">
                {artist.name.slice(0, 1)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <a
                href={artist.external_urls.spotify}
                target="_blank"
                rel="noreferrer"
                className="block truncate font-semibold text-fog transition hover:text-lime"
              >
                {artist.name}
              </a>
              <p className="truncate text-sm text-mist">
                {artist.genres.slice(0, 2).join(", ") || "Artist"}
              </p>
            </div>
            <span className="text-xs tabular-nums text-mist">
              {artist.popularity}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function TrackList({ tracks }: { tracks: SpotifyTrack[] }) {
  return (
    <div>
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-fog">
        Top tracks
      </h2>
      <ol className="mt-6 space-y-3">
        {tracks.map((track, index) => (
          <li key={track.id} className="flex items-center gap-4">
            <span className="w-6 text-sm tabular-nums text-mist">{index + 1}</span>
            {track.album.images[0]?.url ? (
              <Image
                src={track.album.images[0].url}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 rounded object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded bg-ink-soft text-sm font-semibold text-lime">
                {track.name.slice(0, 1)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <a
                href={track.external_urls.spotify}
                target="_blank"
                rel="noreferrer"
                className="block truncate font-semibold text-fog transition hover:text-lime"
              >
                {track.name}
              </a>
              <p className="truncate text-sm text-mist">
                {track.artists.map((a) => a.name).join(", ")}
              </p>
            </div>
            <span className="text-xs tabular-nums text-mist">
              {formatDuration(track.duration_ms)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function RecentList({ recent }: { recent: PlayHistoryItem[] }) {
  return (
    <section className="mt-16">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-fog">
        Recently played
      </h2>
      <ul className="mt-6 divide-y divide-white/10 border-y border-white/10">
        {recent.map((item, index) => (
          <li
            key={`${item.track.id}-${item.played_at}-${index}`}
            className="flex flex-wrap items-center justify-between gap-3 py-4"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-fog">{item.track.name}</p>
              <p className="truncate text-sm text-mist">
                {item.track.artists.map((a) => a.name).join(", ")}
              </p>
            </div>
            <time className="text-sm text-mist" dateTime={item.played_at}>
              {formatPlayedAt(item.played_at)} PT
            </time>
          </li>
        ))}
      </ul>
    </section>
  );
}
