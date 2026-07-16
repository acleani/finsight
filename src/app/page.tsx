import Link from "next/link";
import CompanyLogo from "@/components/CompanyLogo";
import SearchBox from "@/components/SearchBox";
import SentimentLabel from "@/components/SentimentLabel";
import TradeButtons from "@/components/TradeButtons";
import { ProvenanceLine } from "@/components/Provenance";
import { fundamentals, marketData, news } from "@/lib/providers";
import { trailingReturn } from "@/lib/indicators";
import { fmtBig, fmtNum, fmtPct } from "@/lib/format";

const SHORT_NAMES: Record<string, string> = {
  KO: "Coca-Cola", TSM: "TSMC", "005930.KS": "Samsung", JNJ: "J&J",
  "ISP.MI": "Intesa Sanpaolo", "RACE.MI": "Ferrari", "ENEL.MI": "Enel",
  GOOGL: "Google", AMZN: "Amazon",
};

function shortName(symbol: string, name: string): string {
  return SHORT_NAMES[symbol] ?? name.split(" ")[0].replace(",", "");
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

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
      <section className="relative px-2 pb-4 pt-14 text-center md:pt-20">
        <div className="hero-bg" aria-hidden />
        <div className="relative">
          <h1 className="hero-title mx-auto max-w-3xl">
            Capire un&apos;azienda.<br />
            <span className="hero-accent">Prima di investire.</span>
          </h1>
          <p className="hero-sub mx-auto mt-5 max-w-2xl">
            Fondamentali, valutazione, rischi e punteggi spiegabili —
            con la provenienza di ogni dato. Evidenza, non hype.
          </p>
          <div className="mx-auto mt-8 flex justify-center">
            <SearchBox />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-ink-3">
            Oppure parti da un&apos;azienda che conosci
          </p>
          <div className="mx-auto mt-3 flex max-w-4xl flex-wrap justify-center gap-2.5">
            {rows.map(({ company: c }) => (
              <Link key={c.symbol} href={`/stocks/${c.symbol}`} className="logo-chip">
                <CompanyLogo domain={c.domain} name={c.name} size={26} />
                {shortName(c.symbol, c.name)}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* come funziona: investire informati in 3 passi */}
      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            n: "1", color: "var(--accent)", title: "Cerca un'azienda",
            text: "Per nome o ticker: Apple, Ferrari, Enel… In un secondo hai prezzo, storia e notizie.",
            href: "/discover", cta: "o esplora le collezioni →",
          },
          {
            n: "2", color: "var(--series-4)", title: "Leggi l'analisi in 1 minuto",
            text: "Punteggio 0–100 spiegato voce per voce: perché è interessante, cosa può andare storto, quando conviene aspettare.",
            href: "/stocks/NVDA", cta: "guarda un esempio →",
          },
          {
            n: "3", color: "var(--series-2)", title: "Decidi con metodo",
            text: "Confronta le alternative, controlla le correlazioni, simula il portafoglio e poi ordina dal tuo broker.",
            href: "/compare", cta: "prova il confronto →",
          },
        ].map((s) => (
          <Link key={s.n} href={s.href} className="card block p-6 text-left">
            <span className="step-badge" style={{ background: s.color }}>{s.n}</span>
            <h2 className="mt-4 text-lg font-semibold">{s.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{s.text}</p>
            <p className="mt-3 text-sm font-medium" style={{ color: s.color }}>{s.cta}</p>
          </Link>
        ))}
      </section>

      <section className="card p-5">
        <h2 className="mb-1 text-lg font-semibold">Panoramica del listino</h2>
        {rows[0]?.quote && <ProvenanceLine p={rows[0].quote.provenance} />}
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-grid text-left text-xs uppercase tracking-wide text-ink-3">
                <th className="py-2 font-semibold">Titolo</th>
                <th className="py-2 text-right font-semibold">Prezzo</th>
                <th className="py-2 text-right font-semibold">Var%</th>
                <th className="py-2 text-right font-semibold">1 mese</th>
                <th className="py-2 text-right font-semibold">Volume</th>
                <th className="py-2 text-right font-semibold">Mercato</th>
                <th className="py-2 text-right font-semibold">Ora</th>
                <th className="py-2 text-right font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ company: c, quote, r1m }) => (
                <tr key={c.symbol} className="border-t border-grid hover:bg-surface-2/60">
                  <td className="py-2.5">
                    <Link href={`/stocks/${c.symbol}`} className="group flex items-center gap-2.5">
                      <CompanyLogo domain={c.domain} name={c.name} />
                      <span>
                        <span className="block font-semibold leading-tight group-hover:text-accent">{c.name}</span>
                        <span className="block text-xs text-ink-3">{c.symbol} · {c.sector}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="tabular py-2.5 text-right font-semibold">{fmtNum(quote!.price)} <span className="text-xs font-normal text-ink-3">{c.currency}</span></td>
                  <td className={`tabular py-2.5 text-right font-semibold ${quote!.changePct >= 0 ? "text-good" : "text-bad"}`}>
                    {quote!.changePct >= 0 ? "▲" : "▼"} {fmtPct(quote!.changePct)}
                  </td>
                  <td className={`tabular py-2.5 text-right ${r1m != null && r1m >= 0 ? "text-good" : "text-bad"}`}>
                    {fmtPct(r1m)}
                  </td>
                  <td className="tabular py-2.5 text-right text-ink-2">{fmtBig(quote!.volume)}</td>
                  <td className="py-2.5 text-right text-xs text-ink-2">{c.exchange}</td>
                  <td className="tabular py-2.5 text-right text-xs text-ink-3">{fmtTime(quote!.provenance.retrievedAt)}</td>
                  <td className="py-2.5 pl-3 text-right"><TradeButtons symbol={c.symbol} etoroSlug={c.etoroSlug} compact /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-ink-3">
          I pulsanti eToro/Fineco sono collegamenti esterni di comodo, non una raccomandazione:
          leggi prima l&apos;analisi del titolo.
        </p>
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
