import Link from "next/link";
import { fundamentals, marketData } from "@/lib/providers";
import { computeScores } from "@/lib/scoring";
import { seriesCagr, trailingReturn } from "@/lib/indicators";
import { lastFcf } from "@/lib/scoring";
import { fmtPct } from "@/lib/format";
import type { Company, Fundamentals, PriceBar } from "@/lib/types";

export const metadata = { title: "Scopri — FinSight" };

interface Row {
  company: Company;
  f: Fundamentals | null;
  bars: PriceBar[] | null;
  overall: number | null;
  health: number | null;
  valuation: number | null;
  momentum: number | null;
  r12: number | null;
}

/**
 * Collezioni con regole di filtro dichiarate accanto al titolo:
 * l'utente vede sempre PERCHÉ un titolo è in lista.
 */
const COLLECTIONS: {
  key: string; title: string; rule: string;
  filter: (r: Row) => boolean; sort: (a: Row, b: Row) => number;
}[] = [
  {
    key: "compounders",
    title: "Compounder di qualità",
    rule: "ROIC > 20% e crescita ricavi (CAGR 5a) > 8%",
    filter: (r) => (r.f?.roic ?? 0) > 0.2 && (seriesCagr(r.f?.revenue ?? []) ?? 0) > 8,
    sort: (a, b) => (b.overall ?? 0) - (a.overall ?? 0),
  },
  {
    key: "fortress",
    title: "Bilanci solidi",
    rule: "Punteggio di solidità finanziaria ≥ 70",
    filter: (r) => (r.health ?? 0) >= 70,
    sort: (a, b) => (b.health ?? 0) - (a.health ?? 0),
  },
  {
    key: "value",
    title: "Valutazione interessante",
    rule: "Punteggio valutazione ≥ 60 (multipli sotto la storia propria)",
    filter: (r) => (r.valuation ?? 0) >= 60,
    sort: (a, b) => (b.valuation ?? 0) - (a.valuation ?? 0),
  },
  {
    key: "dividends",
    title: "Dividendi consistenti",
    rule: "Dividend yield > 2,5% e payout < 80%",
    filter: (r) => (r.f?.dividendYield ?? 0) > 0.025 && (r.f?.payoutRatio ?? 1) < 0.8,
    sort: (a, b) => (b.f?.dividendYield ?? 0) - (a.f?.dividendYield ?? 0),
  },
  {
    key: "momentum",
    title: "Momentum forte (attenzione alla valutazione)",
    rule: "Rendimento 12 mesi > 20%",
    filter: (r) => (r.r12 ?? 0) > 20,
    sort: (a, b) => (b.r12 ?? 0) - (a.r12 ?? 0),
  },
  {
    key: "cash",
    title: "Macchine da cassa",
    rule: "Margine FCF ultimo esercizio > 15%",
    filter: (r) => {
      if (!r.f) return false;
      const fcf = lastFcf(r.f);
      return fcf != null && r.f.revenue.length > 0 && fcf / r.f.revenue[r.f.revenue.length - 1] > 0.15;
    },
    sort: (a, b) => (b.overall ?? 0) - (a.overall ?? 0),
  },
  {
    key: "italy",
    title: "Quotate italiane",
    rule: "Borsa Italiana",
    filter: (r) => r.company.country === "IT",
    sort: (a, b) => (b.overall ?? 0) - (a.overall ?? 0),
  },
];

export default async function DiscoverPage() {
  const fp = fundamentals();
  const md = marketData();
  const companies = await fp.listCompanies();

  const rows: Row[] = await Promise.all(
    companies.map(async (company) => {
      const [f, series] = await Promise.all([
        fp.getFundamentals(company.symbol),
        md.getPriceSeries(company.symbol),
      ]);
      const bars = series?.bars ?? null;
      const scores = computeScores(f, bars);
      return {
        company, f, bars,
        overall: scores.overall.score,
        health: scores.health.score,
        valuation: scores.valuation.score,
        momentum: scores.momentum.score,
        r12: bars ? trailingReturn(bars, 252) : null,
      };
    }),
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Scopri</h1>
        <p className="mt-1 text-ink-2">
          Collezioni costruite con regole di filtro dichiarate — nessuna lista magica:
          il criterio è sempre scritto accanto al titolo della collezione.
        </p>
      </header>

      {COLLECTIONS.map((col) => {
        const items = rows.filter(col.filter).sort(col.sort);
        return (
          <section key={col.key} className="card p-5">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">{col.title}</h2>
              <span className="text-xs text-ink-3">Regola: {col.rule}</span>
            </div>
            {items.length === 0 ? (
              <p className="text-sm text-ink-3">Nessun titolo coperto soddisfa la regola in questo momento.</p>
            ) : (
              <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {items.map((r) => (
                  <li key={r.company.symbol}>
                    <Link href={`/stocks/${r.company.symbol}`}
                      className="block rounded-xl border border-bordr p-3 hover:border-accent">
                      <div className="flex items-baseline justify-between">
                        <span className="font-semibold">{r.company.symbol}</span>
                        <span className="tabular text-sm font-medium">{r.overall ?? "n.d."}/100</span>
                      </div>
                      <p className="text-sm text-ink-2">{r.company.name}</p>
                      <p className="mt-1 text-xs text-ink-3">
                        {r.company.sector} · 12 mesi: <span className={`${(r.r12 ?? 0) >= 0 ? "text-good" : "text-bad"}`}>{fmtPct(r.r12)}</span>
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
