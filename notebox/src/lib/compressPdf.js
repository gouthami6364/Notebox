import { PDFDocument } from "pdf-lib";

export async function compressPdf(file, onProgress) {
  const pdfjs = await import("pdfjs-dist");
  const worker = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = worker;

  const data = new Uint8Array(await file.arrayBuffer());
 const src = await pdfjs.getDocument({
  data,
  isEvalSupported: false,
  enableScripting: false,
}).promise;
  const out = await PDFDocument.create();

  for (let i = 1; i <= src.numPages; i++) {
    const page = await src.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const scale = 1600 / Math.max(base.width, base.height);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob = await new Promise((res) =>
      canvas.toBlob(res, "image/jpeg", 0.65)
    );
    const img = await out.embedJpg(await blob.arrayBuffer());
    const p = out.addPage([canvas.width, canvas.height]);
    p.drawImage(img, { x: 0, y: 0, width: canvas.width, height: canvas.height });

    page.cleanup();
    canvas.width = 0;
    canvas.height = 0;
    onProgress?.(i, src.numPages);
  }

  await src.destroy();
  const bytes = await out.save();
  return new Blob([bytes], { type: "application/pdf" });
}