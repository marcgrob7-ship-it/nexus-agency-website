/** Verkleinert ein Foto im Browser auf max. `maxKante` px (längste Seite) und gibt JPEG-Base64 zurück. */
export async function verkleinereBild(
  datei: File,
  maxKante = 1600,
  qualitaet = 0.82,
): Promise<{ data: string; mediaType: "image/jpeg"; vorschau: string; breite: number; hoehe: number }> {
  const bitmap = await ladeBild(datei);
  const faktor = Math.min(1, maxKante / Math.max(bitmap.width, bitmap.height));
  const breite = Math.round(bitmap.width * faktor);
  const hoehe = Math.round(bitmap.height * faktor);
  const canvas = document.createElement("canvas");
  canvas.width = breite;
  canvas.height = hoehe;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas nicht verfügbar");
  ctx.drawImage(bitmap, 0, 0, breite, hoehe);
  if ("close" in bitmap) (bitmap as ImageBitmap).close();
  const dataUrl = canvas.toDataURL("image/jpeg", qualitaet);
  return { data: dataUrl.split(",")[1], mediaType: "image/jpeg", vorschau: dataUrl, breite, hoehe };
}

async function ladeBild(datei: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      // berücksichtigt die EXIF-Ausrichtung (iPhone-Fotos)
      return await createImageBitmap(datei, { imageOrientation: "from-image" });
    } catch {
      /* Fallback unten (z. B. HEIC in älteren Browsern) */
    }
  }
  const url = URL.createObjectURL(datei);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}
