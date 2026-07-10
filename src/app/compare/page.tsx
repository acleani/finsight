import Link from "next/link";
import CompareForm from "@/components/CompareForm";
import { ClaimTag, ProvenanceLine } from "@/components/Provenance";
import { fmtBig, fmtNum, fmtPct } from "@/lib/format";
import {
  annualizedReturn, annualizedVolatility, maxDrawdown, seriesCagr, trailingReturn,
} from "@/lib/indicators";
import { fundamentals, marketData } from "@/lib/providers";
import { computeScores, lastFcf } from "@/lib/scoring";

export const metadata = { title: "Confronta titoli — FinSight" };

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ symbols?: string }>;
}) {
  const { symbols: raw } = await searchParams;
  const symbols = (raw ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 5);

  const fp = fundamentals();
  const md = marketData();
  const all = await fp.listCompanies();

  const cols = await Promise.all(
    symbols.map(async (symbol) => {
      const [company, f, quote, series] = await Promise.all([
        fp.getCompany(symbol),
        fp.getFundamentals(symbol),
        md.getQuote(symbol),
        md.getPriceSeries(symbol),
      ]);
      if (!company) return null;
      const bars = series?.bars ?? null;
      const scores = computeScores(f, bars);
      const fcf = f ? lastFcf(f) : null;
      return {
        company, f, quote, scores,
        r1y: bars ? trailingReturn(bars, 252) : null,
        r5y: bars ? annualizedReturn(bars, 5) : null,
        vol: bars ? annualizedVolatility(bars) : null,
        dd: bars ? maxDrawdown(bars)?.maxDrawdownPct ?? null : null,
        revCagr: f ? seriesCagr(f.revenue) : null,
        fcfMargin: f && fcf != null && f.revenue.length
          ? (fcf / f.revenue[f.revenue.length - 1]) * 100 : null,
      };
    }),
  ).then((r) => r.filter((c) => c != null));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Confronta titoli</h1>
        <p className="mt-1 text-ink-2">Da 2 a 5 aziende fianco a fianco, sulle stesse metriche.</p>
      </header>

      <CompareForm all={all.map((c) => ({ symbol: c.symbol, name: c.name }))} selected={symbols} />

      {cols.length >= 2 ? (
        <section className="card overflow-x-auto p-5">
          {cols[0]!.quote && <ProvenanceLine p={cols[0]!.quote.provenance} />}
          <table className="mt-3 w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left">
                <th className="w-52 pb-3 text-xs font-medium text-ink-3">Metrica</th>
                {cols.map((c) => (
                  <th key={c!.company.symbol} className="pb-3 text-right">
                    <Link href={`/stocks/${c!.company.symbol}`} className="font-semibold hover:text-accent">
                      {c!.company.symbol}
                    </Link>
                    <div className="text-xs font-normal text-ink-3">{c!.company.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <Row label="Prezzo" cells={cols.map((c) => c!.quote ? `${fmtNum(c!.quote.price)} ${c!.company.currency}` : "n.d.")} />
              <Row label="Capitalizzazione" cells={cols.map((c) => fmtBig(c!.f?.marketCap ?? null, c!.company.currency))} />
              <Row label="Rendimento 1 anno" cells={cols.map((c) => fmtPct(c!.r1y))} signed={cols.map((c) => c!.r1y)} />
              <Row label="Rendimento 5 anni (ann.)" cells={cols.map((c) => fmtPct(c!.r5y))} signed={cols.map((c) => c!.r5y)} />
              <Row label="Crescita ricavi (CAGR 5a)" cells={cols.map((c) => fmtPct(c!.revCagr))} signed={cols.map((c) => c!.revCagr)} />
              <Row label="Margine FCF" cells={cols.map((c) => fmtPct(c!.fcfMargin, false))} />
              <Row label="ROIC" cells={cols.map((c) => c!.f?.roic != null ? `${fmtNum(c!.f!.roic! * 100, 0)}%` : "n.d.")} />
              <Row label="P/E" cells={cols.map((c) => c!.f?.pe != null ? fmtNum(c!.f!.pe!, 1) : "n.d.")} />
              <Row label="EV/EBITDA" cells={cols.map((c) => c!.f?.evEbitda != null ? fmtNum(c!.f!.evEbitda!, 1) : "n.d.")} />
              <Row label="Dividend yield" cells={cols.map((c) => c!.f?.dividendYield != null ? `${fmtNum(c!.f!.dividendYield! * 100, 1)}%` : "n.d.")} />
              <Row label="Volatilità annua" cells={cols.map((c) => fmtPct(c!.vol, false))} />
              <Row label="Max drawdown" cells={cols.map((c) => fmtPct(c!.dd, false))} />
              <Row label="Solidità finanziaria" cells={cols.map((c) => scoreCell(c!.scores.health.score))} />
              <Row label="Qualità" cells={cols.map((c) => scoreCell(c!.scores.quality.score))} />
              <Row label="Valutazione" cells={cols.map((c) => scoreCell(c!.scores.valuation.score))} />
              <Row label="Punteggio complessivo" cells={cols.map((c) => scoreCell(c!.scores.overall.score))} bold />
            </tbody>
          </table>

          <div className="mt-5 border-t border-grid pt-4">
            <h2 className="text-base font-semibold">Lettura del confronto <ClaimTag kind="INTERPRETATION" /></h2>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-ink-2">
              {readComparison(cols as NonNullable<(typeof cols)[number]>[]).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-ink-3">
              Quando l&apos;evidenza è mista non viene dichiarato un &quot;vincitore&quot;: dipende dal tuo profilo e orizzonte.
            </p>
          </div>
        </section>
      ) : (
        <section className="card p-8 text-center text-ink-2">
          <p className="text-lg">Seleziona almeno due titoli per iniziare il confronto.</p>
          <p className="mt-2 text-sm text-ink-3">
            Esempi: <Link href="/compare?symbols=AAPL,MSFT" className="text-accent hover:underline">AAPL vs MSFT</Link>
            {" · "}<Link href="/compare?symbols=ENEL.MI,ISP.MI,RACE.MI" className="text-accent hover:underline">le tre italiane</Link>
          </p>
        </section>
      )}
    </div>
  );
}

function Row({
  label, cells, signed, bold = false,
}: {
  label: string; cells: string[]; signed?: (number | null)[]; bold?: boolean;
}) {
  return (
    <tr className="border-t border-grid">
      <td className="py-2 text-ink-2">{label}</td>
      {cells.map((v, i) => (
        <td key={i} className={`tabular py-2 text-right ${bold ? "font-bold" : "font-medium"} ${
          signed?.[i] != null ? (signed[i]! >= 0 ? "text-good" : "text-bad") : ""}`}>
          {v}
        </td>
      ))}
    </tr>
  );
}

function scoreCell(s: number | null) {
  return s == null ? "n.d." : `${s}/100`;
}

type Col = {
  company: { symbol: string; name: string };
  scores: ReturnType<typeof computeScores>;
  r1y: number | null; revCagr: number | null; vol: number | null;
  f: { pe: number | null } | null;
};

/** Frasi deterministiche di lettura: solo confronti verificabili sui dati. */
function readComparison(cols: Col[]): string[] {
  const out: string[] = [];
  const by = <T,>(get: (c: Col) => T | null, better: (a: T, b: T) => boolean) => {
    const valid = cols.filter((c) => get(c) != null);
    if (valid.length < 2) return null;
    return valid.reduce((a, b) => (better(get(a)! as T, get(b)! as T) ? a : b));
  };

  const safest = by((c) => c.scores.health.score, (a, b) => a > b);
  if (safest) out.push(`${safest.company.symbol} ha il punteggio di solidità finanziaria più alto del gruppo.`);
  const cheapest = by((c) => c.scores.valuation.score, (a, b) => a > b);
  if (cheapest) out.push(`${cheapest.company.symbol} risulta il meno caro rispetto alla propria storia e ai flussi di cassa.`);
  const grower = by((c) => c.revCagr, (a, b) => a > b);
  if (grower) out.push(`${grower.company.symbol} ha la crescita dei ricavi più alta (CAGR 5 anni).`);
  const risky = by((c) => c.vol, (a, b) => a > b);
  if (risky) out.push(`${risky.company.symbol} è il più volatile: maggiore rischio di esecuzione e oscillazioni più ampie.`);
  return out;
}
