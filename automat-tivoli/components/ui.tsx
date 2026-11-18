"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AMPEL_FARBE, type Ampel } from "@/lib/calc";
import { markenFarbe } from "@/lib/artikel";
import { IconGear, IconMinus, IconPlus } from "./Icons";

export function Kopf({ titel, unter, rechts }: { titel: string; unter?: ReactNode; rechts?: ReactNode }) {
  return (
    <header className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">{titel}</h1>
        {unter && <div className="mt-0.5 text-sm text-muted">{unter}</div>}
      </div>
      {rechts ?? (
        <Link href="/einstellungen" aria-label="Einstellungen" className="grid size-11 shrink-0 place-items-center rounded-xl bg-card border border-line text-muted">
          <IconGear className="size-5" />
        </Link>
      )}
    </header>
  );
}

export function AmpelPunkt({ ampel, className = "size-3" }: { ampel: Ampel; className?: string }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full ${className}`}
      style={{ background: AMPEL_FARBE[ampel], boxShadow: ampel === "grau" ? undefined : `0 0 10px ${AMPEL_FARBE[ampel]}88` }}
    />
  );
}

export function MarkenPunkt({ marke, className = "size-3" }: { marke: string; className?: string }) {
  return <span className={`inline-block shrink-0 rounded-[4px] ${className}`} style={{ background: markenFarbe(marke) }} />;
}

export function Stepper({
  wert,
  onChange,
  warnung,
  label,
  onBestaetigen,
}: {
  wert: number;
  onChange: (n: number) => void;
  warnung?: boolean;
  label?: string;
  onBestaetigen?: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" aria-label={`${label ?? ""} minus`} className="grid size-11 place-items-center rounded-xl bg-card2 border border-line active:scale-95" onClick={() => onChange(Math.max(0, wert - 1))}>
        <IconMinus className="size-5" />
      </button>
      <button
        type="button"
        onClick={onBestaetigen}
        title={warnung ? "Unsicher – antippen zum Bestätigen" : undefined}
        className={`zahl h-11 min-w-12 rounded-xl px-1 text-center text-lg font-bold ${warnung ? "bg-warn/15 text-warn ring-2 ring-warn" : "text-zinc-100"}`}
      >
        {wert}
      </button>
      <button type="button" aria-label={`${label ?? ""} plus`} className="grid size-11 place-items-center rounded-xl bg-card2 border border-line active:scale-95" onClick={() => onChange(wert + 1)}>
        <IconPlus className="size-5" />
      </button>
    </div>
  );
}

export function Kennzahl({ wert, label, gross }: { wert: ReactNode; label: string; gross?: boolean }) {
  return (
    <div className="karte p-4">
      <div className={`zahl font-bold tracking-tight ${gross ? "text-5xl" : "text-2xl"}`}>{wert}</div>
      <div className="mt-1 truncate text-xs uppercase tracking-wider text-muted">{label}</div>
    </div>
  );
}

export function Laden() {
  return <div className="py-20 text-center text-muted">Lädt …</div>;
}
