"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { STANDARD_ARTIKEL } from "./artikel";
import { leereZaehlung } from "./calc";
import type { Artikel, Zaehlung } from "./types";

const K_ARTIKEL = "tivoli.artikel.v1";
const K_ZAEHLUNGEN = "tivoli.zaehlungen.v1";
const K_ENTWURF = "tivoli.entwurf.v1";

function lesen<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function schreiben(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Speicher voll oder blockiert – App funktioniert weiter */
  }
}

interface StoreValue {
  bereit: boolean;
  artikel: Artikel[];
  setArtikel: (a: Artikel[]) => void;
  zaehlungen: Zaehlung[];
  speichereZaehlung: (z: Zaehlung) => void;
  aktualisiereZaehlung: (id: string, fn: (z: Zaehlung) => Zaehlung) => void;
  loescheZaehlung: (id: string) => void;
  entwurf: Zaehlung | null;
  setEntwurf: (z: Zaehlung | null) => void;
  /** Zählung per ID, sonst die neueste, sonst eine leere Annahme (alles 0) */
  waehleZaehlung: (id?: string | null) => Zaehlung;
  importiere: (daten: { artikel?: Artikel[]; zaehlungen?: Zaehlung[] }) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [bereit, setBereit] = useState(false);
  const [artikel, setArtikelState] = useState<Artikel[]>(STANDARD_ARTIKEL);
  const [zaehlungen, setZaehlungen] = useState<Zaehlung[]>([]);
  const [entwurf, setEntwurfState] = useState<Zaehlung | null>(null);

  useEffect(() => {
    setArtikelState(lesen(K_ARTIKEL, STANDARD_ARTIKEL));
    setZaehlungen(lesen<Zaehlung[]>(K_ZAEHLUNGEN, []));
    setEntwurfState(lesen<Zaehlung | null>(K_ENTWURF, null));
    setBereit(true);
  }, []);

  const setArtikel = useCallback((a: Artikel[]) => {
    setArtikelState(a);
    schreiben(K_ARTIKEL, a);
  }, []);

  const setAlleZaehlungen = useCallback((fn: (alt: Zaehlung[]) => Zaehlung[]) => {
    setZaehlungen((alt) => {
      const neu = fn(alt).sort((a, b) => b.datum.localeCompare(a.datum));
      schreiben(K_ZAEHLUNGEN, neu);
      return neu;
    });
  }, []);

  const speichereZaehlung = useCallback(
    (z: Zaehlung) => setAlleZaehlungen((alt) => [z, ...alt.filter((x) => x.id !== z.id)]),
    [setAlleZaehlungen],
  );

  const aktualisiereZaehlung = useCallback(
    (id: string, fn: (z: Zaehlung) => Zaehlung) =>
      setAlleZaehlungen((alt) => alt.map((z) => (z.id === id ? fn(z) : z))),
    [setAlleZaehlungen],
  );

  const loescheZaehlung = useCallback(
    (id: string) => setAlleZaehlungen((alt) => alt.filter((z) => z.id !== id)),
    [setAlleZaehlungen],
  );

  const setEntwurf = useCallback((z: Zaehlung | null) => {
    setEntwurfState(z);
    schreiben(K_ENTWURF, z);
  }, []);

  const waehleZaehlung = useCallback(
    (id?: string | null) => {
      if (id) {
        const z = zaehlungen.find((x) => x.id === id);
        if (z) return z;
      }
      return zaehlungen[0] ?? leereZaehlung(artikel);
    },
    [zaehlungen, artikel],
  );

  const importiere = useCallback(
    (daten: { artikel?: Artikel[]; zaehlungen?: Zaehlung[] }) => {
      if (daten.artikel) setArtikel(daten.artikel);
      if (daten.zaehlungen) setAlleZaehlungen(() => daten.zaehlungen!);
    },
    [setArtikel, setAlleZaehlungen],
  );

  const value = useMemo(
    () => ({
      bereit,
      artikel,
      setArtikel,
      zaehlungen,
      speichereZaehlung,
      aktualisiereZaehlung,
      loescheZaehlung,
      entwurf,
      setEntwurf,
      waehleZaehlung,
      importiere,
    }),
    [bereit, artikel, setArtikel, zaehlungen, speichereZaehlung, aktualisiereZaehlung, loescheZaehlung, entwurf, setEntwurf, waehleZaehlung, importiere],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore ausserhalb von StoreProvider");
  return ctx;
}

export function neueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
