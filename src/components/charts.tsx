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
const MUTED = "#6e6e73";
const GRID = "rgba(0,0,0,0.06)";
const BLUE = "#0071e3";
const TEAL = "#00c2a8";
const CORAL = "#ff5a36";
const AMBER = "#f5a524";

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
    <div className="rounded-xl border border-black/8 bg-white px-3 py-2 text-xs text-ink shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
      <p className="font-semibold tracking-tight">{full}</p>
      <p className="text-muted">
        {row.name}: <span className="text-ink">{row.value}</span>
      </p>
    </div>
  );
}

export function AffinityBarChart({
  data,
}: {
  data: { name: string; fullName: string; affinity: number; rank: number }[];
}) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 4, right: 8, top: 4, bottom: 4 }}>
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
            width={108}
            stroke={MUTED}
            tick={{ fill: INK, fontSize: 12, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<Tip />} cursor={{ fill: "rgba(0,113,227,0.05)" }} />
          <Bar dataKey="affinity" name="Affinity" radius={[0, 8, 8, 0]} barSize={16}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === 0 ? BLUE : i < 3 ? TEAL : "#b4bcc8"} />
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
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 4, bottom: 52, top: 8 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis
            dataKey="name"
            stroke={MUTED}
            interval={0}
            angle={-32}
            textAnchor="end"
            tick={{ fill: INK, fontSize: 10, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            stroke={MUTED}
            tick={{ fill: MUTED, fontSize: 11 }}
            unit="m"
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<Tip />} cursor={{ fill: "rgba(255,90,54,0.05)" }} />
          <Bar dataKey="minutes" name="Minutes" fill={CORAL} radius={[8, 8, 0, 0]} barSize={22} />
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
  const top = data.slice(0, 8);
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={top} margin={{ left: 0, right: 4, bottom: 44, top: 8 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis
            dataKey="name"
            stroke={MUTED}
            interval={0}
            angle={-28}
            textAnchor="end"
            tick={{ fill: INK, fontSize: 10, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            domain={[0, 3]}
            stroke={MUTED}
            tick={{ fill: MUTED, fontSize: 11 }}
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
                <div className="rounded-xl border border-black/8 bg-white px-3 py-2 text-xs shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
                  <p className="font-semibold text-ink">{p.fullName}</p>
                  <p className="text-muted">
                    In {p.windows}/3 windows ({p.labels})
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="windows" name="Windows" fill={AMBER} radius={[8, 8, 0, 0]} barSize={22} />
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
  const colors = [CORAL, BLUE];
  if (!data.length) {
    return (
      <p className="flex h-[300px] items-center justify-center text-sm text-muted">
        No track mix data
      </p>
    );
  }
  return (
    <div className="relative h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={68}
            outerRadius={98}
            paddingAngle={3}
            stroke="#fff"
            strokeWidth={3}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-xl border border-black/8 bg-white px-3 py-2 text-xs text-ink shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
                  {payload[0].name}: {payload[0].value}
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-semibold tracking-tight text-ink">
            {data.reduce((s, d) => s + d.value, 0)}
          </p>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
            tracks
          </p>
        </div>
      </div>
    </div>
  );
}
