import sharp from "sharp";

const src = "Minimal Navy Notebook Graduation Cap Icon.png";

// Cut out just the notebook and cap, without the tile margin or shadow
const glyph = await sharp(src)
  .extract({ left: 317, top: 296, width: 620, height: 620 })
  .toBuffer();

async function make(size, fraction, out) {
  const n = Math.round(size * fraction);
  const inner = await sharp(glyph).resize(n, n).toBuffer();
  const offset = Math.round((size - n) / 2);
  await sharp({
    create: { width: size, height: size, channels: 3, background: "#ffffff" },
  })
    .composite([{ input: inner, top: offset, left: offset }])
    .png()
    .toFile(out);
  console.log("made", out);
}

await make(192, 0.84, "public/icon-192.png");
await make(512, 0.84, "public/icon-512.png");
await make(512, 0.62, "public/icon-maskable-512.png");
await make(180, 0.8, "public/apple-touch-icon.png");
await make(64, 0.92, "public/favicon-64.png");