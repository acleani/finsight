"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CompareForm({
  all, selected,
}: {
  all: { symbol: string; name: string }[];
  selected: string[];
}) {
  const [sel, setSel] = useState<string[]>(selected);
  const router = useRouter();

  const toggle = (symbol: string) => {
    setSel((cur) => {
      const next = cur.includes(symbol)
        ? cur.filter((s) => s !== symbol)
        : cur.length < 5 ? [...cur, symbol] : cur;
      return next;
    });
  };

  const apply = () => {
    router.push(sel.length ? `/compare?symbols=${sel.join(",")}` : "/compare");
  };

  return (
    <div className="card p-4">
      <p className="mb-2 text-sm text-ink-2">Seleziona da 2 a 5 titoli:</p>
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
    </div>
  );
}
