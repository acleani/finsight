"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SearchResult } from "@/lib/providers/types";

export default function SearchBox({ compact = false }: { compact?: boolean }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (q.trim().length < 1) { setResults([]); setOpen(false); return; }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = (await r.json()) as { results: SearchResult[] };
        setResults(data.results ?? []);
        setOpen(true);
      } catch { setResults([]); }
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const go = (symbol: string) => {
    setOpen(false);
    setQ("");
    router.push(`/stocks/${encodeURIComponent(symbol)}`);
  };

  return (
    <div ref={boxRef} className={`relative ${compact ? "w-48 md:w-64" : "w-full max-w-xl"}`}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results[0]) go(results[0].symbol);
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder={compact ? "Cerca titolo…" : "Cerca per nome, ticker o settore — es. Ferrari, NVDA, banche…"}
        aria-label="Cerca un titolo"
        className={`w-full rounded-xl border border-bordr bg-surface px-3 text-ink outline-none placeholder:text-ink-3 focus:border-accent ${compact ? "py-1.5 text-sm" : "py-3"}`}
      />
      {open && results.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-bordr bg-surface shadow-lg">
          {results.slice(0, 8).map((r) => (
            <li key={r.symbol}>
              <button
                onClick={() => go(r.symbol)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-surface-2"
              >
                <span><span className="font-semibold">{r.symbol}</span> · {r.name}</span>
                <span className="whitespace-nowrap text-xs text-ink-3">{r.exchange} · {r.currency}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && q.trim().length > 0 && results.length === 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-bordr bg-surface px-3 py-2 text-sm text-ink-2 shadow-lg">
          Nessun risultato per “{q}”.
        </div>
      )}
    </div>
  );
}
