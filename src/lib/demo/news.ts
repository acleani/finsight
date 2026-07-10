/**
 * Notizie DEMO — titoli sintetici e verosimili, NON reali.
 * Gli articoli sullo stesso evento condividono eventId: il clustering
 * evita di contare dieci articoli come dieci catalizzatori indipendenti.
 */

import type { NewsArticle } from "../types";
import { demoProvenance } from "./companies";

const N = (
  id: string, eventId: string, headline: string, publisher: string,
  publishedAt: string, tickers: string[], topic: string,
  sentiment: NewsArticle["sentiment"], relevance: number, summary: string,
): NewsArticle => ({
  id, eventId, headline, publisher, publishedAt, url: null,
  tickers, topic, sentiment, relevance, summary,
  provenance: demoProvenance(),
});

export const NEWS: NewsArticle[] = [
  N("n1", "ev-nvda-earnings", "NVIDIA supera le attese: ricavi datacenter in crescita del 60%",
    "Demo Wire", "2026-07-09T21:10:00Z", ["NVDA"], "Utili", "positive", 0.95,
    "Trimestrale sopra il consenso, trainata dalla domanda di acceleratori per l'IA. Guidance alzata per il prossimo trimestre."),
  N("n2", "ev-nvda-earnings", "I chip per l'IA spingono NVIDIA a un nuovo record",
    "Demo Business", "2026-07-10T06:30:00Z", ["NVDA"], "Utili", "positive", 0.85,
    "Stesso evento della trimestrale: analisi sulla sostenibilità della domanda di GPU nei prossimi trimestri."),
  N("n3", "ev-ecb-rates", "La BCE lascia i tassi invariati, attesi due tagli entro fine anno",
    "Demo Macro", "2026-07-09T13:45:00Z", ["ENEL.MI", "ISP.MI"], "Macro", "neutral", 0.7,
    "Decisione in linea con le attese; il mercato prezza un allentamento graduale. Impatto potenziale su utility e banche."),
  N("n4", "ev-aapl-product", "Apple presenta la nuova generazione di dispositivi indossabili",
    "Demo Tech", "2026-07-08T17:00:00Z", ["AAPL"], "Prodotti", "positive", 0.6,
    "Ampliamento della gamma con focus su salute. Contributo ai ricavi atteso marginale nel breve periodo."),
  N("n5", "ev-race-guidance", "Ferrari alza la guidance 2026 dopo un semestre record",
    "Demo Motori", "2026-07-07T08:15:00Z", ["RACE.MI"], "Utili", "positive", 0.9,
    "Portafoglio ordini oltre i due anni; margini in ulteriore espansione grazie alle personalizzazioni."),
  N("n6", "ev-enel-plan", "Enel accelera sugli investimenti in rete e rinnovabili",
    "Demo Energia", "2026-07-06T10:00:00Z", ["ENEL.MI"], "Strategia", "positive", 0.65,
    "Aggiornamento del piano industriale: più capex regolato, conferma della politica dei dividendi."),
  N("n7", "ev-isp-capital", "Intesa Sanpaolo: cedola in crescita e nuovo buyback allo studio",
    "Demo Finanza", "2026-07-05T07:30:00Z", ["ISP.MI"], "Capitale", "positive", 0.8,
    "La banca conferma la distribuzione elevata; sensibilità degli utili al calo dei tassi come rischio principale."),
  N("n8", "ev-asml-orders", "ASML: ordini EUV sotto le attese nel trimestre",
    "Demo Chip", "2026-07-04T15:20:00Z", ["ASML"], "Utili", "negative", 0.85,
    "Prenotazioni deboli in un trimestre volatile; il management ribadisce gli obiettivi di lungo periodo."),
  N("n9", "ev-amzn-cloud", "AWS annuncia nuovi datacenter europei da 12 miliardi",
    "Demo Cloud", "2026-07-03T11:00:00Z", ["AMZN"], "Investimenti", "positive", 0.7,
    "Espansione della capacità cloud in Europa; capex elevato ma domanda IA in crescita."),
  N("n10", "ev-ko-dividend", "Coca-Cola aumenta il dividendo per il 64° anno consecutivo",
    "Demo Consumer", "2026-07-02T14:00:00Z", ["KO"], "Dividendi", "positive", 0.6,
    "Incremento in linea con la storia della società; payout elevato ma coperto dai flussi di cassa."),
  N("n11", "ev-jnj-litigation", "Johnson & Johnson: nuova udienza sul contenzioso talco",
    "Demo Health", "2026-07-01T18:30:00Z", ["JNJ"], "Legale", "negative", 0.75,
    "Il contenzioso resta la principale incognita; l'esito potrebbe richiedere ulteriori accantonamenti."),
  N("n12", "ev-sap-cloud", "SAP: la migrazione al cloud accelera, ricavi ricorrenti al 45%",
    "Demo Software", "2026-06-30T09:00:00Z", ["SAP"], "Utili", "positive", 0.7,
    "La transizione al cloud procede sopra i piani; margini in miglioramento dopo la ristrutturazione."),
  N("n13", "ev-msft-ai", "Microsoft integra agenti IA in tutta la suite enterprise",
    "Demo Tech", "2026-06-29T16:45:00Z", ["MSFT"], "Prodotti", "positive", 0.75,
    "Monetizzazione dell'IA su base installata enorme; da monitorare l'impatto del capex sui margini."),
  N("n14", "ev-googl-antitrust", "Alphabet, la Commissione UE apre un nuovo dossier sull'advertising",
    "Demo Regolatorio", "2026-06-28T12:00:00Z", ["GOOGL"], "Regolatorio", "negative", 0.8,
    "Rischio regolatorio ricorrente; possibili rimedi strutturali sul business pubblicitario."),
  N("n15", "ev-semis-macro", "Semiconduttori: il ciclo degli investimenti IA non rallenta",
    "Demo Macro", "2026-06-27T10:30:00Z", ["NVDA", "ASML"], "Settori", "positive", 0.65,
    "Analisi di settore: capex dei grandi cloud provider ancora in crescita a doppia cifra."),
];
