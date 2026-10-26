"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

const RANGES = [
  { id: "short_term", label: "4 weeks" },
  { id: "medium_term", label: "6 months" },
  { id: "long_term", label: "All time" },
] as const;

export function TimeRangeTabs({
  range,
  demo,
}: {
  range?: string;
  demo?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = range || params.get("range") || "medium_term";

  function setRange(id: string) {
    const next = new URLSearchParams(params.toString());
    next.set("range", id);
    if (demo) next.set("demo", "1");
    else next.delete("demo");
    const base = pathname || "/";
    router.push(`${base}?${next.toString()}`);
  }

  return (
    <div className="inline-flex gap-1 rounded-full border border-white/10 bg-white/5 p-1">
      {RANGES.map((item) => {
        const active = current === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setRange(item.id)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-lime text-ink"
                : "text-mist hover:bg-white/5 hover:text-fog"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
