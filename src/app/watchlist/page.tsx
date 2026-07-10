"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CompanyLogo from "@/components/CompanyLogo";
import TradeButtons from "@/components/TradeButtons";
import { getWatchlist, setWatchlist } from "@/components/WatchButton";
import { fmtNum, fmtPct } from "@/lib/format";
import type { OverviewRow } from "@/app/api/overview/route";

export default function WatchlistPage() {
  const [rows, setRows] = useState<OverviewRow[] | null>(null);
  const [symbols, setSymbols] = useState<string[]>([]);

  useEffect(() => {
    setSymbols(getWatchlist());
    fetch("/api/overview")
      .then((r) => r.json())
      .then((d: { rows: OverviewRow[] }) => setRows(d.rows))
      .catch(() => setRows([]));
  }, []);

  const remove = (s: string) => {
    const next = symbols.filter((x) => x !== s);
    setWatchlist(next);
    setSymbols(next);
  };

  const items = rows?.filter((r) => symbols.includes(r.company.symbol)) ?? null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Watchlist</h1>
        <p className="mt-1 text-ink-2">
          I titoli che stai seguendo (salvati solo su questo browser).
        </p>
      </header>

      {items == null ? (
        <div className="card animate-pulse p-8 text-center text-ink-3">Caricamento…</div>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-lg text-ink-2">La tua watchlist è vuota.</p>
          <p className="mt-2 text-sm text-ink-3">
            Apri la pagina di un titolo e premi «☆ Aggiungi a watchlist», oppure{" "}
            <Link href="/discover" className="text-accent hover:underline">esplora le collezioni</Link>.
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto p-5">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-3">
                <th className="pb-2 font-medium">Titolo</th>
                <th className="pb-2 text-right font-medium">Prezzo</th>
                <th className="pb-2 text-right font-medium">Var. giorno</th>
                <th className="pb-2 text-right font-medium">12 mesi</th>
                <th className="pb-2 text-right font-medium">Punteggio</th>
                <th className="pb-2 text-right font-medium"></th>
                <th className="pb-2 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.company.symbol} className="border-t border-grid">
                  <td className="py-2">
                    <Link href={`/stocks/${r.company.symbol}`} className="group flex items-center gap-2.5">
                      <CompanyLogo domain={r.company.domain} name={r.company.name} size={24} />
                      <span className="font-medium group-hover:text-accent">{r.company.symbol}</span>
                      <span className="hidden text-ink-3 md:inline">{r.company.name}</span>
                    </Link>
                  </td>
                  <td className="tabular py-2 text-right">
                    {r.quote ? `${fmtNum(r.quote.price)} ${r.company.currency}` : "n.d."}
                  </td>
                  <td className={`tabular py-2 text-right font-medium ${
                    (r.quote?.changePct ?? 0) >= 0 ? "text-good" : "text-bad"}`}>
                    {r.quote ? fmtPct(r.quote.changePct) : "—"}
                  </td>
                  <td className={`tabular py-2 text-right ${(r.r12 ?? 0) >= 0 ? "text-good" : "text-bad"}`}>
                    {fmtPct(r.r12)}
                  </td>
                  <td className="tabular py-2 text-right font-medium">
                    {r.scores.overall == null ? "n.d." : `${r.scores.overall}/100`}
                  </td>
                  <td className="py-2 pl-3 text-right">
                    <TradeButtons symbol={r.company.symbol} etoroSlug={r.company.etoroSlug} compact />
                  </td>
                  <td className="py-2 text-right">
                    <button onClick={() => remove(r.company.symbol)}
                      className="text-xs text-ink-3 hover:text-bad" aria-label={`Rimuovi ${r.company.symbol}`}>
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
