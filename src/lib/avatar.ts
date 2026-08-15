/**
 * Thumbnail physics for an X avatar. ProfileClickWeight is published at 0.
 * This does not score Phoenix. It scores whether a 40px circle still reads
 * as a person/object in a reply pile.
 */

export type AvatarMetric = {
  id: string;
  label: string;
  value: number;
  note: string;
};

export type AvatarPlay = {
  id: string;
  title: string;
  why: string;
};

export type AvatarResult = {
  reach: number;
  grade: "F" | "D" | "C" | "B" | "A" | "S";
  headline: string;
  metrics: AvatarMetric[];
  plays: AvatarPlay[];
  disclaimer: string;
};

function luma(r: number, g: number, b: number) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function sat(r: number, g: number, b: number) {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  if (max === min) return 0;
  const d = max - min;
  return l > 0.5 ? d / (2 - max - min) : d / (max + min);
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function stats(values: number[]) {
  if (!values.length) return { mean: 0, std: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const v = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return { mean, std: Math.sqrt(v) };
}

function downsample(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  tw: number,
  th: number,
): { l: number[]; s: number[] } {
  const l: number[] = [];
  const s: number[] = [];
  for (let y = 0; y < th; y++) {
    for (let x = 0; x < tw; x++) {
      const x0 = Math.floor((x * w) / tw);
      const x1 = Math.floor(((x + 1) * w) / tw);
      const y0 = Math.floor((y * h) / th);
      const y1 = Math.floor(((y + 1) * h) / th);
      let r = 0,
        g = 0,
        b = 0,
        n = 0;
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          const i = (yy * w + xx) * 4;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          n++;
        }
      }
      if (!n) continue;
      r /= n;
      g /= n;
      b /= n;
      l.push(luma(r, g, b));
      s.push(sat(r, g, b));
    }
  }
  return { l, s };
}

