export type Ort = "automat" | "lager";

export interface Artikel {
  id: string;
  marke: string;
  sorte: string;
  /** Zielbestand gesamt (Lager + Automat) */
  soll: number;
  /** Preis in CHF */
  preis: number;
  /** Fächer im Automaten, z. B. ["B5", "B6", "B7"] */
  fach: string[];
}

/** Eine Zeile einer gespeicherten Zählung (Snapshot des Artikels zum Zeitpunkt der Zählung) */
export interface Position {
  artikelId: string;
  marke: string;
  sorte: string;
  soll: number;
  preis: number;
  fach: string[];
  lager: number;
  automat: number;
  /** true, wenn die KI den Wert als unsicher markiert hat und er noch nicht geprüft wurde */
  unsicher: boolean;
}

export interface UnbekanntesProdukt {
  ort: Ort;
  beschreibung: string;
  anzahl: number;
}

export interface Zaehlung {
  id: string;
  /** ISO-Datum */
  datum: string;
  quelle: "foto" | "manuell";
  positionen: Position[];
  unbekannt: UnbekanntesProdukt[];
  /** artikelIds, die in der Bestellliste als «bestellt» abgehakt wurden */
  bestellt: string[];
  hinweis?: string;
}

export interface AnalyseErgebnis {
  positionen: { artikelId: string; ort: Ort; anzahl: number; sicher: boolean }[];
  unbekannt: UnbekanntesProdukt[];
  hinweis: string;
}
