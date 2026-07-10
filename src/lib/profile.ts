/** Profilo investitore: salvato SOLO in localStorage, mai inviato a server esterni. */

import type { InvestorProfile } from "./types";

export const DEFAULT_PROFILE: InvestorProfile = {
  horizon: "long",
  riskTolerance: "balanced",
  markets: ["GLOBAL"],
  styles: ["quality"],
  excludedSectors: [],
};

export function loadProfile(): InvestorProfile | null {
  try {
    const raw = localStorage.getItem("investorProfile");
    return raw ? (JSON.parse(raw) as InvestorProfile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(p: InvestorProfile) {
  localStorage.setItem("investorProfile", JSON.stringify(p));
}

export const HORIZONS = [
  { value: "short", label: "Meno di 3 anni" },
  { value: "medium", label: "3–5 anni" },
  { value: "long", label: "5–10 anni" },
  { value: "verylong", label: "Oltre 10 anni" },
] as const;

export const RISK_LEVELS = [
  { value: "conservative", label: "Prudente" },
  { value: "moderate", label: "Moderato" },
  { value: "balanced", label: "Bilanciato" },
  { value: "growth", label: "Crescita" },
  { value: "aggressive", label: "Aggressivo" },
] as const;

export const MARKETS = [
  { value: "IT", label: "Italia" },
  { value: "EU", label: "Europa" },
  { value: "US", label: "Stati Uniti" },
  { value: "GLOBAL", label: "Globale" },
] as const;

export const STYLES = [
  { value: "growth", label: "Crescita" },
  { value: "quality", label: "Qualità" },
  { value: "value", label: "Valore" },
  { value: "dividends", label: "Dividendi" },
  { value: "momentum", label: "Momentum" },
] as const;

/** true se l'azienda rientra nei mercati preferiti. */
export function matchesMarkets(country: string, markets: string[]): boolean {
  if (!markets.length || markets.includes("GLOBAL")) return true;
  const eu = ["IT", "DE", "FR", "NL", "ES"];
  return markets.some((m) =>
    m === "IT" ? country === "IT"
    : m === "EU" ? eu.includes(country)
    : m === "US" ? country === "US"
    : false,
  );
}
