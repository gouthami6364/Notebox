import { PDFDocument } from "pdf-lib";

async function shrink(file, maxSide = 1600, quality = 0.7) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);

  const blob = await new Promise((res) =>
    canvas.toBlob(res, "image/jpeg", quality)
  );
  return { bytes: await blob.arrayBuffer(), w, h };
}

export async function makePdf(files) {
  const pdf = await PDFDocument.create();
  for (const file of files) {
    const { bytes, w, h } = await shrink(file);
    const img = await pdf.embedJpg(bytes);
    const page = pdf.addPage([w, h]);
    page.drawImage(img, { x: 0, y: 0, width: w, height: h });
  }
  const out = await pdf.save();
  return new Blob([out], { type: "application/pdf" });
}