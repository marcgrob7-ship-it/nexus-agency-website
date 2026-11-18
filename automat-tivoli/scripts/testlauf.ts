// Kontrolle: ohne Foto, Lager = 0 und Automat = 0 → Total 772 Stück in 43 Positionen
import { STANDARD_ARTIKEL } from "../lib/artikel";
import { leereZaehlung, zusammenfassung } from "../lib/calc";

const s = zusammenfassung(leereZaehlung(STANDARD_ARTIKEL).positionen);
console.log(`Artikel im Stamm: ${STANDARD_ARTIKEL.length}`);
console.log(`Total zu bestellen: ${s.totalStueck} Stück`);
console.log(`Positionen:         ${s.positionen}`);
console.log(`Warenwert:          CHF ${s.betrag.toFixed(2)}`);
const ok = s.totalStueck === 772 && s.positionen === 43;
console.log(ok ? "✅ Testlauf bestanden (772 / 43)" : "❌ Testlauf fehlgeschlagen");
process.exit(ok ? 0 : 1);
