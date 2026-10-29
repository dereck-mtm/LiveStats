"use client";

type Hour = { hour: number; label: string; count: number };

export function ListeningClock({
  hours,
  peakLabel,
}: {
  hours: Hour[];
  peakLabel: string | null;
}) {
  const max = Math.max(1, ...hours.map((h) => h.count));
  // Show a readable slice of the day — collapse empty overnight if all quiet
  const display = hours;

  if (!display.some((h) => h.count > 0)) {
    return (
      <p className="text-[15px] text-white/55">
        Play a few more songs and this clock fills in from recent listens.
      </p>
    );
  }

  return (
    <div>
      {peakLabel ? (
        <p className="mb-6 text-[18px] font-medium tracking-[-0.02em] text-white/85">
          Most often around <span className="text-[#1ed760]">{peakLabel}</span>{" "}
          PT
        </p>
      ) : null}
      <div className="flex h-40 items-end gap-[3px] sm:gap-1">
        {display.map((h) => {
          const height = Math.max(4, Math.round((h.count / max) * 100));
          const hot = peakLabel === h.label;
          return (
            <div
              key={h.hour}
              className="group relative flex flex-1 flex-col items-center justify-end"
              title={`${h.label}: ${h.count}`}
            >
              <div
                className={`w-full rounded-t-sm transition ${
                  hot ? "bg-[#1ed760]" : "bg-white/25 group-hover:bg-white/45"
                }`}
                style={{ height: `${height}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-white/40">
        <span>12a</span>
        <span>6a</span>
        <span>12p</span>
        <span>6p</span>
        <span>11p</span>
      </div>
    </div>
  );
}
