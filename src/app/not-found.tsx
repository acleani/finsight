import Link from "next/link";
import SearchBox from "@/components/SearchBox";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="text-5xl">🔍</p>
      <h1 className="mt-4 text-2xl font-bold">Titolo o pagina non trovati</h1>
      <p className="mt-2 text-ink-2">
        Il simbolo cercato non è tra i titoli coperti, oppure l&apos;indirizzo non esiste.
      </p>
      <div className="mt-6 flex justify-center"><SearchBox /></div>
      <p className="mt-4 text-sm text-ink-3">
        Oppure torna alla <Link href="/" className="text-accent hover:underline">panoramica dei mercati</Link>.
      </p>
    </div>
  );
}
