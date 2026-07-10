import { NextResponse } from "next/server";
import { fundamentals, marketData } from "@/lib/providers";
import { computeScores } from "@/lib/scoring";
import { trailingReturn } from "@/lib/indicators";

/**
 * Riepilogo per watchlist/idee: quote + punteggi oggettivi per dimensione.
 * I punteggi personalizzati si calcolano client-side dal profilo locale,
 * partendo SEMPRE da queste dimensioni oggettive.
 */
export async function GET() {
  const fp = fundamentals();
  const md = marketData();
  const companies = await fp.listCompanies();

  const rows = await Promise.all(
    companies.map(async (c) => {
      const [f, quote, series] = await Promise.all([
        fp.getFundamentals(c.symbol),
        md.getQuote(c.symbol),
        md.getPriceSeries(c.symbol),
      ]);
      const bars = series?.bars ?? null;
      const s = computeScores(f, bars);
      return {
        company: c,
        quote,
        dividendYield: f?.dividendYield ?? null,
        r12: bars ? trailingReturn(bars, 252) : null,
        scores: {
          quality: s.quality.score,
          health: s.health.score,
          growth: s.growth.score,
          valuation: s.valuation.score,
          momentum: s.momentum.score,
          risk: s.risk.score,
          overall: s.overall.score,
          dataConfidence: s.dataConfidence,
        },
      };
    }),
  );
  return NextResponse.json({ rows });
}

export type OverviewRow = {
  company: {
    symbol: string; name: string; exchange: string; country: string;
    currency: string; sector: string; industry: string; themes: string[];
  };
  quote: { price: number; change: number; changePct: number } | null;
  dividendYield: number | null;
  r12: number | null;
  scores: {
    quality: number | null; health: number | null; growth: number | null;
    valuation: number | null; momentum: number | null; risk: number | null;
    overall: number | null; dataConfidence: number;
  };
};
