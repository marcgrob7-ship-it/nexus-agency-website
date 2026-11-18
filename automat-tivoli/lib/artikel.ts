import type { Artikel } from "./types";

/** Fachbereich "B5–B7" → ["B5","B6","B7"] */
export function fachBereich(von: string, bis?: string): string[] {
  if (!bis) return [von];
  const reihe = von[0];
  const a = Number(von.slice(1));
  const b = Number(bis.slice(1));
  const out: string[] = [];
  for (let i = a; i <= b; i++) out.push(`${reihe}${i}`);
  return out;
}

export function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function gruppe(marke: string, sorten: string[], soll: number, preis: number, fach: string[]): Artikel[] {
  return sorten.map((sorte) => ({
    id: `${slug(marke)}--${slug(sorte)}`,
    marke,
    sorte,
    soll,
    preis,
    fach,
  }));
}

export const STANDARD_ARTIKEL: Artikel[] = [
  ...gruppe("Nocco", ["Ramonade", "Black Orange", "Pfirsich", "Grand Sour", "Limon"], 24, 3.9, fachBereich("B5", "B7")),
  ...gruppe("Blaze", ["Sweet Lemon", "Blue Grape", "Orange Pineapple", "Orange Mango"], 24, 2.9, fachBereich("E5", "E8")),
  ...gruppe("Homie", ["Grapefruit", "Holunder", "Lemonade", "Pineapple"], 24, 2.9, fachBereich("E1", "E4")),
  { id: "barbell--schoko", marke: "Barbell", sorte: "Schoko", soll: 12, preis: 3.9, fach: ["B1"] },
  { id: "barbell--vanille", marke: "Barbell", sorte: "Vanille", soll: 12, preis: 3.9, fach: ["B2"] },
  { id: "barbell--banane", marke: "Barbell", sorte: "Banane", soll: 12, preis: 3.9, fach: ["B3"] },
  { id: "barbell--erdbeer", marke: "Barbell", sorte: "Erdbeer", soll: 12, preis: 3.9, fach: ["B4"] },
  ...gruppe(
    "Vitamin Well",
    ["Protect", "Recover", "Zero Ananas", "Zero Himbeer", "Boost", "Reload"],
    12,
    2.9,
    fachBereich("C1", "C4"),
  ),
  ...gruppe("V8", ["Energy"], 12, 2.9, fachBereich("D5", "D6")),
  ...gruppe(
    "Focus Water",
    ["Antiox", "Immunity", "Relax", "Reload", "Care", "Activity", "Push"],
    12,
    2.9,
    fachBereich("C5", "C8"),
  ),
  ...gruppe("Red Bull", ["Original"], 24, 3.9, ["B8"]),
  ...gruppe("Monster", ["Ice", "Original Zero", "Lewis Hamilton Edt."], 12, 2.9, fachBereich("D7", "D8")),
  ...gruppe("San Pellegrino", ["Wasser mit Kohlensäure"], 24, 2.9, fachBereich("D3", "D4")),
  ...gruppe("Evian", ["Wasser still"], 24, 2.9, fachBereich("D1", "D2")),
  ...gruppe("Dymatize", ["Layer Bar"], 24, 2.9, fachBereich("A5", "A8")),
  ...gruppe("Grenade", ["Oreo"], 24, 2.9, fachBereich("A5", "A8")),
  ...gruppe("Nutrend", ["Quizz"], 24, 2.9, fachBereich("A5", "A8")),
  ...gruppe("Powerfood", ["Dream"], 24, 2.9, fachBereich("A5", "A8")),
  ...gruppe("Oat King", ["Super Banana", "Chocolate Chip"], 20, 2.9, fachBereich("A1", "A4")),
  ...gruppe("Oat King", ["Apricot Yoghurt"], 0, 2.9, fachBereich("A1", "A4")),
];

/** Erkennungshinweise für die KI (Etiketten) */
export const ERKENNUNGS_HINWEISE = `
- Blaze: orange Dose = Orange Pineapple, weisse Dose = Orange Mango, dazu Sweet Lemon, Blue Grape.
- Focus Water: Antiox (grün, Lemon & Ginger), Activity (Etikett «Active», gelb, Pineapple & Mango), Care (lila, Mirabelle & Rhubarb), Immunity, Relax, Reload, Push.
- Vitamin Well: Recover (orange Schrift), Boost (rot), Protect, Reload, Zero Ananas, Zero Himbeer.
- Homie: Grapefruit, Holunder, Lemonade, Pineapple.
- Barbell (Proteinshake): Schoko, Vanille, Banane, Erdbeer.
- Wasser: Evian = still, San Pellegrino = mit Kohlensäure.
- Riegel in A5–A8: Dymatize Layer Bar, Grenade Oreo, Nutrend Quizz, Powerfood Dream.
- Oat King: Super Banana, Chocolate Chip, Apricot Yoghurt.
- Schienennummern am Automaten: 10–17 = Reihe A (Fach 1–8), 20–27 = B, 30–37 = C, 40–47 = D, 50–57 = E.
`.trim();

const MARKEN_FARBEN: Record<string, string> = {
  Nocco: "#ec4899",
  Blaze: "#f97316",
  Homie: "#facc15",
  Barbell: "#8b5cf6",
  "Vitamin Well": "#14b8a6",
  V8: "#f59e0b",
  "Focus Water": "#3b82f6",
  "Red Bull": "#ef4444",
  Monster: "#22c55e",
  "San Pellegrino": "#0ea5e9",
  Evian: "#c7d2fe",
  Dymatize: "#a855f7",
  Grenade: "#f43f5e",
  Nutrend: "#fb923c",
  Powerfood: "#e879f9",
  "Oat King": "#d6a35c",
};

const FALLBACK_FARBEN = ["#38bdf8", "#a3e635", "#fda4af", "#fcd34d", "#c4b5fd", "#5eead4"];

export function markenFarbe(marke: string): string {
  if (MARKEN_FARBEN[marke]) return MARKEN_FARBEN[marke];
  let h = 0;
  for (const c of marke) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return FALLBACK_FARBEN[h % FALLBACK_FARBEN.length];
}

export const REIHEN = ["A", "B", "C", "D", "E"] as const;
export const FAECHER = [1, 2, 3, 4, 5, 6, 7, 8] as const;
