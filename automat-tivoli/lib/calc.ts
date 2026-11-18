import type { Artikel, Position, Zaehlung } from "./types";

/** Bestellen = MAX(0, SOLL − Lager − Automat) */
export function bestellen(p: Pick<Position, "soll" | "lager" | "automat">): number {
  return Math.max(0, p.soll - p.lager - p.automat);
}

export function positionAusArtikel(a: Artikel, lager = 0, automat = 0, unsicher = false): Position {
  return {
    artikelId: a.id,
    marke: a.marke,
    sorte: a.sorte,
    soll: a.soll,
    preis: a.preis,
    fach: [...a.fach],
    lager,
    automat,
    unsicher,
  };
}

/** Leere Zählung (Lager = 0, Automat = 0) – Annahme, solange noch nichts gezählt wurde */
export function leereZaehlung(artikel: Artikel[], datum = new Date()): Zaehlung {
  return {
    id: "leer",
    datum: datum.toISOString(),
    quelle: "manuell",
    positionen: artikel.map((a) => positionAusArtikel(a)),
    unbekannt: [],
    bestellt: [],
  };
}

export interface Zusammenfassung {
  totalStueck: number;
  positionen: number;
  betrag: number;
}

export function zusammenfassung(positionen: Position[]): Zusammenfassung {
  let totalStueck = 0;
  let anzahl = 0;
  let betrag = 0;
  for (const p of positionen) {
    const b = bestellen(p);
    if (b > 0) {
      totalStueck += b;
      anzahl += 1;
      betrag += b * p.preis;
    }
  }
  return { totalStueck, positionen: anzahl, betrag: Math.round(betrag * 100) / 100 };
}

export type Ampel = "rot" | "orange" | "gruen" | "grau";

/** rot = leer, orange = unter 50 % SOLL, grün = ab 50 % */
export function ampel(bestand: number, soll: number): Ampel {
  if (soll <= 0) return "grau";
  if (bestand <= 0) return "rot";
  if (bestand / soll < 0.5) return "orange";
  return "gruen";
}

export const AMPEL_FARBE: Record<Ampel, string> = {
  rot: "#ef4444",
  orange: "#f59e0b",
  gruen: "#22c55e",
  grau: "#52525b",
};

export interface MarkenStatus {
  marke: string;
  soll: number;
  bestand: number;
  bestellen: number;
  positionen: Position[];
  ampel: Ampel;
}

/** Positionen nach Marke gruppieren (Reihenfolge wie im Artikelstamm) */
export function nachMarke(positionen: Position[]): MarkenStatus[] {
  const map = new Map<string, MarkenStatus>();
  for (const p of positionen) {
    let m = map.get(p.marke);
    if (!m) {
      m = { marke: p.marke, soll: 0, bestand: 0, bestellen: 0, positionen: [], ampel: "grau" };
      map.set(p.marke, m);
    }
    m.soll += p.soll;
    m.bestand += p.lager + p.automat;
    m.bestellen += bestellen(p);
    m.positionen.push(p);
  }
  for (const m of map.values()) m.ampel = ampel(m.bestand, m.soll);
  return [...map.values()];
}

export interface FachStatus {
  fach: string;
  positionen: Position[];
  automat: number;
  soll: number;
  /** 0..1 oder null, wenn kein Artikel zugeordnet */
  fuellstand: number | null;
  ampel: Ampel;
}

/** Füllstand pro Fach: Summe Automat / Summe SOLL aller Artikel, die diesem Fach zugeordnet sind */
export function fachStatus(positionen: Position[], fach: string): FachStatus {
  const ps = positionen.filter((p) => p.fach.includes(fach));
  // Bei Gruppen über mehrere Fächer (z. B. Nocco B5–B7) wird Bestand und SOLL anteilig verteilt
  let automat = 0;
  let soll = 0;
  for (const p of ps) {
    const n = Math.max(1, p.fach.length);
    automat += p.automat / n;
    soll += p.soll / n;
  }
  const relevant = ps.filter((p) => p.soll > 0);
  if (ps.length === 0 || relevant.length === 0) {
    return { fach, positionen: ps, automat, soll, fuellstand: null, ampel: "grau" };
  }
  const fuellstand = soll > 0 ? Math.min(1, automat / soll) : 0;
  return { fach, positionen: ps, automat, soll, fuellstand, ampel: ampel(automat, soll) };
}

export function chf(n: number): string {
  return new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF" }).format(n);
}

export function datumLang(iso: string): string {
  return new Date(iso).toLocaleDateString("de-CH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function datumKurz(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })
  );
}

/** Bestellliste als Text (WhatsApp / E-Mail) */
export function bestellText(z: Zaehlung): string {
  const datum = new Date(z.datum).toLocaleDateString("de-CH");
  const s = zusammenfassung(z.positionen);
  const zeilen: string[] = [`*Bestellung Automat Tivoli – ${datum}*`, ""];
  for (const m of nachMarke(z.positionen)) {
    const ps = m.positionen.filter((p) => bestellen(p) > 0);
    if (ps.length === 0) continue;
    zeilen.push(`*${m.marke}*`);
    for (const p of ps) zeilen.push(`• ${p.sorte}: ${bestellen(p)}`);
    zeilen.push("");
  }
  zeilen.push(`Total: ${s.totalStueck} Stück (${s.positionen} Positionen)`);
  return zeilen.join("\n");
}
