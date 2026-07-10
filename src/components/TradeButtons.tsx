/**
 * Link ai broker per comprare/vendere il titolo.
 * Sono collegamenti esterni di comodo, NON una raccomandazione di acquisto
 * né un'affiliazione. eToro ha pagine pubbliche per titolo; Fineco richiede
 * il login, quindi si atterra sulla sezione mercati.
 */

const FINECO_URL = "https://finecobank.com/it/online/mercati-e-trading/";

export default function TradeButtons({
  symbol, etoroSlug, compact = false,
}: {
  symbol: string; etoroSlug?: string; compact?: boolean;
}) {
  const etoroUrl = etoroSlug
    ? `https://www.etoro.com/it/markets/${etoroSlug}`
    : `https://www.etoro.com/it/discover/search?query=${encodeURIComponent(symbol.split(".")[0])}`;
  const cls = compact
    ? "rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
    : "rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide";

  return (
    <span className="inline-flex gap-1.5 whitespace-nowrap">
      <a
        href={etoroUrl} target="_blank" rel="noopener noreferrer nofollow"
        title={`Apri ${symbol} su eToro (sito esterno)`}
        className={`${cls} bg-accent text-white hover:opacity-90`}
      >
        eToro ↗
      </a>
      <a
        href={FINECO_URL} target="_blank" rel="noopener noreferrer nofollow"
        title="Apri Fineco Mercati e Trading (sito esterno, richiede login; cerca poi il titolo)"
        className={`${cls} border border-accent text-accent hover:bg-surface-2`}
      >
        Fineco ↗
      </a>
    </span>
  );
}
