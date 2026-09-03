// Generates the PWA/Android launcher icons from one inline SVG so the whole
// icon set stays in sync with the app's palette.
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";

const INK = "#060d16";
const ACCENT = "#7dd3fc";
const DIM = "#38bdf8";

// A globe with a radar sweep — the app's two ideas in one mark.
const art = (pad) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="sky" cx="35%" cy="28%">
      <stop offset="0%" stop-color="#123a5c"/>
      <stop offset="100%" stop-color="${INK}"/>
    </radialGradient>
    <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="${ACCENT}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="${INK}"/>
  <g transform="translate(256 256) scale(${1 - pad}) translate(-256 -256)">
    <circle cx="256" cy="256" r="168" fill="url(#sky)" stroke="${DIM}" stroke-width="10"/>
    <path d="M256 88 A168 168 0 0 1 256 424" fill="none" stroke="${DIM}" stroke-width="7" opacity="0.55"/>
    <ellipse cx="256" cy="256" rx="168" ry="66" fill="none" stroke="${DIM}" stroke-width="7" opacity="0.55"/>
    <ellipse cx="256" cy="256" rx="88" ry="168" fill="none" stroke="${DIM}" stroke-width="7" opacity="0.45"/>
    <path d="M256 256 L256 88 A168 168 0 0 1 400 172 Z" fill="url(#sweep)"/>
    <circle cx="256" cy="256" r="20" fill="${ACCENT}"/>
    <circle cx="256" cy="256" r="40" fill="none" stroke="${ACCENT}" stroke-width="6" opacity="0.6"/>
  </g>
</svg>`;

await mkdir("public/icons", { recursive: true });

const jobs = [
  { file: "public/icons/icon-192.png", size: 192, pad: 0 },
  { file: "public/icons/icon-512.png", size: 512, pad: 0 },
  // Android masks launcher icons to a circle/squircle, so the maskable variant
  // keeps its art inside the safe zone.
  { file: "public/icons/maskable-512.png", size: 512, pad: 0.22 },
  { file: "public/apple-touch-icon.png", size: 180, pad: 0.08 },
];

for (const { file, size, pad } of jobs) {
  await sharp(Buffer.from(art(pad))).resize(size, size).png().toFile(file);
  console.log("wrote", file);
}

await writeFile("public/icons/icon.svg", art(0).trim());
console.log("wrote public/icons/icon.svg");