export function analyzeAvatar(image: {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}): AvatarResult {
  const { data, width: w, height: h } = image;
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const r = Math.min(w, h) / 2;
  const r2 = r * r * 0.92 * 0.92;

  const insideL: number[] = [];
  const insideS: number[] = [];
  const innerL: number[] = [];
  let inN = 0;
  let outN = 0;
  let inEdge = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const L = luma(data[i], data[i + 1], data[i + 2]);
      const S = sat(data[i], data[i + 1], data[i + 2]);
      const dx = x - cx;
      const dy = y - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 <= r2) {
        insideL.push(L);
        insideS.push(S);
        inN++;
        if (d2 <= r2 * 0.35) innerL.push(L);
        if (x + 1 < w) {
          const j = (y * w + x + 1) * 4;
          inEdge += Math.abs(L - luma(data[j], data[j + 1], data[j + 2]));
        }
      } else {
        outN++;
      }
    }
  }

  const circle = stats(insideL);
  const core = stats(innerL);
  const chroma = stats(insideS).mean;
  const thumb = downsample(data, w, h, 40, 40);
  const micro = downsample(data, w, h, 24, 24);
  const thumbC = stats(thumb.l);
  const microC = stats(micro.l);
  const edge = inN ? inEdge / inN : 0;

  const punch = clamp01((circle.std - 0.06) / 0.22);
  const read40 = clamp01((thumbC.std - 0.04) / 0.18);
  const read24 = clamp01((microC.std - 0.03) / 0.16);
  const center = clamp01(core.std / Math.max(0.04, circle.std + 0.02));
  const crop =
    inN + outN === 0 ? 0 : clamp01(0.35 + (inN / (inN + outN) - 0.55) * 2);
  const mid = circle.mean;
  const dual = clamp01(1 - Math.abs(mid - 0.48) * 2.1) * 0.55 + punch * 0.45;
  const color = clamp01((chroma - 0.08) / 0.45);
  const mud = clamp01(1 - Math.max(0, edge * 3 - thumbC.std * 8));

  const reach = Math.round(
    clamp01(
      read40 * 0.32 +
        read24 * 0.14 +
        punch * 0.18 +
        center * 0.12 +
        dual * 0.12 +
        color * 0.07 +
        crop * 0.05 +
        mud * 0.0,
    ) * 100,
  );

  const grade: AvatarResult["grade"] =
    reach >= 88 ? "S" : reach >= 75 ? "A" : reach >= 60 ? "B" : reach >= 45 ? "C" : reach >= 30 ? "D" : "F";

  const metrics: AvatarMetric[] = [
    {
      id: "read40",
      label: "Reads at 40px",
      value: read40,
      note: "The size of the chip next to a reply.",
    },
    {
      id: "read24",
      label: "Reads at 24px",
      value: read24,
      note: "Stacked replies. If this dies, you are a gray dot.",
    },
    {
      id: "punch",
      label: "Contrast in the circle",
      value: punch,
      note: "X crops a circle. Corners are gone.",
    },
    {
      id: "center",
      label: "Subject in the hole",
      value: center,
      note: "Face or object has to sit in the middle third.",
    },
    {
      id: "dual",
      label: "Dark + light feed",
      value: dual,
      note: "X is mostly dark. Pure black still vanishes. Pure white flares.",
    },
    {
      id: "color",
      label: "Chroma",
      value: color,
      note: "One loud color beats a muddy photograph.",
    },
  ];

  const plays: AvatarPlay[] = [];
  if (read40 < 0.45 || read24 < 0.4) {
    plays.push({
      id: "tiny",
      title: "It dies at reply size",
      why: "Downsample this to 40px. If you cannot tell what it is, neither can a scroller. One object, hard edge, crop tighter.",
    });
  }
  if (punch < 0.4) {
    plays.push({
      id: "flat",
      title: "The circle is mud",
      why: "Raise contrast. A mid-gray face on a mid-gray wall is invisible next to 12 other mid-gray faces.",
    });
  }
  if (center < 0.45) {
    plays.push({
      id: "crop",
      title: "The subject is not in the crop",
      why: "X uses a circle. Group shots, landscapes, and full-body photos lose the person. Put the face in the middle third.",
    });
  }
  if (mid < 0.22) {
    plays.push({
      id: "dark",
      title: "This is a hole in dark mode",
      why: "Most For You viewing is a black feed. A black hoodie on black is a missing avatar. Add a rim light or a bright ring.",
    });
  }
  if (mid > 0.82) {
    plays.push({
      id: "blown",
      title: "This flares on light mode",
      why: "A white void next to a white compose box is the same problem as the black hole. A darker ring around the subject fixes both.",
    });
  }
  if (color < 0.28 && punch < 0.55) {
    plays.push({
      id: "gray",
      title: "Pick one loud color",
      why: "Recognition is a silhouette plus a hue. Beige-on-beige is a default egg with more steps.",
    });
  }
  if (edge > 0.12 && thumbC.std < 0.1) {
    plays.push({
      id: "busy",
      title: "Busy at full size, nothing at chip size",
      why: "Fine detail is noise at 40px. The pattern that survives downsample is a big shape, not a collage.",
    });
  }
  if (plays.length === 0) {
    plays.push({
      id: "good",
      title: "This still reads as you in a reply pile",
      why: "Protect it. Don't put tiny text in it. Don't swap it every week — recognition is a memory, not a ranking head.",
    });
  }

  const worst = [...metrics].sort((a, b) => a.value - b.value)[0];
  const headline =
    grade === "S" || grade === "A"
      ? "The chip still looks like you at reply size."
      : `Weakest: ${worst.label.toLowerCase()}. ${worst.note}`;

  return {
    reach,
    grade,
    headline,
    metrics,
    plays,
    disclaimer:
      "ProfileClickWeight is published at 0. This is not a Phoenix score. It is whether a 40px circle survives the feed chrome so people recognize you in the reply pile — which is where ReplyWeight (5) and the mutual boost actually live.",
  };
}

export function gradeColor(g: string) {
  if (g === "S" || g === "A") return "var(--good)";
  if (g === "B") return "var(--gold)";
  if (g === "C") return "var(--warn)";
  return "var(--bad)";
}
