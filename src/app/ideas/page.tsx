"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadProfile, matchesMarkets } from "@/lib/profile";
import { profileWeights } from "@/lib/scoring";
import { fmtPct } from "@/lib/format";
import type { InvestorProfile } from "@/lib/types";
import type { OverviewRow } from "@/app/api/overview/route";

/**
 * Idee personalizzate = punteggio oggettivo + adattamento al profilo.
 * Entrambi i numeri restano visibili e distinti; il fit non nasconde i rischi.
 */
export default function IdeasPage() {
  const [rows, setRows] = useState<OverviewRow[] | null>(null);
  const [profile, setProfile] = useState<InvestorProfile | null>(null);

  useEffect(() => {
    setProfile(loadProfile());
    fetch("/api/overview")
      .then((r) => r.json())
      .then((d: { rows: OverviewRow[] }) => setRows(d.rows))
      .catch(() => setRows([]));
  }, []);

  if (rows == null) {
    return <div className="card animate-pulse p-8 text-center text-ink-3">Analisi dei titoli coperti…</div>;
  }

  const w = profileWeights(profile);

  const ideas = rows
    .map((r) => {
      const s = r.scores;
      const dims: [number | null, number][] = [
        [s.quality, w.quality], [s.health, w.health], [s.growth, w.growth],
        [s.valuation, w.valuation], [s.momentum, w.momentum], [s.risk, w.risk],
      ];
      const avail = dims.filter(([v]) => v != null);
      const wsum = avail.reduce((a, [, wt]) => a + wt, 0);
      const fit = wsum ? Math.round(avail.reduce((a, [v, wt]) => a + (v as number) * wt, 0) / wsum) : null;

      let bonus = 0;
      if (profile) {
        if (!matchesMarkets(r.company.country, profile.markets)) bonus -= 15;
        if (profile.styles.includes("dividends") && (r.dividendYield ?? 0) > 0.025) bonus += 5;
        if (profile.styles.includes("momentum") && (s.momentum ?? 0) > 60) bonus += 3;
        if (profile.styles.includes("value") && (s.valuation ?? 0) > 60) bonus += 3;
        if (profile.styles.includes("growth") && (s.growth ?? 0) > 60) bonus += 3;
        if (profile.styles.includes("quality") && (s.quality ?? 0) > 60) bonus += 3;
        if (profile.excludedSectors.includes(r.company.sector)) bonus = -1000;
      }
      return { r, fit: fit == null ? null : Math.max(0, Math.min(100, fit + bonus)) };
    })
    .filter((x) => x.fit != null && x.fit > 0)
    .sort((a, b) => (b.fit ?? 0) - (a.fit ?? 0))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Aziende che meritano un approfondimento — per te</h1>
        <p className="mt-1 text-ink-2">
          Non sono «titoli da comprare»: sono punti di partenza per la tua ricerca,
          ordinati in base al tuo profilo.
        </p>
        {!profile && (
          <p className="mt-2 rounded-xl border border-warn/50 bg-surface-2 px-4 py-2 text-sm text-ink-2">
            Non hai ancora impostato un profilo: sto usando pesi bilanciati.{" "}
            <Link href="/settings" className="text-accent hover:underline">Imposta il profilo</Link> per idee più mirate.
          </p>
        )}
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ideas.map(({ r, fit }) => (
          <Link key={r.company.symbol} href={`/stocks/${r.company.symbol}`}
            className="card block p-5 hover:border-accent">
            <div className="flex items-baseline justify-between">
              <h2 className="font-semibold">{r.company.symbol}</h2>
              <span className="text-xs text-ink-3">{r.company.sector}</span>
            </div>
            <p className="text-sm text-ink-2">{r.company.name}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-surface-2 p-2 text-center">
                <p className="text-xs text-ink-3">Oggettivo</p>
                <p className="tabular font-bold">{r.scores.overall ?? "n.d."}/100</p>
              </div>
              <div className="rounded-lg bg-surface-2 p-2 text-center">
                <p className="text-xs text-ink-3">Adatto a te</p>
                <p className="tabular font-bold text-accent">{fit}/100</p>
              </div>
            </div>
            <ul className="mt-3 space-y-1 text-xs text-ink-2">
              <li>Solidità: <b>{r.scores.health ?? "n.d."}</b> · Valutazione: <b>{r.scores.valuation ?? "n.d."}</b></li>
              <li>Crescita: <b>{r.scores.growth ?? "n.d."}</b> · Momentum: <b>{r.scores.momentum ?? "n.d."}</b></li>
              <li>12 mesi: <span className={(r.r12 ?? 0) >= 0 ? "text-good" : "text-bad"}>{fmtPct(r.r12)}</span>
                {" · "}confidenza dati {r.scores.dataConfidence}%</li>
            </ul>
            <p className="mt-2 text-xs text-ink-3">Apri l&apos;analisi per rischi e punti deboli →</p>
          </Link>
        ))}
      </div>

      <p className="text-xs text-ink-3">
        Il punteggio «adatto a te» ripesa le stesse dimensioni oggettive secondo il tuo profilo
        (pesi pubblicati in <Link href="/methodology" className="text-accent hover:underline">metodologia</Link>);
        non altera i dati né nasconde i segnali di rischio, sempre visibili nella pagina del titolo.
      </p>
    </div>
  );
}
