/**
 * FIXTURE DEMO — dati sintetici, plausibili ma NON reali.
 * Servono solo a far girare il prodotto senza credenziali API.
 * Ogni record è etichettato con provenance.freshness = "synthetic"
 * e l'interfaccia mostra sempre il badge "Dati demo".
 */

import type { Company, Fundamentals, DataProvenance } from "../types";

const RETRIEVED = "2026-07-10T09:00:00Z";

export const demoProvenance = (period?: string, currency?: string): DataProvenance => ({
  source: "Demo fixtures (dati sintetici)",
  freshness: "synthetic",
  retrievedAt: RETRIEVED,
  period,
  currency,
  note: "Dati dimostrativi: non usarli per decisioni reali.",
});

export const COMPANIES: Company[] = [
  {
    symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", country: "US", currency: "USD",
    sector: "Tecnologia", industry: "Elettronica di consumo",
    description: "Progetta e vende smartphone, computer, dispositivi indossabili e servizi digitali con un ecosistema integrato.",
    peers: ["MSFT", "GOOGL", "AMZN"], themes: ["consumer-tech", "ai"], domain: "apple.com", etoroSlug: "aapl",
  },
  {
    symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", country: "US", currency: "USD",
    sector: "Tecnologia", industry: "Software e cloud",
    description: "Software enterprise, cloud Azure, produttività e intelligenza artificiale applicata.",
    peers: ["AAPL", "GOOGL", "AMZN"], themes: ["cloud", "ai"], domain: "microsoft.com", etoroSlug: "msft",
  },
  {
    symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ", country: "US", currency: "USD",
    sector: "Tecnologia", industry: "Semiconduttori",
    description: "GPU e sistemi per accelerazione del calcolo, leader nell'infrastruttura per l'intelligenza artificiale.",
    peers: ["ASML", "MSFT"], themes: ["semiconductors", "ai"], domain: "nvidia.com", etoroSlug: "nvda",
  },
  {
    symbol: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ", country: "US", currency: "USD",
    sector: "Servizi di comunicazione", industry: "Internet e pubblicità",
    description: "Motore di ricerca, pubblicità digitale, cloud e ricerca sull'intelligenza artificiale.",
    peers: ["MSFT", "AMZN", "AAPL"], themes: ["ai", "cloud"], domain: "abc.xyz", etoroSlug: "googl",
  },
  {
    symbol: "AMZN", name: "Amazon.com Inc.", exchange: "NASDAQ", country: "US", currency: "USD",
    sector: "Beni di consumo discrezionali", industry: "E-commerce e cloud",
    description: "E-commerce globale e AWS, la più grande piattaforma cloud al mondo.",
    peers: ["MSFT", "GOOGL"], themes: ["cloud", "consumer-tech"], domain: "amazon.com", etoroSlug: "amzn",
  },
  {
    symbol: "JNJ", name: "Johnson & Johnson", exchange: "NYSE", country: "US", currency: "USD",
    sector: "Sanità", industry: "Farmaceutica",
    description: "Farmaci e dispositivi medici; profilo difensivo con lunga storia di dividendi.",
    peers: ["KO"], themes: ["healthcare", "dividends"], domain: "jnj.com", etoroSlug: "jnj",
  },
  {
    symbol: "KO", name: "The Coca-Cola Company", exchange: "NYSE", country: "US", currency: "USD",
    sector: "Beni di prima necessità", industry: "Bevande",
    description: "Marchi globali di bevande con distribuzione capillare e dividendi in crescita da decenni.",
    peers: ["JNJ"], themes: ["consumer-staples", "dividends"], domain: "coca-colacompany.com", etoroSlug: "ko",
  },
  {
    symbol: "ASML", name: "ASML Holding N.V.", exchange: "Euronext Amsterdam", country: "NL", currency: "EUR",
    sector: "Tecnologia", industry: "Apparecchiature per semiconduttori",
    description: "Monopolista di fatto della litografia EUV, indispensabile per i chip più avanzati.",
    peers: ["NVDA", "SAP"], themes: ["semiconductors", "ai"], domain: "asml.com", etoroSlug: "asml",
  },
  {
    symbol: "SAP", name: "SAP SE", exchange: "XETRA", country: "DE", currency: "EUR",
    sector: "Tecnologia", industry: "Software enterprise",
    description: "Software gestionale per grandi imprese in transizione verso il cloud.",
    peers: ["MSFT", "ASML"], themes: ["cloud"], domain: "sap.com", etoroSlug: "sap",
  },
  {
    symbol: "RACE.MI", name: "Ferrari N.V.", exchange: "Borsa Italiana", country: "IT", currency: "EUR",
    sector: "Beni di consumo discrezionali", industry: "Automobili di lusso",
    description: "Casa automobilistica di lusso con margini da azienda del lusso e domanda superiore all'offerta.",
    peers: ["ENEL.MI", "ISP.MI"], themes: ["luxury", "italy"], domain: "ferrari.com", etoroSlug: "race",
  },
  {
    symbol: "ENEL.MI", name: "Enel S.p.A.", exchange: "Borsa Italiana", country: "IT", currency: "EUR",
    sector: "Utility", industry: "Elettricità e rinnovabili",
    description: "Utility integrata con forte presenza nelle rinnovabili e dividendo elevato.",
    peers: ["ISP.MI", "RACE.MI"], themes: ["energy", "dividends", "italy"], domain: "enel.com",
  },
  {
    symbol: "ISP.MI", name: "Intesa Sanpaolo S.p.A.", exchange: "Borsa Italiana", country: "IT", currency: "EUR",
    sector: "Finanza", industry: "Banche",
    description: "Prima banca italiana per capitalizzazione, focalizzata su wealth management e remunerazione degli azionisti.",
    peers: ["ENEL.MI", "RACE.MI"], themes: ["financials", "dividends", "italy"], domain: "intesasanpaolo.com",
  },
];

