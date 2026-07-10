/**
 * Analisi interpretativa basata su regole deterministiche (INTERPRETAZIONE).
 *
 * Non è un modello linguistico: ogni frase deriva da una condizione
 * verificabile sui dati disponibili. Quando sarà configurato un
 * AIAnalysisProvider (es. API Claude), queste regole diventeranno il
 * livello di evidenza passato al modello — mai il contrario.
 */

import type {
  Company, Fundamentals, Insight, PriceBar, RedFlag, Scenario,
} from "./types";
import { maxDrawdown, seriesCagr, trailingReturn } from "./indicators";
import { lastFcf } from "./scoring";
import { fmtNum, fmtPct } from "./format";

export function strengths(c: Company, f: Fundamentals | null, bars: PriceBar[] | null): Insight[] {
  const out: Insight[] = [];
  if (!f) return out;

  const revCagr = seriesCagr(f.revenue);
  if (revCagr != null && revCagr > 10) {
    out.push({
      kind: "CALCULATION",
      title: `Ricavi in crescita composta del ${fmtNum(revCagr, 1)}% annuo`,
      detail: "Crescita a doppia cifra sugli esercizi disponibili.",
    });
  }
  if (f.roic != null && f.roic > 0.2) {
    out.push({
      kind: "FACT",
      title: `ROIC elevato (${fmtNum(f.roic * 100, 0)}%)`,
      detail: "Il capitale investito rende molto sopra il costo tipico del capitale: segnale di vantaggio competitivo.",
    });
  }
  const fcf = lastFcf(f);
  if (fcf != null && f.revenue.length && fcf / f.revenue[f.revenue.length - 1] > 0.15) {
    out.push({
      kind: "CALCULATION",
      title: "Forte generazione di cassa",
      detail: `Margine FCF del ${fmtNum((fcf / f.revenue[f.revenue.length - 1]) * 100, 0)}% nell'ultimo esercizio.`,
    });
  }
  if (f.totalDebt != null && f.cash != null && f.cash > f.totalDebt) {
    out.push({
      kind: "FACT",
      title: "Cassa netta positiva",
      detail: "La liquidità supera il debito totale: bilancio molto solido.",
    });
  }
  if (f.dividendYield != null && f.dividendYield > 0.03) {
    out.push({
      kind: "FACT",
      title: `Dividendo del ${fmtNum(f.dividendYield * 100, 1)}%`,
      detail: "Remunerazione significativa mentre si attende l'apprezzamento del capitale.",
    });
  }
  const sharesDelta = f.sharesOutstanding.length >= 2
    ? f.sharesOutstanding[f.sharesOutstanding.length - 1] / f.sharesOutstanding[0] - 1 : null;
  if (sharesDelta != null && sharesDelta < -0.03) {
    out.push({
      kind: "CALCULATION",
      title: "Buyback costanti",
      detail: `Numero di azioni ridotto del ${fmtNum(Math.abs(sharesDelta) * 100, 1)}% in 5 anni.`,
    });
  }
  if (bars) {
    const r12 = trailingReturn(bars, 252);
    if (r12 != null && r12 > 15) {
      out.push({
        kind: "CALCULATION",
        title: `Momentum positivo (+${fmtNum(r12, 0)}% in 12 mesi)`,
        detail: "Il mercato sta già riconoscendo la tesi: attenzione però a non pagare l'entusiasmo.",
      });
    }
  }
  return out.slice(0, 5);
}

export function weaknesses(c: Company, f: Fundamentals | null, bars: PriceBar[] | null): Insight[] {
  const out: Insight[] = [];
  if (!f) return out;

  if (f.pe != null && f.peHistoricalRange && f.pe > f.peHistoricalRange.median * 1.25) {
    out.push({
      kind: "CALCULATION",
      title: "Valutazione sopra la propria storia",
      detail: `P/E attuale ${fmtNum(f.pe, 0)} contro una mediana storica di ${fmtNum(f.peHistoricalRange.median, 0)}: il prezzo incorpora aspettative elevate.`,
    });
  }
  const revCagr = seriesCagr(f.revenue);
  if (revCagr != null && revCagr < 3) {
    out.push({
      kind: "CALCULATION",
      title: "Crescita dei ricavi modesta",
      detail: `CAGR del ${fmtNum(revCagr, 1)}%: la tesi dipende da margini e remunerazione, non dalla crescita.`,
    });
  }
  const netDebtEbitda = f.totalDebt != null && f.cash != null && f.ebitda
    ? (f.totalDebt - f.cash) / f.ebitda : null;
  if (netDebtEbitda != null && netDebtEbitda > 2.5) {
    out.push({
      kind: "CALCULATION",
      title: `Leva elevata (debito netto ${fmtNum(netDebtEbitda, 1)}× EBITDA)`,
      detail: "Il debito riduce la flessibilità e amplifica gli scenari negativi.",
    });
  }
  if (f.payoutRatio != null && f.payoutRatio > 0.7) {
    out.push({
      kind: "FACT",
      title: `Payout elevato (${fmtNum(f.payoutRatio * 100, 0)}%)`,
      detail: "Poco margine per aumentare il dividendo se gli utili deludono.",
    });
  }
  if (bars) {
    const dd = maxDrawdown(bars);
    if (dd && dd.maxDrawdownPct < -45) {
      out.push({
        kind: "CALCULATION",
        title: `Drawdown storici severi (${fmtNum(dd.maxDrawdownPct, 0)}%)`,
        detail: "Chi investe deve essere pronto a oscillazioni molto ampie.",
      });
    }
    const r3 = trailingReturn(bars, 66);
    if (r3 != null && r3 < -10) {
      out.push({
        kind: "CALCULATION",
        title: `Momentum negativo (${fmtNum(r3, 0)}% in 3 mesi)`,
        detail: "Il mercato sta scontando qualcosa: capire cosa, prima di comprare il ribasso.",
      });
    }
  }
  if (f.beta != null && f.beta > 1.5) {
    out.push({
      kind: "FACT",
      title: `Beta elevato (${fmtNum(f.beta, 1)})`,
      detail: "Il titolo tende ad amplificare i movimenti del mercato in entrambe le direzioni.",
    });
  }
  return out.slice(0, 5);
}

