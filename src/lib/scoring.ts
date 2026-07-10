/**
 * Motore di scoring spiegabile.
 *
 * Regole:
 *  - ogni componente dichiara metrica grezza, normalizzazione, peso e contributo;
 *  - i dati mancanti NON valgono zero: il peso viene ridistribuito sui
 *    componenti disponibili e la copertura è mostrata all'utente;
 *  - la metodologia completa è pubblicata in /methodology.
 */

import type {
  CompanyScores, Fundamentals, InvestorProfile, PriceBar,
  ScoreBreakdown, ScoreComponent,
} from "./types";
import {
  annualizedVolatility, maxDrawdown, seriesCagr,
  sma, trailingReturn,
} from "./indicators";
import { fmtNum, fmtPct } from "./format";

/** Normalizza value su [lo, hi] → 0..100 (clamp). higherIsBetter=false inverte. */
function norm(value: number, lo: number, hi: number, higherIsBetter = true): number {
  const t = Math.max(0, Math.min(1, (value - lo) / (hi - lo)));
  return Math.round((higherIsBetter ? t : 1 - t) * 100);
}

function component(
  key: string, label: string, weight: number,
  rawValue: number | null, rawLabel: string,
  normalized: number | null, explanation: string,
): ScoreComponent {
  return {
    key, label, weight, rawValue,
    rawLabel: rawValue == null ? "Dato non disponibile" : rawLabel,
    normalized: rawValue == null ? null : normalized,
    contribution: null, // calcolato in buildBreakdown
    explanation,
  };
}

function buildBreakdown(components: ScoreComponent[]): ScoreBreakdown {
  const available = components.filter((c) => c.normalized != null);
  const totalWeight = components.reduce((a, c) => a + c.weight, 0);
  const availWeight = available.reduce((a, c) => a + c.weight, 0);
  const coverage = totalWeight ? availWeight / totalWeight : 0;

  let score: number | null = null;
  if (availWeight > 0) {
    score = Math.round(
      available.reduce((a, c) => a + (c.normalized as number) * c.weight, 0) / availWeight,
    );
    for (const c of available) {
      c.contribution = Math.round(((c.normalized as number) * c.weight) / availWeight);
    }
  }
  return {
    score,
    components,
    missing: components.filter((c) => c.normalized == null).map((c) => c.label),
    coverage,
  };
}

// ---------------------------------------------------------------------------

export function scoreHealth(f: Fundamentals | null): ScoreBreakdown {
  if (!f) return buildBreakdown([]);
  const fcf = lastFcf(f);
  const fcfMargin = fcf != null && f.revenue.length
    ? fcf / f.revenue[f.revenue.length - 1] : null;
  const netDebtEbitda = f.totalDebt != null && f.cash != null && f.ebitda
    ? (f.totalDebt - f.cash) / f.ebitda : null;
  const dilution = f.sharesOutstanding.length >= 2
    ? (f.sharesOutstanding[f.sharesOutstanding.length - 1] / f.sharesOutstanding[0] - 1) * 100
    : null;

  return buildBreakdown([
    component("fcf", "Generazione di cassa (margine FCF)", 25,
      fcfMargin, fmtPct(fcfMargin == null ? null : fcfMargin * 100, false),
      fcfMargin == null ? null : norm(fcfMargin, 0, 0.25),
      "Free cash flow / ricavi dell'ultimo esercizio. Sopra il 15% è eccellente."),
    component("debt", "Leva finanziaria (debito netto / EBITDA)", 25,
      netDebtEbitda, fmtNum(netDebtEbitda ?? null, 1) + "×",
      netDebtEbitda == null ? null : norm(netDebtEbitda, 4, -1, false),
      "Sotto 1× è molto solido; sopra 3× la leva inizia a pesare."),
    component("margin", "Margine operativo", 20,
      f.operatingMargin, fmtPct(f.operatingMargin == null ? null : f.operatingMargin * 100, false),
      f.operatingMargin == null ? null : norm(f.operatingMargin, 0.03, 0.35),
      "Capacità di trasformare i ricavi in utile operativo."),
    component("coverage", "Copertura degli interessi", 15,
      f.interestCoverage, fmtNum(f.interestCoverage ?? null, 0) + "×",
      f.interestCoverage == null ? null : norm(f.interestCoverage, 2, 20),
      "Quante volte l'utile operativo copre gli oneri finanziari."),
    component("dilution", "Evoluzione del numero di azioni (5 anni)", 15,
      dilution, fmtPct(dilution, true),
      dilution == null ? null : norm(dilution, 10, -8, false),
      "Numero di azioni in calo = buyback (positivo); in crescita = diluizione."),
  ]);
}

