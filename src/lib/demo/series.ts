/**
 * Generatore deterministico di serie storiche DEMO.
 * Random walk geometrico con seed derivato dal simbolo: la stessa azienda
 * produce sempre la stessa serie. I parametri (drift, volatilità) sono
 * scelti per coerenza narrativa con le fixture, non sono dati reali.
 */

import type { PriceBar, PriceSeries } from "../types";
import { demoProvenance } from "./companies";

const PARAMS: Record<string, { start: number; drift: number; vol: number; baseVolume: number }> = {
  AAPL: { start: 60, drift: 0.00075, vol: 0.017, baseVolume: 55e6 },
  MSFT: { start: 180, drift: 0.00082, vol: 0.016, baseVolume: 25e6 },
  NVDA: { start: 12, drift: 0.0019, vol: 0.031, baseVolume: 300e6 },
  GOOGL: { start: 68, drift: 0.00068, vol: 0.018, baseVolume: 28e6 },
  AMZN: { start: 95, drift: 0.0005, vol: 0.021, baseVolume: 45e6 },
  JNJ: { start: 140, drift: 0.00016, vol: 0.010, baseVolume: 7e6 },
  KO: { start: 52, drift: 0.0002, vol: 0.009, baseVolume: 13e6 },
  ASML: { start: 250, drift: 0.00095, vol: 0.023, baseVolume: 1.2e6 },
  SAP: { start: 110, drift: 0.00055, vol: 0.015, baseVolume: 1.5e6 },
  "RACE.MI": { start: 170, drift: 0.00078, vol: 0.015, baseVolume: 0.4e6 },
  "ENEL.MI": { start: 7.5, drift: 0.00012, vol: 0.013, baseVolume: 25e6 },
  "ISP.MI": { start: 2.2, drift: 0.00055, vol: 0.017, baseVolume: 90e6 },
};

/** PRNG deterministico (mulberry32). */
function rng(seedStr: string) {
  let h = 1779033703;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Normale standard via Box-Muller. */
function gauss(r: () => number) {
  const u = Math.max(r(), 1e-9);
  const v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const END_DATE = new Date("2026-07-10T00:00:00Z"); // "oggi" del dataset demo
const YEARS = 10;

const cache = new Map<string, PriceSeries>();

export function getDemoSeries(symbol: string): PriceSeries | null {
  const p = PARAMS[symbol];
  if (!p) return null;
  const hit = cache.get(symbol);
  if (hit) return hit;

  const r = rng(symbol);
  const bars: PriceBar[] = [];
  const totalDays = Math.round(YEARS * 365.25);
  let price = p.start;

  for (let i = totalDays; i >= 0; i--) {
    const d = new Date(END_DATE);
    d.setUTCDate(d.getUTCDate() - i);
    const dow = d.getUTCDay();
    if (dow === 0 || dow === 6) continue; // weekend

    // regime: un ciclo lento aumenta/riduce il drift per creare fasi di mercato
    const t = (totalDays - i) / totalDays;
    const regime = Math.sin(t * Math.PI * 4 + p.start) * 0.0009;
    const ret = p.drift + regime + p.vol * gauss(r);
    const open = price;
    price = Math.max(0.5, price * Math.exp(ret));
    const close = price;
    const hi = Math.max(open, close) * (1 + r() * p.vol * 0.7);
    const lo = Math.min(open, close) * (1 - r() * p.vol * 0.7);
    const volume = Math.round(p.baseVolume * (0.6 + r() * 0.9 + Math.abs(ret) * 25));

    bars.push({
      date: d.toISOString().slice(0, 10),
      open: round(open), high: round(hi), low: round(lo), close: round(close),
      volume,
    });
  }

  const series: PriceSeries = { symbol, bars, provenance: demoProvenance(undefined) };
  cache.set(symbol, series);
  return series;
}

function round(v: number) {
  return Math.round(v * 100) / 100;
}
