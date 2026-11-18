"use client";

import { useRef, useState } from "react";
import { Kopf, Laden, MarkenPunkt, Stepper } from "@/components/ui";
import { IconPlus, IconTrash } from "@/components/Icons";
import { STANDARD_ARTIKEL, slug } from "@/lib/artikel";
import { nachMarke, positionAusArtikel } from "@/lib/calc";
import { neueId, useStore } from "@/lib/store";
import type { Artikel } from "@/lib/types";

/** "B5-B7, D1" → ["B5","B6","B7","D1"] */
function parseFach(text: string): string[] {
  const out: string[] = [];
  for (const teil of text.toUpperCase().split(/[,;\s]+/).filter(Boolean)) {
    const m = teil.match(/^([A-E])(\d)(?:[-–]([A-E])?(\d))?$/);
    if (!m) continue;
    const [, r, a, , b] = m;
    if (b) for (let i = Number(a); i <= Number(b); i++) out.push(`${r}${i}`);
    else out.push(`${r}${a}`);
  }
  return [...new Set(out)];
}

function fachText(f: string[]): string {
  if (f.length > 2) {
    const r = f[0][0];
    const zahlen = f.map((x) => Number(x.slice(1)));
    const fortlaufend = f.every((x, i) => x[0] === r && (i === 0 || zahlen[i] === zahlen[i - 1] + 1));
    if (fortlaufend) return `${f[0]}-${f[f.length - 1]}`;
  }
  return f.join(", ");
}