export function scoreGrowth(f: Fundamentals | null): ScoreBreakdown {
  if (!f) return buildBreakdown([]);
  const revCagr = seriesCagr(f.revenue);
  const niCagr = seriesCagr(f.netIncome.map((v) => Math.max(v, 0.001)));
  const lastGrowth = f.revenue.length >= 2
    ? (f.revenue[f.revenue.length - 1] / f.revenue[f.revenue.length - 2] - 1) * 100
    : null;

  return buildBreakdown([
    component("revcagr", "Crescita ricavi (CAGR 5 anni)", 40,
      revCagr, fmtPct(revCagr),
      revCagr == null ? null : norm(revCagr, 0, 25),
      "Crescita composta annua dei ricavi sugli esercizi disponibili."),
    component("nicagr", "Crescita utili (CAGR 5 anni)", 35,
      niCagr, fmtPct(niCagr),
      niCagr == null ? null : norm(niCagr, 0, 30),
      "Crescita composta annua dell'utile netto."),
    component("lastyear", "Crescita ricavi ultimo anno", 25,
      lastGrowth, fmtPct(lastGrowth),
      lastGrowth == null ? null : norm(lastGrowth, -5, 25),
      "Accelerazione o rallentamento rispetto alla media storica."),
  ]);
}

export function scoreQuality(f: Fundamentals | null): ScoreBreakdown {
  if (!f) return buildBreakdown([]);
  const fcf = lastFcf(f);
  const fcfConversion = fcf != null && f.netIncome.length && f.netIncome[f.netIncome.length - 1] > 0
    ? fcf / f.netIncome[f.netIncome.length - 1] : null;

  return buildBreakdown([
    component("roic", "ROIC", 35,
      f.roic, fmtPct(f.roic == null ? null : f.roic * 100, false),
      f.roic == null ? null : norm(f.roic, 0.05, 0.30),
      "Rendimento del capitale investito: la misura principale della qualità del business."),
    component("netmargin", "Margine netto", 25,
      f.netMargin, fmtPct(f.netMargin == null ? null : f.netMargin * 100, false),
      f.netMargin == null ? null : norm(f.netMargin, 0.02, 0.30),
      "Quota dei ricavi che diventa utile netto."),
    component("fcfconv", "Conversione utili → cassa", 25,
      fcfConversion, fmtPct(fcfConversion == null ? null : fcfConversion * 100, false),
      fcfConversion == null ? null : norm(fcfConversion, 0.4, 1.2),
      "FCF/utile netto vicino o sopra il 100% indica utili di alta qualità."),
    component("roe", "ROE", 15,
      f.roe, fmtPct(f.roe == null ? null : f.roe * 100, false),
      f.roe == null ? null : norm(f.roe, 0.05, 0.35),
      "Rendimento del capitale proprio (sensibile alla leva: leggere insieme al debito)."),
  ]);
}

export function scoreValuation(f: Fundamentals | null): ScoreBreakdown {
  if (!f) return buildBreakdown([]);
  // posizione del P/E attuale dentro il proprio range storico (0 = minimo, 1 = massimo)
  let peVsHistory: number | null = null;
  if (f.pe != null && f.peHistoricalRange) {
    const { low, high } = f.peHistoricalRange;
    peVsHistory = high > low ? (f.pe - low) / (high - low) : null;
  }
  const fcfYield = f.priceFcf != null && f.priceFcf > 0 ? (1 / f.priceFcf) * 100 : null;
  const earningsYield = f.pe != null && f.pe > 0 ? (1 / f.pe) * 100 : null;

  return buildBreakdown([
    component("pehist", "P/E vs range storico proprio", 40,
      peVsHistory, peVsHistory == null ? "—" : `${Math.round(peVsHistory * 100)}° percentile`,
      peVsHistory == null ? null : norm(peVsHistory, 1, 0),
      "Dove si colloca la valutazione attuale rispetto alla storia della stessa azienda."),
    component("fcfyield", "Rendimento FCF", 30,
      fcfYield, fmtPct(fcfYield, false),
      fcfYield == null ? null : norm(fcfYield, 1, 6),
      "FCF/prezzo: più alto = più cassa per euro investito."),
    component("eyield", "Rendimento utili (1/PE)", 30,
      earningsYield, fmtPct(earningsYield, false),
      earningsYield == null ? null : norm(earningsYield, 2, 8),
      "L'inverso del P/E, confrontabile con i rendimenti obbligazionari."),
  ]);
}

export function scoreMomentum(bars: PriceBar[] | null): ScoreBreakdown {
  if (!bars || bars.length < 60) return buildBreakdown([]);
  const r3m = trailingReturn(bars, 66);
  const r12m = trailingReturn(bars, 252);
  const closes = bars.map((b) => b.close);
  const sma200 = sma(closes, 200);
  const last = closes[closes.length - 1];
  const s200 = sma200[sma200.length - 1];
  const vsSma = s200 ? ((last / s200) - 1) * 100 : null;

  return buildBreakdown([
    component("r12", "Rendimento 12 mesi", 40,
      r12m, fmtPct(r12m),
      r12m == null ? null : norm(r12m, -20, 40),
      "Momentum di lungo periodo."),
    component("r3", "Rendimento 3 mesi", 30,
      r3m, fmtPct(r3m),
      r3m == null ? null : norm(r3m, -15, 20),
      "Momentum recente."),
    component("sma", "Prezzo vs media a 200 giorni", 30,
      vsSma, fmtPct(vsSma),
      vsSma == null ? null : norm(vsSma, -15, 15),
      "Sopra la SMA200 il trend di fondo è positivo."),
  ]);
}

