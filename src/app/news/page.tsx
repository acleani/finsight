import Link from "next/link";
import SentimentLabel from "@/components/SentimentLabel";
import { ProvenanceLine } from "@/components/Provenance";
import { fmtDateTime } from "@/lib/format";
import { news } from "@/lib/providers";
import type { NewsArticle } from "@/lib/types";

export const metadata = { title: "Notizie — FinSight" };

export default async function NewsPage() {
  const articles = await news().getNews();

  // clustering per evento: più articoli sullo stesso eventId = un solo evento
  const events = new Map<string, NewsArticle[]>();
  for (const a of articles) {
    const list = events.get(a.eventId) ?? [];
    list.push(a);
    events.set(a.eventId, list);
  }
  const clusters = [...events.values()].sort(
    (a, b) => b[0].publishedAt.localeCompare(a[0].publishedAt),
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Notizie</h1>
        <p className="mt-1 text-ink-2">
          Gli articoli sono raggruppati per evento: dieci pezzi sulla stessa trimestrale
          contano come un solo evento, non dieci catalizzatori.
        </p>
        {articles[0] && <ProvenanceLine p={articles[0].provenance} />}
      </header>

      <div className="space-y-4">
        {clusters.map((cluster) => {
          const main = cluster[0];
          const rest = cluster.slice(1);
          return (
            <article key={main.eventId} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="max-w-3xl text-base font-semibold">{main.headline}</h2>
                <ImpactBadge s={main.sentiment} />
              </div>
              <p className="mt-1 text-sm text-ink-2">{main.summary}</p>
              <p className="mt-2 text-xs text-ink-3">
                {main.publisher} · {fmtDateTime(main.publishedAt)} · argomento: {main.topic} ·{" "}
                <SentimentLabel s={main.sentiment} /> · rilevanza {Math.round(main.relevance * 100)}%
              </p>
              <p className="mt-1 text-xs text-ink-3">
                Titoli correlati:{" "}
                {main.tickers.map((t, i) => (
                  <span key={t}>
                    {i > 0 && ", "}
                    <Link href={`/stocks/${t}`} className="text-accent hover:underline">{t}</Link>
                  </span>
                ))}
              </p>
              {rest.length > 0 && (
                <details className="mt-2 text-sm">
                  <summary className="cursor-pointer text-xs text-ink-3 hover:text-ink">
                    Altre {rest.length} coperture dello stesso evento
                  </summary>
                  <ul className="mt-1 space-y-1 text-ink-2">
                    {rest.map((a) => (
                      <li key={a.id}>· {a.headline} <span className="text-ink-3">({a.publisher})</span></li>
                    ))}
                  </ul>
                </details>
              )}
            </article>
          );
        })}
      </div>

      <p className="text-xs text-ink-3">
        Il sentiment descrive il tono della notizia, non il suo impatto finanziario futuro:
        una notizia positiva su un titolo molto caro può già essere nel prezzo.
      </p>
    </div>
  );
}

function ImpactBadge({ s }: { s: NewsArticle["sentiment"] }) {
  if (s === "positive")
    return <span className="tag" style={{ color: "var(--good)", borderColor: "currentcolor" }}>▲ potenziale impatto positivo</span>;
  if (s === "negative")
    return <span className="tag" style={{ color: "var(--bad)", borderColor: "currentcolor" }}>▼ potenziale impatto negativo</span>;
  return <span className="tag">≈ probabilmente neutro</span>;
}
