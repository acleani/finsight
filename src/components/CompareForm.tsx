"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SearchResult } from "@/lib/providers/types";

export default function CompareForm({
  all, selected,
}: {
  all: { symbol: string; name: string }[];
  selected: string[];
}) {
  const [sel, setSel] = useState<string[]>(selected);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // ricerca con debounce: trova anche titoli fuori dal catalogo suggerito
  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); setOpen(false); return; }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = (await r.json()) as { results: SearchResult[] };
        setResults(data.results ?? []);
        setOpen(true);
      } catch { setResults([]); }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const add = (symbol: string) => {
    const s = symbol.trim().toUpperCase();
    if (!s) return;
    setSel((cur) => (cur.includes(s) || cur.length >= 5 ? cur : [...cur, s]));
    setQ("");
    setOpen(false);
  };

  const toggle = (symbol: string) => {
    setSel((cur) =>
      cur.includes(symbol) ? cur.filter((s) => s !== symbol)
      : cur.length < 5 ? [...cur, symbol] : cur);
  };

  const apply = () => {
    router.push(sel.length ? `/compare?symbols=${sel.join(",")}` : "/compare");
  };

  return (
    <div className="card p-4">
      {/* ricerca libera */}
      <div ref={boxRef} className="relative mb-3 max-w-md">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") (results[0] ? add(results[0].symbol) : add(q));
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Cerca qualsiasi titolo da aggiungere — es. Tesla, UCG.MI, LVMH…"
          aria-label="Cerca un titolo da confrontare"
          className="w-full rounded-xl border border-bordr bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-3 focus:border-accent"
        />
        {open && results.length > 0 && (
          <ul className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-bordr bg-surface shadow-lg">
            {results.slice(0, 8).map((r) => (
              <li key={r.symbol + r.exchange}>
                <button onClick={() => add(r.symbol)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-surface-2">
                  <span><b>{r.symbol}</b> · {r.name}</span>
                  <span className="whitespace-nowrap text-xs text-ink-3">{r.exchange} {r.currency}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* selezione corrente */}
      {sel.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-ink-3">Selezionati:</span>
          {sel.map((s) => (
            <button key={s} onClick={() => toggle(s)}
              className="rounded-full border border-accent bg-accent px-3 py-1 text-sm text-white"
              title="Rimuovi dal confronto">
              {s} ✕
            </button>
          ))}
        </div>
      )}

      <p className="mb-2 text-sm text-ink-2">Oppure scegli tra i titoli con analisi completa:</p>
      <div className="flex flex-wrap gap-2">
        {all.map((c) => (
          <button key={c.symbol} onClick={() => toggle(c.symbol)}
            aria-pressed={sel.includes(c.symbol)}
            className={`rounded-full border px-3 py-1 text-sm ${
              sel.includes(c.symbol)
                ? "border-accent bg-accent text-white"
                : "border-bordr text-ink-2 hover:border-accent hover:text-ink"}`}>
            {c.symbol}
          </button>
        ))}
      </div>
      <button onClick={apply} disabled={sel.length < 2}
        className="mt-3 rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40">
        Confronta {sel.length >= 2 ? `(${sel.length})` : ""}
      </button>
      <p className="mt-2 text-xs text-ink-3">
        I titoli fuori dal catalogo mostrano le metriche di prezzo quando i dati reali sono
        attivi; i fondamentali non disponibili sono indicati come «n.d.», mai stimati.
      </p>
    </div>
  );
}
