"use client";

import { Suspense, useState } from "react";
import { Kopf, Laden, MarkenPunkt } from "@/components/ui";
import { AuswahlBanner, useAuswahl } from "@/components/useAuswahl";
import { IconCheck, IconCopy, IconDownload, IconShare } from "@/components/Icons";
import { bestellText, bestellen, chf, datumKurz, nachMarke, zusammenfassung } from "@/lib/calc";
import { exportExcel, exportPdf } from "@/lib/export";
import { useStore } from "@/lib/store";

export default function Seite() {
  return (
    <Suspense fallback={<Laden />}>
      <Bestellliste />
    </Suspense>
  );
}

function Bestellliste() {
  const { bereit, aktualisiereZaehlung } = useStore();
  const { z, istNeueste, istLeer } = useAuswahl();
  const [meldung, setMeldung] = useState<string | null>(null);
  const [lokalBestellt, setLokalBestellt] = useState<string[]>([]);
  if (!bereit) return <Laden />;

  // Die Annahme «alles leer» ist nicht gespeichert → Häkchen nur lokal
  const bestellt = istLeer ? lokalBestellt : z.bestellt;
  const zMitHaken = { ...z, bestellt };

  const s = zusammenfassung(z.positionen);
  const marken = nachMarke(z.positionen)
    .map((m) => ({ ...m, positionen: m.positionen.filter((p) => bestellen(p) > 0) }))
    .filter((m) => m.positionen.length > 0);
  const erledigt = marken.flatMap((m) => m.positionen).filter((p) => bestellt.includes(p.artikelId)).length;

  function toggle(id: string) {
    const neu = (liste: string[]) => (liste.includes(id) ? liste.filter((x) => x !== id) : [...liste, id]);
    if (istLeer) setLokalBestellt(neu);
    else aktualisiereZaehlung(z.id, (alt) => ({ ...alt, bestellt: neu(alt.bestellt) }));
  }

  function zeige(text: string) {
    setMeldung(text);
    setTimeout(() => setMeldung(null), 2200);
  }

  async function kopieren() {
    const text = bestellText(zMitHaken);
    try {
      await navigator.clipboard.writeText(text);
      zeige("Liste kopiert ✓");
    } catch {
      // Fallback für ältere Browser / http im WLAN
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      zeige("Liste kopiert ✓");
    }
  }

  async function teilen() {
    const text = bestellText(zMitHaken);
    if (navigator.share) {
      try {
        await navigator.share({ title: "Bestellung Automat Tivoli", text });
      } catch {
        /* abgebrochen */
      }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  }

  return (
    <>
      <Kopf titel="Bestellliste" unter={istLeer ? "Annahme: Lager und Automat leer" : `Zählung vom ${datumKurz(z.datum)}`} />
      <AuswahlBanner z={z} istNeueste={istNeueste} istLeer={istLeer} pfad="/bestellung" />

      <section className="karte p-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="zahl text-4xl font-extrabold">{s.totalStueck} <span className="text-base font-semibold text-muted">Stück</span></div>
            <div className="mt-1 text-sm text-muted">
              {s.positionen} Positionen · {chf(s.betrag)}
            </div>
          </div>
          <div className="text-right">
            <div className="zahl text-lg font-bold">{erledigt}/{s.positionen}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted">bestellt</div>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-card2">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${s.positionen ? (erledigt / s.positionen) * 100 : 0}%` }} />
        </div>
      </section>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button className="knopf-primaer col-span-2" onClick={kopieren} disabled={s.positionen === 0}>
          <IconCopy /> Liste kopieren
        </button>
        <button className="knopf-sekundaer" onClick={() => exportPdf(zMitHaken)} disabled={s.positionen === 0}>
          <IconDownload /> PDF (A4)
        </button>
        <button className="knopf-sekundaer" onClick={() => exportExcel(zMitHaken)} disabled={s.positionen === 0}>
          <IconDownload /> Excel
        </button>
        <button className="knopf-sekundaer col-span-2" onClick={teilen} disabled={s.positionen === 0}>
          <IconShare /> Teilen (WhatsApp, E-Mail …)
        </button>
      </div>

      {marken.length === 0 && (
        <div className="karte mt-4 p-6 text-center text-muted">Alles voll – nichts zu bestellen 🎉</div>
      )}

      <div className="mt-5 space-y-4">
        {marken.map((m) => (
          <section key={m.marke} className="karte overflow-hidden">
            <h2 className="flex items-center justify-between border-b border-line bg-card2/60 px-4 py-2.5">
              <span className="flex items-center gap-2 font-bold">
                <MarkenPunkt marke={m.marke} />
                {m.marke}
              </span>
              <span className="zahl text-sm text-muted">{m.bestellen} Stk.</span>
            </h2>
            <ul className="divide-y divide-line">
              {m.positionen.map((p) => {
                const ok = bestellt.includes(p.artikelId);
                return (
                  <li key={p.artikelId}>
                    <button onClick={() => toggle(p.artikelId)} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-card2">
                      <span className={`grid size-7 shrink-0 place-items-center rounded-lg border-2 transition ${ok ? "border-accent bg-accent text-black" : "border-zinc-600"}`}>
                        {ok && <IconCheck className="size-4" />}
                      </span>
                      <span className={`min-w-0 flex-1 ${ok ? "text-muted line-through" : ""}`}>
                        <span className="block truncate font-medium">{p.sorte}</span>
                        <span className="text-xs text-muted">
                          SOLL {p.soll} · Lager {p.lager} · Automat {p.automat} · {chf(p.preis)}
                        </span>
                      </span>
                      <span className={`zahl text-2xl font-bold ${ok ? "text-muted" : ""}`}>{bestellen(p)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {z.unbekannt.length > 0 && (
        <section className="karte mt-4 p-4">
          <h2 className="mb-2 font-semibold">Nicht zugeordnete Produkte</h2>
          <ul className="space-y-1 text-sm text-muted">
            {z.unbekannt.map((u, i) => (
              <li key={i}>• {u.beschreibung} ({u.anzahl}×, {u.ort === "automat" ? "Automat" : "Lager"})</li>
            ))}
          </ul>
        </section>
      )}

      {meldung && (
        <div className="fixed inset-x-0 bottom-24 z-50 mx-auto w-fit rounded-full bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-black shadow-xl">
          {meldung}
        </div>
      )}
    </>
  );
}
