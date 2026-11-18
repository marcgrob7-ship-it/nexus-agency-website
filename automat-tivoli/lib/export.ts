import { bestellen, chf, nachMarke, zusammenfassung } from "./calc";
import type { Zaehlung } from "./types";

function dateiname(z: Zaehlung, endung: string) {
  const d = new Date(z.datum);
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return `Bestellung-Automat-Tivoli-${iso}.${endung}`;
}

function herunterladen(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function zeilen(z: Zaehlung) {
  const out: { marke: string; sorte: string; fach: string; menge: number; preis: number; total: number; bestellt: boolean }[] = [];
  for (const m of nachMarke(z.positionen)) {
    for (const p of m.positionen) {
      const b = bestellen(p);
      if (b <= 0) continue;
      out.push({
        marke: p.marke,
        sorte: p.sorte,
        fach: p.fach.length > 1 ? `${p.fach[0]}–${p.fach[p.fach.length - 1]}` : p.fach[0] ?? "",
        menge: b,
        preis: p.preis,
        total: Math.round(b * p.preis * 100) / 100,
        bestellt: z.bestellt.includes(p.artikelId),
      });
    }
  }
  return out;
}

export async function exportPdf(z: Zaehlung) {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const s = zusammenfassung(z.positionen);
  const datum = new Date(z.datum).toLocaleDateString("de-CH", { day: "2-digit", month: "long", year: "numeric" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Bestellung Automat Tivoli", 14, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(`Zählung vom ${datum}`, 14, 25);
  doc.text(`Total ${s.totalStueck} Stück · ${s.positionen} Positionen · Warenwert ${chf(s.betrag)}`, 14, 30);
  doc.setTextColor(0);

  const rs = zeilen(z);
  const bestelltListe = rs.map((r) => r.bestellt);
  autoTable(doc, {
    startY: 36,
    head: [["Marke", "Sorte", "Fach", "Menge", "Preis", "Total", "Bestellt"]],
    body: rs.map((r) => [r.marke, r.sorte, r.fach, String(r.menge), r.preis.toFixed(2), r.total.toFixed(2), ""]),
    foot: [["", "Total", "", String(s.totalStueck), "", s.betrag.toFixed(2), ""]],
    styles: { fontSize: 9, cellPadding: 1.8 },
    headStyles: { fillColor: [24, 24, 27] },
    footStyles: { fillColor: [244, 244, 245], textColor: 0, fontStyle: "bold" },
    columnStyles: { 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "center" } },
    margin: { left: 14, right: 14 },
    didDrawCell: (data) => {
      // Ankreuzkästchen zum Abhaken auf Papier; bereits bestellte Positionen mit Häkchen
      if (data.section !== "body" || data.column.index !== 6) return;
      const g = 3.2;
      const x = data.cell.x + data.cell.width / 2 - g / 2;
      const y = data.cell.y + data.cell.height / 2 - g / 2;
      doc.setDrawColor(80);
      doc.setLineWidth(0.25);
      doc.rect(x, y, g, g);
      if (bestelltListe[data.row.index]) {
        doc.setLineWidth(0.5);
        doc.line(x + 0.6, y + g * 0.55, x + g * 0.42, y + g - 0.6);
        doc.line(x + g * 0.42, y + g - 0.6, x + g - 0.5, y + 0.5);
      }
    },
    didDrawPage: () => {
      doc.setFontSize(8);
      doc.setTextColor(140);
      doc.text("Preise in CHF · Bestellen = MAX(0, SOLL - Lager - Automat)", 14, 290);
      doc.setTextColor(0);
    },
  });
  herunterladen(doc.output("blob"), dateiname(z, "pdf"));
}

export async function exportExcel(z: Zaehlung) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Automat Tivoli";
  const ws = wb.addWorksheet("Bestellung");
  ws.columns = [
    { header: "Marke", key: "marke", width: 18 },
    { header: "Sorte", key: "sorte", width: 26 },
    { header: "Fach", key: "fach", width: 9 },
    { header: "Menge", key: "menge", width: 9 },
    { header: "Preis CHF", key: "preis", width: 11 },
    { header: "Total CHF", key: "total", width: 11 },
    { header: "Bestellt", key: "bestellt", width: 10 },
  ];
  ws.getRow(1).font = { bold: true };
  const rs = zeilen(z);
  rs.forEach((r) => ws.addRow({ ...r, bestellt: r.bestellt ? "ja" : "" }));
  const letzte = rs.length + 1;
  const sum = ws.addRow({ marke: "Total", menge: { formula: `SUM(D2:D${letzte})` }, total: { formula: `SUM(F2:F${letzte})` } });
  sum.font = { bold: true };
  ws.getColumn("preis").numFmt = "0.00";
  ws.getColumn("total").numFmt = "0.00";

  const voll = wb.addWorksheet("Zählung");
  voll.columns = [
    { header: "Marke", key: "marke", width: 18 },
    { header: "Sorte", key: "sorte", width: 26 },
    { header: "SOLL", key: "soll", width: 8 },
    { header: "Lager", key: "lager", width: 8 },
    { header: "Automat", key: "automat", width: 9 },
    { header: "Bestellen", key: "bestellen", width: 10 },
  ];
  voll.getRow(1).font = { bold: true };
  z.positionen.forEach((p, i) => {
    const r = i + 2;
    voll.addRow({ marke: p.marke, sorte: p.sorte, soll: p.soll, lager: p.lager, automat: p.automat, bestellen: { formula: `MAX(0,C${r}-D${r}-E${r})`, result: bestellen(p) } });
  });

  const buf = await wb.xlsx.writeBuffer();
  herunterladen(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), dateiname(z, "xlsx"));
}
