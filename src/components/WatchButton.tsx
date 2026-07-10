"use client";

import { useEffect, useState } from "react";

export function getWatchlist(): string[] {
  try {
    return JSON.parse(localStorage.getItem("watchlist") ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function setWatchlist(list: string[]) {
  localStorage.setItem("watchlist", JSON.stringify(list));
}

export default function WatchButton({ symbol }: { symbol: string }) {
  const [watched, setWatched] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setWatched(getWatchlist().includes(symbol));
    setReady(true);
  }, [symbol]);

  const toggle = () => {
    const list = getWatchlist();
    const next = list.includes(symbol) ? list.filter((s) => s !== symbol) : [...list, symbol];
    setWatchlist(next);
    setWatched(next.includes(symbol));
  };

  if (!ready) return null;
  return (
    <button
      onClick={toggle}
      className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
        watched
          ? "border-accent text-accent"
          : "border-bordr text-ink-2 hover:border-accent hover:text-ink"
      }`}
    >
      {watched ? "★ In watchlist" : "☆ Aggiungi a watchlist"}
    </button>
  );
}
