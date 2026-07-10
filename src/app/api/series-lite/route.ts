import { NextResponse } from "next/server";
import { fundamentals, marketData } from "@/lib/providers";

/** Serie settimanali compatte per il simulatore di portafoglio. */
export async function GET() {
  const fp = fundamentals();
  const md = marketData();
  const companies = await fp.listCompanies();

  const series = await Promise.all(
    companies.map(async (c) => {
      const s = await md.getPriceSeries(c.symbol);
      if (!s) return { symbol: c.symbol, points: [] as { d: string; p: number }[] };
      // campiona un punto a settimana (venerdì o ultimo disponibile)
      const points: { d: string; p: number }[] = [];
      let lastWeek = "";
      for (const b of s.bars) {
        const week = isoWeek(b.date);
        if (week !== lastWeek) {
          points.push({ d: b.date, p: b.close });
          lastWeek = week;
        } else {
          points[points.length - 1] = { d: b.date, p: b.close };
        }
      }
      return { symbol: c.symbol, points };
    }),
  );
  return NextResponse.json({
    series,
    companies: companies.map((c) => ({
      symbol: c.symbol, name: c.name, sector: c.sector, country: c.country, currency: c.currency,
    })),
  });
}

function isoWeek(date: string): string {
  const d = new Date(date + "T00:00:00Z");
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((d.getTime() - firstThursday.getTime()) / 86400000 - 3) / 7);
  return `${d.getUTCFullYear()}-${week}`;
}
