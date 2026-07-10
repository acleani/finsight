/**
 * Correlazione di Pearson tra i rendimenti giornalieri dei titoli (CALCOLO).
 * Finestra: ultimi ~252 giorni di borsa in comune tra le due serie.
 */

import type { PriceBar } from "./types";

export function dailyReturnsByDate(bars: PriceBar[]): Map<string, number> {
  const m = new Map<string, number>();
  for (let i = 1; i < bars.length; i++) {
    const prev = bars[i - 1].close;
    if (prev > 0) m.set(bars[i].date, Math.log(bars[i].close / prev));
  }
  return m;
}

export function correlation(
  a: Map<string, number>, b: Map<string, number>, window = 252,
): number | null {
  const dates = [...a.keys()].filter((d) => b.has(d)).sort().slice(-window);
  if (dates.length < 60) return null;
  const xs = dates.map((d) => a.get(d)!);
  const ys = dates.map((d) => b.get(d)!);
  const mx = avg(xs), my = avg(ys);
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < xs.length; i++) {
    const vx = xs[i] - mx, vy = ys[i] - my;
    num += vx * vy; dx += vx * vx; dy += vy * vy;
  }
  if (dx === 0 || dy === 0) return null;
  return num / Math.sqrt(dx * dy);
}

function avg(v: number[]) { return v.reduce((s, x) => s + x, 0) / v.length; }

export function corrLabel(c: number): string {
  const a = Math.abs(c);
  if (a >= 0.7) return c > 0 ? "molto alta" : "molto negativa";
  if (a >= 0.45) return c > 0 ? "alta" : "negativa";
  if (a >= 0.25) return c > 0 ? "moderata" : "lievemente negativa";
  return "bassa";
}

/** Colore della cella nella matrice (diverging: rosso = alta, blu = negativa). */
export function corrColor(c: number): string {
  if (c >= 0.7) return "rgba(227, 73, 72, 0.55)";
  if (c >= 0.45) return "rgba(227, 73, 72, 0.32)";
  if (c >= 0.25) return "rgba(227, 73, 72, 0.15)";
  if (c <= -0.25) return "rgba(42, 120, 214, 0.30)";
  if (c <= -0.1) return "rgba(42, 120, 214, 0.15)";
  return "transparent";
}
