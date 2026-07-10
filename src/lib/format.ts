/** Formattazione numeri/valute/date, locale it-IT di default. */

export function fmtNum(n: number | null | undefined, decimals = 2): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("it-IT", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtPct(n: number | null | undefined, signed = true, decimals = 1): string {
  if (n == null || Number.isNaN(n)) return "—";
  const sign = signed && n > 0 ? "+" : "";
  return `${sign}${fmtNum(n, decimals)}%`;
}

export function fmtMoney(n: number | null | undefined, currency = "USD"): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("it-IT", { style: "currency", currency, maximumFractionDigits: 2 });
}

/** Grandi numeri: 3,2 Bln / 815 Mld / 42 Mln (convenzione italiana). */
export function fmtBig(n: number | null | undefined, currency?: string): string {
  if (n == null || Number.isNaN(n)) return "—";
  const abs = Math.abs(n);
  let out: string;
  if (abs >= 1e12) out = `${fmtNum(n / 1e12, 2)} Bln`;
  else if (abs >= 1e9) out = `${fmtNum(n / 1e9, 1)} Mld`;
  else if (abs >= 1e6) out = `${fmtNum(n / 1e6, 1)} Mln`;
  else out = fmtNum(n, 0);
  return currency ? `${out} ${currency}` : out;
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("it-IT", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
