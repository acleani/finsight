/**
 * Astrazione dei provider dati: la UI e la logica di business dipendono
 * solo da queste interfacce, mai da un fornitore specifico.
 * Sostituire il provider = scrivere un nuovo adapter, zero modifiche altrove.
 */

import type {
  Company, Fundamentals, NewsArticle, PriceSeries, Quote,
} from "../types";

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  country: string;
  currency: string;
  assetType: string;
}

export interface MarketDataProvider {
  readonly name: string;
  getQuote(symbol: string): Promise<Quote | null>;
  getPriceSeries(symbol: string): Promise<PriceSeries | null>;
}

export interface FundamentalsProvider {
  readonly name: string;
  getCompany(symbol: string): Promise<Company | null>;
  getFundamentals(symbol: string): Promise<Fundamentals | null>;
  listCompanies(): Promise<Company[]>;
}

export interface NewsProvider {
  readonly name: string;
  getNews(symbol?: string): Promise<NewsArticle[]>;
}

export interface SearchProvider {
  readonly name: string;
  search(query: string): Promise<SearchResult[]>;
}
