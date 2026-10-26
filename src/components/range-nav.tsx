"use client";

import Link from "next/link";

const RANGES = [
  { id: "short_term", label: "4 weeks" },
  { id: "medium_term", label: "6 months" },
  { id: "long_term", label: "All time" },
] as const;

export function RangeNav({ current }: { current: string }) {
  return (
    <div className="inline-flex gap-1 rounded-full border border-white/10 bg-white/5 p-1">
      {RANGES.map((r) => {
        const active = current === r.id;
        return (
          <Link
            key={r.id}
            href={`/?range=${r.id}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-lime text-ink"
                : "text-mist hover:bg-white/5 hover:text-fog"
            }`}
          >
            {r.label}
          </Link>
        );
      })}
    </div>
  );
}