export function redFlags(c: Company, f: Fundamentals | null, bars: PriceBar[] | null): RedFlag[] {
  const out: RedFlag[] = [];
  if (f) {
    const lastRev = f.revenue[f.revenue.length - 1];
    const prevRev = f.revenue[f.revenue.length - 2];
    if (prevRev && lastRev < prevRev) {
      out.push({
        level: "moderate", kind: "CALCULATION",
        title: "Ricavi in calo nell'ultimo esercizio",
        detail: `Da ${fmtNum(prevRev / 1e9, 1)} a ${fmtNum(lastRev / 1e9, 1)} miliardi: verificare se è ciclico o strutturale.`,
      });
    }
    const fcf = lastFcf(f);
    if (fcf != null && fcf < 0) {
      out.push({
        level: "high", kind: "CALCULATION",
        title: "Free cash flow negativo",
        detail: "L'azienda brucia cassa: sostenibile solo con bilancio forte o accesso al capitale.",
      });
    }
    const sharesDelta = f.sharesOutstanding.length >= 2
      ? f.sharesOutstanding[f.sharesOutstanding.length - 1] / f.sharesOutstanding[0] - 1 : null;
    if (sharesDelta != null && sharesDelta > 0.05) {
      out.push({
        level: "moderate", kind: "CALCULATION",
        title: `Diluizione degli azionisti (+${fmtNum(sharesDelta * 100, 1)}% di azioni in 5 anni)`,
        detail: "Ogni azione rappresenta una quota decrescente dell'azienda.",
      });
    }
    if (f.interestCoverage != null && f.interestCoverage < 4) {
      out.push({
        level: f.interestCoverage < 2 ? "critical" : "high", kind: "CALCULATION",
        title: `Copertura degli interessi bassa (${fmtNum(f.interestCoverage, 1)}×)`,
        detail: "Gli oneri finanziari assorbono una parte rilevante dell'utile operativo.",
      });
    }
    if (f.pe != null && f.peHistoricalRange && f.pe >= f.peHistoricalRange.high * 0.95) {
      out.push({
        level: "moderate", kind: "CALCULATION",
        title: "Valutazione al massimo del range storico",
        detail: "Il multiplo attuale è vicino ai massimi degli ultimi anni: poco margine di errore.",
      });
    }
  }
  if (bars) {
    const dd = maxDrawdown(bars);
    if (dd && dd.maxDrawdownPct < -60) {
      out.push({
        level: "high", kind: "CALCULATION",
        title: `Drawdown massimo estremo (${fmtNum(dd.maxDrawdownPct, 0)}%)`,
        detail: dd.recoveryMonths != null
          ? `Il recupero ha richiesto circa ${dd.recoveryMonths} mesi.`
          : "Dal minimo il titolo non ha ancora recuperato il precedente massimo.",
      });
    }
  }
  // segnali qualitativi noti a livello di fixture
  if (c.symbol === "JNJ") {
    out.push({
      level: "moderate", kind: "FACT",
      title: "Contenzioso legale rilevante",
      detail: "Cause in corso con esito incerto; potenziali accantonamenti aggiuntivi (vedi notizie).",
    });
  }
  if (c.symbol === "GOOGL") {
    out.push({
      level: "moderate", kind: "FACT",
      title: "Pressione regolatoria",
      detail: "Procedimenti antitrust in più giurisdizioni sul core business pubblicitario.",
    });
  }
  return out;
}

