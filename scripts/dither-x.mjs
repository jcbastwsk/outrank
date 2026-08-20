/**
 * Crop/resize X kit and ordered-dither to the midnight palette.
 */
import sharp from "sharp";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const root = "/home/jcb/src/outrank";
const out = path.join(root, "public/brand");
const sess =
  "/home/jcb/.grok/sessions/%2Fhome%2Fjcb/01a00200-bb43-77e0-8e69-b283f9771646/images";

const PALETTE = [
  [7, 0, 22],
  [20, 0, 44],
  [26, 8, 56],
  [106, 58, 154],
  [255, 61, 206],
  [61, 240, 255],
  [255, 225, 74],
  [255, 176, 0],
  [248, 241, 255],
  [196, 179, 222],
  [184, 255, 61],
  [255, 77, 109],
  [180, 190, 210],
  [80, 90, 120],
  [40, 30, 70],
  [12, 8, 28],
];

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [13, 7, 15, 5],
].map((row) => row.map((v) => (v + 0.5) / 16 - 0.5));

function nearest(r, g, b) {
  let best = PALETTE[0];
  let bestD = 1e12;
  for (const p of PALETTE) {
    const d = (r - p[0]) ** 2 + (g - p[1]) ** 2 + (b - p[2]) ** 2;
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}

function dither(buf, w, h) {
  const outb = Buffer.alloc(buf.length);
  const amp = 48;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      const t = BAYER[y & 3][x & 3] * amp;
      const p = nearest(buf[i] + t, buf[i + 1] + t, buf[i + 2] + t);
      outb[i] = p[0];
      outb[i + 1] = p[1];
      outb[i + 2] = p[2];
    }
  }
  return outb;
}

async function toRaw(file, w, h, prepare = (s) => s.resize(w, h, { fit: "cover" })) {
  const { data } = await prepare(sharp(file))
    .resize(w, h, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return data;
}

async function writeRgb(file, buf, w, h) {
  await sharp(buf, { raw: { width: w, height: h, channels: 3 } })
    .jpeg({ quality: 92 })
    .toFile(file);
}

async function main() {
  await mkdir(out, { recursive: true });

  const avSrc = path.join(sess, "19.jpg");
  const bnSrc = path.join(sess, "20.jpg");

  const av = await toRaw(avSrc, 400, 400);
  await writeRgb(path.join(out, "x-avatar.jpg"), av, 400, 400);
  await writeRgb(path.join(out, "x-avatar-dither.jpg"), dither(av, 400, 400), 400, 400);

  const meta = await sharp(bnSrc).metadata();
  const tw = 1500;
  const th = 500;
  const sw = meta.width ?? 1600;
  const sh = meta.height ?? 900;
  const srcAspect = sw / sh;
  const dstAspect = tw / th;
  let extract;
  if (srcAspect > dstAspect) {
    const nw = Math.round(sh * dstAspect);
    extract = { left: Math.round((sw - nw) / 2), top: 0, width: nw, height: sh };
  } else {
    const nh = Math.round(sw / dstAspect);
    extract = { left: 0, top: Math.round((sh - nh) * 0.35), width: sw, height: nh };
  }

  const bn = await toRaw(bnSrc, tw, th, (s) => s.extract(extract));
  await writeRgb(path.join(out, "x-banner.jpg"), bn, tw, th);
  await writeRgb(path.join(out, "x-banner-dither.jpg"), dither(bn, tw, th), tw, th);

  // Circle preview of dithered avatar on dithered banner (how X actually looks).
  const circle = Buffer.alloc(400 * 400 * 4);
  const avD = dither(av, 400, 400);
  const cx = 199.5;
  const r = 198;
  for (let y = 0; y < 400; y++) {
    for (let x = 0; x < 400; x++) {
      const i = (y * 400 + x) * 4;
      const j = (y * 400 + x) * 3;
      const dx = x - cx;
      const dy = y - cx;
      if (dx * dx + dy * dy <= r * r) {
        circle[i] = avD[j];
        circle[i + 1] = avD[j + 1];
        circle[i + 2] = avD[j + 2];
        circle[i + 3] = 255;
      }
    }
  }
  await sharp(circle, { raw: { width: 400, height: 400, channels: 4 } })
    .png()
    .toFile(path.join(out, "x-avatar-circle.png"));

  console.log("wrote x-avatar, x-banner, dithered, circle preview");
}

main();
