import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { TimeRangeTabs } from "@/components/time-range-tabs";
import { demoArtists, demoProfile, demoRecent, demoTracks } from "@/lib/demo-data";
import { getSession, setSession } from "@/lib/session";
import {
  ensureFreshSession,
  getRecentlyPlayed,
  getTopArtists,
  getTopTracks,
  type PlayHistoryItem,
  type SpotifyArtist,
  type SpotifyTrack,
} from "@/lib/spotify";

type Range = "short_term" | "medium_term" | "long_term";

function isRange(value: string | undefined): value is Range {
  return (
    value === "short_term" ||
    value === "medium_term" ||
    value === "long_term"
  );
}

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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; demo?: string }>;
}) {
  const params = await searchParams;
  const range: Range = isRange(params.range) ? params.range : "medium_term";
  const forceDemo = params.demo === "1";

  let mode: "live" | "demo" = "demo";
  let displayName = demoProfile.display_name;
  let imageUrl: string | undefined = demoProfile.images[0]?.url;
  let artists: SpotifyArtist[] = demoArtists;
  let tracks: SpotifyTrack[] = demoTracks;
  let recent: PlayHistoryItem[] = demoRecent;
  let error: string | null = null;

  if (!forceDemo) {
    const session = await getSession();
    if (session) {
      try {
        const fresh = await ensureFreshSession(session);
        if (fresh.accessToken !== session.accessToken) {
          await setSession(fresh);
        }
        const [topArtists, topTracks, recently] = await Promise.all([
          getTopArtists(fresh.accessToken, range),
          getTopTracks(fresh.accessToken, range),
          getRecentlyPlayed(fresh.accessToken),
        ]);
        mode = "live";
        displayName = fresh.displayName;
        imageUrl = fresh.imageUrl;
        artists = topArtists.items;
        tracks = topTracks.items;
        recent = recently.items;
      } catch (e) {
        error = e instanceof Error ? e.message : "Failed to load Spotify data";
      }
    }
  }

  const genreSet = new Map<string, number>();
  for (const artist of artists) {
    for (const genre of artist.genres.slice(0, 3)) {
      genreSet.set(genre, (genreSet.get(genre) || 0) + 1);
    }
  }
  const topGenres = [...genreSet.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name]) => name);

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
                mode === "live"
                  ? "bg-lime/15 text-lime"
                  : "bg-white/10 text-mist"
              }`}
            >
              {mode === "live" ? "Live Spotify" : "Demo data"}
            </span>
            {mode === "live" ? (
              <a
                href="/api/auth/logout"
                className="text-sm text-mist transition hover:text-fog"
              >
                Sign out
              </a>
            ) : (
              <a
                href="/api/auth/login"
                className="rounded-full bg-lime px-4 py-2 text-sm font-semibold text-ink transition hover:bg-lime-deep"
              >
                Connect Spotify
              </a>
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
                Listening pulse
              </p>
              <h1 className="mt-1 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight text-fog sm:text-5xl">
                {displayName}
              </h1>
            </div>
          </div>
          <Suspense
            fallback={
              <div className="h-10 w-56 animate-pulse rounded-full bg-white/5" />
            }
          >
            <TimeRangeTabs demo={mode === "demo"} />
          </Suspense>
        </section>

        {error && (
          <p className="mt-6 rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm">
            {error}
          </p>
        )}

        {topGenres.length > 0 && (
          <p className="mt-8 text-sm text-mist">
            Genre lean:{" "}
            <span className="text-fog">{topGenres.join(" · ")}</span>
          </p>
        )}

        <section className="mt-12 grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-fog">
              Top artists
            </h2>
            <ol className="mt-6 space-y-3">
              {artists.map((artist, index) => (
                <li key={artist.id} className="flex items-center gap-4">
                  <span className="w-6 text-sm tabular-nums text-mist">
                    {index + 1}
                  </span>
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

          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-fog">
              Top tracks
            </h2>
            <ol className="mt-6 space-y-3">
              {tracks.map((track, index) => (
                <li key={track.id} className="flex items-center gap-4">
                  <span className="w-6 text-sm tabular-nums text-mist">
                    {index + 1}
                  </span>
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
        </section>

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
                  <p className="truncate font-semibold text-fog">
                    {item.track.name}
                  </p>
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
      </div>
    </main>
  );
}