export function whyNow(c: Company, f: Fundamentals | null, bars: PriceBar[] | null): { now: Insight[]; wait: Insight[] } {
  const now: Insight[] = [];
  const wait: Insight[] = [];
  if (f) {
    const lastGrowth = f.revenue.length >= 2
      ? f.revenue[f.revenue.length - 1] / f.revenue[f.revenue.length - 2] - 1 : null;
    const cagr = seriesCagr(f.revenue);
    if (lastGrowth != null && cagr != null && lastGrowth * 100 > cagr + 2) {
      now.push({
        kind: "CALCULATION",
        title: "Crescita in accelerazione",
        detail: `L'ultimo anno (${fmtPct(lastGrowth * 100)}) è cresciuto più della media quinquennale (${fmtPct(cagr)}).`,
      });
    }
    if (f.pe != null && f.peHistoricalRange && f.pe < f.peHistoricalRange.median) {
      now.push({
        kind: "CALCULATION",
        title: "Valutazione sotto la mediana storica",
        detail: `P/E ${fmtNum(f.pe, 0)} contro mediana ${fmtNum(f.peHistoricalRange.median, 0)}: punto di ingresso storicamente non caro.`,
      });
    } else if (f.pe != null && f.peHistoricalRange && f.pe > f.peHistoricalRange.median * 1.2) {
      wait.push({
        kind: "CALCULATION",
        title: "Prezzo già generoso",
        detail: "Aspettare una correzione o una crescita degli utili che riporti il multiplo verso la media.",
      });
    }
  }
  if (bars) {
    const r3 = trailingReturn(bars, 66);
    const r12 = trailingReturn(bars, 252);
    if (r3 != null && r3 > 0 && r12 != null && r12 > 0) {
      now.push({
        kind: "CALCULATION",
        title: "Trend confermato su più orizzonti",
        detail: `+${fmtNum(r3, 1)}% a 3 mesi e +${fmtNum(r12, 1)}% a 12 mesi.`,
      });
    }
    if (r12 != null && r12 > 60) {
      wait.push({
        kind: "CALCULATION",
        title: "Corsa recente molto forte",
        detail: `+${fmtNum(r12, 0)}% in un anno: il rischio di consolidamento è alto anche se la tesi è valida.`,
      });
    }
    if (r3 != null && r3 < -8) {
      wait.push({
        kind: "CALCULATION",
        title: "Momentum in deterioramento",
        detail: "Meglio capire la causa della debolezza prima di aumentare l'esposizione.",
      });
    }
  }
  if (!now.length) {
    now.push({
      kind: "INTERPRETATION",
      title: "Nessun catalizzatore evidente nei dati disponibili",
      detail: "L'interesse dipende dalla tesi di lungo periodo più che dal timing.",
    });
  }
  if (!wait.length) {
    wait.push({
      kind: "INTERPRETATION",
      title: "Nessun segnale di attesa forte nei dati disponibili",
      detail: "Restano validi i rischi elencati nella sezione dedicata.",
    });
  }
  return { now, wait };
}

export function scenarios(c: Company, f: Fundamentals | null): Scenario[] {
  const growthName = f && (seriesCagr(f.revenue) ?? 0) > 8 ? "la crescita attuale" : "una crescita moderata";
  return [
    {
      name: "bull",
      assumptions: [
        `${c.name} mantiene ${growthName} oltre le attese del mercato`,
        "I margini restano stabili o migliorano",
        "Il multiplo di valutazione si espande verso la parte alta del range storico",
      ],
      catalysts: ["Trimestrali sopra il consenso", "Nuovi prodotti/contratti rilevanti", "Contesto di settore favorevole"],
      risks: ["Aspettative già elevate rendono fragile la sorpresa positiva"],
      metricsToWatch: ["Crescita ricavi a/a", "Margine operativo", "Guidance del management"],
      invalidation: ["Due trimestri consecutivi sotto le attese", "Compressione dei margini"],
    },
    {
      name: "base",
      assumptions: [
        "Crescita e margini in linea con la storia recente",
        "Multiplo di valutazione stabile intorno alla mediana storica",
      ],
      catalysts: ["Esecuzione regolare del piano industriale"],
      risks: ["Rallentamento macro", "Pressione competitiva ordinaria"],
      metricsToWatch: ["CAGR dei ricavi", "Free cash flow", "Evoluzione del numero di azioni"],
      invalidation: ["Cambio strutturale nella domanda del settore"],
    },
    {
      name: "bear",
      assumptions: [
        "La crescita delude o i margini si comprimono",
        "Il multiplo torna verso i minimi del range storico",
      ],
      catalysts: ["Recessione", "Perdita di quota di mercato", "Eventi regolatori o legali avversi"],
      risks: ["La combinazione di utili in calo e multiplo in compressione produce perdite ampie"],
      metricsToWatch: ["Revisioni delle stime", "Debito netto", "Segnali di prezzo (momentum)"],
      invalidation: ["Stabilizzazione degli utili e ritorno della crescita"],
    },
  ];
}