/** Fondamentali sintetici, coerenti nello stile ma inventati (demo). */
export const FUNDAMENTALS: Record<string, Fundamentals> = {
  AAPL: f("AAPL", "USD", {
    revenue: [365, 394, 383, 391, 408], netIncome: [94.7, 99.8, 97.0, 93.7, 101.9],
    ocf: [104, 122, 110, 118, 126], capex: [11, 11, 11, 9.5, 10.2],
    shares: [16.7, 16.3, 15.8, 15.4, 15.1],
    totalDebt: 106, cash: 62, ebitda: 134,
    grossMargin: 0.462, operatingMargin: 0.302, netMargin: 0.25, roe: 1.45, roic: 0.56,
    currentRatio: 0.95, interestCoverage: 28, eps: 6.75, divYield: 0.005, payout: 0.15,
    pe: 33.5, fwdPe: 29.8, ps: 8.4, pb: 48, evEbitda: 25.4, priceFcf: 29,
    peRange: { low: 18, high: 37, median: 27 }, beta: 1.2, mcap: 3400,
  }),
  MSFT: f("MSFT", "USD", {
    revenue: [198, 212, 245, 279, 310], netIncome: [72.7, 72.4, 88.1, 101.2, 112.4],
    ocf: [89, 87.6, 118, 131, 142], capex: [23.9, 28.1, 44.5, 58, 63],
    shares: [7.5, 7.45, 7.43, 7.4, 7.38],
    totalDebt: 97, cash: 80, ebitda: 158,
    grossMargin: 0.69, operatingMargin: 0.45, netMargin: 0.36, roe: 0.38, roic: 0.29,
    currentRatio: 1.3, interestCoverage: 40, eps: 15.2, divYield: 0.007, payout: 0.24,
    pe: 34.8, fwdPe: 30.5, ps: 12.4, pb: 12.9, evEbitda: 23.9, priceFcf: 45,
    peRange: { low: 24, high: 38, median: 31 }, beta: 0.95, mcap: 3900,
  }),
  NVDA: f("NVDA", "USD", {
    revenue: [26.9, 27, 60.9, 130.5, 184], netIncome: [9.8, 4.4, 29.8, 72.9, 104],
    ocf: [9.1, 5.6, 28.1, 64.1, 96], capex: [0.98, 1.8, 1.1, 3.2, 5.4],
    shares: [25.3, 24.9, 24.7, 24.6, 24.5],
    totalDebt: 11, cash: 43, ebitda: 115,
    grossMargin: 0.75, operatingMargin: 0.62, netMargin: 0.565, roe: 0.92, roic: 0.78,
    currentRatio: 4.2, interestCoverage: 120, eps: 4.25, divYield: 0.0003, payout: 0.01,
    pe: 42, fwdPe: 33, ps: 23.7, pb: 38, evEbitda: 37, priceFcf: 46,
    peRange: { low: 30, high: 85, median: 52 }, beta: 1.8, mcap: 4360,
  }),
  GOOGL: f("GOOGL", "USD", {
    revenue: [258, 283, 307, 350, 392], netIncome: [76, 60, 73.8, 100.1, 118],
    ocf: [91.7, 91.5, 101.7, 125.3, 144], capex: [24.6, 31.5, 32.3, 52.5, 68],
    shares: [13.2, 13.0, 12.7, 12.4, 12.2],
    totalDebt: 28, cash: 110, ebitda: 152,
    grossMargin: 0.57, operatingMargin: 0.32, netMargin: 0.30, roe: 0.32, roic: 0.28,
    currentRatio: 1.9, interestCoverage: 200, eps: 9.7, divYield: 0.004, payout: 0.08,
    pe: 24.5, fwdPe: 21.8, ps: 6.9, pb: 7.2, evEbitda: 17.1, priceFcf: 32,
    peRange: { low: 17, high: 30, median: 24 }, beta: 1.05, mcap: 2900,
  }),
  AMZN: f("AMZN", "USD", {
    revenue: [470, 514, 575, 638, 705], netIncome: [33.4, -2.7, 30.4, 59.2, 78],
    ocf: [46.3, 46.8, 84.9, 115.9, 138], capex: [61, 63.6, 52.7, 83, 105],
    shares: [10.2, 10.3, 10.4, 10.5, 10.6],
    totalDebt: 135, cash: 101, ebitda: 145,
    grossMargin: 0.48, operatingMargin: 0.11, netMargin: 0.11, roe: 0.24, roic: 0.15,
    currentRatio: 1.06, interestCoverage: 22, eps: 7.4, divYield: null, payout: null,
    pe: 32, fwdPe: 27, ps: 3.5, pb: 7.6, evEbitda: 17.5, priceFcf: 74,
    peRange: { low: 26, high: 105, median: 58 }, beta: 1.3, mcap: 2480,
  }),
  JNJ: f("JNJ", "USD", {
    revenue: [93.8, 94.9, 85.2, 88.8, 92.0], netIncome: [20.9, 17.9, 13.3, 14.1, 17.5],
    ocf: [23.4, 21.2, 22.8, 24.3, 25.1], capex: [3.7, 4.0, 4.5, 4.4, 4.6],
    shares: [2.64, 2.62, 2.42, 2.41, 2.40],
    totalDebt: 34, cash: 25, ebitda: 30.8,
    grossMargin: 0.69, operatingMargin: 0.26, netMargin: 0.19, roe: 0.24, roic: 0.17,
    currentRatio: 1.1, interestCoverage: 25, eps: 7.3, divYield: 0.032, payout: 0.68,
    pe: 21, fwdPe: 15.5, ps: 4.1, pb: 5.3, evEbitda: 12.9, priceFcf: 18.5,
    peRange: { low: 14, high: 25, median: 18 }, beta: 0.55, mcap: 380,
  }),
  KO: f("KO", "USD", {
    revenue: [38.7, 43.0, 45.8, 47.1, 48.9], netIncome: [9.8, 9.5, 10.7, 10.6, 11.4],
    ocf: [12.6, 11.0, 11.6, 6.8, 12.9], capex: [1.4, 1.5, 1.9, 2.0, 2.1],
    shares: [4.34, 4.33, 4.32, 4.31, 4.30],
    totalDebt: 44, cash: 14, ebitda: 15.3,
    grossMargin: 0.60, operatingMargin: 0.29, netMargin: 0.23, roe: 0.42, roic: 0.16,
    currentRatio: 1.1, interestCoverage: 8.5, eps: 2.62, divYield: 0.029, payout: 0.74,
    pe: 26.5, fwdPe: 22.8, ps: 6.2, pb: 10.9, evEbitda: 21.5, priceFcf: 27,
    peRange: { low: 19, high: 30, median: 25 }, beta: 0.6, mcap: 300,
  }),
  ASML: f("ASML", "EUR", {
    revenue: [18.6, 21.2, 27.6, 28.3, 33.9], netIncome: [5.9, 5.6, 7.8, 7.6, 9.7],
    ocf: [10.8, 7.3, 5.4, 9.5, 11.5], capex: [1.0, 1.3, 1.8, 1.7, 1.9],
    shares: [0.407, 0.398, 0.394, 0.392, 0.39],
    totalDebt: 4.7, cash: 12, ebitda: 11.6,
    grossMargin: 0.51, operatingMargin: 0.33, netMargin: 0.286, roe: 0.48, roic: 0.36,
    currentRatio: 1.5, interestCoverage: 60, eps: 24.9, divYield: 0.009, payout: 0.28,
    pe: 34, fwdPe: 28, ps: 9.7, pb: 16.3, evEbitda: 28, priceFcf: 34,
    peRange: { low: 22, high: 50, median: 34 }, beta: 1.4, mcap: 330,
  }),
  SAP: f("SAP", "EUR", {
    revenue: [27.8, 30.9, 31.2, 34.2, 37.6], netIncome: [5.4, 2.3, 5.9, 3.1, 6.6],
    ocf: [6.2, 5.5, 6.1, 4.7, 7.9], capex: [0.8, 0.9, 0.8, 0.7, 0.8],
    shares: [1.19, 1.18, 1.17, 1.17, 1.16],
    totalDebt: 12, cash: 10, ebitda: 10.3,
    grossMargin: 0.73, operatingMargin: 0.21, netMargin: 0.175, roe: 0.15, roic: 0.12,
    currentRatio: 1.2, interestCoverage: 20, eps: 5.7, divYield: 0.011, payout: 0.41,
    pe: 40, fwdPe: 32, ps: 7.4, pb: 6.3, evEbitda: 27, priceFcf: 39,
    peRange: { low: 18, high: 45, median: 27 }, beta: 0.9, mcap: 280,
  }),
  "RACE.MI": f("RACE.MI", "EUR", {
    revenue: [4.27, 5.1, 5.97, 6.68, 7.35], netIncome: [0.83, 0.94, 1.26, 1.53, 1.72],
    ocf: [1.32, 1.39, 1.71, 1.94, 2.15], capex: [0.72, 0.83, 0.87, 0.98, 1.05],
    shares: [0.185, 0.183, 0.181, 0.180, 0.179],
    totalDebt: 2.9, cash: 1.3, ebitda: 2.75,
    grossMargin: 0.50, operatingMargin: 0.28, netMargin: 0.234, roe: 0.45, roic: 0.24,
    currentRatio: 1.4, interestCoverage: 35, eps: 9.6, divYield: 0.006, payout: 0.29,
    pe: 46, fwdPe: 40, ps: 10.8, pb: 20, evEbitda: 29.5, priceFcf: 42,
    peRange: { low: 28, high: 55, median: 42 }, beta: 0.9, mcap: 79,
  }),
  "ENEL.MI": f("ENEL.MI", "EUR", {
    revenue: [88.3, 140.5, 95.6, 82.0, 84.5], netIncome: [3.2, 1.7, 3.4, 6.6, 7.1],
    ocf: [10.7, 8.4, 15.9, 13.7, 14.2], capex: [11.5, 13.8, 12.5, 11.6, 11.9],
    shares: [10.17, 10.17, 10.17, 10.17, 10.17],
    totalDebt: 64, cash: 8, ebitda: 22.8,
    grossMargin: null, operatingMargin: 0.14, netMargin: 0.084, roe: 0.22, roic: 0.08,
    currentRatio: 0.9, interestCoverage: 4.8, eps: 0.7, divYield: 0.058, payout: 0.68,
    pe: 11.5, fwdPe: 10.8, ps: 0.96, pb: 2.4, evEbitda: 6.4, priceFcf: 35,
    peRange: { low: 8, high: 16, median: 11 }, beta: 0.75, mcap: 82,
  }),
  "ISP.MI": f("ISP.MI", "EUR", {
    revenue: [20.8, 21.6, 25.1, 26.7, 27.3], netIncome: [4.2, 4.4, 7.7, 8.7, 9.1],
    ocf: [6.0, 5.5, 9.0, 9.8, 10.1], capex: [0.9, 1.0, 1.0, 1.1, 1.1],
    shares: [19.4, 18.8, 18.2, 17.9, 17.6],
    totalDebt: null, cash: null, ebitda: null,
    grossMargin: null, operatingMargin: 0.48, netMargin: 0.333, roe: 0.145, roic: null,
    currentRatio: null, interestCoverage: null, eps: 0.52, divYield: 0.078, payout: 0.7,
    pe: 9.8, fwdPe: 9.2, ps: 3.3, pb: 1.35, evEbitda: null, priceFcf: null,
    peRange: { low: 6, high: 12, median: 9 }, beta: 1.1, mcap: 89,
  }),
};

