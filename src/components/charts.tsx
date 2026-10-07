"use client";

import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ReactNode } from "react";

// Colors per entitat (mai per posició): cada costat té sempre el mateix color.
const COLOR = {
  primary: "var(--series-1)",
  lesionat: "var(--series-1)",
  sa: "var(--series-2)",
  bilateral: "var(--series-3)",
};

const shortDate = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${Number(d)}/${Number(m)}`;
};

function ChartFrame({ title, children, height = 200 }: { title: string; children: ReactNode; height?: number }) {
  return (
    <figure>
      <figcaption className="mb-2 text-sm font-medium text-muted">{title}</figcaption>
      <div style={{ height }} className="w-full">
        {children}
      </div>
    </figure>
  );
}

function TooltipBox({ active, payload, label, unit, labelFormat }: { active?: boolean; payload?: readonly { name?: unknown; value?: unknown; color?: string }[]; label?: unknown; unit?: string; labelFormat?: (l: string) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-sm">
      <div className="mb-1 font-medium">{labelFormat ? labelFormat(String(label)) : String(label)}</div>
      {payload.map((p) => (
        <div key={String(p.name)} className="flex items-center gap-2">
          <span aria-hidden className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted">{String(p.name)}</span>
          <span className="ml-auto font-medium tabular-nums">
            {typeof p.value === "number" ? Math.round(p.value * 10) / 10 : String(p.value ?? "—")}
            {unit ? ` ${unit}` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

const axisProps = { tickLine: false, axisLine: false, fontSize: 12 } as const;

export function WellnessCharts({ data }: { data: { data: string; puntuacio: number; dolor: number; son_hores: number | null }[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <ChartFrame title="Puntuació wellness (5–25, més alt = millor)">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="data" tickFormatter={shortDate} {...axisProps} minTickGap={16} />
            <YAxis domain={[5, 25]} ticks={[5, 10, 15, 20, 25]} {...axisProps} />
            <Tooltip content={(p) => <TooltipBox {...p} labelFormat={shortDate} />} />
            <Line isAnimationActive={false} type="monotone" dataKey="puntuacio" name="Wellness" stroke={COLOR.primary} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartFrame>
      <ChartFrame title="Dolor EVA (0–10)">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="data" tickFormatter={shortDate} {...axisProps} minTickGap={16} />
            <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} {...axisProps} />
            <Tooltip cursor={{ fill: "var(--surface-2)" }} content={(p) => <TooltipBox {...p} labelFormat={shortDate} />} />
            <Bar isAnimationActive={false} dataKey="dolor" name="Dolor" fill={COLOR.sa} radius={[4, 4, 0, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
    </div>
  );
}

export function LoadCharts({ weeks }: { weeks: { setmana: string; srpe: number; distanciaKm: number }[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <ChartFrame title="Càrrega setmanal (sRPE = RPE × minuts, UA)">
        <ResponsiveContainer>
          <BarChart data={weeks} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="setmana" tickFormatter={shortDate} {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip cursor={{ fill: "var(--surface-2)" }} content={(p) => <TooltipBox {...p} unit="UA" labelFormat={(l) => `Setmana del ${shortDate(l)}`} />} />
            <Bar isAnimationActive={false} dataKey="srpe" name="sRPE" fill={COLOR.primary} radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
      <ChartFrame title="Distància setmanal de carrera (km)">
        <ResponsiveContainer>
          <BarChart data={weeks} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="setmana" tickFormatter={shortDate} {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip cursor={{ fill: "var(--surface-2)" }} content={(p) => <TooltipBox {...p} unit="km" labelFormat={(l) => `Setmana del ${shortDate(l)}`} />} />
            <Bar isAnimationActive={false} dataKey="distanciaKm" name="Distància" fill={COLOR.bilateral} radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
    </div>
  );
}

const COSTAT_LABEL = { lesionat: "Costat lesionat", sa: "Costat sa", bilateral: "Bilateral" } as const;

/** Evolució d'un test: una línia per costat i una línia discontínua amb el baseline. */
export function TestChart({ title, unit, rows, baselines }: { title: string; unit: string | null; rows: { data: string; costat: "lesionat" | "sa" | "bilateral"; valor: number }[]; baselines: { costat: "lesionat" | "sa" | "bilateral"; valor: number }[] }) {
  const costats = (["lesionat", "sa", "bilateral"] as const).filter((c) => rows.some((r) => r.costat === c));
  const dates = [...new Set(rows.map((r) => r.data))].sort();
  const data = dates.map((d) => {
    const point: Record<string, string | number> = { data: d };
    for (const c of costats) {
      const v = rows.filter((r) => r.data === d && r.costat === c).at(-1);
      if (v) point[c] = Number(v.valor);
    }
    return point;
  });
  return (
    <ChartFrame title={`${title}${unit ? ` (${unit})` : ""}`} height={220}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="data" tickFormatter={shortDate} {...axisProps} />
          <YAxis {...axisProps} domain={["auto", "auto"]} />
          <Tooltip content={(p) => <TooltipBox {...p} unit={unit ?? undefined} labelFormat={shortDate} />} />
          {costats.length > 1 && <Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} formatter={(v) => <span style={{ color: "var(--muted)" }}>{v}</span>} />}
          {baselines
            .filter((b) => costats.includes(b.costat))
            .map((b) => (
              <ReferenceLine key={b.costat} y={b.valor} stroke={COLOR[b.costat]} strokeDasharray="4 4" strokeOpacity={0.7} ifOverflow="extendDomain" />
            ))}
          {costats.map((c) => (
            <Line key={c} isAnimationActive={false} type="monotone" dataKey={c} name={COSTAT_LABEL[c]} stroke={COLOR[c]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
