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
    dateStyle: "medium",
    timeStyle: "short",
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

  return (
    <main className="relative min-h-screen">
      <div className="mx-auto max-w-6xl px-5 pb-20 pt-7 sm:px-8">
        <header className="fade-up flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-[family-name:var(--font-display)] text-[1.35rem] font-semibold tracking-[-0.03em] text-ink">
              LiveStats
            </p>
            <p className="text-[0.8rem] text-muted">Listening analytics</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-full border border-black/8 bg-white p-1 shadow-[var(--shadow)]">
              {RANGES.map((r) => {
                const active = range === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => changeRange(r.id)}
                    className={`rounded-full px-3.5 py-1.5 text-[0.8125rem] font-medium transition ${
                      active
                        ? "bg-ink text-white"
                        : "text-muted hover:text-ink"
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
              className="rounded-full border border-black/8 bg-white px-3.5 py-2 text-[0.8125rem] font-medium text-ink shadow-[var(--shadow)] transition hover:shadow-[var(--shadow-hover)]"
            >
              {updating ? "Updating…" : "Refresh"}
            </button>
          </div>
        </header>

        <section className="fade-up fade-up-1 mt-12 flex flex-wrap items-center gap-5">
          {avatar ? (
            <Image
              src={avatar}
              alt=""
              width={84}
              height={84}
              className="h-[84px] w-[84px] rounded-full object-cover shadow-[var(--shadow)] ring-1 ring-black/5"
              unoptimized
            />
          ) : null}
          <div className="min-w-0">
            <p className="text-[0.75rem] font-medium uppercase tracking-[0.16em] text-muted">
              Portfolio dashboard
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.04em] text-ink sm:text-[3.25rem]">
              {data.profile.display_name}
            </h1>
            <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-ink-soft">
              Spotify listening habits as exploratory analytics — affinity,
              catalog shape, and artists that persist across time.
            </p>
            <p className="mt-3 text-[0.78rem] text-muted">
              {data.source === "live" ? "Live Spotify" : "Snapshot"} ·{" "}
              {formatFetchedAt(data.fetchedAt)} PT · next auto-refresh in {mins}:
              {secs}
            </p>
          </div>
        </section>

        <section className="fade-up fade-up-2 mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Top artists", value: data.summary.topArtistCount },
            { label: "Top tracks", value: data.summary.topTrackCount },
            {
              label: "Top-track minutes",
              value: data.summary.topCatalogMinutes,
            },
            {
              label: "Sticky artists",
              value: data.summary.stickyArtists,
              hint: "appear in 2+ windows",
            },
          ].map((card) => (
            <div key={card.label} className="kpi">
              <p className="kpi-label">{card.label}</p>
              <p className="kpi-value">{card.value}</p>
              {card.hint ? (
                <p className="mt-1 text-[0.72rem] text-muted">{card.hint}</p>
              ) : null}
            </div>
          ))}
        </section>

        <section className="fade-up fade-up-3 mt-6 grid gap-4 lg:grid-cols-2">
          <figure className="panel p-5 sm:p-6">
            <figcaption className="mb-4">
              <h2 className="panel-title">Artist affinity</h2>
              <p className="panel-sub">
                Rank-derived affinity from Spotify top artists · {data.rangeLabel}
              </p>
            </figcaption>
            <AffinityBarChart data={data.affinity} />
          </figure>

          <figure className="panel p-5 sm:p-6">
            <figcaption className="mb-4">
              <h2 className="panel-title">Track length distribution</h2>
              <p className="panel-sub">
                Duration of each top track in minutes
              </p>
            </figcaption>
            <DurationBarChart data={data.durations} />
          </figure>

          <figure className="panel p-5 sm:p-6">
            <figcaption className="mb-4">
              <h2 className="panel-title">Artists that stick</h2>
              <p className="panel-sub">
                Presence across 4-week, 6-month, and all-time windows
              </p>
            </figcaption>
            <StickyArtistsChart data={data.sticky} />
          </figure>

          <figure className="panel p-5 sm:p-6">
            <figcaption className="mb-4">
              <h2 className="panel-title">Explicit vs clean</h2>
              <p className="panel-sub">Content flags in the current top tracks</p>
            </figcaption>
            <ExplicitPie data={data.mix} />
            <div className="mt-2 flex justify-center gap-4 text-[0.78rem] text-muted">
              {data.mix.map((m) => (
                <span key={m.name}>
                  {m.name} · {m.value}
                </span>
              ))}
            </div>
          </figure>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="panel p-5 sm:p-6">
            <h2 className="panel-title">Top artists</h2>
            <ol className="mt-5 space-y-3">
              {data.artists.map((artist, i) => (
                <li key={artist.id} className="flex items-center gap-3">
                  <span className="w-5 text-[0.8rem] tabular-nums text-muted">
                    {i + 1}
                  </span>
                  {artist.images?.[0]?.url ? (
                    <Image
                      src={artist.images[0].url}
                      alt=""
                      width={44}
                      height={44}
                      className="h-11 w-11 rounded-full object-cover ring-1 ring-black/5"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eee] text-sm font-semibold">
                      {artist.name.slice(0, 1)}
                    </div>
                  )}
                  <a
                    href={artist.external_urls?.spotify}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-[0.95rem] font-semibold tracking-tight text-ink transition hover:text-accent"
                  >
                    {artist.name}
                  </a>
                </li>
              ))}
            </ol>
          </div>

          <div className="panel p-5 sm:p-6">
            <h2 className="panel-title">Top tracks</h2>
            <ol className="mt-5 space-y-3">
              {data.tracks.map((track, i) => (
                <li key={track.id} className="flex items-center gap-3">
                  <span className="w-5 text-[0.8rem] tabular-nums text-muted">
                    {i + 1}
                  </span>
                  {track.album?.images?.[0]?.url ? (
                    <Image
                      src={track.album.images[0].url}
                      alt=""
                      width={44}
                      height={44}
                      className="h-11 w-11 rounded-xl object-cover ring-1 ring-black/5"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eee] text-sm font-semibold">
                      {track.name.slice(0, 1)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <a
                      href={track.external_urls?.spotify}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-[0.95rem] font-semibold tracking-tight text-ink transition hover:text-accent"
                    >
                      {track.name}
                    </a>
                    <p className="truncate text-[0.8rem] text-muted">
                      {track.artists.map((a) => a.name).join(", ")}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-black/6 pt-6 text-[0.8rem] text-muted">
          <p>
            Built as a data portfolio piece with Spotify Web API tops + Recharts.
          </p>
          <Link href="/owner" className="font-medium text-accent hover:underline">
            Connect live refresh
          </Link>
        </footer>
      </div>
    </main>
  );
}
