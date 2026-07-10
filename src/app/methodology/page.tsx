import Link from "next/link";
import { getDataMode } from "@/lib/providers";

export const metadata = { title: "Metodologia e fonti — FinSight" };

export default function MethodologyPage() {
  const mode = getDataMode();
  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Metodologia e fonti</h1>
        <p className="mt-1 text-ink-2">
          La trasparenza è una funzione del prodotto: qui trovi come nascono i numeri che vedi.
        </p>
      </header>

      <Section title="Modalità dati attuale">
        <p>
          Stato: <b>{mode === "demo" ? "DEMO — dati sintetici" : "LIVE — provider reali configurati"}</b>.
        </p>
        {mode === "demo" && (
          <p>
            In modalità demo tutti i prezzi, i fondamentali e le notizie sono <b>fixture
            sintetiche</b>, plausibili ma inventate, generate in modo deterministico. Servono a
            valutare il prodotto senza credenziali. Non usarle mai per decisioni reali:
            ogni dato è etichettato «sintetico (demo)» nella riga di provenienza.
          </p>
        )}
        <p>
          Per attivare i dati reali imposta le variabili documentate in <code>.env.example</code>{" "}
          (a partire da <code>TWELVE_DATA_API_KEY</code>): l&apos;applicazione passa automaticamente
          al provider reale, senza modifiche al codice.
        </p>
      </Section>

      <Section title="Architettura delle fonti">
        <p>
          La logica di business dipende da interfacce astratte
          (<code>MarketDataProvider</code>, <code>FundamentalsProvider</code>, <code>NewsProvider</code>,{" "}
          <code>SearchProvider</code>), mai da un fornitore specifico. Gerarchia prevista:
        </p>
        <ul>
          <li><b>Tier 1</b> — fonti primarie (SEC EDGAR, investor relations, BCE/FRED) per bilanci e macro;</li>
          <li><b>Tier 2</b> — provider strutturati (adapter Twelve Data incluso; Alpha Vantage aggiungibile);</li>
          <li><b>Tier 3</b> — notizie da feed legalmente accessibili. Nessuno scraping di siti protetti;
            nessuna integrazione viene simulata come reale.</li>
        </ul>
      </Section>

      <Section title="Fatto, calcolo, interpretazione">
        <p>Ogni affermazione è etichettata:</p>
        <ul>
          <li><b>Fatto</b> — dato verificato della fonte (es. il P/E dichiarato).</li>
          <li><b>Calcolo</b> — metrica deterministica derivata dai dati (es. CAGR, drawdown, RSI).</li>
          <li><b>Interpretazione</b> — conclusione ragionata, non un fatto (es. «valutazione generosa»).</li>
        </ul>
        <p>
          Le analisi testuali di questa versione sono <b>regole deterministiche</b>, non un modello
          linguistico: ogni frase deriva da una condizione verificabile. Un eventuale livello di
          IA generativa (AIAnalysisProvider) riceverà in input solo evidenze strutturate e
          citazioni — mai la richiesta di «inventare» dati mancanti.
        </p>
      </Section>

      <Section title="Come sono costruiti i punteggi">
        <p>
          Ogni dimensione (qualità, solidità, crescita, valutazione, momentum, rischio) è la media
          pesata di componenti dichiarati. Per ciascun componente la pagina del titolo mostra:
          metrica grezza, valore normalizzato 0–100, peso e contributo.
        </p>
        <ul>
          <li><b>Solidità finanziaria</b>: margine FCF (25), debito netto/EBITDA (25), margine operativo (20), copertura interessi (15), diluizione (15).</li>
          <li><b>Qualità</b>: ROIC (35), margine netto (25), conversione utili→cassa (25), ROE (15).</li>
          <li><b>Crescita</b>: CAGR ricavi (40), CAGR utili (35), crescita ultimo anno (25).</li>
          <li><b>Valutazione</b>: P/E vs storia propria (40), rendimento FCF (30), rendimento utili (30).</li>
          <li><b>Momentum</b>: 12 mesi (40), 3 mesi (30), prezzo vs SMA200 (30).</li>
          <li><b>Rischio</b> (100 = rischio basso): volatilità (40), max drawdown (35), beta (25).</li>
        </ul>
        <p>
          <b>Dati mancanti:</b> non valgono mai zero. Il componente viene escluso, il suo peso
          ridistribuito e la «copertura» mostrata accanto al punteggio, insieme alla
          confidenza complessiva dei dati.
        </p>
        <p>
          <b>Punteggio complessivo</b> (profilo bilanciato): qualità 22%, solidità 22%, crescita 18%,
          valutazione 18%, momentum 10%, rischio 10%.
        </p>
      </Section>

      <Section title="Personalizzazione">
        <p>
          Il profilo investitore ripesa le stesse dimensioni: ad esempio un profilo prudente
          porta solidità al 30% e rischio al 18%, un profilo aggressivo porta crescita al 32% e
          momentum al 24%. Il punteggio oggettivo resta sempre visibile accanto a quello
          personalizzato e i segnali di rischio non vengono mai nascosti. Il profilo è salvato
          solo nel tuo browser.
        </p>
      </Section>

      <Section title="Formule principali">
        <ul>
          <li>CAGR = (valore finale / valore iniziale)^(1/anni) − 1</li>
          <li>Volatilità annualizzata = dev. standard dei rendimenti log giornalieri × √252</li>
          <li>Max drawdown = minimo di (prezzo / massimo precedente − 1)</li>
          <li>FCF = flusso di cassa operativo − capex; rendimento FCF = FCF / capitalizzazione</li>
          <li>RSI(14) secondo Wilder; SMA = media mobile semplice</li>
        </ul>
      </Section>

      <Section title="Notizie">
        <p>
          Gli articoli sono raggruppati per evento (eventId): più coperture dello stesso fatto
          contano una sola volta. Il sentiment descrive il tono, non l&apos;impatto economico futuro.
          In modalità live è prevista una gerarchia di affidabilità delle fonti.
        </p>
      </Section>

      <Section title="Limiti noti">
        <ul>
          <li>La copertura demo è di 12 titoli; i confronti settoriali usano solo i titoli coperti.</li>
          <li>Il range storico del P/E in demo è un dato di fixture, non una serie calcolata.</li>
          <li>Non ci sono stime degli analisti né target price: senza un modello trasparente sarebbero falsa precisione.</li>
          <li>La conversione valutaria non è ancora implementata: ogni titolo è mostrato nella sua valuta nativa, sempre dichiarata.</li>
        </ul>
      </Section>

      <Section title="Avvertenza">
        <p>
          FinSight fornisce informazione e supporto alla ricerca, <b>non consulenza
          finanziaria</b> né sollecitazione all&apos;investimento. Nessun contenuto implica certezza
          sui movimenti futuri dei prezzi. Investire comporta rischi, inclusa la perdita del
          capitale investito.
        </p>
      </Section>

      <p className="text-sm text-ink-3">
        Domande sul metodo? Il codice è aperto:{" "}
        <Link href="https://github.com/acleani/finsight" className="text-accent hover:underline">
          github.com/acleani/finsight
        </Link>
      </p>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-2 p-5 text-sm leading-relaxed text-ink-2 [&_b]:text-ink [&_code]:rounded [&_code]:bg-surface-2 [&_code]:px-1 [&_li]:ml-4 [&_li]:list-disc">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}
