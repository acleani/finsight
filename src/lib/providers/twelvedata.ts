/**
 * Adapter Twelve Data (dati di mercato reali).
 * Si attiva impostando TWELVE_DATA_API_KEY (vedi .env.example).
 * Implementa quotazioni e serie storiche; i fondamentali completi
 * richiedono un piano dati superiore e restano al provider demo
 * finché non è configurato un FundamentalsProvider reale.
 */

import type { PriceBar, PriceSeries, Quote } from "../types";
import type { MarketDataProvider } from "./types";

const BASE = "https://api.twelvedata.com";

export class TwelveDataProvider implements MarketDataProvider {
  readonly name = "Twelve Data";

  constructor(private apiKey: string) {}

  private async call<T>(path: string, params: Record<string, string>): Promise<T | null> {
    const qs = new URLSearchParams({ ...params, apikey: this.apiKey });
    try {
      const res = await fetch(`${BASE}${path}?${qs}`, {
        next: { revalidate: 300 }, // cache 5 minuti lato server
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as T & { status?: string };
      if ((data as { status?: string }).status === "error") return null;
      return data;
    } catch {
      return null; // degradazione controllata: il chiamante mostra "dato non disponibile"
    }
  }

  async getQuote(symbol: string): Promise<Quote | null> {
    type R = { close: string; change: string; percent_change: string; volume: string; currency: string };
    const d = await this.call<R>("/quote", { symbol });
    if (!d?.close) return null;
    return {
      symbol,
      price: parseFloat(d.close),
      change: parseFloat(d.change),
      changePct: parseFloat(d.percent_change),
      volume: d.volume ? parseInt(d.volume, 10) : null,
      provenance: {
        source: "Twelve Data",
        freshness: "delayed",
        retrievedAt: new Date().toISOString(),
        currency: d.currency,
      },
    };
  }

  async getPriceSeries(symbol: string): Promise<PriceSeries | null> {
    type R = { values?: { datetime: string; open: string; high: string; low: string; close: string; volume: string }[] };
    const d = await this.call<R>("/time_series", {
      symbol, interval: "1day", outputsize: "5000",
    });
    if (!d?.values?.length) return null;
    const bars: PriceBar[] = d.values
      .map((v) => ({
        date: v.datetime,
        open: parseFloat(v.open), high: parseFloat(v.high),
        low: parseFloat(v.low), close: parseFloat(v.close),
        volume: v.volume ? parseInt(v.volume, 10) : 0,
      }))
      .reverse();
    return {
      symbol, bars,
      provenance: {
        source: "Twelve Data",
        freshness: "end-of-day",
        retrievedAt: new Date().toISOString(),
      },
    };
  }
}
