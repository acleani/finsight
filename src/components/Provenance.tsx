import type { ClaimKind, DataProvenance } from "@/lib/types";
import { fmtDateTime } from "@/lib/format";

const FRESHNESS_LABEL: Record<string, string> = {
  "real-time": "tempo reale",
  delayed: "ritardato",
  "end-of-day": "fine giornata",
  historical: "storico",
  synthetic: "sintetico (demo)",
};

/** Riga di provenienza del dato: fonte, freschezza, timestamp, periodo. */
export function ProvenanceLine({ p }: { p: DataProvenance }) {
  return (
    <p className="text-xs text-ink-3">
      Fonte: {p.source} · {FRESHNESS_LABEL[p.freshness] ?? p.freshness}
      {p.period ? ` · periodo ${p.period}` : ""}
      {p.currency ? ` · ${p.currency}` : ""} · aggiornato {fmtDateTime(p.retrievedAt)}
    </p>
  );
}

const KIND_LABEL: Record<ClaimKind, { label: string; cls: string; help: string }> = {
  FACT: { label: "Fatto", cls: "tag-fact", help: "Dato verificato dalla fonte" },
  CALCULATION: { label: "Calcolo", cls: "tag-calc", help: "Metrica deterministica calcolata dai dati" },
  INTERPRETATION: { label: "Interpretazione", cls: "tag-interp", help: "Conclusione ragionata, non un fatto" },
};

export function ClaimTag({ kind }: { kind: ClaimKind }) {
  const k = KIND_LABEL[kind];
  return <span className={`tag ${k.cls}`} title={k.help}>{k.label}</span>;
}
