"use client";

import { Suspense, useState } from "react";
import { AmpelPunkt, Kopf, Laden, MarkenPunkt } from "@/components/ui";
import { AuswahlBanner, useAuswahl } from "@/components/useAuswahl";
import { AMPEL_FARBE, bestellen, fachStatus } from "@/lib/calc";
import { FAECHER, REIHEN, markenFarbe } from "@/lib/artikel";
import { useStore } from "@/lib/store";

export default function Seite() {
  return (
    <Suspense fallback={<Laden />}>
      <Plan />
    </Suspense>
  );
}

function Plan() {
  const { bereit } = useStore();
  const { z, istNeueste, istLeer } = useAuswahl();
  const [gewaehlt, setGewaehlt] = useState<string | null>(null);
  if (!bereit) return <Laden />;

  const detail = gewaehlt ? fachStatus(z.positionen, gewaehlt) : null;

  return (
    <>
      <Kopf titel="Automatenplan" unter="Reihe A–E × Fach 1–8 · Füllstand im Automaten" />
      <AuswahlBanner z={z} istNeueste={istNeueste} istLeer={istLeer} pfad="/plan" />

      <section className="rounded-3xl border border-line bg-gradient-to-b from-zinc-800/60 to-zinc-900 p-2.5 shadow-2xl">
        <div className="rounded-2xl border border-white/5 bg-black/60 p-2">
          <div className="mb-1 grid grid-cols-[18px_repeat(8,minmax(0,1fr))] gap-1 text-center text-[10px] text-muted">
            <span />
            {FAECHER.map((f) => (
              <span key={f}>{f}</span>
            ))}
          </div>
          {REIHEN.map((r) => (
            <div key={r} className="mb-1 grid grid-cols-[18px_repeat(8,minmax(0,1fr))] gap-1">
              <span className="grid place-items-center text-xs font-bold text-muted">{r}</span>
              {FAECHER.map((f) => {
                const fach = `${r}${f}`;
                const st = fachStatus(z.positionen, fach);
                const farbe = AMPEL_FARBE[st.ampel];
                const hauptMarke = st.positionen.find((p) => p.soll > 0)?.marke ?? st.positionen[0]?.marke;
                const aktiv = gewaehlt === fach;
                return (
                  <button
                    key={fach}
                    onClick={() => setGewaehlt(aktiv ? null : fach)}
                    className={`relative flex aspect-[3/4] flex-col overflow-hidden rounded-lg border bg-zinc-900 text-left transition active:scale-95 ${aktiv ? "border-white ring-2 ring-white/60" : "border-white/10"}`}
                    aria-label={`Fach ${fach}`}
                  >
                    {/* Füllstand von unten */}
                    <span
                      className="absolute inset-x-0 bottom-0 transition-all"
                      style={{ height: `${Math.max(st.fuellstand ?? 0, st.fuellstand === 0 ? 0 : 0.06) * 100}%`, background: `${farbe}55` }}
                    />
                    {hauptMarke && <span className="relative h-1 w-full" style={{ background: markenFarbe(hauptMarke) }} />}
                    <span className="relative px-1 pt-0.5 text-[9px] font-semibold text-zinc-400">{fach}</span>
                    <span className="relative mt-auto px-1 pb-1">
                      <span className="zahl block text-sm font-bold leading-none" style={{ color: st.fuellstand === null ? "#71717a" : farbe }}>
                        {st.fuellstand === null ? "–" : Math.round(st.automat)}
                      </span>
                    </span>
                    {st.ampel === "rot" && <span className="absolute right-1 top-1.5 size-1.5 rounded-full bg-bad" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-center gap-4 text-[11px] text-muted">
          <span className="flex items-center gap-1.5"><AmpelPunkt ampel="rot" className="size-2.5" />leer</span>
          <span className="flex items-center gap-1.5"><AmpelPunkt ampel="orange" className="size-2.5" />unter 50 %</span>
          <span className="flex items-center gap-1.5"><AmpelPunkt ampel="gruen" className="size-2.5" />ab 50 %</span>
        </div>
      </section>

      {detail ? (
        <section className="karte mt-4 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-bold">Fach {detail.fach}</h2>
            {detail.fuellstand !== null && (
              <span className="zahl text-sm text-muted">{Math.round(detail.fuellstand * 100)} % gefüllt</span>
            )}
          </div>
          {detail.positionen.length === 0 ? (
            <p className="text-sm text-muted">Diesem Fach ist kein Artikel zugeordnet (Einstellungen → Fach).</p>
          ) : (
            <ul className="divide-y divide-line">
              {detail.positionen.map((p) => (
                <li key={p.artikelId} className="flex items-center gap-3 py-2.5">
                  <MarkenPunkt marke={p.marke} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{p.marke} {p.sorte}</div>
                    <div className="text-xs text-muted">
                      Fächer {p.fach.join(", ")} · Automat {p.automat} · Lager {p.lager} · SOLL {p.soll}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="zahl font-bold">{bestellen(p)}</div>
                    <div className="text-[10px] uppercase text-muted">bestellen</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {detail.positionen.some((p) => p.fach.length > 1) && (
            <p className="mt-2 text-xs text-muted">Artikel über mehrere Fächer werden für die Anzeige gleichmässig auf ihre Fächer verteilt.</p>
          )}
        </section>
      ) : (
        <p className="mt-4 text-center text-sm text-muted">Fach antippen für Details</p>
      )}
    </>
  );
}
