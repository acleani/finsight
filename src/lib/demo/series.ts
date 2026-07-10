/**
 * Generatore deterministico di serie storiche DEMO.
 *
 * Modello a fattori: rendimento = drift + βm·mercato + βs·settore + idiosincratico.
 * Così le correlazioni tra titoli dello stesso settore (es. semiconduttori)
 * sono realisticamente alte e quelle tra settori lontani basse — utile per
 * la sezione Correlazioni. Restano dati sintetici, non reali.
 */

import type { PriceBar, PriceSeries } from "../types";
import { demoProvenance } from "./companies";

type Params = {
  start: number; drift: number; vol: number; baseVolume: number;
  betaM: number;               // esposizione al fattore mercato
  factor: string | null;       // fattore settoriale condiviso
  betaS: number;               // esposizione al fattore settoriale
};

const PARAMS: Record<string, Params> = {
  AAPL: { start: 60, drift: 0.00062, vol: 0.011, baseVolume: 55e6, betaM: 1.1, factor: "bigtech", betaS: 0.8 },
  MSFT: { start: 180, drift: 0.00068, vol: 0.010, baseVolume: 25e6, betaM: 1.0, factor: "bigtech", betaS: 0.9 },
  GOOGL: { start: 68, drift: 0.00055, vol: 0.012, baseVolume: 28e6, betaM: 1.05, factor: "bigtech", betaS: 0.85 },
  AMZN: { start: 95, drift: 0.00040, vol: 0.014, baseVolume: 45e6, betaM: 1.2, factor: "bigtech", betaS: 0.8 },
  NVDA: { start: 12, drift: 0.00165, vol: 0.019, baseVolume: 300e6, betaM: 1.5, factor: "semis", betaS: 1.3 },
  AVGO: { start: 45, drift: 0.00120, vol: 0.015, baseVolume: 20e6, betaM: 1.3, factor: "semis", betaS: 1.1 },
  TSM: { start: 55, drift: 0.00085, vol: 0.014, baseVolume: 12e6, betaM: 1.1, factor: "semis", betaS: 1.0 },
  "005930.KS": { start: 45000, drift: 0.00035, vol: 0.013, baseVolume: 14e6, betaM: 0.9, factor: "semis", betaS: 0.7 },
  ASML: { start: 250, drift: 0.00080, vol: 0.015, baseVolume: 1.2e6, betaM: 1.2, factor: "semis", betaS: 0.9 },
  SAP: { start: 110, drift: 0.00048, vol: 0.011, baseVolume: 1.5e6, betaM: 0.9, factor: "bigtech", betaS: 0.4 },
  JNJ: { start: 140, drift: 0.00014, vol: 0.008, baseVolume: 7e6, betaM: 0.5, factor: "defensive", betaS: 0.6 },
  KO: { start: 52, drift: 0.00018, vol: 0.007, baseVolume: 13e6, betaM: 0.45, factor: "defensive", betaS: 0.6 },
  "RACE.MI": { start: 170, drift: 0.00065, vol: 0.011, baseVolume: 0.4e6, betaM: 0.8, factor: "italy", betaS: 0.5 },
  "ENEL.MI": { start: 7.5, drift: 0.00012, vol: 0.009, baseVolume: 25e6, betaM: 0.6, factor: "italy", betaS: 0.9 },
  "ISP.MI": { start: 2.2, drift: 0.00048, vol: 0.013, baseVolume: 90e6, betaM: 1.0, factor: "italy", betaS: 1.1 },
};

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

function gauss(r: () => number) {
  const u = Math.max(r(), 1e-9);
  const v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const END_DATE = new Date("2026-07-10T00:00:00Z");
const YEARS = 10;
const TOTAL_DAYS = Math.round(YEARS * 365.25);

/** Serie di shock condivise (mercato e settori), deterministiche. */
const shockCache = new Map<string, number[]>();
function shocks(name: string, dailyVol: number): number[] {
  const hit = shockCache.get(name);
  if (hit) return hit;
  const r = rng(`FACTOR:${name}`);
  const arr: number[] = [];
  for (let i = 0; i <= TOTAL_DAYS; i++) arr.push(gauss(r) * dailyVol);
  shockCache.set(name, arr);
  return arr;
}

const cache = new Map<string, PriceSeries>();

export function getDemoSeries(symbol: string): PriceSeries | null {
  const p = PARAMS[symbol];
  if (!p) return null;
  const hit = cache.get(symbol);
  if (hit) return hit;

  const r = rng(symbol);
  const market = shocks("market", 0.009);
  const sector = p.factor ? shocks(p.factor, 0.010) : null;
  const bars: PriceBar[] = [];
  let price = p.start;

  for (let i = TOTAL_DAYS; i >= 0; i--) {
    const d = new Date(END_DATE);
    d.setUTCDate(d.getUTCDate() - i);
    const dow = d.getUTCDay();
    if (dow === 0 || dow === 6) continue;

    const t = (TOTAL_DAYS - i) / TOTAL_DAYS;
    const regime = Math.sin(t * Math.PI * 4 + p.start) * 0.0007;
    const idx = TOTAL_DAYS - i;
    const ret =
      p.drift + regime +
      p.betaM * market[idx] +
      (sector ? p.betaS * sector[idx] : 0) +
      p.vol * gauss(r);

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
