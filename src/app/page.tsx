import Image from "next/image";
import Link from "next/link";
import {
  AffinityBarChart,
  DurationBarChart,
  ExplicitPie,
  StickyArtistsChart,
} from "@/components/charts";
import { RangeNav } from "@/components/range-nav";
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

export const dynamic = "force-dynamic";

function formatFetchedAt(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Los_Angeles",
  }).format(new Date(iso));
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range: StatsRange = isStatsRange(params.range)
    ? params.range
    : "medium_term";

  const meta = getSnapshotMeta();
  const bundle = getRangeBundle(range);
  const summary = summaryStats(range);
  const affinity = artistAffinityChart(range);
  const durations = trackDurationChart(range);
  const sticky = crossPeriodArtists();
  const mix = explicitMix(range);
  const avatar = meta.profile.images[0]?.url;

  return (
    <main className="relative min-h-screen overflow-hidden bg-ink text-fog">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[380px]"
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 85% 0%, rgba(198,242,74,0.18), transparent 55%), radial-gradient(ellipse 45% 50% at 0% 10%, rgba(61,214,198,0.12), transparent 50%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-8 sm:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
              LiveStats
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-mist">
              Personal listening analytics
            </p>
          </div>
          <RangeNav current={range} />
        </header>

        <section className="mt-12 flex flex-wrap items-end gap-6">
          {avatar ? (
            <Image
              src={avatar}
              alt=""
              width={88}
              height={88}
              className="h-[88px] w-[88px] rounded-full object-cover ring-2 ring-lime/40"
              unoptimized
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight sm:text-5xl">
              {meta.profile.display_name}
            </h1>
            <p className="mt-2 max-w-2xl text-mist">
              Portfolio dashboard of my Spotify listening — affinity rankings,
              catalog shape, and artists that stick across time windows.
            </p>
            <p className="mt-2 text-xs text-mist">
              Data snapshot · {formatFetchedAt(meta.fetchedAt)} PT ·{" "}
              {RANGE_LABEL[range]}
            </p>
          </div>
        </section>

        <section className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Top artists", value: summary.topArtistCount },
            { label: "Top tracks", value: summary.topTrackCount },
            {
              label: "Top-track minutes",
              value: summary.topCatalogMinutes,
            },
            {
              label: "Sticky artists",
              value: summary.stickyArtists,
              hint: "in 2+ windows",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="border-b border-white/10 pb-3 pt-1"
            >
              <p className="text-xs uppercase tracking-[0.16em] text-mist">
                {card.label}
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold text-lime">
                {card.value}
              </p>
              {card.hint ? (
                <p className="text-xs text-mist">{card.hint}</p>
              ) : null}
            </div>
          ))}
        </section>

        <section className="mt-14 grid gap-10 lg:grid-cols-2">
          <figure>
            <figcaption className="mb-3">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
                Artist affinity
              </h2>
              <p className="text-sm text-mist">
                Rank-based score from Spotify top artists ({RANGE_LABEL[range]}
                ).
              </p>
            </figcaption>
            <AffinityBarChart data={affinity} />
          </figure>

          <figure>
            <figcaption className="mb-3">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
                Track length mix
              </h2>
              <p className="text-sm text-mist">
                Duration of each top track in minutes.
              </p>
            </figcaption>
            <DurationBarChart data={durations} />
          </figure>

          <figure>
            <figcaption className="mb-3">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
                Artists that stick
              </h2>
              <p className="text-sm text-mist">
                How many time windows (4 weeks / 6 months / all time) each
                artist appears in.
              </p>
            </figcaption>
            <StickyArtistsChart data={sticky} />
          </figure>

          <figure>
            <figcaption className="mb-3">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
                Explicit vs clean
              </h2>
              <p className="text-sm text-mist">
                Content flag split across the current top tracks.
              </p>
            </figcaption>
            <ExplicitPie data={mix} />
          </figure>
        </section>

        <section className="mt-16 grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
              Top artists
            </h2>
            <ol className="mt-5 space-y-3">
              {bundle.artists.map((artist, i) => (
                <li key={artist.id} className="flex items-center gap-3">
                  <span className="w-5 text-sm tabular-nums text-mist">
                    {i + 1}
                  </span>
                  {artist.images?.[0]?.url ? (
                    <Image
                      src={artist.images[0].url}
                      alt=""
                      width={44}
                      height={44}
                      className="h-11 w-11 rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-soft text-lime">
                      {artist.name.slice(0, 1)}
                    </div>
                  )}
                  <a
                    href={artist.external_urls?.spotify}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate font-semibold hover:text-lime"
                  >
                    {artist.name}
                  </a>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
              Top tracks
            </h2>
            <ol className="mt-5 space-y-3">
              {bundle.tracks.map((track, i) => (
                <li key={track.id} className="flex items-center gap-3">
                  <span className="w-5 text-sm tabular-nums text-mist">
                    {i + 1}
                  </span>
                  {track.album?.images?.[0]?.url ? (
                    <Image
                      src={track.album.images[0].url}
                      alt=""
                      width={44}
                      height={44}
                      className="h-11 w-11 rounded object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded bg-ink-soft text-lime">
                      {track.name.slice(0, 1)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <a
                      href={track.external_urls?.spotify}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate font-semibold hover:text-lime"
                    >
                      {track.name}
                    </a>
                    <p className="truncate text-sm text-mist">
                      {track.artists.map((a) => a.name).join(", ")}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <footer className="mt-16 border-t border-white/10 pt-6 text-sm text-mist">
          <p>
            Built as a data portfolio piece — Spotify Web API tops transformed
            into exploratory charts.{" "}
            <Link href="/owner" className="text-lime underline">
              Refresh data
            </Link>
          </p>
        </footer>
      </div>
    </main>
  );
}
