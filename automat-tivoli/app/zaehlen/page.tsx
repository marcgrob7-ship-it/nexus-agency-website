"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Kopf, Laden, MarkenPunkt, Stepper } from "@/components/ui";
import { IconCamera, IconImage, IconSpark, IconTrash } from "@/components/Icons";
import { verkleinereBild } from "@/lib/bild";
import { bestellen, nachMarke, positionAusArtikel, zusammenfassung } from "@/lib/calc";
import { neueId, useStore } from "@/lib/store";
import type { AnalyseErgebnis, Ort, Position, Zaehlung } from "@/lib/types";

interface Foto {
  id: string;
  ort: Ort;
  data: string;
  mediaType: "image/jpeg";
  vorschau: string;
}

const MAX_NUTZLAST = 4_000_000; // Vercel erlaubt max. ~4.5 MB pro Anfrage

export default function Zaehlen() {
  const router = useRouter();
  const { bereit, artikel, entwurf, setEntwurf, speichereZaehlung } = useStore();
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [laeuft, setLaeuft] = useState(false);
  const [verarbeite, setVerarbeite] = useState(0);
  const [fehler, setFehler] = useState<string | null>(null);
  const [nurUnsicher, setNurUnsicher] = useState(false);
  const kameraRef = useRef<HTMLInputElement>(null);
  const galerieRef = useRef<HTMLInputElement>(null);

  const nutzlast = useMemo(() => fotos.reduce((s, f) => s + f.data.length, 0), [fotos]);

  async function dateienHinzu(liste: FileList | null) {
    if (!liste?.length) return;
    setFehler(null);
    setVerarbeite((n) => n + liste.length);
    for (const datei of Array.from(liste)) {
      try {
        const b = await verkleinereBild(datei);
        setFotos((alt) => [
          ...alt,
          // Erstes Foto = Automat; danach den Ort des letzten Fotos übernehmen
          { id: neueId(), ort: alt.length ? alt[alt.length - 1].ort : "automat", data: b.data, mediaType: b.mediaType, vorschau: b.vorschau },
        ]);
      } catch {
        setFehler(`Foto «${datei.name}» konnte nicht gelesen werden.`);
      } finally {
        setVerarbeite((n) => n - 1);
      }
    }
  }

  function neuerEntwurf(quelle: Zaehlung["quelle"], erg?: AnalyseErgebnis): Zaehlung {
    const werte = new Map<string, { lager: number; automat: number; unsicher: boolean }>();
    for (const p of erg?.positionen ?? []) {
      const w = werte.get(p.artikelId) ?? { lager: 0, automat: 0, unsicher: false };
      w[p.ort] += p.anzahl;
      if (!p.sicher) w.unsicher = true;
      werte.set(p.artikelId, w);
    }
    return {
      id: neueId(),
      datum: new Date().toISOString(),
      quelle,
      positionen: artikel.map((a) => {
        const w = werte.get(a.id);
        return positionAusArtikel(a, w?.lager ?? 0, w?.automat ?? 0, w?.unsicher ?? false);
      }),
      unbekannt: erg?.unbekannt ?? [],
      bestellt: [],
      hinweis: erg?.hinweis || undefined,
    };
  }

  async function auswerten() {
    if (nutzlast > MAX_NUTZLAST) {
      setFehler("Zu viele/grosse Fotos auf einmal. Bitte maximal ca. 6–8 Fotos pro Auswertung.");
      return;
    }
    setLaeuft(true);
    setFehler(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fotos: fotos.map(({ data, mediaType, ort }) => ({ data, mediaType, ort })),
          artikel: artikel.map(({ id, marke, sorte, fach }) => ({ id, marke, sorte, fach })),
        }),
      });
      const json = await res.json().catch(() => ({ fehler: `Serverfehler (${res.status})` }));
      if (!res.ok) throw new Error(json.fehler ?? `Fehler ${res.status}`);
      setEntwurf(neuerEntwurf("foto", json as AnalyseErgebnis));
      setFotos([]);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "Auswertung fehlgeschlagen.");
    } finally {
      setLaeuft(false);
    }
  }

  if (!bereit) return <Laden />;

  // ───────────── Schritt 2: Prüfansicht ─────────────
  if (entwurf) {
    const s = zusammenfassung(entwurf.positionen);
    const anzahlUnsicher = entwurf.positionen.filter((p) => p.unsicher).length;
    const setPos = (id: string, fn: (p: Position) => Position) =>
      setEntwurf({ ...entwurf, positionen: entwurf.positionen.map((p) => (p.artikelId === id ? fn(p) : p)) });
    const marken = nachMarke(entwurf.positionen)
      .map((m) => ({ ...m, positionen: nurUnsicher ? m.positionen.filter((p) => p.unsicher) : m.positionen }))
      .filter((m) => m.positionen.length > 0);

    return (
      <>
        <Kopf titel="Prüfen" unter="Zahlen kontrollieren und mit +/− korrigieren" />

        <div className="sticky top-0 z-30 -mx-4 mb-3 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="zahl text-2xl font-extrabold leading-none">{s.totalStueck} <span className="text-sm font-semibold text-muted">Stück</span></div>
              <div className="mt-1 text-xs text-muted">{s.positionen} Positionen zu bestellen</div>
            </div>
            <button
              className="knopf-primaer h-12"
              onClick={() => {
                const z = { ...entwurf, datum: new Date().toISOString() };
                speichereZaehlung(z);
                setEntwurf(null);
                router.push("/bestellung");
              }}
            >
              Speichern
            </button>
          </div>
        </div>

        {anzahlUnsicher > 0 && (
          <button onClick={() => setNurUnsicher((v) => !v)} className="mb-3 flex w-full items-center justify-between rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 text-left text-sm">
            <span><b className="text-warn">{anzahlUnsicher} unsichere Werte</b> – orange markiert. Zahl antippen = bestätigt.</span>
            <span className="font-semibold text-warn">{nurUnsicher ? "Alle" : "Nur diese"}</span>
          </button>
        )}
        {entwurf.hinweis && <div className="mb-3 rounded-xl border border-line bg-card2 px-4 py-3 text-sm text-muted">💡 {entwurf.hinweis}</div>}

        {entwurf.unbekannt.length > 0 && (
          <section className="karte mb-3 p-4">
            <h2 className="mb-1 font-semibold">Unbekannte Produkte</h2>
            <ul className="space-y-1 text-sm text-muted">
              {entwurf.unbekannt.map((u, i) => (
                <li key={i}>• {u.beschreibung} – {u.anzahl}× ({u.ort === "automat" ? "Automat" : "Lager"})</li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">Werden nicht bestellt. Neue Artikel unter Einstellungen hinzufügen.</p>
          </section>
        )}

        <div className="space-y-4">
          {marken.map((m) => (
            <section key={m.marke} className="karte overflow-hidden">
              <h2 className="flex items-center gap-2 border-b border-line bg-card2/60 px-4 py-2.5 font-bold">
                <MarkenPunkt marke={m.marke} /> {m.marke}
              </h2>
              <ul className="divide-y divide-line">
                {m.positionen.map((p) => (
                  <li key={p.artikelId} className={`px-4 py-3 ${p.unsicher ? "bg-warn/5" : ""}`}>
                    <div className="mb-2 flex items-baseline justify-between gap-2">
                      <span className="truncate font-semibold">{p.sorte}</span>
                      <span className="zahl shrink-0 text-xs text-muted">
                        SOLL {p.soll} · <b className={bestellen(p) > 0 ? "text-accent" : "text-zinc-400"}>bestellen {bestellen(p)}</b>
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="mb-1 text-[10px] uppercase tracking-wider text-muted">Automat</div>
                        <Stepper
                          label={`${p.sorte} Automat`}
                          wert={p.automat}
                          warnung={p.unsicher}
                          onChange={(n) => setPos(p.artikelId, (x) => ({ ...x, automat: n, unsicher: false }))}
                          onBestaetigen={() => setPos(p.artikelId, (x) => ({ ...x, unsicher: false }))}
                        />
                      </div>
                      <div>
                        <div className="mb-1 text-[10px] uppercase tracking-wider text-muted">Lager</div>
                        <Stepper
                          label={`${p.sorte} Lager`}
                          wert={p.lager}
                          warnung={p.unsicher && p.lager > 0}
                          onChange={(n) => setPos(p.artikelId, (x) => ({ ...x, lager: n, unsicher: false }))}
                          onBestaetigen={() => setPos(p.artikelId, (x) => ({ ...x, unsicher: false }))}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <button
          className="mt-6 w-full py-3 text-sm text-muted underline"
          onClick={() => confirm("Zählung verwerfen?") && setEntwurf(null)}
        >
          Zählung verwerfen
        </button>
      </>
    );
  }

  // ───────────── Schritt 1: Fotos ─────────────
  return (
    <>
      <Kopf titel="Neue Zählung" unter="Fotos vom Automaten und/oder Lagerregal" />

      <input ref={kameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { dateienHinzu(e.target.files); e.target.value = ""; }} />
      <input ref={galerieRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { dateienHinzu(e.target.files); e.target.value = ""; }} />

      <div className="grid grid-cols-2 gap-3">
        <button className="knopf h-28 flex-col rounded-2xl bg-card border border-line text-base" onClick={() => kameraRef.current?.click()} disabled={laeuft}>
          <IconCamera className="size-8 text-accent" /> Foto aufnehmen
        </button>
        <button className="knopf h-28 flex-col rounded-2xl bg-card border border-line text-base" onClick={() => galerieRef.current?.click()} disabled={laeuft}>
          <IconImage className="size-8 text-accent" /> Aus Galerie
        </button>
      </div>

      {(fotos.length > 0 || verarbeite > 0) && (
        <section className="mt-4 space-y-3">
          {fotos.map((f, i) => (
            <div key={f.id} className="karte flex gap-3 p-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.vorschau} alt={`Foto ${i + 1}`} className="size-24 shrink-0 rounded-xl object-cover" />
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Foto {i + 1}</span>
                  <button aria-label="Foto entfernen" className="grid size-9 place-items-center rounded-lg text-muted active:bg-card2" onClick={() => setFotos((alt) => alt.filter((x) => x.id !== f.id))}>
                    <IconTrash />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-card2 p-1">
                  {(["automat", "lager"] as Ort[]).map((o) => (
                    <button
                      key={o}
                      onClick={() => setFotos((alt) => alt.map((x) => (x.id === f.id ? { ...x, ort: o } : x)))}
                      className={`h-10 rounded-lg text-sm font-semibold transition ${f.ort === o ? (o === "automat" ? "bg-accent text-black" : "bg-sky-400 text-black") : "text-muted"}`}
                    >
                      {o === "automat" ? "Automat" : "Lager"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {verarbeite > 0 && <div className="karte p-4 text-center text-sm text-muted">Foto wird verkleinert …</div>}
        </section>
      )}

      {fehler && <div className="mt-4 rounded-xl border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-red-300">{fehler}</div>}

      <button className="knopf-primaer mt-5 w-full" disabled={fotos.length === 0 || laeuft || verarbeite > 0} onClick={auswerten}>
        {laeuft ? (
          <>
            <span className="size-5 animate-spin rounded-full border-2 border-black/30 border-t-black" /> KI zählt … (bis ~1 Min.)
          </>
        ) : (
          <>
            <IconSpark /> {fotos.length > 0 ? `${fotos.length} Foto${fotos.length > 1 ? "s" : ""} auswerten` : "Fotos auswerten"}
          </>
        )}
      </button>

      <div className="mt-3 rounded-xl border border-line bg-card2 px-4 py-3 text-xs leading-relaxed text-muted">
        Pro Foto wählen, ob es den <b className="text-zinc-300">Automaten</b> oder das <b className="text-zinc-300">Lager</b> zeigt.
        Ohne Lagerfoto gilt Lager = 0. Fotos werden auf max. 1600 px verkleinert und nicht gespeichert.
      </div>

      <button className="knopf-sekundaer mt-4 w-full" disabled={laeuft} onClick={() => setEntwurf(neuerEntwurf("manuell"))}>
        Ohne Foto manuell zählen
      </button>
    </>
  );
}
