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

const INK = "#0b1210";
const LIME = "#c6f24a";
const MIST = "#9bb5a8";
const FOG = "#d7e3dc";
const CORAL = "#ff6b4a";
const TEAL = "#3dd6c6";

function Tip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name?: string; payload?: Record<string, unknown> }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0];
  const full = (row.payload?.fullName as string) || label;
  return (
    <div className="rounded-lg border border-white/10 bg-ink-soft px-3 py-2 text-xs text-fog shadow-lg">
      <p className="font-semibold">{full}</p>
      <p className="text-mist">
        {row.name}: {row.value}
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
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 12 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
          <XAxis type="number" stroke={MIST} tick={{ fill: MIST, fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            stroke={MIST}
            tick={{ fill: FOG, fontSize: 11 }}
          />
          <Tooltip content={<Tip />} cursor={{ fill: "rgba(198,242,74,0.08)" }} />
          <Bar dataKey="affinity" name="Affinity" radius={[0, 6, 6, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === 0 ? LIME : TEAL} />
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
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 8, bottom: 48 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="name"
            stroke={MIST}
            interval={0}
            angle={-35}
            textAnchor="end"
            tick={{ fill: FOG, fontSize: 10 }}
          />
          <YAxis stroke={MIST} tick={{ fill: MIST, fontSize: 11 }} unit="m" />
          <Tooltip content={<Tip />} cursor={{ fill: "rgba(198,242,74,0.08)" }} />
          <Bar dataKey="minutes" name="Minutes" fill={CORAL} radius={[6, 6, 0, 0]} />
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
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={top} margin={{ left: 0, right: 8, bottom: 40 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="name"
            stroke={MIST}
            interval={0}
            angle={-30}
            textAnchor="end"
            tick={{ fill: FOG, fontSize: 10 }}
          />
          <YAxis
            allowDecimals={false}
            domain={[0, 3]}
            stroke={MIST}
            tick={{ fill: MIST, fontSize: 11 }}
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
                <div className="rounded-lg border border-white/10 bg-ink-soft px-3 py-2 text-xs text-fog">
                  <p className="font-semibold">{p.fullName}</p>
                  <p className="text-mist">
                    In {p.windows}/3 windows ({p.labels})
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="windows" name="Windows" fill={LIME} radius={[6, 6, 0, 0]} />
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
  const colors = [CORAL, LIME];
  if (!data.length) {
    return (
      <p className="flex h-72 items-center justify-center text-sm text-mist">
        No track mix data
      </p>
    );
  }
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={3}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} stroke={INK} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-lg border border-white/10 bg-ink-soft px-3 py-2 text-xs text-fog">
                  {payload[0].name}: {payload[0].value}
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
