"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { fmtNum, fmtPct } from "@/lib/format";

type Lite = { symbol: string; points: { d: string; p: number }[] };
type Co = { symbol: string; name: string; sector: string; country: string; currency: string };

/**
 * Simulatore di portafoglio storico: quote ipotetiche → andamento passato,
 * volatilità, drawdown e concentrazione. È una simulazione del PASSATO,
 * non una previsione.
 */
export default function PortfolioPage() {
  const [data, setData] = useState<{ series: Lite[]; companies: Co[] } | null>(null);
  const [weights, setWeights] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/series-lite")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ series: [], companies: [] }));
  }, []);

  const total = Object.values(weights).reduce((a, b) => a + b, 0);

  const sim = useMemo(() => {
    if (!data || total <= 0) return null;
    const active = Object.entries(weights).filter(([, v]) => v > 0);
    const seriesBySymbol = new Map(data.series.map((s) => [s.symbol, s.points]));
    // allinea sulle date comuni della serie più corta
    const dateSets = active.map(([s]) => new Set((seriesBySymbol.get(s) ?? []).map((p) => p.d)));
    if (!dateSets.length) return null;
    const common = [...dateSets[0]].filter((d) => dateSets.every((set) => set.has(d))).sort();
    if (common.length < 20) return null;

    const priceAt = new Map(active.map(([sym]) => {
      const m = new Map((seriesBySymbol.get(sym) ?? []).map((p) => [p.d, p.p]));
      return [sym, m] as const;
    }));

    const first = common[0];
    const points = common.map((d) => {
      let value = 0;
      for (const [sym, amount] of active) {
        const p0 = priceAt.get(sym)!.get(first)!;
        const p = priceAt.get(sym)!.get(d)!;
        value += (amount / total) * (p / p0);
      }
      return { date: d, value: value * 100 };
    });

    // metriche
    const rets: number[] = [];
    for (let i = 1; i < points.length; i++) rets.push(Math.log(points[i].value / points[i - 1].value));
    const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
    const vol = Math.sqrt(rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (rets.length - 1) * 52) * 100;
    let peak = points[0].value, maxDd = 0;
    for (const p of points) {
      peak = Math.max(peak, p.value);
      maxDd = Math.min(maxDd, p.value / peak - 1);
    }
    const years = (new Date(points[points.length - 1].date).getTime() - new Date(first).getTime()) / (365.25 * 86400000);
    const cagr = (Math.pow(points[points.length - 1].value / 100, 1 / years) - 1) * 100;

    // concentrazione per settore
    const bySector = new Map<string, number>();
    for (const [sym, amount] of active) {
      const sector = data.companies.find((c) => c.symbol === sym)?.sector ?? "?";
      bySector.set(sector, (bySector.get(sector) ?? 0) + amount / total);
    }
    const maxSector = [...bySector.entries()].sort((a, b) => b[1] - a[1])[0];
    const maxPosition = active.map(([sym, v]) => [sym, v / total] as const).sort((a, b) => b[1] - a[1])[0];

    return { points, vol, maxDd: maxDd * 100, cagr, years, bySector: [...bySector.entries()], maxSector, maxPosition };
  }, [data, weights, total]);

  if (!data) return <div className="card animate-pulse p-8 text-center text-ink-3">Caricamento serie storiche…</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Simulatore di portafoglio</h1>
        <p className="mt-1 text-ink-2">
          Inserisci importi ipotetici: vedrai come si sarebbe comportato il portafoglio
          nel passato disponibile. <b>Non è una previsione</b>: i rendimenti passati non
          garantiscono risultati futuri.
        </p>
      </header>

      <section className="card p-5">
        <h2 className="mb-3 text-base font-semibold">Composizione (importi ipotetici, es. in €)</h2>
        <div className="grid gap-x-6 gap-y-2 md:grid-cols-2">
          {data.companies.map((c) => (
            <label key={c.symbol} className="flex items-center justify-between gap-3 text-sm">
              <span><b>{c.symbol}</b> <span className="text-ink-3">{c.name}</span></span>
              <input
                type="number" min={0} step={100}
                value={weights[c.symbol] ?? ""}
                placeholder="0"
                onChange={(e) => setWeights((w) => ({ ...w, [c.symbol]: Number(e.target.value) || 0 }))}
                className="w-28 rounded-lg border border-bordr bg-surface px-2 py-1 text-right tabular outline-none focus:border-accent"
              />
            </label>
          ))}
        </div>
        {total > 0 && <p className="mt-3 text-sm text-ink-2">Totale investito ipotetico: <b className="tabular">{fmtNum(total, 0)}</b></p>}
      </section>

      {sim ? (
        <>
          <section className="card p-5">
            <h2 className="mb-1 text-base font-semibold">Andamento storico simulato (base 100)</h2>
            <p className="mb-3 text-xs text-ink-3">
              Periodo comune disponibile: ~{fmtNum(sim.years, 1)} anni · ribilanciamento assente (buy &amp; hold).
            </p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sim.points} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="var(--grid)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "var(--ink-3)", fontSize: 11 }}
                    tickFormatter={(d: string) => d.slice(0, 7)} minTickGap={48} stroke="var(--grid)" />
                  <YAxis tick={{ fill: "var(--ink-3)", fontSize: 11 }} stroke="transparent" width={56}
                    tickFormatter={(v: number) => fmtNum(v, 0)} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }}
                    formatter={(v) => [fmtNum(Number(v), 1), "Valore (base 100)"]}
                  />
                  <Line dataKey="value" stroke="var(--accent)" strokeWidth={2.2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-4">
            <Stat label="Rendimento annuo composto" value={fmtPct(sim.cagr)} good={sim.cagr >= 0} />
            <Stat label="Volatilità annualizzata" value={fmtPct(sim.vol, false)} />
            <Stat label="Max drawdown" value={fmtPct(sim.maxDd, false)} good={false} />
            <Stat label="Posizione più grande" value={`${sim.maxPosition[0]} (${fmtNum(sim.maxPosition[1] * 100, 0)}%)`} />
          </section>

          <section className="card p-5">
            <h2 className="mb-3 text-base font-semibold">Allocazione per settore</h2>
            <ul className="space-y-2 text-sm">
              {sim.bySector.sort((a, b) => b[1] - a[1]).map(([sector, frac]) => (
                <li key={sector}>
                  <div className="mb-0.5 flex justify-between">
                    <span className="text-ink-2">{sector}</span>
                    <span className="tabular font-medium">{fmtNum(frac * 100, 0)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${frac * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            {sim.maxSector[1] > 0.5 && (
              <p className="mt-3 text-sm text-warn">
                ⚠ Concentrazione elevata: oltre metà del portafoglio è nel settore «{sim.maxSector[0]}».
              </p>
            )}
            {sim.maxPosition[1] > 0.4 && (
              <p className="mt-1 text-sm text-warn">
                ⚠ La singola posizione {sim.maxPosition[0]} pesa più del 40%.
              </p>
            )}
          </section>
        </>
      ) : total > 0 ? (
        <div className="card p-8 text-center text-ink-3">Storia comune insufficiente per la simulazione.</div>
      ) : (
        <div className="card p-8 text-center text-ink-3">Inserisci almeno un importo per simulare.</div>
      )}
    </div>
  );
}

function Stat({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="card p-4 text-center">
      <p className="text-xs text-ink-3">{label}</p>
      <p className={`tabular mt-1 text-lg font-bold ${good === true ? "text-good" : good === false ? "text-bad" : ""}`}>{value}</p>
    </div>
  );
}
