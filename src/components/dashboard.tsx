"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, useEffectEvent } from "react";
import {
  AffinityBarChart,
  DurationBarChart,
  ExplicitPie,
  StickyArtistsChart,
} from "@/components/charts";
import type { StatsPayload } from "@/lib/stats-payload";

const RANGES = [
  { id: "short_term", label: "4 weeks" },
  { id: "medium_term", label: "6 months" },
  { id: "long_term", label: "All time" },
] as const;

function formatFetchedAt(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  }).format(new Date(iso));
}

export function Dashboard({ initial }: { initial: StatsPayload }) {
  const [data, setData] = useState(initial);
  const [range, setRange] = useState(initial.range);
  const [updating, setUpdating] = useState(false);
  const [countdown, setCountdown] = useState(initial.nextRefreshSec);

  const load = useCallback(async (nextRange: string, soft = false) => {
    if (!soft) setUpdating(true);
    try {
      const res = await fetch(`/api/stats?range=${nextRange}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const json = (await res.json()) as StatsPayload;
      setData(json);
      setCountdown(json.nextRefreshSec);
    } finally {
      setUpdating(false);
    }
  }, []);

  const onTickRefresh = useEffectEvent(() => {
    void load(range, true);
  });

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          onTickRefresh();
          return data.nextRefreshSec;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [data.nextRefreshSec, range]);

  useEffect(() => {
    setData(initial);
    setRange(initial.range);
    setCountdown(initial.nextRefreshSec);
  }, [initial]);

  async function changeRange(id: string) {
    setRange(id as StatsPayload["range"]);
    await load(id);
  }

  const avatar = data.profile.images[0]?.url;
  const mins = Math.floor(countdown / 60);
  const secs = String(countdown % 60).padStart(2, "0");
  const topArtist = data.artists[0]?.name ?? "—";

  return (
    <main className="min-h-screen bg-canvas text-ink">
      {/* Hero — one composition */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 70% at 50% -20%, rgba(0,113,227,0.09), transparent 60%), radial-gradient(ellipse 50% 40% at 100% 0%, rgba(0,0,0,0.03), transparent 50%)",
          }}
        />
        <div className="relative mx-auto max-w-[1120px] px-6 pb-16 pt-8 sm:px-10 sm:pb-24 sm:pt-10">
          <header className="rise flex items-center justify-between">
            <p className="text-[15px] font-semibold tracking-[-0.02em]">
              LiveStats
            </p>
            <div className="flex items-center gap-3 text-[13px] text-secondary">
              <span className="inline-flex items-center gap-2">
                <span className="live-dot" />
                {data.source === "live" ? "Live" : "Synced"}
              </span>
              <span className="text-tertiary">·</span>
              <span className="tabular-nums">
                {updating ? "Updating" : `${mins}:${secs}`}
              </span>
            </div>
          </header>

          <div className="rise rise-1 mt-20 sm:mt-28">
            <p className="text-[13px] font-medium tracking-[0.14em] text-tertiary uppercase">
              Listening analytics
            </p>
            <h1 className="mt-4 max-w-[11ch] text-[clamp(3.5rem,10vw,6.5rem)] font-semibold leading-[0.92] tracking-[-0.055em] text-ink">
              LiveStats
            </h1>
            <p className="mt-6 max-w-md text-[19px] leading-snug tracking-[-0.02em] text-secondary">
              {data.profile.display_name}&apos;s Spotify habits, visualized —
              affinity, shape, and what sticks.
            </p>
          </div>

          <div className="rise rise-2 mt-12 flex flex-wrap items-center gap-4">
            {avatar ? (
              <Image
                src={avatar}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover"
                unoptimized
              />
            ) : null}
            <div className="flex rounded-full bg-well p-1">
              {RANGES.map((r) => {
                const active = range === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => changeRange(r.id)}
                    className={`rounded-full px-4 py-2 text-[13px] font-medium tracking-[-0.01em] transition ${
                      active
                        ? "bg-ink text-white shadow-sm"
                        : "text-secondary hover:text-ink"
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => load(range)}
              className="text-[13px] font-medium text-blue hover:opacity-70"
            >
              Refresh now
            </button>
          </div>

          <p className="rise rise-3 mt-6 text-[12px] text-tertiary">
            Top right now: {topArtist} · Updated {formatFetchedAt(data.fetchedAt)}{" "}
            PT
          </p>
        </div>
      </section>

      {/* Metrics strip — no boxes */}
      <section className="border-y border-[var(--hairline)] bg-surface">
        <div className="rise rise-2 mx-auto grid max-w-[1120px] grid-cols-2 gap-8 px-6 py-12 sm:grid-cols-4 sm:px-10 sm:py-16">
          {[
            { label: "Artists", value: data.summary.topArtistCount },
            { label: "Tracks", value: data.summary.topTrackCount },
            { label: "Minutes", value: data.summary.topCatalogMinutes },
            { label: "Sticky", value: data.summary.stickyArtists },
          ].map((m) => (
            <div key={m.label}>
              <p className="text-[12px] font-medium tracking-[0.06em] text-tertiary uppercase">
                {m.label}
              </p>
              <p className="mt-2 text-[40px] font-semibold leading-none tracking-[-0.05em] sm:text-[48px]">
                {m.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Charts */}
      <section className="mx-auto max-w-[1120px] px-6 py-16 sm:px-10 sm:py-24">
        <div className="rise rise-2 mb-14 max-w-xl">
          <h2 className="text-[32px] font-semibold tracking-[-0.04em] sm:text-[40px]">
            Explore the mix
          </h2>
          <p className="mt-3 text-[17px] leading-relaxed text-secondary">
            Rank-based affinity and catalog shape from Spotify top items — the
            same signals behind Wrapped, laid out for analysis.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <figure className="rise rise-2 rounded-[28px] bg-well p-6 sm:p-8">
            <figcaption className="mb-6">
              <h3 className="text-[17px] font-semibold tracking-[-0.02em]">
                Artist affinity
              </h3>
              <p className="mt-1 text-[13px] text-tertiary">
                Higher bar = stronger rank in {data.rangeLabel.toLowerCase()}
              </p>
            </figcaption>
            <AffinityBarChart data={data.affinity} />
          </figure>

          <figure className="rise rise-3 rounded-[28px] bg-well p-6 sm:p-8">
            <figcaption className="mb-6">
              <h3 className="text-[17px] font-semibold tracking-[-0.02em]">
                Track length
              </h3>
              <p className="mt-1 text-[13px] text-tertiary">
                Duration of each top track (minutes)
              </p>
            </figcaption>
            <DurationBarChart data={data.durations} />
          </figure>

          <figure className="rise rise-3 rounded-[28px] bg-well p-6 sm:p-8">
            <figcaption className="mb-6">
              <h3 className="text-[17px] font-semibold tracking-[-0.02em]">
                Artists that stick
              </h3>
              <p className="mt-1 text-[13px] text-tertiary">
                How many time windows each artist appears in
              </p>
            </figcaption>
            <StickyArtistsChart data={data.sticky} />
          </figure>

          <figure className="rise rise-4 rounded-[28px] bg-well p-6 sm:p-8">
            <figcaption className="mb-6">
              <h3 className="text-[17px] font-semibold tracking-[-0.02em]">
                Explicit vs clean
              </h3>
              <p className="mt-1 text-[13px] text-tertiary">
                Content flags across current top tracks
              </p>
            </figcaption>
            <ExplicitPie data={data.mix} />
            <div className="mt-1 flex justify-center gap-6 text-[12px] text-tertiary">
              {data.mix.map((m) => (
                <span key={m.name}>
                  {m.name} {m.value}
                </span>
              ))}
            </div>
          </figure>
        </div>
      </section>

      {/* Ranked lists — editorial */}
      <section className="border-t border-[var(--hairline)] bg-surface">
        <div className="mx-auto grid max-w-[1120px] gap-16 px-6 py-16 sm:px-10 sm:py-24 lg:grid-cols-2 lg:gap-20">
          <div className="rise rise-2">
            <h2 className="text-[28px] font-semibold tracking-[-0.035em]">
              Top artists
            </h2>
            <ol className="mt-8">
              {data.artists.map((artist, i) => (
                <li
                  key={artist.id}
                  className="flex items-center gap-4 border-b border-[var(--hairline)] py-4 first:pt-0"
                >
                  <span className="w-6 text-[13px] tabular-nums text-tertiary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {artist.images?.[0]?.url ? (
                    <Image
                      src={artist.images[0].url}
                      alt=""
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-well text-sm font-medium">
                      {artist.name.slice(0, 1)}
                    </div>
                  )}
                  <a
                    href={artist.external_urls?.spotify}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-[17px] font-medium tracking-[-0.02em] transition hover:text-blue"
                  >
                    {artist.name}
                  </a>
                </li>
              ))}
            </ol>
          </div>

          <div className="rise rise-3">
            <h2 className="text-[28px] font-semibold tracking-[-0.035em]">
              Top tracks
            </h2>
            <ol className="mt-8">
              {data.tracks.map((track, i) => (
                <li
                  key={track.id}
                  className="flex items-center gap-4 border-b border-[var(--hairline)] py-4 first:pt-0"
                >
                  <span className="w-6 text-[13px] tabular-nums text-tertiary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {track.album?.images?.[0]?.url ? (
                    <Image
                      src={track.album.images[0].url}
                      alt=""
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-[10px] object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-well text-sm font-medium">
                      {track.name.slice(0, 1)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <a
                      href={track.external_urls?.spotify}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-[17px] font-medium tracking-[-0.02em] transition hover:text-blue"
                    >
                      {track.name}
                    </a>
                    <p className="truncate text-[13px] text-tertiary">
                      {track.artists.map((a) => a.name).join(", ")}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-3 px-6 py-10 text-[13px] text-tertiary sm:px-10">
        <p>Personal Spotify analytics · portfolio project</p>
        <Link href="/owner" className="font-medium text-blue hover:opacity-70">
          Connect live refresh
        </Link>
      </footer>
    </main>
  );
}
