"use client";

/**
 * Grafico prezzi interattivo (Recharts): intervalli 1M→MAX, SMA 50/200,
 * modalità rendimento %, scala log. Tooltip con crosshair.
 */

import { useMemo, useState } from "react";
import {
  CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { PriceBar } from "@/lib/types";
import { sma } from "@/lib/indicators";
import { fmtNum } from "@/lib/format";

const RANGES = [
  { key: "1M", days: 22 }, { key: "3M", days: 66 }, { key: "6M", days: 130 },
  { key: "YTD", days: -1 }, { key: "1A", days: 260 }, { key: "3A", days: 780 },
  { key: "5A", days: 1300 }, { key: "10A", days: 2600 }, { key: "MAX", days: 0 },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

export default function PriceChart({ bars, currency }: { bars: PriceBar[]; currency: string }) {
  const [range, setRange] = useState<RangeKey>("1A");
  const [pctMode, setPctMode] = useState(false);
  const [logScale, setLogScale] = useState(false);

  const data = useMemo(() => {
    const closes = bars.map((b) => b.close);
    const sma50 = sma(closes, 50);
    const sma200 = sma(closes, 200);
    const all = bars.map((b, i) => ({
      date: b.date, close: b.close, sma50: sma50[i], sma200: sma200[i],
    }));

    let slice = all;
    const def = RANGES.find((r) => r.key === range)!;
    if (def.days > 0) slice = all.slice(-def.days);
    else if (def.days === -1) {
      const year = all[all.length - 1]?.date.slice(0, 4);
      slice = all.filter((d) => d.date.startsWith(year));
    }

    if (pctMode && slice.length) {
      const base = slice[0].close;
      const b50 = slice[0].sma50;
      const b200 = slice[0].sma200;
      return slice.map((d) => ({
        date: d.date,
        close: (d.close / base - 1) * 100,
        sma50: d.sma50 != null && b50 != null ? (d.sma50 / b50 - 1) * 100 : null,
        sma200: d.sma200 != null && b200 != null ? (d.sma200 / b200 - 1) * 100 : null,
      }));
    }
    return slice;
  }, [bars, range, pctMode]);

  const unit = pctMode ? "%" : ` ${currency}`;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Intervallo temporale">
          {RANGES.map((r) => (
            <button key={r.key} onClick={() => setRange(r.key)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                range === r.key ? "bg-accent text-white" : "border border-bordr text-ink-2 hover:bg-surface-2"}`}>
              {r.key}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-1">
          <button onClick={() => setPctMode(!pctMode)}
            aria-pressed={pctMode}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
              pctMode ? "bg-accent text-white" : "border border-bordr text-ink-2 hover:bg-surface-2"}`}>
            Rendimento %
          </button>
          <button onClick={() => setLogScale(!logScale)}
            aria-pressed={logScale} disabled={pctMode}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium disabled:opacity-40 ${
              logScale && !pctMode ? "bg-accent text-white" : "border border-bordr text-ink-2 hover:bg-surface-2"}`}>
            Log
          </button>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "var(--ink-3)", fontSize: 11 }}
              tickFormatter={(d: string) => d.slice(0, 7)} minTickGap={48}
              stroke="var(--grid)" />
            <YAxis tick={{ fill: "var(--ink-3)", fontSize: 11 }} stroke="transparent"
              scale={logScale && !pctMode ? "log" : "auto"}
              domain={["auto", "auto"]} width={62}
              tickFormatter={(v: number) => fmtNum(v, v < 10 ? 2 : 0)} />
            <Tooltip
              contentStyle={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: 10, fontSize: 12, color: "var(--ink)",
              }}
              labelStyle={{ color: "var(--ink-2)" }}
              formatter={(value) => [
                value == null ? "—" : `${fmtNum(Number(value))}${unit}`,
              ]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} iconType="plainline" />
            <Line name={pctMode ? "Rendimento" : `Prezzo (${currency})`} dataKey="close"
              stroke="var(--accent)" strokeWidth={2.2} dot={false} isAnimationActive={false} />
            <Line name="SMA 50" dataKey="sma50" stroke="var(--series-3)"
              strokeWidth={1.6} dot={false} isAnimationActive={false} connectNulls={false} />
            <Line name="SMA 200" dataKey="sma200" stroke="var(--series-4)"
              strokeWidth={1.6} dot={false} isAnimationActive={false} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
