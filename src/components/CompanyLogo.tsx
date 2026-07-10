"use client";

import { useState } from "react";

/**
 * Logo aziendale via favicon del sito ufficiale (Google s2, uso lecito).
 * Se il dominio manca o l'immagine non carica: avatar con l'iniziale.
 */
export default function CompanyLogo({
  domain, name, size = 28,
}: {
  domain?: string; name: string; size?: number;
}) {
  const [failed, setFailed] = useState(false);

  if (!domain || failed) {
    return (
      <span
        aria-hidden
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-surface-2 font-bold text-ink-2"
        style={{ width: size, height: size, fontSize: size * 0.45 }}
      >
        {name.charAt(0)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`}
      alt=""
      aria-hidden
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className="shrink-0 rounded-full bg-white object-contain p-0.5 ring-1 ring-bordr"
    />
  );
}
