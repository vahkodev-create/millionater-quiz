import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const svgPath = path.join(ROOT, "icon.svg");
const outDir = path.join(ROOT, "icons");

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function render(svgBuffer, outPath, size) {
  await sharp(svgBuffer, { density: 300 })
    .resize(size, size, { fit: "cover" })
    .png()
    .toFile(outPath);
}

async function renderMaskable(svgBuffer, outPath, size) {
  // Add padding so Android maskable icons don't clip the artwork.
  const padded = Math.round(size * 0.82);
  const inset = Math.floor((size - padded) / 2);

  const img = await sharp(svgBuffer, { density: 300 })
    .resize(padded, padded, { fit: "contain" })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 5, g: 8, b: 20, alpha: 1 },
    },
  })
    .composite([{ input: img, left: inset, top: inset }])
    .png()
    .toFile(outPath);
}

const svgBuffer = await fs.readFile(svgPath);
await ensureDir(outDir);

await render(svgBuffer, path.join(outDir, "icon-192.png"), 192);
await render(svgBuffer, path.join(outDir, "icon-512.png"), 512);
await renderMaskable(svgBuffer, path.join(outDir, "maskable-192.png"), 192);
await renderMaskable(svgBuffer, path.join(outDir, "maskable-512.png"), 512);

console.log("Generated icons in ./icons/");

