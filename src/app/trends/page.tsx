import Link from "next/link";
import { ClaimTag } from "@/components/Provenance";
import { fmtPct } from "@/lib/format";
import { trailingReturn } from "@/lib/indicators";
import { fundamentals, marketData, news } from "@/lib/providers";

export const metadata = { title: "Trend — FinSight" };

const THEME_LABELS: Record<string, string> = {
  ai: "Intelligenza artificiale",
  semiconductors: "Semiconduttori",
  cloud: "Cloud",
  "consumer-tech": "Tecnologia di consumo",
  healthcare: "Sanità",
  dividends: "Dividendi",
  "consumer-staples": "Beni di prima necessità",
  luxury: "Lusso",
  energy: "Energia",
  financials: "Finanza",
  italy: "Italia",
};

/**
 * Trend Score trasparente per tema:
 *  - momentum medio a 1 e 3 mesi dei titoli del tema (peso 60)
 *  - volume di notizie recenti sul tema (peso 20)
 *  - sentiment medio delle notizie (peso 20)
 * I segnali non disponibili sono dichiarati e il peso ridistribuito.
 */
export default async function TrendsPage() {
  const fp = fundamentals();
  const md = marketData();
  const companies = await fp.listCompanies();
  const articles = await news().getNews();

  const rows = await Promise.all(
    companies.map(async (c) => {
      const series = await md.getPriceSeries(c.symbol);
      const bars = series?.bars ?? null;
      return {
        c,
        r1m: bars ? trailingReturn(bars, 22) : null,
        r3m: bars ? trailingReturn(bars, 66) : null,
      };
    }),
  );

  const themes = new Map<string, typeof rows>();
  for (const r of rows) {
    for (const t of r.c.themes) {
      const list = themes.get(t) ?? [];
      list.push(r);
      themes.set(t, list);
    }
  }

  const trendRows = [...themes.entries()].map(([theme, members]) => {
    const moms = members.map((m) => m.r1m).filter((v): v is number => v != null);
    const moms3 = members.map((m) => m.r3m).filter((v): v is number => v != null);
    const themeNews = articles.filter((a) =>
      a.tickers.some((t) => members.some((m) => m.c.symbol === t)));
    const eventCount = new Set(themeNews.map((a) => a.eventId)).size;
    const sentimentAvg = themeNews.length
      ? themeNews.reduce((s, a) => s + (a.sentiment === "positive" ? 1 : a.sentiment === "negative" ? -1 : 0), 0) / themeNews.length
      : null;

    const signals: { label: string; available: boolean; score: number | null; weight: number }[] = [
      {
        label: "Momentum prezzi (1m/3m)",
        available: moms.length > 0,
        weight: 60,
        score: moms.length
          ? clamp01((avg(moms) + avg(moms3) / 3 + 8) / 20) * 100
          : null,
      },
      {
        label: `Volume notizie (${eventCount} eventi)`,
        available: themeNews.length > 0,
        weight: 20,
        score: themeNews.length ? clamp01(eventCount / 4) * 100 : null,
      },
      {
        label: "Sentiment notizie",
        available: sentimentAvg != null,
        weight: 20,
        score: sentimentAvg == null ? null : clamp01((sentimentAvg + 1) / 2) * 100,
      },
    ];
    const avail = signals.filter((s) => s.score != null);
    const wsum = avail.reduce((a, s) => a + s.weight, 0);
    const score = wsum
      ? Math.round(avail.reduce((a, s) => a + (s.score as number) * s.weight, 0) / wsum)
      : null;

    return { theme, members, signals, score, avg1m: moms.length ? avg(moms) : null };
  }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Trend di mercato</h1>
        <p className="mt-1 text-ink-2">
          Un tema non è «di tendenza» solo perché appare nei giornali: il Trend Score
          combina segnali dichiarati e mostra quali erano davvero disponibili.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {trendRows.map((t) => (
          <section key={t.theme} className="card p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-semibold">{THEME_LABELS[t.theme] ?? t.theme}</h2>
              <span className="tabular text-lg font-bold">{t.score == null ? "n.d." : `${t.score}/100`}</span>
            </div>
            <p className="mt-0.5 text-xs text-ink-3">
              Trend Score <ClaimTag kind="CALCULATION" /> · momentum medio 1 mese: {fmtPct(t.avg1m)}
            </p>
            <ul className="mt-3 space-y-1 text-xs text-ink-2">
              {t.signals.map((s) => (
                <li key={s.label} className="flex justify-between gap-2">
                  <span>{s.available ? "●" : "○"} {s.label}{!s.available && " — non disponibile"}</span>
                  <span className="tabular">{s.score == null ? "—" : `${Math.round(s.score)}/100 · peso ${s.weight}`}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {t.members.map((m) => (
                <Link key={m.c.symbol} href={`/stocks/${m.c.symbol}`}
                  className="rounded-full border border-bordr px-2.5 py-0.5 text-xs text-ink-2 hover:border-accent hover:text-ink">
                  {m.c.symbol}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function avg(v: number[]) { return v.reduce((a, b) => a + b, 0) / v.length; }
function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }
