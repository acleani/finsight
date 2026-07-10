# FinSight 📊

**Piattaforma di analisi e ricerca sui titoli finanziari per investitori retail.**
Filosofia: *evidenza invece di hype, trasparenza invece di scatole nere, analisi invece di previsione.*

Costruita con Next.js (App Router) + TypeScript + Tailwind CSS + Recharts.

## Cosa fa

- **Panoramica mercati** (`/`): listino, migliori/peggiori, trend di settore calcolati, ultime notizie
- **Analisi azienda** (`/stocks/AAPL`) — la pagina centrale:
  - quotazione con provenienza del dato (fonte, freschezza, timestamp, valuta)
  - sintesi: *perché è interessante* / *cosa può andare storto*, ogni frase etichettata **Fatto / Calcolo / Interpretazione**
  - grafico interattivo (1M→MAX, SMA 50/200, modalità rendimento %, scala log)
  - performance storica: rendimenti su 9 orizzonti, volatilità, max drawdown con tempo di recupero, % anni positivi
  - fondamentali: 5 esercizi di ricavi/utili/FCF, margini, ROIC, debito, diluizione/buyback
  - valutazione: multipli + posizione del P/E nel range storico proprio, con avviso value-trap
  - **punteggi spiegabili 0–100** per 6 dimensioni: ogni componente mostra metrica grezza, normalizzazione, peso, contributo; i dati mancanti sono esclusi e dichiarati (mai contati come zero)
  - "Perché ora / perché aspettare", scenari bull/base/bear con condizioni di invalidazione, red flag classificati per gravità
- **Scopri** (`/discover`): collezioni con regole di filtro dichiarate (compounder, bilanci solidi, dividendi…)
- **Confronta** (`/compare`): 2–5 titoli fianco a fianco + lettura deterministica del confronto
- **Trend** (`/trends`): Trend Score per tema con segnali dichiarati (momentum, volume notizie, sentiment)
- **Notizie** (`/news`): clustering per evento (10 articoli sulla stessa trimestrale = 1 evento)
- **Idee per te** (`/ideas`): punteggio oggettivo **e** punteggio "adatto a te", sempre distinti
- **Watchlist** (`/watchlist`) e **profilo investitore** (`/settings`) — salvati solo nel browser
- **Simulatore di portafoglio** (`/portfolio`): performance storica, volatilità, drawdown, concentrazione
- **Metodologia** (`/methodology`): formule, pesi, trattamento dei dati mancanti, limiti — pubblica
- Tema chiaro/scuro, responsive, stati di caricamento/vuoto/errore

## Demo mode e dati reali

Il progetto parte in **DEMO MODE**: 12 titoli con dati sintetici deterministici,
etichettati ovunque come tali (banner + riga di provenienza su ogni dato).
Nessun dato inventato viene mai presentato come reale.

Per i dati reali: copia `.env.example` in `.env.local` e imposta `TWELVE_DATA_API_KEY`
(piano gratuito su twelvedata.com). L'architettura a provider
(`src/lib/providers/`) permette di aggiungere altri fornitori scrivendo solo un adapter.

## Avvio

```bash
npm install
npm run dev        # sviluppo su http://localhost:3000
npm run build      # build di produzione
npm start
```

## Struttura

```
src/lib/types.ts          # modello di dominio (provenienza, punteggi, profilo…)
src/lib/providers/        # interfacce + adapter (demo, Twelve Data)
src/lib/demo/             # fixture sintetiche etichettate
src/lib/indicators.ts     # metriche deterministiche (CAGR, drawdown, RSI…)
src/lib/scoring.ts        # punteggi spiegabili + pesi per profilo
src/lib/analysis.ts       # insight/rischi/scenari basati su regole
src/app/                  # pagine (App Router) e API routes
src/components/           # componenti UI
```

## Decisioni architetturali (e perché)

- **Niente database/Redis/auth in questa versione**: il principio guida della specifica è
  "l'architettura più semplice genuinamente manutenibile". Finché i dati sono demo o
  cache-abili lato server, un DB aggiungerebbe solo complessità. Watchlist e profilo
  vivono in localStorage; lo schema di dominio è già pronto per la persistenza.
- **Niente target price né stime**: senza un modello di valutazione trasparente sarebbero
  falsa precisione (vietata dalla specifica).
- **Analisi testuale a regole, non LLM**: ogni frase deriva da condizioni verificabili.
  L'interfaccia `AIAnalysisProvider` è il punto di estensione previsto per un futuro
  livello generativo con grounding e citazioni.

## ⚠️ Avvertenza

FinSight fornisce informazione e supporto alla ricerca, **non consulenza finanziaria**.
I rendimenti passati non sono indicativi di quelli futuri. Investire comporta rischi,
inclusa la perdita del capitale.
