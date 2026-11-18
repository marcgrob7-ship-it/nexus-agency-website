"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { datumKurz } from "@/lib/calc";
import type { Zaehlung } from "@/lib/types";

/** Gewählte Zählung aus ?z=…, sonst die neueste, sonst Annahme «alles leer» */
export function useAuswahl(): { z: Zaehlung; istNeueste: boolean; istLeer: boolean; query: string } {
  const sp = useSearchParams();
  const { waehleZaehlung, zaehlungen } = useStore();
  const z = waehleZaehlung(sp.get("z"));
  const istLeer = z.id === "leer";
  const istNeueste = istLeer || zaehlungen[0]?.id === z.id;
  return { z, istNeueste, istLeer, query: istNeueste ? "" : `?z=${z.id}` };
}

export function AuswahlBanner({ z, istNeueste, istLeer, pfad }: { z: Zaehlung; istNeueste: boolean; istLeer: boolean; pfad: string }) {
  if (istLeer) {
    return (
      <div className="mb-4 rounded-xl border border-line bg-card2 px-4 py-3 text-sm text-muted">
        Noch keine Zählung gespeichert – Annahme: <b className="text-zinc-200">Lager = 0, Automat = 0</b>.
      </div>
    );
  }
  if (istNeueste) return null;
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 text-sm">
      <span>Ältere Zählung vom {datumKurz(z.datum)}</span>
      <Link href={pfad} className="font-semibold text-warn">Neueste</Link>
    </div>
  );
}
