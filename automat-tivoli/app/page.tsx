"use client";

import Link from "next/link";
import { Suspense } from "react";
import { AmpelPunkt, Kennzahl, Kopf, Laden, MarkenPunkt } from "@/components/ui";
import { AuswahlBanner, useAuswahl } from "@/components/useAuswahl";
import { IconCamera, IconList } from "@/components/Icons";
import { chf, datumLang, nachMarke, zusammenfassung } from "@/lib/calc";
import { markenFarbe } from "@/lib/artikel";
import { useStore } from "@/lib/store";

export default function Seite() {
  return (
    <Suspense fallback={<Laden />}>
      <Dashboard />
    </Suspense>
  );
}

function Dashboard() {
  const { bereit } = useStore();
  const { z, istNeueste, istLeer, query } = useAuswahl();
  if (!bereit) return <Laden />;

  const s = zusammenfassung(z.positionen);
  const marken = nachMarke(z.positionen).filter((m) => m.soll > 0);
  const max = Math.max(1, ...marken.map((m) => m.bestellen));
  const ampelZahl = { rot: 0, orange: 0, gruen: 0 };
  marken.forEach((m) => m.ampel !== "grau" && ampelZahl[m.ampel]++);

  return (
    <>
      <Kopf titel="Automat Tivoli" unter={<span className="capitalize">{datumLang(istLeer ? new Date().toISOString() : z.datum)}</span>} />
      <AuswahlBanner z={z} istNeueste={istNeueste} istLeer={istLeer} pfad="/" />

      <section className="karte relative overflow-hidden p-5">
        <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-accent/20 blur-3xl" />
        <div className="text-xs uppercase tracking-wider text-muted">Total zu bestellen</div>
        <div className="zahl mt-1 text-6xl font-extrabold tracking-tight">
          {s.totalStueck}
          <span className="ml-2 text-xl font-semibold text-muted">Stück</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          <span><b className="zahl text-zinc-100">{s.positionen}</b> Positionen</span>
          <span>Warenwert <b className="zahl text-zinc-100">{chf(s.betrag)}</b></span>
        </div>
      </section>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Link href="/zaehlen" className="knopf-primaer">
          <IconCamera /> Neu zählen
        </Link>
        <Link href={`/bestellung${query}`} className="knopf h-14 bg-card2 border border-line">
          <IconList /> Bestellliste
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <Kennzahl wert={<span className="text-bad">{ampelZahl.rot}</span>} label="Leer" />
        <Kennzahl wert={<span className="text-warn">{ampelZahl.orange}</span>} label="< 50 %" />
        <Kennzahl wert={<span className="text-emerald-400">{ampelZahl.gruen}</span>} label="Gefüllt" />
      </div>

      <section className="mt-6">
        <h2 className="mb-2 flex items-baseline justify-between text-sm font-semibold uppercase tracking-wider text-muted">
          <span>Pro Marke</span>
          <span className="normal-case tracking-normal">Bestand / SOLL</span>
        </h2>
        <ul className="karte divide-y divide-line">
          {marken.map((m) => (
            <li key={m.marke} className="flex items-center gap-3 px-4 py-3">
              <AmpelPunkt ampel={m.ampel} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="flex items-center gap-2 truncate font-semibold">
                    <MarkenPunkt marke={m.marke} className="size-2.5" />
                    {m.marke}
                  </span>
                  <span className="zahl text-xs text-muted">{m.bestand} / {m.soll}</span>
                </div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-card2">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(m.bestellen / max) * 100}%`, background: markenFarbe(m.marke) }} />
                </div>
              </div>
              <div className="w-14 text-right">
                <div className="zahl text-lg font-bold leading-none">{m.bestellen}</div>
                <div className="text-[10px] uppercase text-muted">bestellen</div>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-2 px-1 text-xs text-muted">Balken = zu bestellende Stück. Ampel: rot = leer, orange = unter 50 % SOLL, grün = ab 50 %.</p>
      </section>
    </>
  );
}
