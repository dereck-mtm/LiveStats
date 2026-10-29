"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type SearchHit = {
  id: string;
  name: string;
  artists: string;
  albumImage?: string;
  spotifyUrl?: string;
};

type Rec = {
  id: string;
  trackName: string;
  artists: string;
  albumImage?: string;
  spotifyUrl?: string;
  fromName: string;
  note: string;
  createdAt: string;
};

export function RecommendSong() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [selected, setSelected] = useState<SearchHit | null>(null);
  const [fromName, setFromName] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<Rec[]>([]);
  const [status, setStatus] = useState<"idle" | "searching" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/recommend")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setHits([]);
      return;
    }
    const id = setTimeout(() => {
      setStatus("searching");
      void fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
        .then((r) => r.json())
        .then((d) => {
          setHits(d.items || []);
          setStatus("idle");
        })
        .catch(() => {
          setHits([]);
          setStatus("idle");
        });
    }, 280);
    return () => clearTimeout(id);
  }, [query]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) {
      setError("Search and pick a song first.");
      return;
    }
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackId: selected.id,
          trackName: selected.name,
          artists: selected.artists,
          albumImage: selected.albumImage,
          spotifyUrl: selected.spotifyUrl,
          fromName,
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send");
      setItems((prev) => [data.item, ...prev]);
      setSelected(null);
      setQuery("");
      setHits([]);
      setNote("");
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send");
      setStatus("error");
    }
  }

  return (
    <section className="bg-[#0a0a0a] px-6 py-20 text-white sm:px-10 sm:py-28">
      <div className="mx-auto max-w-[1120px]">
        <p className="text-[13px] font-medium tracking-[0.14em] text-[#1ed760] uppercase">
          For recruiters & friends
        </p>
        <h2 className="mt-3 max-w-xl text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.045em]">
          Recommend a song
        </h2>
        <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-white/60">
          Visiting from LinkedIn? Leave something I should play next — search
          Spotify and send it over.
        </p>

        <form
          onSubmit={submit}
          className="mt-10 grid max-w-2xl gap-4 rounded-[28px] bg-white/[0.04] p-6 ring-1 ring-white/10 sm:p-8"
        >
          <label className="block">
            <span className="text-[12px] font-medium tracking-[0.06em] text-white/45 uppercase">
              Search Spotify
            </span>
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelected(null);
              }}
              placeholder="Song or artist"
              className="mt-2 w-full rounded-2xl border-0 bg-white/10 px-4 py-3 text-[15px] text-white outline-none ring-1 ring-white/10 placeholder:text-white/35 focus:ring-[#1ed760]/60"
            />
          </label>

          {hits.length > 0 && !selected ? (
            <ul className="max-h-56 overflow-auto rounded-2xl bg-black/40 ring-1 ring-white/10">
              {hits.map((hit) => (
                <li key={hit.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(hit);
                      setQuery(`${hit.name} — ${hit.artists}`);
                      setHits([]);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-white/10"
                  >
                    {hit.albumImage ? (
                      <Image
                        src={hit.albumImage}
                        alt=""
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-md object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-white/10" />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-medium">
                        {hit.name}
                      </span>
                      <span className="block truncate text-[12px] text-white/45">
                        {hit.artists}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {selected ? (
            <div className="flex items-center gap-3 rounded-2xl bg-[#1ed760]/12 px-3 py-3 ring-1 ring-[#1ed760]/25">
              {selected.albumImage ? (
                <Image
                  src={selected.albumImage}
                  alt=""
                  width={44}
                  height={44}
                  className="h-11 w-11 rounded-md object-cover"
                  unoptimized
                />
              ) : null}
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium">{selected.name}</p>
                <p className="truncate text-[12px] text-white/55">
                  {selected.artists}
                </p>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-1">
              <span className="text-[12px] font-medium tracking-[0.06em] text-white/45 uppercase">
                Your name
              </span>
              <input
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="Optional"
                className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-[15px] text-white outline-none ring-1 ring-white/10 placeholder:text-white/35 focus:ring-[#1ed760]/60"
              />
            </label>
            <label className="block sm:col-span-1">
              <span className="text-[12px] font-medium tracking-[0.06em] text-white/45 uppercase">
                Note
              </span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Why this one?"
                className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-[15px] text-white outline-none ring-1 ring-white/10 placeholder:text-white/35 focus:ring-[#1ed760]/60"
              />
            </label>
          </div>

          {error ? <p className="text-[13px] text-[#ff6b6b]">{error}</p> : null}
          {status === "sent" ? (
            <p className="text-[13px] text-[#1ed760]">Sent — thanks for the rec.</p>
          ) : null}

          <button
            type="submit"
            disabled={status === "sending"}
            className="mt-1 inline-flex items-center justify-center rounded-full bg-[#1ed760] px-6 py-3 text-[14px] font-semibold text-black transition hover:brightness-110 disabled:opacity-60"
          >
            {status === "sending" ? "Sending…" : "Send recommendation"}
          </button>
        </form>

        {items.length > 0 ? (
          <div className="mt-16">
            <h3 className="text-[22px] font-semibold tracking-[-0.03em]">
              Inbox
            </h3>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {items.slice(0, 8).map((rec) => (
                <li
                  key={rec.id}
                  className="flex gap-3 rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10"
                >
                  {rec.albumImage ? (
                    <Image
                      src={rec.albumImage}
                      alt=""
                      width={56}
                      height={56}
                      className="h-14 w-14 rounded-lg object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-lg bg-white/10" />
                  )}
                  <div className="min-w-0">
                    <a
                      href={rec.spotifyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-[15px] font-medium hover:text-[#1ed760]"
                    >
                      {rec.trackName}
                    </a>
                    <p className="truncate text-[13px] text-white/45">
                      {rec.artists}
                    </p>
                    <p className="mt-1 truncate text-[12px] text-white/35">
                      from {rec.fromName}
                      {rec.note ? ` · “${rec.note}”` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
