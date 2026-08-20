import sharp from "sharp";
import path from "path";

const N = 64;
const B4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [13, 7, 15, 5],
];
const BAYER = [];
for (let y = 0; y < 8; y++) {
  BAYER[y] = [];
  for (let x = 0; x < 8; x++) {
    const q = B4[y % 4][x % 4];
    const extra = ((x >> 2) + (y >> 2) * 2) * 0.25;
    BAYER[y][x] = (q + extra + 0.5) / 16;
  }
}

const SPECKLE = [
  [255, 225, 74, 90],
  [255, 61, 206, 70],
  [61, 240, 255, 70],
  [106, 58, 154, 50],
  [248, 241, 255, 40],
];

const buf = Buffer.alloc(N * N * 4);
for (let y = 0; y < N; y++) {
  for (let x = 0; x < N; x++) {
    const t = BAYER[y & 7][x & 7];
    const i = (y * N + x) * 4;
    if (t > 0.62) {
      const c = SPECKLE[(x + y * 3) % SPECKLE.length];
      buf[i] = c[0];
      buf[i + 1] = c[1];
      buf[i + 2] = c[2];
      buf[i + 3] = c[3];
    }
  }
}

const dest = path.join("/home/jcb/src/outrank/public/dither-tile.png");
await sharp(buf, { raw: { width: N, height: N, channels: 4 } })
  .png()
  .toFile(dest);
console.log("wrote", dest);
