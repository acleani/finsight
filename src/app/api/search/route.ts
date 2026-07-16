import { NextRequest, NextResponse } from "next/server";
import { getDataMode, marketData, search } from "@/lib/providers";
import type { SearchResult } from "@/lib/providers/types";
import { TwelveDataProvider } from "@/lib/providers/twelvedata";

/**
 * Ricerca titoli: sempre sul catalogo coperto (demo); in modalità LIVE
 * unisce anche i risultati di Twelve Data su tutte le borse.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const local = await search().search(q);

  let remote: SearchResult[] = [];
  if (getDataMode() === "live" && q.trim().length >= 2) {
    const md = marketData();
    if (md instanceof TwelveDataProvider) {
      remote = await md.search(q);
    }
  }
  const seen = new Set(local.map((r) => r.symbol));
  const merged = [...local, ...remote.filter((r) => !seen.has(r.symbol))].slice(0, 10);
  return NextResponse.json({ results: merged });
}
