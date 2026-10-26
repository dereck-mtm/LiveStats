"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, useEffectEvent } from "react";
import {
  AffinityBarChart,
  DurationBarChart,
  ExplicitPie,
  MIX_COLORS,
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
  const topArtist = data.artists[0];
  const heroImage =
    topArtist?.images?.[0]?.url ||
    data.tracks[0]?.album?.images?.[0]?.url ||
    avatar;

  return (
    <main className="min-h-screen bg-canvas text-ink">
      {/* Full-bleed Apple Music–style hero */}
      <section className="relative min-h-[100svh] overflow-hidden bg-ink text-white">
        {heroImage ? (
          <div className="absolute inset-0">
            <Image
              src={heroImage}
              alt=""
              fill
              priority
              unoptimized
              className="hero-media object-cover object-center"
              sizes="100vw"
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{ background: "var(--hero-scrim)" }}
            />
            <div
              aria-hidden
              className="absolute inset-0 opacity-40"
              style={{
                background:
                  "radial-gradient(ellipse 80% 60% at 70% 20%, rgba(0,113,227,0.35), transparent 55%)",
              }}
            />
          </div>
        ) : (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% 0%, #2c2c2e, #000)",
            }}
          />
        )}

        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1120px] flex-col px-6 pb-16 pt-7 sm:px-10 sm:pb-20 sm:pt-9">
          <header className="fade-in flex items-center justify-between">
            <p className="text-[15px] font-semibold tracking-[-0.03em]">
              LiveStats
            </p>
            <div className="flex items-center gap-3 text-[13px] text-white/70">
              <span className="inline-flex items-center gap-2">
                <span className="live-dot" />
                {data.source === "live" ? "Live" : "Synced"}
              </span>
              <span className="text-white/35">·</span>
              <span className="tabular-nums text-white/55">
                {updating ? "Updating" : `${mins}:${secs}`}
              </span>
            </div>
          </header>

          <div className="mt-auto max-w-3xl pb-4 pt-24 sm:pt-32">
            <p className="rise text-[13px] font-medium tracking-[0.16em] text-white/55 uppercase">
              {data.profile.display_name}
            </p>
            <h1 className="rise rise-1 mt-3 text-[clamp(3.75rem,14vw,7.5rem)] font-semibold leading-[0.9] tracking-[-0.06em]">
              LiveStats
            </h1>
            <p className="rise rise-2 mt-6 max-w-md text-[18px] leading-snug tracking-[-0.015em] text-white/72 sm:text-[20px]">
              Listening, affinity, and what sticks — {data.profile.display_name}
              &apos;s Spotify, laid out like a product page.
            </p>

            <div className="rise rise-3 mt-10 flex flex-wrap items-center gap-3">
              {avatar ? (
                <Image
                  src={avatar}
                  alt=""
                  width={44}
                  height={44}
                  className="h-11 w-11 rounded-full object-cover ring-2 ring-white/20"
                  unoptimized
                />
              ) : null}
              <div className="glass flex rounded-full p-1">
                {RANGES.map((r) => {
                  const active = range === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => changeRange(r.id)}
                      className={`rounded-full px-4 py-2 text-[13px] font-medium tracking-[-0.01em] transition ${
                        active
                          ? "bg-white text-ink"
                          : "text-white/70 hover:text-white"
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
                className="text-[13px] font-medium text-white/80 underline-offset-4 hover:text-white hover:underline"
              >
                Refresh now
              </button>
            </div>

            <p className="rise rise-4 mt-6 text-[12px] text-white/45">
              {topArtist
                ? `Now leading: ${topArtist.name}`
                : "Waiting on listening data"}{" "}
              · Updated {formatFetchedAt(data.fetchedAt)} PT
            </p>
          </div>
        </div>
      </section>

      {/* Metrics — quiet Apple strip */}
      <section className="border-b border-[var(--hairline)] bg-surface">
        <div className="mx-auto grid max-w-[1120px] grid-cols-2 gap-x-8 gap-y-10 px-6 py-14 sm:grid-cols-4 sm:px-10 sm:py-20">
          {[
            { label: "Artists", value: data.summary.topArtistCount },
            { label: "Tracks", value: data.summary.topTrackCount },
            { label: "Minutes", value: data.summary.topCatalogMinutes },
            { label: "Sticky", value: data.summary.stickyArtists },
          ].map((m, i) => (
            <div key={m.label} className={`rise rise-${Math.min(i + 1, 4)}`}>
              <p className="text-[12px] font-medium tracking-[0.08em] text-tertiary uppercase">
                {m.label}
              </p>
              <p className="mt-2 text-[44px] font-semibold leading-none tracking-[-0.055em] sm:text-[52px]">
                {m.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Charts */}
      <section className="mx-auto max-w-[1120px] px-6 py-20 sm:px-10 sm:py-28">
        <div className="rise mb-16 max-w-xl">
          <h2 className="text-[34px] font-semibold tracking-[-0.045em] sm:text-[44px]">
            The mix
          </h2>
          <p className="mt-3 text-[17px] leading-relaxed text-secondary">
            Rank affinity, catalog shape, and retention across{" "}
            {data.rangeLabel.toLowerCase()} — the signals behind Wrapped,
            readable at a glance.
          </p>
        </div>

        {data.artists.length === 0 ? (
          <div className="rounded-[28px] bg-well px-8 py-16 text-center">
            <p className="text-[17px] font-medium tracking-[-0.02em]">
              No listening data for this window yet
            </p>
            <p className="mt-2 text-[14px] text-secondary">
              Connect live refresh from the owner page, or sync a fresh snapshot.
            </p>
            <Link
              href="/owner"
              className="mt-6 inline-block text-[14px] font-medium text-blue hover:opacity-70"
            >
              Connect Spotify →
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            <figure className="rise rise-1 chart-well rounded-[28px] p-6 sm:p-8">
              <figcaption className="mb-6">
                <h3 className="text-[17px] font-semibold tracking-[-0.02em]">
                  Artist affinity
                </h3>
                <p className="mt-1 text-[13px] text-tertiary">
                  Higher bar = stronger rank
                </p>
              </figcaption>
              <AffinityBarChart data={data.affinity} />
            </figure>

            <figure className="rise rise-2 chart-well rounded-[28px] p-6 sm:p-8">
              <figcaption className="mb-6">
                <h3 className="text-[17px] font-semibold tracking-[-0.02em]">
                  Track length
                </h3>
                <p className="mt-1 text-[13px] text-tertiary">
                  Duration of each top track
                </p>
              </figcaption>
              <DurationBarChart data={data.durations} />
            </figure>

            <figure className="rise rise-3 chart-well rounded-[28px] p-6 sm:p-8">
              <figcaption className="mb-6">
                <h3 className="text-[17px] font-semibold tracking-[-0.02em]">
                  Artists that stick
                </h3>
                <p className="mt-1 text-[13px] text-tertiary">
                  Appearances across time windows
                </p>
              </figcaption>
              <StickyArtistsChart data={data.sticky} />
            </figure>

            <figure className="rise rise-4 chart-well rounded-[28px] p-6 sm:p-8">
              <figcaption className="mb-6">
                <h3 className="text-[17px] font-semibold tracking-[-0.02em]">
                  Explicit vs clean
                </h3>
                <p className="mt-1 text-[13px] text-tertiary">
                  Content flags on top tracks
                </p>
              </figcaption>
              <ExplicitPie data={data.mix} />
              <div className="mt-2 flex justify-center gap-7 text-[13px] text-secondary">
                {data.mix.map((m) => (
                  <span key={m.name} className="inline-flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: MIX_COLORS[m.name] ?? "#86868b" }}
                    />
                    {m.name}
                    <span className="tabular-nums text-ink">{m.value}</span>
                  </span>
                ))}
              </div>
            </figure>
          </div>
        )}
      </section>

      {/* Editorial lists */}
      <section className="border-t border-[var(--hairline)] bg-surface">
        <div className="mx-auto grid max-w-[1120px] gap-16 px-6 py-20 sm:px-10 sm:py-28 lg:grid-cols-2 lg:gap-24">
          <div className="rise rise-1">
            <h2 className="text-[28px] font-semibold tracking-[-0.04em] sm:text-[32px]">
              Top artists
            </h2>
            <ol className="mt-10">
              {data.artists.length === 0 ? (
                <li className="py-4 text-[15px] text-tertiary">No artists yet</li>
              ) : (
                data.artists.map((artist, i) => (
                  <li
                    key={artist.id}
                    className="group flex items-center gap-4 border-b border-[var(--hairline)] py-4 first:pt-0"
                  >
                    <span className="w-7 text-[13px] tabular-nums text-tertiary">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {artist.images?.[0]?.url ? (
                      <Image
                        src={artist.images[0].url}
                        alt=""
                        width={52}
                        height={52}
                        className="h-[52px] w-[52px] rounded-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-well text-sm font-medium">
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
                ))
              )}
            </ol>
          </div>

          <div className="rise rise-2">
            <h2 className="text-[28px] font-semibold tracking-[-0.04em] sm:text-[32px]">
              Top tracks
            </h2>
            <ol className="mt-10">
              {data.tracks.length === 0 ? (
                <li className="py-4 text-[15px] text-tertiary">No tracks yet</li>
              ) : (
                data.tracks.map((track, i) => (
                  <li
                    key={track.id}
                    className="group flex items-center gap-4 border-b border-[var(--hairline)] py-4 first:pt-0"
                  >
                    <span className="w-7 text-[13px] tabular-nums text-tertiary">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {track.album?.images?.[0]?.url ? (
                      <Image
                        src={track.album.images[0].url}
                        alt=""
                        width={52}
                        height={52}
                        className="h-[52px] w-[52px] rounded-[12px] object-cover transition duration-500 group-hover:scale-[1.03]"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[12px] bg-well text-sm font-medium">
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
                ))
              )}
            </ol>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-3 px-6 py-12 text-[13px] text-tertiary sm:px-10">
        <p>Personal Spotify analytics · portfolio</p>
        <Link href="/owner" className="font-medium text-blue hover:opacity-70">
          Connect live refresh
        </Link>
      </footer>
    </main>
  );
}
