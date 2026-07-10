/**
 * Metriche deterministiche calcolate dalle serie storiche (CALCOLO).
 * Nessuna di queste funzioni inventa dati: con input insufficienti
 * restituiscono null e l'interfaccia mostra "Dato non disponibile".
 */

import type { PriceBar } from "./types";

export function sma(values: (number | null)[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  let sum = 0;
  let count = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v == null) continue;
    sum += v;
    count++;
    if (count > period) {
      // rimuovi il valore uscito dalla finestra (assumendo serie senza null interni)
      const out_v = values[i - period];
      if (out_v != null) { sum -= out_v; count--; }
    }
    if (count === period) out[i] = sum / period;
  }
  return out;
}

export function rsi(closes: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length <= period) return out;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  gain /= period; loss /= period;
  out[period] = 100 - 100 / (1 + (loss === 0 ? Infinity : gain / loss));
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    gain = (gain * (period - 1) + Math.max(d, 0)) / period;
    loss = (loss * (period - 1) + Math.max(-d, 0)) / period;
    out[i] = 100 - 100 / (1 + (loss === 0 ? Infinity : gain / loss));
  }
  return out;
}

/** Rendimento % su n giorni di borsa (null se la storia non basta). */
export function trailingReturn(bars: PriceBar[], days: number): number | null {
  if (bars.length <= days) return null;
  const prev = bars[bars.length - 1 - days].close;
  if (!prev) return null;
  return (bars[bars.length - 1].close / prev - 1) * 100;
}

export function ytdReturn(bars: PriceBar[]): number | null {
  if (!bars.length) return null;
  const year = bars[bars.length - 1].date.slice(0, 4);
  const first = bars.find((b) => b.date.startsWith(year));
  if (!first || first === bars[bars.length - 1]) return null;
  return (bars[bars.length - 1].close / first.close - 1) * 100;
}

/** CAGR % su n anni (252 giorni di borsa/anno). */
export function annualizedReturn(bars: PriceBar[], years: number): number | null {
  const days = Math.round(years * 252);
  if (bars.length <= days) return null;
  const start = bars[bars.length - 1 - days].close;
  const end = bars[bars.length - 1].close;
  if (!start) return null;
  return (Math.pow(end / start, 1 / years) - 1) * 100;
}

/** Volatilità annualizzata % dei rendimenti giornalieri. */
export function annualizedVolatility(bars: PriceBar[], lookbackDays = 252): number | null {
  const closes = bars.slice(-lookbackDays - 1).map((b) => b.close);
  if (closes.length < 30) return null;
  const rets: number[] = [];
  for (let i = 1; i < closes.length; i++) rets.push(Math.log(closes[i] / closes[i - 1]));
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const varr = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (rets.length - 1);
  return Math.sqrt(varr * 252) * 100;
}

export interface DrawdownInfo {
  maxDrawdownPct: number;
  peakDate: string;
  troughDate: string;
  recoveryMonths: number | null; // null = non ancora recuperato
}

export function maxDrawdown(bars: PriceBar[]): DrawdownInfo | null {
  if (bars.length < 30) return null;
  let peak = bars[0].close, peakDate = bars[0].date;
  let maxDd = 0, ddPeakDate = peakDate, troughDate = bars[0].date;
  for (const b of bars) {
    if (b.close > peak) { peak = b.close; peakDate = b.date; }
    const dd = b.close / peak - 1;
    if (dd < maxDd) { maxDd = dd; ddPeakDate = peakDate; troughDate = b.date; }
  }
  // tempo di recupero: primo giorno dopo il minimo in cui il prezzo torna al picco
  const peakValue = bars.find((b) => b.date === ddPeakDate)?.close ?? null;
  let recoveryMonths: number | null = null;
  if (peakValue != null) {
    const troughIdx = bars.findIndex((b) => b.date === troughDate);
    for (let i = troughIdx; i < bars.length; i++) {
      if (bars[i].close >= peakValue) {
        const ms = new Date(bars[i].date).getTime() - new Date(troughDate).getTime();
        recoveryMonths = Math.round(ms / (30.44 * 24 * 3600 * 1000));
        break;
      }
    }
  }
  return { maxDrawdownPct: maxDd * 100, peakDate: ddPeakDate, troughDate, recoveryMonths };
}

export function positiveYearsPct(bars: PriceBar[]): number | null {
  const byYear = new Map<string, { first: number; last: number }>();
  for (const b of bars) {
    const y = b.date.slice(0, 4);
    const e = byYear.get(y);
    if (!e) byYear.set(y, { first: b.close, last: b.close });
    else e.last = b.close;
  }
  const years = [...byYear.values()];
  if (years.length < 3) return null;
  const positive = years.filter((y) => y.last > y.first).length;
  return (positive / years.length) * 100;
}

/** CAGR % dell'ultima vs prima osservazione di una serie annuale. */
export function seriesCagr(values: number[]): number | null {
  if (values.length < 2) return null;
  const first = values[0], last = values[values.length - 1];
  if (first <= 0 || last <= 0) return null;
  return (Math.pow(last / first, 1 / (values.length - 1)) - 1) * 100;
}
