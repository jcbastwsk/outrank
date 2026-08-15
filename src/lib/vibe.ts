import {
  extractFeatures,
  FORMAT_META,
  type FormatId,
  type LaneId,
  type TribeId,
  classifyLane,
} from "./score";

export type FormatCadence = "sprinter" | "mixed" | "essayist";

export type VibeMix = {
  id: string;
  label: string;
  n: number;
};

export type VibeProfile = {
  updatedAt: string;
  samples: number;
  posture: LaneId;
  tribe: TribeId;
  aesthetic: string;
  confidence: number;
  mix: VibeMix[];
  formatMix: VibeMix[];
  cadence: FormatCadence;
  note: string;
};

const AESTHETIC: Record<string, string> = {
  milady: "Remilia / milady — cute-degens, in-group, private jokes",
  reel: "AI cinema/art — stills, generations, workflow-as-bait",
  operator: "Operator — lessons, announces, thoughts?",
  cursed: "Cursed — broken grammar as the joke",
  scene: "Scene — unfinished claims, fat-tail OC",
  portable: "Portable — screenshot / copy-link",
  thin: "Thin — no room, no hook",
  spam: "Broadcast",
  volatile: "Volatile",
  empty: "Unknown",
};

export function splitPosts(blob: string): string[] {
  return blob
    .split(/\n\s*[-—]{3,}\s*\n|\n{2,}/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2)
    .slice(0, 20);
}

export function inferVibe(texts: string[]): VibeProfile {
  const posts = texts.map((t) => t.trim()).filter((t) => t.length > 2);
  const counts = new Map<string, number>();
  const formatCounts = new Map<FormatId, number>();
  let tribeVotes = 0;
  let tribe: TribeId = "none";

  for (const t of posts) {
    const f = extractFeatures(t);
    const lane = classifyLane(f);
    const key = f.tribe !== "none" ? f.tribe : lane.id;
    counts.set(key, (counts.get(key) ?? 0) + 1);
    formatCounts.set(f.format, (formatCounts.get(f.format) ?? 0) + 1);
    if (f.tribe !== "none") {
      tribeVotes += 1;
      tribe = f.tribe;
    }
  }

  const mix = [...counts.entries()]
    .map(([id, n]) => ({
      id,
      n,
      label: id === "milady" ? "Milady" : AESTHETIC[id]?.split(" — ")[0] ?? id,
    }))
    .sort((a, b) => b.n - a.n);

  const top = mix[0];
  const samples = posts.length;
  const posture: LaneId =
    top?.id === "milady"
      ? "scene"
      : ((top?.id as LaneId) ?? "thin");
  const share = samples ? (top?.n ?? 0) / samples : 0;
  const confidence = Math.min(0.95, share * (samples >= 4 ? 1 : samples >= 2 ? 0.75 : 0.45));

  if (tribeVotes < 2 && tribe !== "none" && samples >= 3) {
    tribe = "none";
  }
  if (tribeVotes >= 2) tribe = "milady";

  const formatMix = [...formatCounts.entries()]
    .map(([id, n]) => ({
      id,
      n,
      label: FORMAT_META[id].label,
    }))
    .sort((a, b) => b.n - a.n);

  const sprintN =
    (formatCounts.get("micro") ?? 0) + (formatCounts.get("short") ?? 0);
  const essayN =
    (formatCounts.get("long") ?? 0) +
    (formatCounts.get("article") ?? 0) +
    (formatCounts.get("thread") ?? 0);
  const cadence: FormatCadence =
    samples === 0
      ? "mixed"
      : essayN > sprintN && essayN >= 2
        ? "essayist"
        : sprintN > essayN
          ? "sprinter"
          : "mixed";

  const aesthetic =
    tribe === "milady"
      ? AESTHETIC.milady
      : top
        ? AESTHETIC[top.id] ?? top.label
        : AESTHETIC.empty;

  const cadenceNote =
    cadence === "essayist"
      ? " You write long — click, dwell, copy-link. A thin short from you is a status update."
      : cadence === "sprinter"
        ? " You write shorts — one breath or it dies. An essay has to open like one of your tweets."
        : "";

  const note =
    samples === 0
      ? "Paste a few recent posts. One tweet is a mood, not a room."
      : tribe === "milady"
        ? "You post from inside a room. Cold For You will bounce. Don't explain Remilia. Don't costume a fundraise." +
          cadenceNote
        : posture === "operator"
          ? "You write like someone who posts on purpose. Screenshot + a real ask. Steal scene craft, not scene skin." +
            cadenceNote
          : posture === "reel"
            ? "AI art/cinema room. The LinkedIn skeleton is allowed. Still + number + thread." +
              cadenceNote
            : posture === "scene"
              ? "Fat-tail OC. Unfinished thoughts. The last 20 posts are the context window." +
                cadenceNote
              : posture === "cursed"
                ? "The wreck is the bit. Don't suddenly become articulate." + cadenceNote
                : "No stable room yet. More samples, or you're switching costumes." +
                  cadenceNote;

  return {
    updatedAt: new Date().toISOString(),
    samples,
    posture,
    tribe,
    aesthetic,
    confidence,
    mix,
    formatMix,
    cadence,
    note,
  };
}

export const VIBE_KEY = "outrank.vibe";
