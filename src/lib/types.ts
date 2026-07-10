/**
 * Modello di dominio di FinSight.
 * Ogni dato mostrato all'utente porta con sé la sua provenienza (DataProvenance)
 * e la distinzione FATTO / CALCOLO / INTERPRETAZIONE è modellata esplicitamente.
 */

export type DataMode = "demo" | "live";

export type Freshness = "real-time" | "delayed" | "end-of-day" | "historical" | "synthetic";

export interface DataProvenance {
  source: string;          // es. "Demo fixtures", "Twelve Data", "SEC EDGAR"
  freshness: Freshness;
  retrievedAt: string;     // ISO
  period?: string;         // es. "FY 2025", "TTM"
  currency?: string;
  note?: string;
}

export type ClaimKind = "FACT" | "CALCULATION" | "INTERPRETATION";

export interface Company {
  symbol: string;
  name: string;
  exchange: string;
  country: string;
  currency: string;
  sector: string;
  industry: string;
  isin?: string;
  description: string;
  peers: string[];         // symbols
  themes: string[];        // es. "ai", "semiconductors"
}

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  volume: number | null;
  provenance: DataProvenance;
}

export interface PriceBar {
  date: string;            // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PriceSeries {
  symbol: string;
  bars: PriceBar[];
  provenance: DataProvenance;
}

/** Serie storiche annuali dei fondamentali (dal più vecchio al più recente). */
export interface Fundamentals {
  symbol: string;
  fiscalYears: string[];         // es. ["2021","2022","2023","2024","2025"]
  revenue: number[];             // valuta nativa
  netIncome: number[];
  operatingCashFlow: number[];
  capex: number[];               // valori positivi = spesa
  totalDebt: number | null;
  cash: number | null;
  ebitda: number | null;
  sharesOutstanding: number[];   // per anno, per rilevare diluizione/buyback
  grossMargin: number | null;    // frazioni: 0.44 = 44%
  operatingMargin: number | null;
  netMargin: number | null;
  roe: number | null;
  roic: number | null;
  currentRatio: number | null;
  interestCoverage: number | null;
  eps: number | null;
  dividendYield: number | null;  // frazione
  payoutRatio: number | null;
  pe: number | null;
  forwardPe: number | null;
  ps: number | null;
  pb: number | null;
  evEbitda: number | null;
  priceFcf: number | null;
  peHistoricalRange: { low: number; high: number; median: number } | null;
  beta: number | null;
  marketCap: number | null;
  provenance: DataProvenance;
}

export type Sentiment = "positive" | "negative" | "neutral";

export interface NewsArticle {
  id: string;
  eventId: string;              // articoli sullo stesso evento condividono l'eventId
  headline: string;
  publisher: string;
  publishedAt: string;          // ISO
  url: string | null;
  tickers: string[];
  topic: string;
  sentiment: Sentiment;
  relevance: number;            // 0..1
  summary: string;
  provenance: DataProvenance;
}

/** Un componente di punteggio, sempre ispezionabile. */
export interface ScoreComponent {
  key: string;
  label: string;
  rawValue: number | null;      // metrica originale (null = dato mancante)
  rawLabel: string;             // metrica formattata, o "Dato non disponibile"
  normalized: number | null;    // 0..100, null se mancante
  weight: number;               // peso dichiarato
  contribution: number | null;  // normalized * weight effettivo
  explanation: string;
}

export interface ScoreBreakdown {
  score: number | null;         // 0..100 sui soli componenti disponibili
  components: ScoreComponent[];
  missing: string[];            // label dei componenti non disponibili
  coverage: number;             // frazione di peso coperta da dati reali 0..1
}

export interface CompanyScores {
  health: ScoreBreakdown;
  quality: ScoreBreakdown;
  growth: ScoreBreakdown;
  valuation: ScoreBreakdown;
  momentum: ScoreBreakdown;
  risk: ScoreBreakdown;         // 100 = rischio basso
  overall: ScoreBreakdown;
  dataConfidence: number;       // 0..100
}

export type RiskLevel = "low" | "moderate" | "high" | "critical";

export interface RedFlag {
  level: RiskLevel;
  title: string;
  detail: string;
  kind: ClaimKind;
}

export interface Insight {
  title: string;
  detail: string;
  kind: ClaimKind;
}

export interface Scenario {
  name: "bull" | "base" | "bear";
  assumptions: string[];
  catalysts: string[];
  risks: string[];
  metricsToWatch: string[];
  invalidation: string[];
}

/** Profilo investitore (client-side, mai inviato a terzi). */
export interface InvestorProfile {
  horizon: "short" | "medium" | "long" | "verylong";
  riskTolerance: "conservative" | "moderate" | "balanced" | "growth" | "aggressive";
  markets: string[];            // ["IT","EU","US","ASIA","GLOBAL"]
  styles: string[];             // ["growth","quality","value","dividends","momentum","turnaround"]
  excludedSectors: string[];
}