type FInput = {
  revenue: number[]; netIncome: number[]; ocf: number[]; capex: number[]; shares: number[];
  totalDebt: number | null; cash: number | null; ebitda: number | null;
  grossMargin: number | null; operatingMargin: number | null; netMargin: number | null;
  roe: number | null; roic: number | null; currentRatio: number | null; interestCoverage: number | null;
  eps: number | null; divYield: number | null; payout: number | null;
  pe: number | null; fwdPe: number | null; ps: number | null; pb: number | null;
  evEbitda: number | null; priceFcf: number | null;
  peRange: { low: number; high: number; median: number } | null; beta: number | null; mcap: number | null;
};

/** I valori sono espressi in miliardi (valuta nativa); qui li scaliamo. */
function f(symbol: string, currency: string, x: FInput): Fundamentals {
  const B = 1e9;
  return {
    symbol,
    fiscalYears: ["FY2021", "FY2022", "FY2023", "FY2024", "FY2025"],
    revenue: x.revenue.map((v) => v * B),
    netIncome: x.netIncome.map((v) => v * B),
    operatingCashFlow: x.ocf.map((v) => v * B),
    capex: x.capex.map((v) => v * B),
    sharesOutstanding: x.shares.map((v) => v * B),
    totalDebt: x.totalDebt == null ? null : x.totalDebt * B,
    cash: x.cash == null ? null : x.cash * B,
    ebitda: x.ebitda == null ? null : x.ebitda * B,
    grossMargin: x.grossMargin,
    operatingMargin: x.operatingMargin,
    netMargin: x.netMargin,
    roe: x.roe,
    roic: x.roic,
    currentRatio: x.currentRatio,
    interestCoverage: x.interestCoverage,
    eps: x.eps,
    dividendYield: x.divYield,
    payoutRatio: x.payout,
    pe: x.pe,
    forwardPe: x.fwdPe,
    ps: x.ps,
    pb: x.pb,
    evEbitda: x.evEbitda,
    priceFcf: x.priceFcf,
    peHistoricalRange: x.peRange,
    beta: x.beta,
    marketCap: x.mcap == null ? null : x.mcap * B,
    provenance: demoProvenance("FY2025", currency),
  };
}
