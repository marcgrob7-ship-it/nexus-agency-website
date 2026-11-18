"use client";

import Link from "next/link";
import { Kopf, Laden } from "@/components/ui";
import { IconCamera, IconTrash } from "@/components/Icons";
import { bestellen, chf, datumKurz, zusammenfassung } from "@/lib/calc";
import { useStore } from "@/lib/store";

export default function Verlauf() {
  const { bereit, zaehlungen, loescheZaehlung } = useStore();
  if (!bereit) return <Laden />;

  return (
    <>
      <Kopf titel="Verlauf" unter={`${zaehlungen.length} gespeicherte Zählung${zaehlungen.length === 1 ? "" : "en"}`} />

      {zaehlungen.length === 0 ? (
        <div className="karte p-8 text-center">
          <p className="text-muted">Noch keine Zählung gespeichert.</p>
          <Link href="/zaehlen" className="knopf-primaer mt-4 w-full">
            <IconCamera /> Erste Zählung starten
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {zaehlungen.map((z, i) => {
            const s = zusammenfassung(z.positionen);
            const offen = z.positionen.filter((p) => bestellen(p) > 0);
            const erledigt = offen.filter((p) => z.bestellt.includes(p.artikelId)).length;
            const q = i === 0 ? "" : `?z=${z.id}`;
            return (
              <li key={z.id} className="karte p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">
                      {datumKurz(z.datum)}
                      {i === 0 && <span className="ml-2 rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-accent">aktuell</span>}
                    </div>
                    <div className="mt-0.5 text-xs text-muted">
                      {z.quelle === "foto" ? "📷 per Foto" : "✍️ manuell"} · {erledigt}/{s.positionen} bestellt
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="zahl text-2xl font-bold leading-none">{s.totalStueck}</div>
                    <div className="text-[10px] uppercase text-muted">Stück</div>
                  </div>
                </div>
                <div className="mt-2 text-sm text-muted">
                  {s.positionen} Positionen · {chf(s.betrag)}
                </div>
                <div className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2">
                  <Link href={`/${q}`} className="knopf-sekundaer h-11 text-sm">Übersicht</Link>
                  <Link href={`/bestellung${q}`} className="knopf-sekundaer h-11 text-sm">Bestellliste</Link>
                  <button
                    aria-label="Zählung löschen"
                    className="knopf-sekundaer h-11 w-11 px-0 text-muted"
                    onClick={() => confirm(`Zählung vom ${datumKurz(z.datum)} löschen?`) && loescheZaehlung(z.id)}
                  >
                    <IconTrash />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-4 px-1 text-xs text-muted">Die Daten sind lokal auf diesem Gerät gespeichert. Sicherung: Einstellungen → Daten exportieren.</p>
    </>
  );
}