export default function Einstellungen() {
  const { bereit, artikel, setArtikel, zaehlungen, importiere } = useStore();
  const [offen, setOffen] = useState<string | null>(null);
  const [neu, setNeu] = useState({ marke: "", sorte: "", soll: 12, preis: "2.90", fach: "" });
  const dateiRef = useRef<HTMLInputElement>(null);
  if (!bereit) return <Laden />;

  const update = (id: string, patch: Partial<Artikel>) => setArtikel(artikel.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const gruppen = nachMarke(artikel.map((a) => positionAusArtikel(a)));
  const marken = [...new Set(artikel.map((a) => a.marke))];

  function hinzufuegen() {
    if (!neu.marke.trim() || !neu.sorte.trim()) return;
    const basis = `${slug(neu.marke)}--${slug(neu.sorte)}`;
    const id = artikel.some((a) => a.id === basis) ? `${basis}-${neueId()}` : basis;
    const a: Artikel = {
      id,
      marke: neu.marke.trim(),
      sorte: neu.sorte.trim(),
      soll: neu.soll,
      preis: Number(neu.preis.replace(",", ".")) || 0,
      fach: parseFach(neu.fach),
    };
    // nach der letzten Sorte derselben Marke einfügen
    const idx = artikel.map((x) => x.marke).lastIndexOf(a.marke);
    const liste = [...artikel];
    liste.splice(idx >= 0 ? idx + 1 : liste.length, 0, a);
    setArtikel(liste);
    setNeu({ marke: neu.marke, sorte: "", soll: neu.soll, preis: neu.preis, fach: neu.fach });
  }

  function exportieren() {
    const blob = new Blob([JSON.stringify({ version: 1, artikel, zaehlungen }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `automat-tivoli-sicherung-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }

  async function importieren(datei?: File) {
    if (!datei) return;
    try {
      const daten = JSON.parse(await datei.text());
      if (!Array.isArray(daten.artikel)) throw new Error();
      if (confirm("Sicherung laden? Aktuelle Artikel und Zählungen werden ersetzt.")) importiere(daten);
    } catch {
      alert("Datei ist keine gültige Sicherung.");
    }
  }

  const sollTotal = artikel.reduce((s, a) => s + a.soll, 0);

  return (
    <>
      <Kopf titel="Einstellungen" unter={`${artikel.length} Artikel · SOLL total ${sollTotal} Stück`} rechts={<span />} />

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted">Artikelstamm</h2>
      <div className="space-y-3">
        {gruppen.map((g) => (
          <section key={g.marke} className="karte overflow-hidden">
            <h3 className="flex items-center justify-between border-b border-line bg-card2/60 px-4 py-2.5 font-bold">
              <span className="flex items-center gap-2"><MarkenPunkt marke={g.marke} />{g.marke}</span>
              <span className="zahl text-xs font-normal text-muted">SOLL {g.soll}</span>
            </h3>
            <ul className="divide-y divide-line">
              {g.positionen.map((p) => {
                const a = artikel.find((x) => x.id === p.artikelId)!;
                const auf = offen === a.id;
                return (
                  <li key={a.id}>
                    <button className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-card2" onClick={() => setOffen(auf ? null : a.id)}>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{a.sorte}</span>
                        <span className="text-xs text-muted">Fach {fachText(a.fach) || "–"} · CHF {a.preis.toFixed(2)}</span>
                      </span>
                      <span className={`zahl text-lg font-bold ${a.soll === 0 ? "text-muted" : ""}`}>{a.soll}</span>
                    </button>
                    {auf && (
                      <div className="space-y-3 bg-card2/40 px-4 pb-4 pt-1">
                        <label className="block">
                          <span className="text-xs text-muted">Marke</span>
                          <input className="mt-1 h-11 w-full rounded-xl border border-line bg-bg px-3" defaultValue={a.marke} onBlur={(e) => e.target.value.trim() && update(a.id, { marke: e.target.value.trim() })} />
                        </label>
                        <label className="block">
                          <span className="text-xs text-muted">Sorte</span>
                          <input className="mt-1 h-11 w-full rounded-xl border border-line bg-bg px-3" defaultValue={a.sorte} onBlur={(e) => e.target.value.trim() && update(a.id, { sorte: e.target.value.trim() })} />
                        </label>
                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <span className="text-xs text-muted">SOLL (0 = nicht nachbestellen)</span>
                            <div className="mt-1"><Stepper label="SOLL" wert={a.soll} onChange={(n) => update(a.id, { soll: n })} /></div>
                          </div>
                          <label className="w-28">
                            <span className="text-xs text-muted">Preis CHF</span>
                            <input
                              inputMode="decimal"
                              className="mt-1 h-11 w-full rounded-xl border border-line bg-bg px-3 text-right"
                              defaultValue={a.preis.toFixed(2)}
                              onBlur={(e) => update(a.id, { preis: Number(e.target.value.replace(",", ".")) || 0 })}
                            />
                          </label>
                        </div>
                        <label className="block">
                          <span className="text-xs text-muted">Fach (z. B. B5-B7 oder A1, A2)</span>
                          <input className="mt-1 h-11 w-full rounded-xl border border-line bg-bg px-3 uppercase" defaultValue={fachText(a.fach)} onBlur={(e) => update(a.id, { fach: parseFach(e.target.value) })} />
                        </label>
                        <button
                          className="knopf h-11 w-full border border-bad/40 text-red-300"
                          onClick={() => confirm(`${a.marke} ${a.sorte} entfernen?`) && setArtikel(artikel.filter((x) => x.id !== a.id))}
                        >
                          <IconTrash /> Artikel entfernen
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wider text-muted">Artikel hinzufügen</h2>
      <section className="karte space-y-3 p-4">
        <datalist id="marken">{marken.map((m) => <option key={m} value={m} />)}</datalist>
        <div className="grid grid-cols-2 gap-2">
          <input list="marken" placeholder="Marke" className="h-11 rounded-xl border border-line bg-bg px-3" value={neu.marke} onChange={(e) => setNeu({ ...neu, marke: e.target.value })} />
          <input placeholder="Sorte" className="h-11 rounded-xl border border-line bg-bg px-3" value={neu.sorte} onChange={(e) => setNeu({ ...neu, sorte: e.target.value })} />
          <input placeholder="Fach, z. B. C1-C4" className="h-11 rounded-xl border border-line bg-bg px-3 uppercase" value={neu.fach} onChange={(e) => setNeu({ ...neu, fach: e.target.value })} />
          <input inputMode="decimal" placeholder="Preis" className="h-11 rounded-xl border border-line bg-bg px-3" value={neu.preis} onChange={(e) => setNeu({ ...neu, preis: e.target.value })} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">SOLL</span>
          <Stepper label="SOLL neu" wert={neu.soll} onChange={(n) => setNeu({ ...neu, soll: n })} />
        </div>
        <button className="knopf-primaer h-12 w-full" disabled={!neu.marke.trim() || !neu.sorte.trim()} onClick={hinzufuegen}>
          <IconPlus /> Hinzufügen
        </button>
      </section>

      <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wider text-muted">Daten</h2>
      <section className="karte grid grid-cols-2 gap-2 p-4">
        <button className="knopf-sekundaer" onClick={exportieren}>Daten exportieren</button>
        <button className="knopf-sekundaer" onClick={() => dateiRef.current?.click()}>Sicherung laden</button>
        <input ref={dateiRef} type="file" accept="application/json" className="hidden" onChange={(e) => importieren(e.target.files?.[0])} />
        <button
          className="knopf-sekundaer col-span-2 text-red-300"
          onClick={() => confirm("Artikelstamm auf den Standard zurücksetzen? Gespeicherte Zählungen bleiben erhalten.") && setArtikel(STANDARD_ARTIKEL)}
        >
          Artikelstamm zurücksetzen
        </button>
      </section>
      <p className="mt-3 px-1 text-xs text-muted">Änderungen gelten für neue Zählungen. Gespeicherte Zählungen behalten ihre damaligen SOLL-Werte und Preise.</p>
    </>
  );
}