export function scoreRisk(bars: PriceBar[] | null, f: Fundamentals | null): ScoreBreakdown {
  const comps: ScoreComponent[] = [];
  if (bars && bars.length > 60) {
    const vol = annualizedVolatility(bars);
    const dd = maxDrawdown(bars);
    comps.push(component("vol", "Volatilità annualizzata", 40,
      vol, fmtPct(vol, false),
      vol == null ? null : norm(vol, 60, 12, true),
      "Oscillazione tipica del titolo: più bassa = punteggio di rischio migliore."));
    comps.push(component("dd", "Max drawdown storico", 35,
      dd?.maxDrawdownPct ?? null, fmtPct(dd?.maxDrawdownPct ?? null, false),
      dd == null ? null : norm(dd.maxDrawdownPct, -75, -15, true),
      "La perdita massima dal picco nella storia disponibile."));
  }
  if (f) {
    comps.push(component("beta", "Beta", 25,
      f.beta, fmtNum(f.beta ?? null, 2),
      f.beta == null ? null : norm(f.beta, 2, 0.5, true),
      "Sensibilità al mercato: sotto 1 il titolo tende a muoversi meno dell'indice."));
  }
  return buildBreakdown(comps);
}

// ---------------------------------------------------------------------------

const OVERALL_WEIGHTS = {
  quality: 0.22, health: 0.22, growth: 0.18, valuation: 0.18, momentum: 0.10, risk: 0.10,
};

/** Pesi personalizzati per profilo — NON sostituiscono mai il punteggio oggettivo. */
export function profileWeights(p: InvestorProfile | null): typeof OVERALL_WEIGHTS {
  if (!p) return OVERALL_WEIGHTS;
  switch (p.riskTolerance) {
    case "conservative":
      return { quality: 0.20, health: 0.30, growth: 0.08, valuation: 0.20, momentum: 0.04, risk: 0.18 };
    case "moderate":
      return { quality: 0.22, health: 0.26, growth: 0.12, valuation: 0.20, momentum: 0.06, risk: 0.14 };
    case "balanced":
      return OVERALL_WEIGHTS;
    case "growth":
      return { quality: 0.22, health: 0.14, growth: 0.28, valuation: 0.12, momentum: 0.16, risk: 0.08 };
    case "aggressive":
      return { quality: 0.18, health: 0.10, growth: 0.32, valuation: 0.08, momentum: 0.24, risk: 0.08 };
  }
}

function combine(
  parts: { label: string; bd: ScoreBreakdown; weight: number }[],
): ScoreBreakdown {
  const comps: ScoreComponent[] = parts.map(({ label, bd, weight }) =>
    component(label, label, weight * 100,
      bd.score, bd.score == null ? "—" : `${bd.score}/100`,
      bd.score, `Punteggio della dimensione "${label}" (vedi dettaglio).`),
  );
  return buildBreakdown(comps);
}

export function computeScores(
  f: Fundamentals | null,
  bars: PriceBar[] | null,
  profile: InvestorProfile | null = null,
): CompanyScores {
  const health = scoreHealth(f);
  const quality = scoreQuality(f);
  const growth = scoreGrowth(f);
  const valuation = scoreValuation(f);
  const momentum = scoreMomentum(bars);
  const risk = scoreRisk(bars, f);

  const w = profileWeights(profile);
  const overall = combine([
    { label: "Qualità del business", bd: quality, weight: w.quality },
    { label: "Solidità finanziaria", bd: health, weight: w.health },
    { label: "Crescita", bd: growth, weight: w.growth },
    { label: "Valutazione", bd: valuation, weight: w.valuation },
    { label: "Momentum", bd: momentum, weight: w.momentum },
    { label: "Rischio (100 = basso)", bd: risk, weight: w.risk },
  ]);

  const dims = [health, quality, growth, valuation, momentum, risk];
  const dataConfidence = Math.round(
    (dims.reduce((a, d) => a + d.coverage, 0) / dims.length) * 100,
  );

  return { health, quality, growth, valuation, momentum, risk, overall, dataConfidence };
}

export function verdictLabel(score: number | null): string {
  if (score == null) return "Dati insufficienti";
  if (score >= 75) return "Molto interessante";
  if (score >= 60) return "Interessante";
  if (score >= 45) return "Neutrale";
  if (score >= 30) return "Cautela";
  return "Alto rischio";
}

function lastFcf(f: Fundamentals): number | null {
  if (!f.operatingCashFlow.length || !f.capex.length) return null;
  return f.operatingCashFlow[f.operatingCashFlow.length - 1] - f.capex[f.capex.length - 1];
}

export { lastFcf };
