/**
 * Seamless 96×96 starfield tile. Stars wrap at the edges so a repeat has no seam.
 */
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import path from "node:path";

const W = 96;
const H = 96;
const BG = [7, 0, 22];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

function pngRGB(w, h, rgb) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rgb = Buffer.alloc(W * H * 3);
for (let i = 0; i < W * H; i++) {
  rgb[i * 3] = BG[0];
  rgb[i * 3 + 1] = BG[1];
  rgb[i * 3 + 2] = BG[2];
}

function plot(x, y, color, a) {
  const xx = ((x % W) + W) % W;
  const yy = ((y % H) + H) % H;
  const i = (yy * W + xx) * 3;
  rgb[i] = Math.round(rgb[i] * (1 - a) + color[0] * a);
  rgb[i + 1] = Math.round(rgb[i + 1] * (1 - a) + color[1] * a);
  rgb[i + 2] = Math.round(rgb[i + 2] * (1 - a) + color[2] * a);
}

const rnd = mulberry(1998);
const palette = [
  [255, 255, 255],
  [61, 240, 255],
  [255, 61, 206],
  [255, 225, 74],
];

for (let n = 0; n < 70; n++) {
  const x = Math.floor(rnd() * W);
  const y = Math.floor(rnd() * H);
  const c = palette[Math.floor(rnd() * palette.length)];
  const bright = 0.35 + rnd() * 0.65;
  plot(x, y, c, bright);
  if (rnd() < 0.18) {
    plot(x + 1, y, c, bright * 0.4);
    plot(x - 1, y, c, bright * 0.4);
    plot(x, y + 1, c, bright * 0.4);
    plot(x, y - 1, c, bright * 0.4);
  }
}

const out = path.join(import.meta.dirname, "..", "public", "stars-tile.png");
writeFileSync(out, pngRGB(W, H, rgb));

const tw = W * 2;
const th = H * 2;
const tile2 = Buffer.alloc(tw * th * 3);
for (let y = 0; y < th; y++) {
  for (let x = 0; x < tw; x++) {
    const sx = x % W;
    const sy = y % H;
    const si = (sy * W + sx) * 3;
    const di = (y * tw + x) * 3;
    tile2[di] = rgb[si];
    tile2[di + 1] = rgb[si + 1];
    tile2[di + 2] = rgb[si + 2];
  }
}
writeFileSync(
  path.join(import.meta.dirname, "..", "public", "stars-tile-2x2.png"),
  pngRGB(tw, th, tile2),
);
console.log("wrote", out);
