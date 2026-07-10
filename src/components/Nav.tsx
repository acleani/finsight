import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import SearchBox from "./SearchBox";
import { getDataMode } from "@/lib/providers";

const LINKS = [
  { href: "/", label: "Mercati" },
  { href: "/discover", label: "Scopri" },
  { href: "/compare", label: "Confronta" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/news", label: "Notizie" },
  { href: "/ideas", label: "Idee per te" },
  { href: "/methodology", label: "Metodologia" },
];

export default function Nav() {
  const demo = getDataMode() === "demo";
  return (
    <header className="sticky top-0 z-40 border-b border-bordr bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Fin<span className="text-accent">Sight</span>
        </Link>

        <nav aria-label="Principale" className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto text-sm md:order-none md:w-auto">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-ink-2 hover:bg-surface-2 hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <SearchBox compact />
          <Link href="/settings" aria-label="Impostazioni profilo"
            className="rounded-lg border border-bordr px-2.5 py-1.5 text-sm hover:bg-surface-2">⚙️</Link>
          <ThemeToggle />
        </div>
      </div>
      {demo && (
        <div className="border-t border-bordr bg-surface-2 px-4 py-1.5 text-center text-xs text-ink-2">
          <span className="tag tag-demo mr-2">Dati demo</span>
          Stai vedendo dati sintetici dimostrativi. Configura una API key
          (vedi <Link className="underline" href="/methodology">Metodologia</Link>) per i dati reali.
        </div>
      )}
    </header>
  );
}
