/**
 * Registro dei provider: sceglie automaticamente i dati reali quando
 * le credenziali sono configurate, altrimenti resta in DEMO MODE.
 * La UI legge getDataMode() per mostrare il banner "Dati demo".
 */

import { DemoProvider } from "./demo";
import { TwelveDataProvider } from "./twelvedata";
import type {
  FundamentalsProvider, MarketDataProvider, NewsProvider, SearchProvider,
} from "./types";
import type { DataMode } from "../types";

const demo = new DemoProvider();

const twelveKey = process.env.TWELVE_DATA_API_KEY;

export function getDataMode(): DataMode {
  return twelveKey ? "live" : "demo";
}

export function marketData(): MarketDataProvider {
  return twelveKey ? new TwelveDataProvider(twelveKey) : demo;
}

/** I fondamentali reali richiedono un provider dedicato: finché manca, demo. */
export function fundamentals(): FundamentalsProvider {
  return demo;
}

export function news(): NewsProvider {
  return demo;
}

export function search(): SearchProvider {
  return demo;
}
