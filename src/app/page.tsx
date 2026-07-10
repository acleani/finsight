import Link from "next/link";
import SearchBox from "@/components/SearchBox";
import SentimentLabel from "@/components/SentimentLabel";
import { ProvenanceLine } from "@/components/Provenance";
import { fundamentals, marketData, news } from "@/lib/providers";
import { trailingReturn } from "@/lib/indicators";
import { fmtNum, fmtPct } from "@/lib/format";

export default async function HomePage() {
  const companies = await fundamentals().listCompanies();
  const md = marketData();

  const rows = (
    await Promise.all(
      companies.map(async (c) => {
        const [quote, series] = await Promise.all([
          md.getQuote(c.symbol),
          md.getPriceSeries(c.symbol),
        ]);
        return {
          company: c,
          quote,
          r1m: series ? trailingReturn(series.bars, 22) : null,
        };
      }),
    )
  ).filter((r) => r.quote != null);

  const sorted = [...rows].sort((a, b) => b.quote!.changePct - a.quote!.changePct);
  const gainers = sorted.slice(0, 3);
  const losers = sorted.slice(-3).reverse();

  // trend di settore: media dei rendimenti a 1 mese per settore (CALCOLO trasparente)
  const bySector = new Map<string, number[]>();
  for (const r of rows) {
    if (r.r1m == null) continue;
    const arr = bySector.get(r.company.sector) ?? [];
    arr.push(r.r1m);
    bySector.set(r.company.sector, arr);
  }
  const sectorTrends = [...bySector.entries()]
    .map(([sector, vals]) => ({
      sector,
      avg: vals.reduce((a, b) => a + b, 0) / vals.length,
    }))
    .sort((a, b) => b.avg - a.avg);

  const latestNews = (await news().getNews()).slice(0, 5);

  return (
    <div className="space-y-8">
      <section className="pt-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Capire un&apos;azienda prima di investire
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-ink-2">
          Fondamentali, valutazione, rischi e punteggi spiegabili — con la provenienza
          di ogni dato. Evidenza, non hype.
        </p>
        <div className="mx-auto mt-5 flex justify-center">
          <SearchBox />
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2 text-sm">
          <span className="text-ink-3">Prova:</span>
          {["AAPL", "NVDA", "RACE.MI", "ENEL.MI", "ISP.MI"].map((s) => (
            <Link key={s} href={`/stocks/${s}`}
              className="rounded-full border border-bordr px-3 py-0.5 text-ink-2 hover:border-accent hover:text-ink">
              {s}
            </Link>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-1 text-lg font-semibold">Panoramica del listino</h2>
        {rows[0]?.quote && <ProvenanceLine p={rows[0].quote.provenance} />}
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-3">
                <th className="pb-2 font-medium">Titolo</th>
                <th className="pb-2 text-right font-medium">Prezzo</th>
                <th className="pb-2 text-right font-medium">Var. giorno</th>
                <th className="pb-2 text-right font-medium">1 mese</th>
                <th className="pb-2 text-right font-medium">Settore</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ company: c, quote, r1m }) => (
                <tr key={c.symbol} className="border-t border-grid">
                  <td className="py-2">
                    <Link href={`/stocks/${c.symbol}`} className="font-medium hover:text-accent">
                      {c.symbol}
                    </Link>
                    <span className="ml-2 hidden text-ink-3 md:inline">{c.name}</span>
                  </td>
                  <td className="tabular py-2 text-right">{fmtNum(quote!.price)} {c.currency}</td>
                  <td className={`tabular py-2 text-right font-medium ${quote!.changePct >= 0 ? "text-good" : "text-bad"}`}>
                    {quote!.changePct >= 0 ? "▲" : "▼"} {fmtPct(quote!.changePct)}
                  </td>
                  <td className={`tabular py-2 text-right ${r1m != null && r1m >= 0 ? "text-good" : "text-bad"}`}>
                    {fmtPct(r1m)}
                  </td>
                  <td className="py-2 text-right text-ink-2">{c.sector}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-3">
        <section className="card p-5">
          <h2 className="mb-3 text-base font-semibold">Migliori oggi</h2>
          <MoverList items={gainers} />
        </section>
        <section className="card p-5">
          <h2 className="mb-3 text-base font-semibold">Peggiori oggi</h2>
          <MoverList items={losers} />
          <p className="mt-3 text-xs text-ink-3">
            Un forte movimento di prezzo, da solo, non rende un titolo attraente o da evitare.
          </p>
        </section>
        <section className="card p-5">
          <h2 className="mb-3 text-base font-semibold">Trend di settore (1 mese)</h2>
          <ul className="space-y-2 text-sm">
            {sectorTrends.map((s) => (
              <li key={s.sector} className="flex items-center justify-between gap-2">
                <span className="text-ink-2">{s.sector}</span>
                <span className={`tabular font-medium ${s.avg >= 0 ? "text-good" : "text-bad"}`}>
                  {fmtPct(s.avg)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-3">
            Media dei rendimenti a 1 mese dei titoli coperti per settore — un segnale
            trasparente, non una previsione.
          </p>
        </section>
      </div>

      <section className="card p-5">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Ultime notizie</h2>
          <Link href="/news" className="text-sm text-accent hover:underline">Tutte le notizie →</Link>
        </div>
        <ul className="space-y-3">
          {latestNews.map((n) => (
            <li key={n.id} className="border-t border-grid pt-3 first:border-t-0 first:pt-0">
              <p className="font-medium">{n.headline}</p>
              <p className="text-xs text-ink-3">
                {n.publisher} · {n.tickers.join(", ")} · <SentimentLabel s={n.sentiment} />
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function MoverList({
  items,
}: {
  items: {
    company: { symbol: string; name: string };
    quote: { changePct: number; price: number } | null;
  }[];
}) {
  return (
    <ul className="space-y-2 text-sm">
      {items.map(({ company, quote }) => (
        <li key={company.symbol} className="flex items-center justify-between gap-2">
          <Link href={`/stocks/${company.symbol}`} className="font-medium hover:text-accent">
            {company.symbol}
          </Link>
          <span className={`tabular font-medium ${quote!.changePct >= 0 ? "text-good" : "text-bad"}`}>
            {quote!.changePct >= 0 ? "▲" : "▼"} {fmtPct(quote!.changePct)}
          </span>
        </li>
      ))}
    </ul>
  );
}
