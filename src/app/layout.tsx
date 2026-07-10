import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "FinSight — Analisi e ricerca sui titoli finanziari",
  description:
    "Piattaforma di ricerca per investitori retail: fondamentali, valutazione, punteggi spiegabili e provenienza dei dati. Evidence over hype.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className="min-h-screen">
        <script
          // applica il tema salvato prima del paint per evitare flash
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <footer className="mt-10 border-t border-bordr px-4 py-6 text-center text-xs text-ink-3">
          <p className="mx-auto max-w-3xl">
            FinSight fornisce informazione, formazione e supporto alla ricerca. Non è consulenza
            finanziaria e non garantisce rendimenti: i rendimenti passati non sono indicativi di
            quelli futuri. Prima di investire valuta la tua situazione con un consulente abilitato.
          </p>
        </footer>
      </body>
    </html>
  );
}
