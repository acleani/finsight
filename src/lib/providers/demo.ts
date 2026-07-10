/** Provider DEMO: fixture sintetiche chiaramente etichettate. */

import type { Company, Fundamentals, NewsArticle, PriceSeries, Quote } from "../types";
import { COMPANIES, FUNDAMENTALS, demoProvenance } from "../demo/companies";
import { getDemoSeries } from "../demo/series";
import { NEWS } from "../demo/news";
import type {
  FundamentalsProvider, MarketDataProvider, NewsProvider, SearchProvider, SearchResult,
} from "./types";

export class DemoProvider
  implements MarketDataProvider, FundamentalsProvider, NewsProvider, SearchProvider {
  readonly name = "Demo fixtures";

  async getQuote(symbol: string): Promise<Quote | null> {
    const series = getDemoSeries(symbol);
    if (!series || series.bars.length < 2) return null;
    const last = series.bars[series.bars.length - 1];
    const prev = series.bars[series.bars.length - 2];
    return {
      symbol,
      price: last.close,
      change: +(last.close - prev.close).toFixed(2),
      changePct: +(((last.close / prev.close) - 1) * 100).toFixed(2),
      volume: last.volume,
      provenance: demoProvenance(undefined, companyOf(symbol)?.currency),
    };
  }

  async getPriceSeries(symbol: string): Promise<PriceSeries | null> {
    return getDemoSeries(symbol);
  }

  async getCompany(symbol: string): Promise<Company | null> {
    return companyOf(symbol) ?? null;
  }

  async getFundamentals(symbol: string): Promise<Fundamentals | null> {
    return FUNDAMENTALS[symbol] ?? null;
  }

  async listCompanies(): Promise<Company[]> {
    return COMPANIES;
  }

  async getNews(symbol?: string): Promise<NewsArticle[]> {
    const items = symbol ? NEWS.filter((n) => n.tickers.includes(symbol)) : NEWS;
    return [...items].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }

  async search(query: string): Promise<SearchResult[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return COMPANIES.filter(
      (c) =>
        c.symbol.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.sector.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q),
    ).map((c) => ({
      symbol: c.symbol, name: c.name, exchange: c.exchange,
      country: c.country, currency: c.currency, assetType: "Azione",
    }));
  }
}

function companyOf(symbol: string): Company | undefined {
  return COMPANIES.find((c) => c.symbol === symbol);
}
