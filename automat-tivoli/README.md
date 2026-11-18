# Automat Tivoli

Mobile Web-App (PWA) zum Nachbestellen des Getränke- und Riegelautomaten im Fitnessstudio.
Du fotografierst den Automaten und/oder das Lagerregal, Claude (Modell `claude-sonnet-5-5`, Vision) zählt die Produkte,
du prüfst die Zahlen und die App erstellt die Bestellliste.

**Bestellen = MAX(0, SOLL − Lager − Automat)**. Ohne Lagerfoto gilt Lager = 0.

## Funktionen
- **Zählen:** Fotos aufnehmen oder aus der Galerie wählen, pro Foto «Automat» oder «Lager» wählen. Die Fotos werden im Browser auf max. 1600 px verkleinert und nicht gespeichert.
- **Prüfansicht:** jede Zahl mit +/− korrigieren. Unsichere Werte sind orange markiert (Zahl antippen = bestätigt). Unbekannte Produkte werden separat aufgelistet. Alternativ manuell ohne Foto zählen.
- **Dashboard:** Total Stück, Positionen, Warenwert in CHF, Balken und Ampel pro Marke.
- **Automatenplan:** Raster A–E × 1–8, jedes Fach eingefärbt nach Füllstand. Fach antippen zeigt Details.
- **Bestellliste:** nur Artikel mit Bestellen > 0, gruppiert nach Marke, abhaken als «bestellt». Export als PDF (A4) und Excel, «Liste kopieren» für WhatsApp/E-Mail, Teilen-Button.
- **Verlauf:** jede gespeicherte Zählung mit Datum.
- **Einstellungen:** Artikel, SOLL, Preise und Fächer bearbeiten, Artikel hinzufügen/entfernen, Daten sichern/laden.

Die Daten (Artikelstamm, Zählungen) liegen **lokal im Browser des Geräts** (localStorage). Eine Datenbank ist dafür nicht nötig,
und die App läuft so auch auf Vercel ohne weitere Einrichtung. Am besten immer dasselbe Handy benutzen und gelegentlich
unter *Einstellungen → Daten exportieren* eine Sicherung machen.

## Installation
Voraussetzung: Node.js 20 oder neuer.

```bash
cd automat-tivoli
npm install
cp .env.example .env    # dann ANTHROPIC_API_KEY=... eintragen
```

Der API-Key wird nur auf dem Server verwendet (`app/api/analyze/route.ts`) und gelangt nie ins Frontend.

## Starten
```bash
npm run dev             # Entwicklung, http://localhost:3000
```
oder als Produktionsversion:
```bash
npm run build
npm start
```

Kontrolle der Berechnung (ohne Foto, Lager = 0, Automat = 0 → 772 Stück in 43 Positionen):
```bash
npm run test:total
```

## Vom Handy im gleichen WLAN öffnen
1. Die App auf dem Computer starten (`npm run dev` oder `npm start`; beide lauschen auf allen Netzwerk-Adressen).
2. Die IP-Adresse des Computers herausfinden:
   - macOS: `ipconfig getifaddr en0`
   - Windows: `ipconfig` → «IPv4-Adresse»
3. Auf dem iPhone in Safari `http://<IP-Adresse>:3000` öffnen, z. B. `http://192.168.1.23:3000`.
4. Teilen-Symbol → **«Zum Home-Bildschirm»**.

Hinweis: Im WLAN läuft die App über `http`. Kamera und Upload funktionieren, die Offline-Funktion (Service Worker) aber erst über `https`, also bei Vercel.

## Online stellen bei Vercel
1. Das Repository auf GitHub pushen (ist schon passiert, wenn du diese README auf GitHub siehst).
2. Auf [vercel.com](https://vercel.com) → **Add New… → Project** → Repository importieren.
3. **Root Directory** auf `automat-tivoli` setzen (Framework «Next.js» wird erkannt).
4. Unter **Environment Variables** `ANTHROPIC_API_KEY` mit deinem Key eintragen.
5. **Deploy**. Danach die `https://…vercel.app`-Adresse auf dem iPhone öffnen und zum Home-Bildschirm hinzufügen.

Tipps:
- Vercel nimmt pro Anfrage höchstens ca. 4.5 MB an. Das reicht für etwa 6–8 verkleinerte Fotos pro Auswertung.
- Die Auswertung kann bis etwa eine Minute dauern (`maxDuration = 120` s in der API-Route).
- Wer die URL kennt, kann die Auswertung nutzen und damit API-Kosten verursachen. Bei Bedarf in Vercel unter *Settings → Deployment Protection* einen Passwortschutz aktivieren.

## Technik
- Next.js 15 (App Router) + TypeScript + Tailwind CSS 4
- `@anthropic-ai/sdk`: Vision mit Structured Output (JSON-Schema). Bei einer fälschlichen Ablehnung durch das Modell springt serverseitig ein Ersatzmodell ein (`fallbacks: "default"`).
- PDF: `jspdf` + `jspdf-autotable`, Excel: `exceljs` (beide im Browser)
- PWA: `app/manifest.ts`, Icons in `public/`, `public/sw.js`

| Datei | Inhalt |
|---|---|
| `lib/artikel.ts` | Artikelstamm (Standard), Markenfarben, Erkennungshinweise |
| `lib/calc.ts` | Berechnung Bestellen, Ampel, Füllstand, Text für WhatsApp |
| `lib/store.tsx` | lokale Speicherung (localStorage) |
| `app/api/analyze/route.ts` | Fotoauswertung mit Claude |
| `app/zaehlen/page.tsx` | Fotos → Auswertung → Prüfansicht |

Screenshots (iPhone-14-Grösse) liegen in `screenshots/`.
