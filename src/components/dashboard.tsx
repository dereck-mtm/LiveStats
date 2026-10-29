"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, useEffectEvent } from "react";
import { ListeningClock } from "@/components/listening-clock";
import { RecommendSong } from "@/components/recommend-song";
import { formatSessionWhen } from "@/lib/listening-insights";
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
  const topTrack = data.tracks[0];
  const heroImage =
    topArtist?.images?.[0]?.url ||
    topTrack?.album?.images?.[0]?.url ||
    avatar;
  const alwaysOn = data.alwaysOn.filter((a) => a.windows >= 2).slice(0, 6);

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative min-h-[100svh] overflow-hidden">
        {heroImage ? (
          <div className="absolute inset-0">
            <Image
              src={heroImage}
              alt=""
              fill
              priority
              unoptimized
              className="hero-media object-cover object-center opacity-55"
              sizes="100vw"
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 40%, #000 100%)",
              }}
            />
          </div>
        ) : null}

        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1120px] flex-col px-6 pb-16 pt-7 sm:px-10 sm:pb-20 sm:pt-9">
          <header className="flex items-center justify-between">
            <p className="text-[15px] font-semibold tracking-[-0.03em]">
              LiveStats
            </p>
            <div className="flex items-center gap-3 text-[13px] text-white/60">
              <span className="inline-flex items-center gap-2">
                <span className="live-dot" />
                {data.source === "live" ? "Live" : "Synced"}
              </span>
              <span className="text-white/25">·</span>
              <span className="tabular-nums text-white/45">
                {updating ? "Updating" : `${mins}:${secs}`}
              </span>
            </div>
          </header>

          <div className="mt-auto max-w-3xl pb-2 pt-24">
            <p className="rise text-[13px] font-medium tracking-[0.16em] text-[#1ed760] uppercase">
              {data.profile.display_name}&apos;s listening
            </p>
            <h1 className="rise rise-1 mt-4 text-[clamp(3.25rem,12vw,7rem)] font-semibold leading-[0.9] tracking-[-0.06em]">
              LiveStats
            </h1>
            <p className="rise rise-2 mt-5 max-w-md text-[18px] leading-snug text-white/70 sm:text-[20px]">
              A portfolio Wrapped — what I play, when I listen, and what keeps
              coming back.
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
              <div className="flex rounded-full bg-white/10 p-1 backdrop-blur-xl">
                {RANGES.map((r) => {
                  const active = range === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => changeRange(r.id)}
                      className={`rounded-full px-4 py-2 text-[13px] font-medium transition ${
                        active
                          ? "bg-white text-black"
                          : "text-white/65 hover:text-white"
                      }`}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="rise rise-4 mt-6 text-[12px] text-white/40">
              {topArtist ? `#1 artist: ${topArtist.name}` : "Loading tops"} ·
              Updated {formatFetchedAt(data.fetchedAt)} PT
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#121212]">
        <div className="mx-auto grid max-w-[1120px] grid-cols-2 gap-8 px-6 py-12 sm:grid-cols-4 sm:px-10 sm:py-16">
          {[
            { label: "Top artists", value: data.summary.topArtistCount },
            { label: "Top tracks", value: data.summary.topTrackCount },
            { label: "Always on", value: data.summary.alwaysOnCount },
            { label: "Sessions", value: data.summary.sessionCount },
          ].map((m) => (
            <div key={m.label}>
              <p className="text-[12px] font-medium tracking-[0.08em] text-white/40 uppercase">
                {m.label}
              </p>
              <p className="mt-2 text-[40px] font-semibold leading-none tracking-[-0.05em] sm:text-[48px]">
                {m.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#f037a5] px-6 py-20 text-black sm:px-10 sm:py-28">
        <div className="mx-auto max-w-[1120px]">
          <p className="text-[13px] font-semibold tracking-[0.14em] uppercase opacity-70">
            {data.rangeLabel}
          </p>
          <h2 className="mt-3 text-[clamp(2.25rem,6vw,3.75rem)] font-semibold tracking-[-0.05em]">
            Top artists
          </h2>
          <ol className="mt-12 space-y-5">
            {data.artists.map((artist, i) => (
              <li key={artist.id} className="flex items-center gap-4 sm:gap-6">
                <span className="w-10 text-[28px] font-semibold tracking-[-0.04em] tabular-nums opacity-80 sm:w-14 sm:text-[36px]">
                  {i + 1}
                </span>
                {artist.images?.[0]?.url ? (
                  <Image
                    src={artist.images[0].url}
                    alt=""
                    width={72}
                    height={72}
                    className="h-14 w-14 rounded-full object-cover sm:h-[72px] sm:w-[72px]"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/15 text-lg font-semibold sm:h-[72px] sm:w-[72px]">
                    {artist.name.slice(0, 1)}
                  </div>
                )}
                <a
                  href={artist.external_urls?.spotify}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-[22px] font-semibold tracking-[-0.03em] sm:text-[28px]"
                >
                  {artist.name}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-[#4a90e2] px-6 py-20 text-black sm:px-10 sm:py-28">
        <div className="mx-auto max-w-[1120px]">
          <p className="text-[13px] font-semibold tracking-[0.14em] uppercase opacity-70">
            Heavy rotation
          </p>
          <h2 className="mt-3 text-[clamp(2.25rem,6vw,3.75rem)] font-semibold tracking-[-0.05em]">
            Top tracks
          </h2>
          <ol className="mt-12 space-y-4">
            {data.tracks.map((track, i) => (
              <li key={track.id} className="flex items-center gap-4 sm:gap-5">
                <span className="w-8 text-[20px] font-semibold tabular-nums opacity-75 sm:w-10">
                  {i + 1}
                </span>
                {track.album?.images?.[0]?.url ? (
                  <Image
                    src={track.album.images[0].url}
                    alt=""
                    width={56}
                    height={56}
                    className="h-12 w-12 rounded-md object-cover sm:h-14 sm:w-14"
                    unoptimized
                  />
                ) : (
                  <div className="h-12 w-12 rounded-md bg-black/15 sm:h-14 sm:w-14" />
                )}
                <div className="min-w-0">
                  <a
                    href={track.external_urls?.spotify}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-[18px] font-semibold tracking-[-0.02em] sm:text-[22px]"
                  >
                    {track.name}
                  </a>
                  <p className="truncate text-[14px] opacity-70">
                    {track.artists.map((a) => a.name).join(", ")}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-[#ff6437] px-6 py-20 text-black sm:px-10 sm:py-28">
        <div className="mx-auto max-w-[1120px]">
          <p className="text-[13px] font-semibold tracking-[0.14em] uppercase opacity-70">
            Not a one-month fling
          </p>
          <h2 className="mt-3 max-w-2xl text-[clamp(2.25rem,6vw,3.75rem)] font-semibold tracking-[-0.05em]">
            Always in rotation
          </h2>
          <p className="mt-4 max-w-xl text-[17px] leading-relaxed opacity-80">
            Artists that show up across more than one window — last 4 weeks, 6
            months, and all time. The ones that stick around.
          </p>
          {alwaysOn.length === 0 ? (
            <p className="mt-10 text-[16px] opacity-70">
              Not enough overlap across windows yet.
            </p>
          ) : (
            <ul className="mt-12 grid gap-4 sm:grid-cols-2">
              {alwaysOn.map((a) => (
                <li
                  key={a.fullName}
                  className="rounded-3xl bg-black/10 px-5 py-5"
                >
                  <p className="text-[22px] font-semibold tracking-[-0.03em]">
                    {a.fullName}
                  </p>
                  <p className="mt-1 text-[14px] opacity-75">
                    In {a.windows}/3 windows · {a.labels}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="bg-[#121212] px-6 py-20 sm:px-10 sm:py-28">
        <div className="mx-auto max-w-[1120px]">
          <p className="text-[13px] font-medium tracking-[0.14em] text-[#1ed760] uppercase">
            Habits
          </p>
          <h2 className="mt-3 text-[clamp(2rem,5vw,3.25rem)] font-semibold tracking-[-0.045em]">
            When I listen
          </h2>
          <p className="mt-3 max-w-lg text-[16px] text-white/55">
            From recent plays, in Pacific time — the hours this page sees me
            press play.
          </p>
          <div className="mt-10 rounded-[28px] bg-white/[0.04] p-6 ring-1 ring-white/10 sm:p-8">
            <ListeningClock
              hours={data.clock.hours}
              peakLabel={data.clock.peakLabel}
            />
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-black px-6 py-20 sm:px-10 sm:py-28">
        <div className="mx-auto max-w-[1120px]">
          <p className="text-[13px] font-medium tracking-[0.14em] text-[#1ed760] uppercase">
            Lately
          </p>
          <h2 className="mt-3 text-[clamp(2rem,5vw,3.25rem)] font-semibold tracking-[-0.045em]">
            Listening sessions
          </h2>
          <p className="mt-3 max-w-lg text-[16px] text-white/55">
            Chunks of recent listening — a new session starts after about 30
            quiet minutes.
          </p>
          {data.sessions.length === 0 ? (
            <p className="mt-10 text-[15px] text-white/45">
              No recent sessions in the Spotify feed yet. They show up after a
              few plays with the live connection on.
            </p>
          ) : (
            <ul className="mt-10 divide-y divide-white/10">
              {data.sessions.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-baseline justify-between gap-3 py-5"
                >
                  <div>
                    <p className="text-[18px] font-medium tracking-[-0.02em]">
                      {s.minutes} min · {s.headline}
                    </p>
                    <p className="mt-1 text-[13px] text-white/40">
                      {formatSessionWhen(s.startedAt)} · {s.trackCount} tracks
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="bg-[#1ed760] px-6 py-20 text-black sm:px-10 sm:py-28">
        <div className="mx-auto max-w-[1120px]">
          <p className="text-[13px] font-semibold tracking-[0.14em] uppercase opacity-70">
            Can&apos;t skip it
          </p>
          <h2 className="mt-3 text-[clamp(2.25rem,6vw,3.75rem)] font-semibold tracking-[-0.05em]">
            On repeat
          </h2>
          <p className="mt-4 max-w-xl text-[17px] leading-relaxed opacity-80">
            Songs that showed up more than once in recent plays — real replays,
            not just a top list.
          </p>
          {data.repeats.length === 0 ? (
            <p className="mt-10 text-[16px] opacity-70">
              No repeats in the recent window yet.
            </p>
          ) : (
            <ol className="mt-12 space-y-4">
              {data.repeats.map((t, i) => (
                <li key={t.id} className="flex items-center gap-4">
                  <span className="w-8 text-[20px] font-semibold tabular-nums opacity-75">
                    {i + 1}
                  </span>
                  {t.imageUrl ? (
                    <Image
                      src={t.imageUrl}
                      alt=""
                      width={56}
                      height={56}
                      className="h-14 w-14 rounded-md object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-md bg-black/15" />
                  )}
                  <div className="min-w-0 flex-1">
                    <a
                      href={t.spotifyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-[18px] font-semibold tracking-[-0.02em]"
                    >
                      {t.name}
                    </a>
                    <p className="truncate text-[14px] opacity-70">{t.artists}</p>
                  </div>
                  <p className="text-[18px] font-semibold tabular-nums">
                    ×{t.plays}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <RecommendSong />

      <footer className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-3 px-6 py-12 text-[13px] text-white/40 sm:px-10">
        <p>Dereck · personal listening portfolio</p>
        <Link
          href="/owner"
          className="font-medium text-[#1ed760] hover:opacity-80"
        >
          Owner sync
        </Link>
      </footer>
    </main>
  );
}
