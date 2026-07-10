import type { ScoreBreakdown } from "@/lib/types";
import { fmtNum } from "@/lib/format";

function barColor(score: number | null): string {
  if (score == null) return "var(--ink-3)";
  if (score >= 60) return "var(--good)";
  if (score >= 40) return "var(--warn)";
  return "var(--bad)";
}

export function ScoreBar({ label, bd }: { label: string; bd: ScoreBreakdown }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="text-ink-2">{label}</span>
        <span className="tabular font-semibold">
          {bd.score == null ? "n.d." : `${bd.score}/100`}
          {bd.coverage < 1 && bd.score != null && (
            <span className="ml-1 text-xs font-normal text-ink-3">
              ({Math.round(bd.coverage * 100)}% dei dati)
            </span>
          )}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2" role="img"
        aria-label={`${label}: ${bd.score == null ? "non disponibile" : `${bd.score} su 100`}`}>
        <div className="h-full rounded-full"
          style={{ width: `${bd.score ?? 0}%`, background: barColor(bd.score) }} />
      </div>
    </div>
  );
}

/** Dettaglio ispezionabile di un punteggio: componenti, pesi, contributi, dati mancanti. */
export function ScoreDetail({ title, bd }: { title: string; bd: ScoreBreakdown }) {
  return (
    <details className="group rounded-xl border border-bordr">
      <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-surface-2">
        <span className="font-medium">{title}</span>
        <span className="tabular flex items-center gap-2 font-semibold">
          {bd.score == null ? "n.d." : `${bd.score}/100`}
          <span className="text-ink-3 transition-transform group-open:rotate-90">›</span>
        </span>
      </summary>
      <div className="border-t border-bordr px-4 py-3">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-ink-3">
              <th className="pb-2 font-medium">Componente</th>
              <th className="pb-2 text-right font-medium">Metrica</th>
              <th className="pb-2 text-right font-medium">Punteggio</th>
              <th className="pb-2 text-right font-medium">Peso</th>
            </tr>
          </thead>
          <tbody>
            {bd.components.map((c) => (
              <tr key={c.key} className="border-t border-grid align-top">
                <td className="py-2 pr-2">
                  <div className="font-medium text-ink">{c.label}</div>
                  <div className="text-ink-3">{c.explanation}</div>
                </td>
                <td className="tabular py-2 text-right">{c.rawLabel}</td>
                <td className="tabular py-2 text-right">{c.normalized == null ? "—" : `${c.normalized}/100`}</td>
                <td className="tabular py-2 text-right">{fmtNum(c.weight, 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {bd.missing.length > 0 && (
          <p className="mt-2 text-xs text-warn">
            Dati non disponibili (esclusi dal calcolo, peso ridistribuito): {bd.missing.join(", ")}.
          </p>
        )}
      </div>
    </details>
  );
}
