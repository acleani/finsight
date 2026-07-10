"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DEFAULT_PROFILE, HORIZONS, MARKETS, RISK_LEVELS, STYLES, loadProfile, saveProfile,
} from "@/lib/profile";
import type { InvestorProfile } from "@/lib/types";

export default function SettingsPage() {
  const [p, setP] = useState<InvestorProfile>(DEFAULT_PROFILE);
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- idratazione client da localStorage dopo il mount (pattern SSR-safe)
    setP(loadProfile() ?? DEFAULT_PROFILE);
    setReady(true);
  }, []);

  const update = (patch: Partial<InvestorProfile>) => {
    setP((cur) => ({ ...cur, ...patch }));
    setSaved(false);
  };

  const toggleIn = (key: "markets" | "styles", value: string) => {
    const list = p[key];
    update({ [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] });
  };

  if (!ready) return <div className="card animate-pulse p-8 text-center text-ink-3">Caricamento…</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Il tuo profilo di investimento</h1>
        <p className="mt-1 text-ink-2">
          Facoltativo: serve solo a pesare le <Link href="/ideas" className="text-accent hover:underline">idee personalizzate</Link>.
          Resta salvato su questo browser e non viene inviato a nessun servizio.
          La personalizzazione non nasconde mai i rischi oggettivi.
        </p>
      </header>

      <section className="card space-y-5 p-5">
        <Field label="Orizzonte di investimento">
          <ChipGroup options={HORIZONS} value={p.horizon} onChange={(v) => update({ horizon: v as InvestorProfile["horizon"] })} />
        </Field>

        <Field label="Tolleranza al rischio">
          <ChipGroup options={RISK_LEVELS} value={p.riskTolerance} onChange={(v) => update({ riskTolerance: v as InvestorProfile["riskTolerance"] })} />
        </Field>

        <Field label="Mercati preferiti (anche più di uno)">
          <div className="flex flex-wrap gap-2">
            {MARKETS.map((m) => (
              <Chip key={m.value} active={p.markets.includes(m.value)} onClick={() => toggleIn("markets", m.value)}>
                {m.label}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="Stile preferito (anche più di uno)">
          <div className="flex flex-wrap gap-2">
            {STYLES.map((s) => (
              <Chip key={s.value} active={p.styles.includes(s.value)} onClick={() => toggleIn("styles", s.value)}>
                {s.label}
              </Chip>
            ))}
          </div>
        </Field>

        <div className="flex items-center gap-3 border-t border-grid pt-4">
          <button
            onClick={() => { saveProfile(p); setSaved(true); }}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white">
            Salva profilo
          </button>
          {saved && <span className="text-sm text-good">✓ Salvato. Vai alle <Link href="/ideas" className="underline">idee per te</Link>.</span>}
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{label}</p>
      {children}
    </div>
  );
}

function ChipGroup({
  options, value, onChange,
}: {
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup">
      {options.map((o) => (
        <Chip key={o.value} active={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </Chip>
      ))}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={active}
      className={`rounded-full border px-3 py-1 text-sm ${
        active ? "border-accent bg-accent text-white" : "border-bordr text-ink-2 hover:border-accent hover:text-ink"}`}>
      {children}
    </button>
  );
}
