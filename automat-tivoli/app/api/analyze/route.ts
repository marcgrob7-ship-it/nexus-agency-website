import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { ERKENNUNGS_HINWEISE } from "@/lib/artikel";
import type { AnalyseErgebnis, Ort, UnbekanntesProdukt } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const MODELL = "claude-sonnet-5-5";

interface Anfrage {
  fotos: { data: string; mediaType: "image/jpeg" | "image/png" | "image/webp"; ort: Ort }[];
  artikel: { id: string; marke: string; sorte: string; fach: string[] }[];
}

const SCHEMA = {
  type: "object",
  properties: {
    zaehlung: {
      type: "array",
      description: "Eine Zeile pro erkanntem Artikel aus dem Artikelstamm und Ort.",
      items: {
        type: "object",
        properties: {
          ort: { type: "string", enum: ["automat", "lager"] },
          marke: { type: "string" },
          sorte: { type: "string" },
          anzahl: { type: "integer" },
          sicher: { type: "boolean" },
        },
        required: ["ort", "marke", "sorte", "anzahl", "sicher"],
        additionalProperties: false,
      },
    },
    unbekannt: {
      type: "array",
      description: "Produkte, die nicht im Artikelstamm stehen.",
      items: {
        type: "object",
        properties: {
          ort: { type: "string", enum: ["automat", "lager"] },
          beschreibung: { type: "string" },
          anzahl: { type: "integer" },
        },
        required: ["ort", "beschreibung", "anzahl"],
        additionalProperties: false,
      },
    },
    hinweis: {
      type: "string",
      description: "Kurzer Hinweis auf Deutsch, z. B. welche Fächer schlecht lesbar waren. Leer, wenn nichts auffällt.",
    },
  },
  required: ["zaehlung", "unbekannt", "hinweis"],
  additionalProperties: false,
} as const;

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { fehler: "ANTHROPIC_API_KEY fehlt. Bitte in .env (lokal) bzw. in den Vercel-Umgebungsvariablen setzen." },
      { status: 500 },
    );
  }

  let body: Anfrage;
  try {
    body = (await req.json()) as Anfrage;
  } catch {
    return NextResponse.json({ fehler: "Ungültige Anfrage." }, { status: 400 });
  }
  if (!Array.isArray(body.fotos) || body.fotos.length === 0) {
    return NextResponse.json({ fehler: "Keine Fotos erhalten." }, { status: 400 });
  }
  if (body.fotos.length > 10) {
    return NextResponse.json({ fehler: "Maximal 10 Fotos pro Auswertung." }, { status: 400 });
  }

  const stamm = body.artikel
    .map((a) => `- ${a.marke} | ${a.sorte} | Fach ${a.fach.join(", ") || "–"}`)
    .join("\n");

  const system = `Du zählst Bestände für den Getränke- und Riegelautomaten «Automat Tivoli» in einem Fitnessstudio.

Artikelstamm (Marke | Sorte | übliches Fach):
${stamm}

Erkennungshilfen:
${ERKENNUNGS_HINWEISE}

Regeln:
- Erkenne Produkte am Etikett bzw. an der Verpackung, nicht nur am Fach – die tatsächliche Belegung weicht oft vom Plan ab.
- Zähle pro Sorte und pro Ort. Fotos mit Ort «automat» zählen zum Automaten, Fotos mit Ort «lager» zum Lager. Mehrere Fotos desselben Orts können sich überschneiden: dieselbe Flasche nicht doppelt zählen.
- In Spiralen stehen Flaschen/Riegel hintereinander. Zähle die sichtbaren und schätze die verdeckten (z. B. anhand der Spiralwindungen). Geschätzte oder schlecht lesbare Werte bekommen sicher=false.
- Gib «marke» und «sorte» exakt so zurück, wie sie im Artikelstamm stehen.
- Artikel, die du auf den Fotos nicht siehst, kannst du weglassen (gelten als 0).
- Produkte, die nicht im Artikelstamm stehen, nicht zuordnen, sondern unter «unbekannt» aufführen.`;

  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  body.fotos.forEach((f, i) => {
    content.push({ type: "text", text: `Foto ${i + 1} – Ort: ${f.ort === "automat" ? "automat (Automat)" : "lager (Lagerregal)"}` });
    content.push({ type: "image", source: { type: "base64", media_type: f.mediaType, data: f.data } });
  });
  content.push({ type: "text", text: "Zähle jetzt alle Artikel auf diesen Fotos und antworte im vorgegebenen JSON-Format." });

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.create({
      model: MODELL,
      max_tokens: 16000,
      // Falls das Modell eine Anfrage fälschlich ablehnt, übernimmt serverseitig ein Ersatzmodell.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system,
      output_config: { format: { type: "json_schema", schema: SCHEMA as unknown as Record<string, unknown> } },
      messages: [{ role: "user", content }],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({ fehler: "Die KI konnte diese Fotos nicht auswerten. Bitte erneut versuchen oder manuell zählen." }, { status: 422 });
    }
    if (response.stop_reason === "max_tokens") {
      return NextResponse.json({ fehler: "Antwort zu lang – bitte weniger Fotos auf einmal auswerten." }, { status: 422 });
    }

    const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    const roh = JSON.parse(text) as {
      zaehlung: { ort: Ort; marke: string; sorte: string; anzahl: number; sicher: boolean }[];
      unbekannt: UnbekanntesProdukt[];
      hinweis: string;
    };

    // KI-Namen den Artikel-IDs zuordnen; Duplikate pro Ort aufsummieren
    const index = new Map(body.artikel.map((a) => [norm(a.marke) + "|" + norm(a.sorte), a.id]));
    const sammel = new Map<string, { artikelId: string; ort: Ort; anzahl: number; sicher: boolean }>();
    const unbekannt: UnbekanntesProdukt[] = [...(roh.unbekannt ?? [])];
    for (const z of roh.zaehlung ?? []) {
      const id = index.get(norm(z.marke) + "|" + norm(z.sorte));
      const anzahl = Math.max(0, Math.round(Number(z.anzahl) || 0));
      if (!id) {
        unbekannt.push({ ort: z.ort, beschreibung: `${z.marke} ${z.sorte}`.trim(), anzahl });
        continue;
      }
      const key = `${id}|${z.ort}`;
      const alt = sammel.get(key);
      if (alt) {
        alt.anzahl += anzahl;
        alt.sicher = alt.sicher && z.sicher;
      } else {
        sammel.set(key, { artikelId: id, ort: z.ort, anzahl, sicher: !!z.sicher });
      }
    }

    const ergebnis: AnalyseErgebnis = { positionen: [...sammel.values()], unbekannt, hinweis: roh.hinweis ?? "" };
    return NextResponse.json(ergebnis);
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ fehler: "API-Key ungültig." }, { status: 401 });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ fehler: "Zu viele Anfragen – bitte kurz warten und erneut versuchen." }, { status: 429 });
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ fehler: `Claude-API-Fehler (${err.status}): ${err.message}` }, { status: 502 });
    }
    if (err instanceof SyntaxError) {
      return NextResponse.json({ fehler: "Antwort der KI war kein gültiges JSON. Bitte erneut versuchen." }, { status: 502 });
    }
    console.error(err);
    return NextResponse.json({ fehler: "Unbekannter Fehler bei der Auswertung." }, { status: 500 });
  }
}
