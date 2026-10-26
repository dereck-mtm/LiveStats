"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const INK = "#1d1d1f";
const MUTED = "#86868b";
const GRID = "rgba(0,0,0,0.06)";
const BLUE = "#0071e3";
const FILL = "#1d1d1f";

/** Pie segment colors — keep in sync with dashboard legend swatches. */
export const MIX_COLORS: Record<string, string> = {
  Explicit: INK,
  Clean: BLUE,
};

function Tip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: {
    value: number;
    name?: string;
    payload?: Record<string, unknown>;
  }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0];
  const full = (row.payload?.fullName as string) || label;
  return (
    <div
      className="rounded-2xl px-3.5 py-2.5 text-[12px] text-white"
      style={{
        background: "rgba(29,29,31,0.92)",
        backdropFilter: "blur(16px)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.2)",
      }}
    >
      <p className="font-medium tracking-[-0.01em]">{full}</p>
      <p className="mt-0.5 text-white/65">
        {row.name} · {row.value}
      </p>
    </div>
  );
}

export function AffinityBarChart({
  data,
}: {
  data: { name: string; fullName: string; affinity: number; rank: number }[];
}) {
  if (!data.length) {
    return <EmptyChart />;
  }
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
        >
          <CartesianGrid stroke={GRID} horizontal={false} />
          <XAxis
            type="number"
            stroke={MUTED}
            tick={{ fill: MUTED, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={118}
            tick={{ fill: INK, fontSize: 12, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<Tip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
          <Bar dataKey="affinity" name="Affinity" radius={[0, 10, 10, 0]} barSize={14}>
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={i === 0 ? BLUE : FILL}
                fillOpacity={i === 0 ? 1 : Math.max(0.35, 1 - i * 0.07)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DurationBarChart({
  data,
}: {
  data: { name: string; fullName: string; minutes: number; rank: number }[];
}) {
  if (!data.length) {
    return <EmptyChart />;
  }
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 0, right: 12, top: 8, bottom: 0 }}
        >
          <CartesianGrid stroke={GRID} horizontal={false} />
          <XAxis
            type="number"
            unit="m"
            tick={{ fill: MUTED, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={128}
            tick={{ fill: INK, fontSize: 11, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<Tip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
          <Bar
            dataKey="minutes"
            name="Minutes"
            fill={FILL}
            fillOpacity={0.88}
            radius={[0, 10, 10, 0]}
            barSize={14}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StickyArtistsChart({
  data,
}: {
  data: {
    name: string;
    fullName: string;
    windows: number;
    labels: string;
  }[];
}) {
  const top = data.slice(0, 6);
  if (!top.length) {
    return <EmptyChart />;
  }
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={top}
          layout="vertical"
          margin={{ left: 0, right: 12, top: 8, bottom: 0 }}
        >
          <CartesianGrid stroke={GRID} horizontal={false} />
          <XAxis
            type="number"
            allowDecimals={false}
            domain={[0, 3]}
            tick={{ fill: MUTED, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={118}
            tick={{ fill: INK, fontSize: 12, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as {
                fullName: string;
                windows: number;
                labels: string;
              };
              return (
                <div
                  className="rounded-2xl px-3.5 py-2.5 text-[12px] text-white"
                  style={{
                    background: "rgba(29,29,31,0.92)",
                    backdropFilter: "blur(16px)",
                  }}
                >
                  <p className="font-medium">{p.fullName}</p>
                  <p className="mt-0.5 text-white/65">
                    {p.windows}/3 windows · {p.labels}
                  </p>
                </div>
              );
            }}
          />
          <Bar
            dataKey="windows"
            name="Windows"
            fill={BLUE}
            radius={[0, 10, 10, 0]}
            barSize={14}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ExplicitPie({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  if (!data.length) {
    return <EmptyChart label="No mix data" />;
  }
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="relative h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={74}
            outerRadius={104}
            paddingAngle={3}
            stroke="#ffffff"
            strokeWidth={4}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={MIX_COLORS[d.name] ?? MUTED} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              return (
                <div
                  className="rounded-2xl px-3.5 py-2.5 text-[12px] text-white"
                  style={{ background: "rgba(29,29,31,0.92)" }}
                >
                  {payload[0].name}: {payload[0].value}
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[28px] font-semibold tracking-[-0.04em] text-ink">
            {total}
          </p>
          <p className="text-[11px] font-medium tracking-[0.08em] text-tertiary uppercase">
            tracks
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyChart({ label = "No data" }: { label?: string }) {
  return (
    <p className="flex h-[320px] items-center justify-center text-sm text-tertiary">
      {label}
    </p>
  );
}
