import Link from "next/link";
import { notFound } from "next/navigation";
import PriceChart from "@/components/PriceChart";
import WatchButton from "@/components/WatchButton";
import SentimentLabel from "@/components/SentimentLabel";
import { ClaimTag, ProvenanceLine } from "@/components/Provenance";
import { ScoreBar, ScoreDetail } from "@/components/ScorePanel";
import { redFlags, scenarios, strengths, weaknesses, whyNow } from "@/lib/analysis";
import {
  annualizedReturn, annualizedVolatility, maxDrawdown, positiveYearsPct,
  trailingReturn, ytdReturn,
} from "@/lib/indicators";
import { fmtBig, fmtDate, fmtNum, fmtPct } from "@/lib/format";
import { fundamentals, marketData, news } from "@/lib/providers";
import { computeScores, lastFcf, verdictLabel } from "@/lib/scoring";
import type { RiskLevel, Scenario } from "@/lib/types";

export default async function StockPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol: raw } = await params;
  const symbol = decodeURIComponent(raw).toUpperCase();

  const fp = fundamentals();
  const md = marketData();
  const [company, f, quote, series, articles] = await Promise.all([
    fp.getCompany(symbol),
    fp.getFundamentals(symbol),
    md.getQuote(symbol),
    md.getPriceSeries(symbol),
    news().getNews(symbol),
  ]);

  if (!company) notFound();

  const bars = series?.bars ?? null;
  const scores = computeScores(f, bars);
  const pros = strengths(company, f, bars);
  const cons = weaknesses(company, f, bars);
  const flags = redFlags(company, f, bars);
  const timing = whyNow(company, f, bars);
  const scen = scenarios(company, f);

  const perf = bars
    ? {
        "1 settimana": trailingReturn(bars, 5),
        "1 mese": trailingReturn(bars, 22),
        "3 mesi": trailingReturn(bars, 66),
        "6 mesi": trailingReturn(bars, 130),
        YTD: ytdReturn(bars),
        "1 anno": trailingReturn(bars, 252),
        "3 anni (ann.)": annualizedReturn(bars, 3),
        "5 anni (ann.)": annualizedReturn(bars, 5),
        "10 anni (ann.)": annualizedReturn(bars, 10),
      }
    : null;
  const vol = bars ? annualizedVolatility(bars) : null;
  const dd = bars ? maxDrawdown(bars) : null;
  const posYears = bars ? positiveYearsPct(bars) : null;
  const fcf = f ? lastFcf(f) : null;

  const valuationRows = f
    ? ([
        ["P/E (trailing)", f.pe, ""],
        ["P/E forward", f.forwardPe, "solo se esistono stime affidabili"],
        ["P/S", f.ps, ""],
        ["P/B", f.pb, ""],
        ["EV/EBITDA", f.evEbitda, ""],
        ["Prezzo/FCF", f.priceFcf, ""],
        ["Rendimento FCF", f.priceFcf ? (1 / f.priceFcf) * 100 : null, "%"],
        ["Dividend yield", f.dividendYield != null ? f.dividendYield * 100 : null, "%"],
      ] as const)
    : [];

  return (
    <div className="space-y-6">
      {/* intestazione */}
      <section className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {company.name} <span className="text-ink-3">({company.symbol})</span>
            </h1>
            <p className="mt-1 text-sm text-ink-2">
              {company.exchange} · {company.country} · {company.sector} · {company.industry}
            </p>
            {f?.marketCap != null && (
              <p className="mt-1 text-sm text-ink-2">
                Capitalizzazione: <span className="font-medium">{fmtBig(f.marketCap, company.currency)}</span>
              </p>
            )}
          </div>
          <div className="text-right">
            {quote ? (
              <>
                <p className="tabular text-3xl font-bold">
                  {fmtNum(quote.price)} <span className="text-base font-medium text-ink-2">{company.currency}</span>
                </p>
                <p className={`tabular font-semibold ${quote.changePct >= 0 ? "text-good" : "text-bad"}`}>
                  {quote.changePct >= 0 ? "▲" : "▼"} {fmtNum(quote.change)} ({fmtPct(quote.changePct)})
                </p>
                <ProvenanceLine p={quote.provenance} />
              </>
            ) : (
              <p className="text-ink-3">Quotazione non disponibile</p>
            )}
            <div className="mt-2 flex justify-end">
              <WatchButton symbol={company.symbol} />
            </div>
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-sm text-ink-2">{company.description}</p>
      </section>

      {/* sintesi: punteggio + perché sì / cosa può andare storto */}
      <section className="grid gap-5 lg:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-semibold">Vista d&apos;insieme</h2>
            <ClaimTag kind="INTERPRETATION" />
          </div>
          <p className="mt-2 text-2xl font-bold">{verdictLabel(scores.overall.score)}</p>
          <p className="text-sm text-ink-2">
            Punteggio complessivo: <span className="tabular font-semibold">{scores.overall.score ?? "n.d."}/100</span>
            {" · "}confidenza dati {scores.dataConfidence}%
          </p>
          <div className="mt-4 space-y-3">
            <ScoreBar label="Qualità del business" bd={scores.quality} />
            <ScoreBar label="Solidità finanziaria" bd={scores.health} />
            <ScoreBar label="Crescita" bd={scores.growth} />
            <ScoreBar label="Valutazione" bd={scores.valuation} />
            <ScoreBar label="Momentum" bd={scores.momentum} />
            <ScoreBar label="Rischio (100 = basso)" bd={scores.risk} />
          </div>
          <p className="mt-3 text-xs text-ink-3">
            Metodo, pesi e formule sono pubblici: <Link href="/methodology" className="text-accent hover:underline">metodologia</Link>.
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-semibold">Perché è interessante</h2>
          </div>
          <ul className="mt-3 space-y-3">
            {pros.length === 0 && <li className="text-sm text-ink-3">Dati insufficienti per punti di forza verificabili.</li>}
            {pros.map((s) => (
              <li key={s.title} className="text-sm">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 font-bold text-good">✚</span>
                  <div>
                    <p className="font-medium">{s.title} <ClaimTag kind={s.kind} /></p>
                    <p className="text-ink-2">{s.detail}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-5">
          <h2 className="text-base font-semibold">Cosa può andare storto</h2>
          <ul className="mt-3 space-y-3">
            {cons.length === 0 && <li className="text-sm text-ink-3">Nessuna debolezza rilevata dai dati disponibili (non significa assenza di rischi).</li>}
            {cons.map((s) => (
              <li key={s.title} className="text-sm">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 font-bold text-bad">−</span>
                  <div>
                    <p className="font-medium">{s.title} <ClaimTag kind={s.kind} /></p>
                    <p className="text-ink-2">{s.detail}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* grafico */}
      <section className="card p-5">
        <h2 className="mb-1 text-lg font-semibold">Andamento del prezzo</h2>
        {series && <ProvenanceLine p={series.provenance} />}
        <div className="mt-3">
          {bars ? (
            <PriceChart bars={bars} currency={company.currency} />
          ) : (
            <p className="py-10 text-center text-ink-3">Serie storica non disponibile.</p>
          )}
        </div>
      </section>

      {/* performance storica */}
      <section className="card p-5">
        <h2 className="mb-3 text-lg font-semibold">Performance storica <ClaimTag kind="CALCULATION" /></h2>
        {perf ? (
          <>
            <div className="grid grid-cols-3 gap-3 md:grid-cols-9">
              {Object.entries(perf).map(([label, v]) => (
                <div key={label} className="rounded-xl border border-bordr p-3 text-center">
                  <p className="text-xs text-ink-3">{label}</p>
                  <p className={`tabular text-sm font-semibold ${v == null ? "text-ink-3" : v >= 0 ? "text-good" : "text-bad"}`}>
                    {fmtPct(v)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
              <p><span className="text-ink-3">Volatilità annualizzata:</span> <span className="tabular font-medium">{fmtPct(vol, false)}</span></p>
              <p><span className="text-ink-3">Anni positivi:</span> <span className="tabular font-medium">{posYears == null ? "—" : `${fmtNum(posYears, 0)}%`}</span></p>
              <p>
                <span className="text-ink-3">Max drawdown:</span>{" "}
                <span className="tabular font-medium">{fmtPct(dd?.maxDrawdownPct ?? null, false)}</span>
                {dd?.recoveryMonths != null && <span className="text-ink-2"> (recuperato in ~{dd.recoveryMonths} mesi)</span>}
              </p>
            </div>
            {dd && (
              <p className="mt-2 text-sm text-ink-2">
                Nel periodo peggiore disponibile il titolo ha perso circa {fmtNum(Math.abs(dd.maxDrawdownPct), 0)}%
                dal massimo del {fmtDate(dd.peakDate)} al minimo del {fmtDate(dd.troughDate)}
                {dd.recoveryMonths != null ? `, impiegando circa ${dd.recoveryMonths} mesi per recuperare.` : " e non ha ancora recuperato il precedente massimo."}
              </p>
            )}
          </>
        ) : (
          <p className="text-ink-3">Dati storici insufficienti.</p>
        )}
      </section>

      {/* fondamentali */}
      <section className="card p-5">
        <h2 className="mb-1 text-lg font-semibold">Fondamentali</h2>
        {f ? (
          <>
            <ProvenanceLine p={f.provenance} />
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-ink-2">Ricavi e utili per esercizio</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-ink-3">
                      <th className="pb-1 font-medium">Esercizio</th>
                      <th className="pb-1 text-right font-medium">Ricavi</th>
                      <th className="pb-1 text-right font-medium">Utile netto</th>
                      <th className="pb-1 text-right font-medium">FCF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {f.fiscalYears.map((y, i) => (
                      <tr key={y} className="border-t border-grid">
                        <td className="py-1.5">{y}</td>
                        <td className="tabular py-1.5 text-right">{fmtBig(f.revenue[i])}</td>
                        <td className={`tabular py-1.5 text-right ${f.netIncome[i] < 0 ? "text-bad" : ""}`}>{fmtBig(f.netIncome[i])}</td>
                        <td className="tabular py-1.5 text-right">{fmtBig(f.operatingCashFlow[i] - f.capex[i])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-xs text-ink-3">Valori in valuta nativa ({company.currency}). FCF = flusso di cassa operativo − capex.</p>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-ink-2">Redditività e bilancio (ultimo esercizio)</h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <Metric label="Margine lordo" v={f.grossMargin} pct />
                  <Metric label="Margine operativo" v={f.operatingMargin} pct />
                  <Metric label="Margine netto" v={f.netMargin} pct />
                  <Metric label="ROE" v={f.roe} pct />
                  <Metric label="ROIC" v={f.roic} pct />
                  <Metric label="Current ratio" v={f.currentRatio} />
                  <Metric label="Copertura interessi" v={f.interestCoverage} suffix="×" />
                  <Metric label="Debito totale" v={f.totalDebt} big currency={company.currency} />
                  <Metric label="Cassa" v={f.cash} big currency={company.currency} />
                  <Metric label="FCF ultimo anno" v={fcf} big currency={company.currency} />
                  <Metric label="EPS" v={f.eps} suffix={` ${company.currency}`} />
                  <Metric label="Payout dividendo" v={f.payoutRatio} pct />
                </dl>
                {f.sharesOutstanding.length >= 2 && (
                  <p className="mt-3 text-sm text-ink-2">
                    Azioni in circolazione: da {fmtBig(f.sharesOutstanding[0])} a {fmtBig(f.sharesOutstanding[f.sharesOutstanding.length - 1])} in 5 anni
                    {f.sharesOutstanding[f.sharesOutstanding.length - 1] < f.sharesOutstanding[0]
                      ? " — riacquisti costanti (positivo per gli azionisti)."
                      : " — attenzione alla diluizione."}
                  </p>
                )}
              </div>
            </div>
          </>
        ) : (
          <p className="text-ink-3">Fondamentali non disponibili per questo titolo.</p>
        )}
      </section>

      {/* valutazione */}
      <section className="card p-5">
        <h2 className="mb-3 text-lg font-semibold">Valutazione</h2>
        {f ? (
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <table className="w-full text-sm">
                <tbody>
                  {valuationRows.map(([label, v, note]) => (
                    <tr key={label} className="border-t border-grid first:border-t-0">
                      <td className="py-1.5 text-ink-2">{label}{note && <span className="block text-xs text-ink-3">{note}</span>}</td>
                      <td className="tabular py-1.5 text-right font-medium">
                        {v == null ? "n.d." : fmtNum(v, 1)}{typeof note === "string" && note === "%" ? "%" : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              {f.pe != null && f.peHistoricalRange ? (
                <>
                  <h3 className="mb-2 text-sm font-semibold text-ink-2">P/E rispetto alla propria storia</h3>
                  <PeRangeBar pe={f.pe} range={f.peHistoricalRange} />
                  <p className="mt-3 text-sm text-ink-2">
                    {peConclusion(f.pe, f.peHistoricalRange)} <ClaimTag kind="INTERPRETATION" />
                  </p>
                  <p className="mt-2 text-xs text-ink-3">
                    Un multiplo basso non è automaticamente un&apos;occasione (rischio value trap) e uno alto
                    non è automaticamente eccesso: va letto insieme a crescita, margini e rischio.
                  </p>
                </>
              ) : (
                <p className="text-ink-3">Range storico del P/E non disponibile.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-ink-3">Dati di valutazione non disponibili.</p>
        )}
      </section>

      {/* punteggi in dettaglio */}
      <section className="card p-5">
        <h2 className="mb-1 text-lg font-semibold">Punteggi in dettaglio</h2>
        <p className="mb-3 text-sm text-ink-2">
          Ogni punteggio mostra componenti, metrica grezza, normalizzazione e peso.
          I dati mancanti sono esclusi e dichiarati — mai contati come zero.
        </p>
        <div className="space-y-2">
          <ScoreDetail title="Qualità del business" bd={scores.quality} />
          <ScoreDetail title="Solidità finanziaria" bd={scores.health} />
          <ScoreDetail title="Crescita" bd={scores.growth} />
          <ScoreDetail title="Valutazione" bd={scores.valuation} />
          <ScoreDetail title="Momentum" bd={scores.momentum} />
          <ScoreDetail title="Rischio (100 = rischio basso)" bd={scores.risk} />
          <ScoreDetail title="Punteggio complessivo (combinazione delle dimensioni)" bd={scores.overall} />
        </div>
      </section>

      {/* perché ora / perché aspettare */}
      <section className="grid gap-5 md:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-base font-semibold">Perché guardarla ora</h2>
          <InsightList items={timing.now} positive />
        </div>
        <div className="card p-5">
          <h2 className="text-base font-semibold">Perché aspettare potrebbe essere meglio</h2>
          <InsightList items={timing.wait} />
        </div>
      </section>

      {/* scenari */}
      <section className="card p-5">
        <h2 className="mb-1 text-lg font-semibold">Scenari <ClaimTag kind="INTERPRETATION" /></h2>
        <p className="mb-4 text-sm text-ink-2">
          Tre narrazioni con ipotesi esplicite e condizioni di invalidazione — nessun target price:
          senza un modello di valutazione trasparente sarebbe falsa precisione.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {scen.map((s) => <ScenarioCard key={s.name} s={s} />)}
        </div>
      </section>

      {/* rischi e red flag */}
      <section className="card p-5">
        <h2 className="mb-3 text-lg font-semibold">Rischi e segnali di attenzione</h2>
        {flags.length === 0 ? (
          <p className="text-sm text-ink-2">
            Nessun segnale automatico rilevato sui dati disponibili. L&apos;assenza di segnali
            non equivale ad assenza di rischio.
          </p>
        ) : (
          <ul className="space-y-3">
            {flags.map((r) => (
              <li key={r.title} className="flex items-start gap-3 text-sm">
                <RiskBadge level={r.level} />
                <div>
                  <p className="font-medium">{r.title} <ClaimTag kind={r.kind} /></p>
                  <p className="text-ink-2">{r.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* notizie */}
      <section className="card p-5">
        <h2 className="mb-3 text-lg font-semibold">Notizie recenti</h2>
        {articles.length === 0 ? (
          <p className="text-sm text-ink-3">Nessuna notizia disponibile per questo titolo.</p>
        ) : (
          <ul className="space-y-3">
            {articles.map((n) => (
              <li key={n.id} className="border-t border-grid pt-3 text-sm first:border-t-0 first:pt-0">
                <p className="font-medium">{n.headline}</p>
                <p className="text-ink-2">{n.summary}</p>
                <p className="mt-0.5 text-xs text-ink-3">
                  {n.publisher} · {fmtDate(n.publishedAt)} · <SentimentLabel s={n.sentiment} /> · rilevanza {Math.round(n.relevance * 100)}%
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* peer */}
      {company.peers.length > 0 && (
        <section className="card p-5">
          <h2 className="mb-2 text-base font-semibold">Confronta con i concorrenti</h2>
          <div className="flex flex-wrap gap-2">
            {company.peers.map((p) => (
              <Link key={p} href={`/compare?symbols=${company.symbol},${p}`}
                className="rounded-full border border-bordr px-3 py-1 text-sm text-ink-2 hover:border-accent hover:text-ink">
                {company.symbol} vs {p}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// --- componenti locali -------------------------------------------------------

function Metric({
  label, v, pct = false, big = false, suffix = "", currency,
}: {
  label: string; v: number | null; pct?: boolean; big?: boolean; suffix?: string; currency?: string;
}) {
  let text = "n.d.";
  if (v != null) {
    if (big) text = fmtBig(v, currency);
    else if (pct) text = `${fmtNum(v * 100, 1)}%`;
    else text = `${fmtNum(v, 2)}${suffix}`;
  }
  return (
    <>
      <dt className="text-ink-3">{label}</dt>
      <dd className="tabular text-right font-medium">{text}</dd>
    </>
  );
}

function PeRangeBar({ pe, range }: { pe: number; range: { low: number; high: number; median: number } }) {
  const pos = Math.max(0, Math.min(1, (pe - range.low) / (range.high - range.low)));
  const medianPos = Math.max(0, Math.min(1, (range.median - range.low) / (range.high - range.low)));
  return (
    <div>
      <div className="relative h-3 rounded-full bg-surface-2">
        <div className="absolute top-0 h-3 w-0.5 bg-ink-3" style={{ left: `${medianPos * 100}%` }} title={`Mediana ${fmtNum(range.median, 0)}`} />
        <div className="absolute -top-1 h-5 w-1.5 rounded bg-accent" style={{ left: `calc(${pos * 100}% - 3px)` }} title={`P/E attuale ${fmtNum(pe, 1)}`} />
      </div>
      <div className="mt-1 flex justify-between text-xs text-ink-3">
        <span>min {fmtNum(range.low, 0)}</span>
        <span>mediana {fmtNum(range.median, 0)}</span>
        <span>max {fmtNum(range.high, 0)}</span>
      </div>
    </div>
  );
}

function peConclusion(pe: number, r: { low: number; high: number; median: number }): string {
  const t = (pe - r.low) / (r.high - r.low);
  if (t <= 0.15) return "Valutazione molto sotto il range storico proprio.";
  if (t <= 0.4) return "Valutazione sotto il range storico proprio.";
  if (t <= 0.6) return "Valutazione vicina alla media storica propria.";
  if (t <= 0.85) return "Valutazione sopra il range storico proprio.";
  return "Valutazione molto sopra il range storico proprio.";
}

function InsightList({ items, positive = false }: { items: { title: string; detail: string; kind: "FACT" | "CALCULATION" | "INTERPRETATION" }[]; positive?: boolean }) {
  return (
    <ul className="mt-3 space-y-3">
      {items.map((s) => (
        <li key={s.title} className="text-sm">
          <div className="flex items-start gap-2">
            <span className={`mt-0.5 font-bold ${positive ? "text-good" : "text-warn"}`}>{positive ? "→" : "⏸"}</span>
            <div>
              <p className="font-medium">{s.title} <ClaimTag kind={s.kind} /></p>
              <p className="text-ink-2">{s.detail}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

const SCENARIO_META: Record<Scenario["name"], { label: string; cls: string }> = {
  bull: { label: "Scenario positivo", cls: "text-good" },
  base: { label: "Scenario base", cls: "text-ink" },
  bear: { label: "Scenario negativo", cls: "text-bad" },
};

function ScenarioCard({ s }: { s: Scenario }) {
  const meta = SCENARIO_META[s.name];
  return (
    <div className="rounded-xl border border-bordr p-4 text-sm">
      <h3 className={`font-semibold ${meta.cls}`}>{meta.label}</h3>
      <ScenarioBlock title="Ipotesi" items={s.assumptions} />
      <ScenarioBlock title="Catalizzatori" items={s.catalysts} />
      <ScenarioBlock title="Rischi" items={s.risks} />
      <ScenarioBlock title="Metriche da monitorare" items={s.metricsToWatch} />
      <ScenarioBlock title="La tesi salta se…" items={s.invalidation} />
    </div>
  );
}

function ScenarioBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">{title}</p>
      <ul className="mt-1 list-inside list-disc space-y-0.5 text-ink-2">
        {items.map((i) => <li key={i}>{i}</li>)}
      </ul>
    </div>
  );
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const map: Record<RiskLevel, { label: string; cls: string }> = {
    low: { label: "Basso", cls: "text-good border-good" },
    moderate: { label: "Moderato", cls: "text-warn border-warn" },
    high: { label: "Alto", cls: "text-bad border-bad" },
    critical: { label: "Critico", cls: "text-critical border-critical" },
  };
  const m = map[level];
  return (
    <span className={`tag mt-0.5 shrink-0 ${m.cls}`} style={{ borderColor: "currentcolor" }}>
      ⚠ {m.label}
    </span>
  );
}
