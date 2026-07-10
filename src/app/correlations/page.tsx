import Link from "next/link";
import { ClaimTag } from "@/components/Provenance";
import { corrColor, correlation, dailyReturnsByDate } from "@/lib/correlation";
import { fmtNum } from "@/lib/format";
import { fundamentals, marketData } from "@/lib/providers";

export const metadata = { title: "Correlazioni — FinSight" };

export default async function CorrelationsPage() {
  const fp = fundamentals();
  const md = marketData();
  const companies = await fp.listCompanies();

  const rets = new Map<string, Map<string, number>>();
  await Promise.all(companies.map(async (c) => {
    const s = await md.getPriceSeries(c.symbol);
    if (s) rets.set(c.symbol, dailyReturnsByDate(s.bars));
  }));

  const symbols = companies.map((c) => c.symbol).filter((s) => rets.has(s));
  const matrix = symbols.map((a) =>
    symbols.map((b) => (a === b ? 1 : correlation(rets.get(a)!, rets.get(b)!))),
  );

  // coppie estreme (escludendo la diagonale)
  let hi: { a: string; b: string; c: number } | null = null;
  let lo: { a: string; b: string; c: number } | null = null;
  for (let i = 0; i < symbols.length; i++) {
    for (let j = i + 1; j < symbols.length; j++) {
      const c = matrix[i][j];
      if (c == null) continue;
      if (!hi || c > hi.c) hi = { a: symbols[i], b: symbols[j], c };
      if (!lo || c < lo.c) lo = { a: symbols[i], b: symbols[j], c };
    }
  }

  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">Correlazioni tra i titoli</h1>
        <p className="mt-2 text-lg text-ink-2">
          Quanto due azioni si muovono insieme — e perché conta per il tuo portafoglio.
        </p>
      </header>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">Matrice di correlazione <ClaimTag kind="CALCULATION" /></h2>
        <p className="mb-4 mt-1 text-sm text-ink-2">
          Correlazione di Pearson sui rendimenti giornalieri degli ultimi 12 mesi.
          1 = si muovono identiche, 0 = indipendenti, valori negativi = si muovono in direzioni opposte.
        </p>
        <div className="overflow-x-auto">
          <table className="tabular w-full min-w-[760px] border-collapse text-xs">
            <thead>
              <tr>
                <th className="p-1.5 text-left font-semibold text-ink-3"></th>
                {symbols.map((s) => (
                  <th key={s} className="p-1.5 text-center font-semibold text-ink-3">{short(s)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {symbols.map((a, i) => (
                <tr key={a}>
                  <th className="p-1.5 text-left font-semibold text-ink-2">
                    <Link href={`/stocks/${a}`} className="hover:text-accent">{short(a)}</Link>
                  </th>
                  {symbols.map((b, j) => {
                    const c = matrix[i][j];
                    return (
                      <td key={b} className="border border-grid p-1.5 text-center"
                        style={{ background: c == null ? undefined : corrColor(c) }}
                        title={c == null ? "n.d." : `${a} × ${b}: ${fmtNum(c, 2)}`}>
                        {c == null ? "—" : fmtNum(c, 2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 flex flex-wrap gap-4 text-xs text-ink-3">
          <span><span className="mr-1 inline-block h-3 w-3 rounded-sm align-middle" style={{ background: "rgba(227,73,72,0.45)" }} />alta (≥ 0,45): si muovono insieme</span>
          <span><span className="mr-1 inline-block h-3 w-3 rounded-sm border border-grid align-middle" />bassa: quasi indipendenti</span>
          <span><span className="mr-1 inline-block h-3 w-3 rounded-sm align-middle" style={{ background: "rgba(42,120,214,0.3)" }} />negativa: direzioni opposte</span>
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        {hi && (
          <div className="card p-6">
            <h2 className="text-base font-semibold">La coppia più correlata <ClaimTag kind="CALCULATION" /></h2>
            <p className="mt-2 text-2xl font-semibold tracking-tight">
              {short(hi.a)} × {short(hi.b)} <span className="text-bad">({fmtNum(hi.c, 2)})</span>
            </p>
            <p className="mt-2 text-sm text-ink-2">
              Comprarle entrambe <b>non diversifica quasi nulla</b>: quando una scende, con alta
              probabilità scende anche l&apos;altra. Ha senso solo se vuoi deliberatamente
              concentrare l&apos;esposizione su quel tema (es. semiconduttori) accettando
              oscillazioni più ampie.
            </p>
          </div>
        )}
        {lo && (
          <div className="card p-6">
            <h2 className="text-base font-semibold">La coppia meno correlata <ClaimTag kind="CALCULATION" /></h2>
            <p className="mt-2 text-2xl font-semibold tracking-tight">
              {short(lo.a)} × {short(lo.b)} <span className="text-accent">({fmtNum(lo.c, 2)})</span>
            </p>
            <p className="mt-2 text-sm text-ink-2">
              Una coppia così <b>riduce il rischio complessivo</b>: i ribassi dell&apos;una tendono
              a non coincidere con i ribassi dell&apos;altra, e il portafoglio oscilla meno della
              somma delle sue parti.
            </p>
          </div>
        )}
      </section>

      <section className="card max-w-none p-6">
        <h2 className="text-lg font-semibold">Perché la correlazione conta <ClaimTag kind="INTERPRETATION" /></h2>
        <div className="mt-3 grid gap-6 text-sm leading-relaxed text-ink-2 md:grid-cols-3">
          <div>
            <h3 className="mb-1 font-semibold text-ink">Alta correlazione (≥ 0,7)</h3>
            <p>
              Tipica di aziende dello stesso settore e filiera: NVIDIA, Broadcom, TSMC e Samsung
              dipendono tutte dal ciclo dei semiconduttori e dagli investimenti in IA.
              Comprarne due è quasi come raddoppiare la stessa scommessa: rendimento potenziale
              concentrato, ma nessuna protezione quando il settore corregge.
            </p>
          </div>
          <div>
            <h3 className="mb-1 font-semibold text-ink">Correlazione moderata (0,25–0,7)</h3>
            <p>
              Aziende esposte allo stesso mercato generale ma con business diversi (es. Apple e
              Ferrari). Diversificano in parte: condividono il rischio «borsa», non quello di
              settore. È la zona in cui vive la maggior parte delle coppie di azioni.
            </p>
          </div>
          <div>
            <h3 className="mb-1 font-semibold text-ink">Bassa o negativa (&lt; 0,25)</h3>
            <p>
              Coca-Cola o Johnson &amp; Johnson rispetto a NVIDIA: beni di prima necessità e sanità
              non seguono il ciclo dei chip. Abbinare titoli poco correlati è il modo più
              economico di ridurre il rischio senza rinunciare al rendimento atteso —
              il portafoglio «respira» in tempi diversi.
            </p>
          </div>
        </div>
        <p className="mt-4 border-t border-grid pt-3 text-xs text-ink-3">
          Attenzione: la correlazione è calcolata sul passato e <b>non è stabile</b> — nei crolli
          di mercato le correlazioni tendono a salire tutte insieme. Usala come guida alla
          diversificazione, non come garanzia. Prova l&apos;effetto concreto nel{" "}
          <Link href="/portfolio" className="text-accent hover:underline">simulatore di portafoglio</Link>.
        </p>
      </section>
    </div>
  );
}

function short(s: string) {
  return s === "005930.KS" ? "SMSN" : s.replace(".MI", "");
}
