import {
  ACTION_WEIGHTS,
  BOOSTS,
  likeEquivalent,
} from "./weights";
import { isRageBait, readSlurs } from "./language";

export type ActionId = keyof typeof ACTION_WEIGHTS;

export type DraftFeatures = {
  text: string;
  chars: number;
  hasUrl: boolean;
  hasQuestion: boolean;
  hashtags: number;
  mentions: number;
  numbers: number;
  opinionated: boolean;
  shareable: boolean;
  rageBait: boolean;
  threadCue: boolean;
  mediaCue: boolean;
  allCapsTokens: number;
  isShort: boolean;
  isLong: boolean;
  isEmpty: boolean;
  format: FormatId;
  paragraphs: number;
  /** Unstructured brick. Length without breaks trains scroll-past, not dwell. */
  wall: boolean;
  /** First ~200 characters announce the piece instead of making a claim. */
  ledeWeak: boolean;
  /** "I wrote an article" without the article. */
  articleAnnounce: boolean;
  /** Unfinished claim that begs "wait, what?" — the NK tweet shape. */
  openLoop: boolean;
  hedged: boolean;
  firstPerson: boolean;
  chargedTopic: boolean;
  deadpan: boolean;
  operator: boolean;
  scene: boolean;
  agreeBait: boolean;
  announce: boolean;
  listicle: boolean;
  lowercaseVoice: boolean;
  cursed: boolean;
  hateRisk: boolean;
  /** In-group reclaimed slur. Room voice, not a growth play. */
  reclaimed: boolean;
  aiReel: boolean;
  tribe: TribeId;
  costume: boolean;
};

export type FormatId = "micro" | "short" | "long" | "article" | "thread";

export const FORMAT_META: Record<FormatId, { label: string; blurb: string }> = {
  micro: { label: "Micro", blurb: "One breath. Reply/quote or it dies." },
  short: { label: "Short", blurb: "Classic tweet. Hook in the first line." },
  long: { label: "Long", blurb: "Feed-native essay. First 200 characters are the post." },
  article: { label: "Article", blurb: "Click + dwell + copy-link. The headline is the candidate." },
  thread: { label: "Thread", blurb: "Tweet 1 is what Phoenix ranks. The rest is optional." },
};

const WEAK_LEDE =
  /^(i (just )?(wrote|published|dropped|posted)( an?)?( article| essay| piece| thread| blog)?|new (article|essay|blog|post|thread)\b|a few thoughts\b|thread:|👇|read (the )?(rest|more|below|full))/i;

export type TribeId = "none" | "milady" | "queer";

export const TRIBE_META: Record<
  TribeId,
  { label: string; blurb: string }
> = {
  none: { label: "", blurb: "" },
  milady: {
    label: "Milady",
    blurb: "Remilia room. Reads as nothing unless the viewer already lives there.",
  },
  queer: {
    label: "Queer room",
    blurb: "In-group voice. Cold For You hears a slur. Not a sticker.",
  },
};

export type LaneId =
  | "operator"
  | "scene"
  | "reel"
  | "cursed"
  | "volatile"
  | "portable"
  | "thin"
  | "spam"
  | "empty";

export type Lane = {
  id: LaneId;
  label: string;
  blurb: string;
};

export type ActionEstimate = {
  id: ActionId;
  label: string;
  probability: number;
  weight: number;
  contribution: number;
  likeEquiv: number;
  kind: "positive" | "negative";
};

export type Grade = "F" | "D" | "C" | "B" | "A" | "S";

export type AudienceRead = {
  id: "graph" | "cold";
  label: string;
  reach: number;
  grade: Grade;
  rawScore: number;
};

export type VoiceShare = {
  id: string;
  label: string;
  weight: number;
};

export type ScoreResult = {
  features: DraftFeatures;
  actions: ActionEstimate[];
  rawScore: number;
  reach: number;
  grade: Grade;
  graph: AudienceRead;
  cold: AudienceRead;
  mix: VoiceShare[];
  lane: Lane;
  tribe: TribeId;
  format: FormatId;
  headline: string;
  disclaimer: string;
};

const ACTION_META: {
  id: ActionId;
  label: string;
}[] = [
  { id: "shareViaCopyLink", label: "Copy-link share" },
  { id: "reply", label: "Reply" },
  { id: "quote", label: "Quote" },
  { id: "shareViaDm", label: "DM share" },
  { id: "followAuthor", label: "Follow you" },
  { id: "share", label: "Share" },
  { id: "retweet", label: "Repost" },
  { id: "favorite", label: "Like" },
  { id: "click", label: "Post click" },
  { id: "openLink", label: "Open link" },
  { id: "photoExpand", label: "Photo expand" },
  { id: "videoOpen", label: "Video open" },
  { id: "vqv", label: "Video quality view" },
  { id: "quotedClick", label: "Quoted click" },
  { id: "profileClick", label: "Profile click" },
  { id: "dwell", label: "Dwell (binary)" },
  { id: "contDwellTime", label: "Dwell time" },
  { id: "postUnexplored", label: "Unexplored" },
  { id: "contClickDwellTime", label: "Click dwell" },
  { id: "quotedVqv", label: "Quoted VQV" },
  { id: "notDwelled", label: "Scroll-past" },
  { id: "blockAuthor", label: "Block" },
  { id: "notInterested", label: "Not interested" },
  { id: "muteAuthor", label: "Mute" },
  { id: "report", label: "Report" },
];

const OPEN_LOOP =
  /(lied to|they told us|we were told|nobody (talks|says)|the thing about|pretty sure|beginning to think|starting to think|i was wrong about|don't buy|i don't buy|not buying|big time|about to say|wait until|the quiet part|what they|what nobody)/i;

const HEDGED =
  /(pretty sure|i think|i don't think|i dont think|maybe|low-key|ngl|i guess|starting to|beginning to|i'm not sure|im not sure|could be wrong)/i;

const CHARGED =
  /(north korea|n korea|\bnk\b|dprk|cia|fbi|nsa|mossad|epstein|covid|vaccine|\bufo\b|uap\b|ukraine|gaza|israel|taiwan|ccp|wuhan|lab leak|deep state|mainstream)/i;

const FIRST_PERSON = /\b(i|i'm|im|i've|ive|me|my)\b/i;

const OPERATOR =
  /(excited to|humbled|grateful|thrilled|as a (founder|ceo|cto|cmo|leader)|in my \d+ years|lessons? I (learned|wish)|here's what I|here is what I|building in public|the best founders|high-?agency|we just (shipped|closed|raised)|i'm hiring|im hiring|what would you add|thoughts\?|agree\?|unpopular opinion:|the real moat|leverage|10x your|as someone who|congrats to|proud to announce|i'm excited to share)/i;

const AGREE_BAIT = /(thoughts\?|agree\?|what would you add|am i (wrong|crazy)|change my mind|discuss)/i;

const ANNOUNCE =
  /(announce|we (just |')?(shipped|launched|raised|closed|hired)|i'm (joining|leaving|starting)|today we)/i;

const LISTICLE = /(^\s*\d+[\.\)\/]|^\s*[-–•]\s|lessons I|things I wish|a few things)/im;

const AI_TOOL =
  /(midjourney|runway|kling|sora|veo\b|luma|pika|comfyui|comfy ui|stable diffusion|\bflux\b|higgsfield|hailuo|minimax|hunyuan|wan\b|seedance|dream machine|elevenlabs)/i;

const CINEMA_LEX =
  /(cinematic|short film|ai film|ai cinema|ai art|teaser|trailer|keyframe|color grade|anamorphic|no crew|no camera|generations?|the prompt|ai slop|this is ai|made with ai|(a|the) still)/i;

const MILADY =
  /\b(milady|miladies|remilia|radbro|radbros|very milady|gm milady|gn milady)\b/i;

const WORKFLOW_BAIT =
  /(comment \w+|workflow in (the )?thread|prompt in (the )?thread|save this|which (one|frame|still)|drop a 🔥)/i;

const SCENE_VOICE =
  /(so over|so back|real ones know|this is not a bit|once you see it|the pattern is|they will not|they don't want|nobody is ready|it's happening|its happening|not a coincidence|wake up but)/i;

/** Toddler grammar / missing verb / split compounds. "I all of my bit coins" */
const CURSED =
  /\b(i all of my|i my |i the |i so much|bit coins|face book|you tube|i phone|all of my coin|lose all my|lost all my)\b/i;

function looksBrokenSyntax(t: string): boolean {
  if (CURSED.test(t)) return true;
  const words = t.toLowerCase().match(/[a-z']+/g) ?? [];
  if (words.length < 3 || words.length > 14) return false;
  const verbs = new Set([
    "am","is","are","was","were","be","been","being","have","has","had",
    "do","did","does","lost","lose","sold","bought","got","get","went",
    "think","know","see","saw","said","say","want","need","feel","love",
    "hate","make","made","take","took","come","came",
  ]);
  if (words[0] === "i" && !words.some((w) => verbs.has(w))) return true;
  return false;
}



export function extractFeatures(text: string): DraftFeatures {
  const t = text.trim();
  const hashtags = (t.match(/#\w+/g) ?? []).length;
  const mentions = (t.match(/@\w+/g) ?? []).length;
  const numbers = (t.match(/\b\d+(\.\d+)?x?\b/g) ?? []).length;
  const emoji = (t.match(/\p{Extended_Pictographic}/gu) ?? []).length;
  const proper = (t.match(/\b[A-Z][a-zA-Z]{2,}\b/g) ?? []).length;
  const hasQuestion = /\?/.test(t);
  const isShort = t.length > 0 && t.length < 90;
  const isEmpty = t.length < 8;
  const paragraphs = t.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;
  const lineBreaks = (t.match(/\n/g) ?? []).length;
  const articleLang =
    /(^#{1,3}\s|i wrote (an? )?(essay|article|piece)|read the (rest|full)|full (essay|article)|new (essay|article))/im.test(
      t,
    );
  const structured =
    paragraphs >= 4 ||
    /^#{1,3}\s/m.test(t) ||
    /^(I{1,3}|IV|V|VI)\.\s/m.test(t) ||
    (paragraphs >= 3 && t.length > 600);
  const wall = t.length > 400 && paragraphs <= 2 && lineBreaks < 4;
  // "workflow in the thread" is reply-bait, not a thread. Require an announce.
  const threadCue =
    /^\s*(🧵\s*)?\d+\s*\/\s*\d*/m.test(t) ||
    /\b(a thread|thread:|in this thread)\b/i.test(t);
  const articleCue =
    !wall &&
    (paragraphs >= 5 ||
      (t.length > 900 && structured) ||
      (articleLang && t.length > 360 && paragraphs >= 3));
  const format: FormatId = threadCue
    ? "thread"
    : articleCue
      ? "article"
      : t.length > 280
        ? "long"
        : t.length >= 90
          ? "short"
          : "micro";
  const articleAnnounce = articleLang && !articleCue && t.length < 400;
  const ledeWeak = WEAK_LEDE.test(t.replace(/\s+/g, " ").slice(0, 200));
  const hasUrl = /https?:\/\/|www\./i.test(t);
  const hookWindow = t.slice(0, format === "micro" || format === "short" ? 280 : 160);
  const openLoop = OPEN_LOOP.test(hookWindow);
  const hedged = HEDGED.test(t);
  const firstPerson = FIRST_PERSON.test(t);
  const chargedTopic = CHARGED.test(t);
  const letters = (t.match(/[A-Za-z]/g) ?? []).length;
  const lowers = (t.match(/[a-z]/g) ?? []).length;
  const lowercaseVoice = letters >= 12 && lowers / letters >= 0.86;
  const operator = OPERATOR.test(t) || AGREE_BAIT.test(t) || ANNOUNCE.test(t);
  const agreeBait = AGREE_BAIT.test(t);
  const announce = ANNOUNCE.test(t);
  const listicle = LISTICLE.test(t);
  const sceneVoice = SCENE_VOICE.test(t);
  const deadpan =
    !isEmpty &&
    isShort &&
    !hasUrl &&
    hashtags === 0 &&
    emoji <= 1 &&
    !operator &&
    !articleAnnounce &&
    format !== "article" &&
    format !== "long" &&
    format !== "thread" &&
    (proper > 0 || chargedTopic || lowercaseVoice) &&
    (openLoop || hedged || firstPerson || sceneVoice);
  const aiCraft = AI_TOOL.test(t) || CINEMA_LEX.test(t);
  const workflowBait = WORKFLOW_BAIT.test(t);
  const aiReel =
    !isEmpty &&
    !MILADY.test(t) &&
    (aiCraft || workflowBait) &&
    (aiCraft || operator || announce || agreeBait || listicle || workflowBait);
  const slur = readSlurs(t);
  const tribe: TribeId = MILADY.test(t)
    ? "milady"
    : slur.queerRoom || slur.reclaimed
      ? "queer"
      : "none";
  const costume = tribe !== "none" && (operator || announce || listicle);
  const cursed =
    !operator &&
    !aiReel &&
    tribe === "none" &&
    !slur.hateRisk &&
    !isEmpty &&
    looksBrokenSyntax(t);
  const hateRisk = slur.hateRisk;
  const reclaimed = slur.reclaimed;
  const scene =
    (!operator &&
      !cursed &&
      !aiReel &&
      (openLoop ||
        deadpan ||
        sceneVoice ||
        tribe !== "none" ||
        (chargedTopic && (hedged || lowercaseVoice)))) ||
    (tribe !== "none" && !aiReel);

  return {
    text: t,
    chars: t.length,
    hasUrl,
    hasQuestion,
    hashtags,
    mentions,
    numbers,
    opinionated:
      /(unpopular|hot take|i think|actually|wrong|the reason|nobody|everyone|stop |most .+ is|here's what|here is what)/i.test(
        t,
      ) || openLoop,
    shareable:
      /(send this|screenshot|cheat sheet|framework|playbook|weights?|copy this|pass this|group chat|here is|here's)/i.test(
        t,
      ),
    rageBait: isRageBait(t),
    threadCue,
    mediaCue: /\[(image|video|photo|gif)\]|\.(png|jpg|gif|mp4)\b/i.test(t),
    allCapsTokens: (t.match(/\b[A-Z]{4,}\b/g) ?? []).length,
    isShort,
    isLong: t.length > 220,
    isEmpty,
    format,
    paragraphs,
    wall,
    ledeWeak,
    articleAnnounce,
    openLoop,
    hedged,
    firstPerson,
    chargedTopic,
    deadpan,
    operator,
    scene,
    agreeBait,
    announce,
    listicle,
    lowercaseVoice,
    cursed,
    hateRisk,
    reclaimed,
    aiReel,
    tribe,
    costume,
  };
}

export function classifyLane(f: DraftFeatures): Lane {
  if (f.isEmpty) {
    return { id: "empty", label: "Empty", blurb: "Nothing to score." };
  }
  if (f.hasUrl && f.hashtags >= 3) {
    return {
      id: "spam",
      label: "Spam-shaped",
      blurb: "Looks like a broadcast. Grox and humans both bounce.",
    };
  }
  if (f.hateRisk) {
    return {
      id: "volatile",
      label: "Volatile",
      blurb: "Can print replies. One report is −234. We do not coach this.",
    };
  }
  if (f.cursed) {
    return {
      id: "cursed",
      label: "Cursed",
      blurb: "Broken on purpose. People quote the wreck. Don't fix the grammar.",
    };
  }
  if (f.aiReel) {
    return {
      id: "reel",
      label: "Reel",
      blurb: "AI art/cinema. The LinkedIn skeleton is native here. Still + number + thread.",
    };
  }
  if (f.tribe !== "none") {
    const meta = TRIBE_META[f.tribe];
    return {
      id: "scene",
      label: meta.label,
      blurb: meta.blurb,
    };
  }
  if (f.operator) {
    return {
      id: "operator",
      label: "Operator",
      blurb: "LinkedIn-on-X. Screenshot + “thoughts?” is the engine.",
    };
  }
  if (f.scene) {
    return {
      id: "scene",
      label: "Scene",
      blurb: "Fat-tail OC. Lands if the room already has the context. Not a template.",
    };
  }
  if (f.shareable || (f.numbers >= 2 && f.isLong && !f.wall)) {
    return {
      id: "portable",
      label: "Portable",
      blurb: "Built to be copy-linked into a group chat.",
    };
  }
  return {
    id: "thin",
    label: "Thin",
    blurb: "No hook, no loop, no lesson. Easy to scroll past.",
  };
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export function gradeFromReach(reach: number): Grade {
  return reach >= 88 ? "S" : reach >= 75 ? "A" : reach >= 60 ? "B" : reach >= 45 ? "C" : reach >= 30 ? "D" : "F";
}

export function reachFromRaw(raw: number) {
  return Math.round(clamp01((raw + 0.8) / 3.4) * 100);
}

const VOICE_LABEL: Record<string, string> = {
  operator: "Operator",
  scene: "Scene",
  cursed: "Cursed",
  reel: "Reel",
  milady: "Milady",
  queer: "Queer room",
  portable: "Portable",
  volatile: "Volatile",
  thin: "Thin",
};

export function voiceMix(f: DraftFeatures): VoiceShare[] {
  const w: Record<string, number> = {};
  if (f.isEmpty) return [];
  if (f.hateRisk) w.volatile = 0.8;
  if (f.operator) w.operator = (w.operator ?? 0) + 0.45;
  if (f.scene || f.openLoop || f.deadpan) w.scene = (w.scene ?? 0) + 0.4;
  if (f.cursed) w.cursed = (w.cursed ?? 0) + 0.55;
  if (f.aiReel) w.reel = (w.reel ?? 0) + 0.5;
  if (f.tribe === "milady") w.milady = (w.milady ?? 0) + 0.55;
  if (f.tribe === "queer" || f.reclaimed) w.queer = (w.queer ?? 0) + 0.45;
  if (f.shareable || f.format === "article" || (f.format === "long" && !f.wall)) {
    w.portable = (w.portable ?? 0) + 0.3;
  }
  if (f.costume && f.operator) w.operator = (w.operator ?? 0) + 0.15;
  const sum = Object.values(w).reduce((a, b) => a + b, 0);
  if (sum === 0) return [{ id: "thin", label: "Thin", weight: 1 }];
  return Object.entries(w)
    .map(([id, v]) => ({
      id,
      label: VOICE_LABEL[id] ?? id,
      weight: v / sum,
    }))
    .sort((a, b) => b.weight - a.weight);
}

/**
 * Heuristic stand-in for Phoenix P(action | viewer, post).
 * Phoenix itself is a Grok transformer over the viewer's engagement history.
 * We cannot run that model for every viewer. These are content-conditioned
 * prior rates so the *published weights* can be applied honestly.
 */
export function estimateProbabilities(
  f: DraftFeatures,
): Record<ActionId, number> {
  const p = {
    favorite: 0.07,
    reply: 0.022,
    retweet: 0.012,
    photoExpand: f.mediaCue ? 0.08 : 0.012,
    videoOpen: 0.01,
    click: 0.03,
    openLink: f.hasUrl ? 0.07 : 0.002,
    profileClick: 0.012,
    vqv: 0.008,
    share: 0.007,
    shareViaDm: 0.005,
    shareViaCopyLink: 0.004,
    dwell: 0.18,
    quote: 0.009,
    quotedClick: 0.004,
    quotedVqv: 0,
    followAuthor: 0.009,
    postUnexplored: 0.04,
    contDwellTime: 7,
    contClickDwellTime: 0,
    // Negative heads are rare; their weights are enormous. Keep priors tiny
    // so a clean bland post isn't auto-failed by the mute/report terms.
    notInterested: 0.003,
    blockAuthor: 0.0003,
    muteAuthor: 0.0004,
    report: 0.00008,
    notDwelled: 0.22,
  } satisfies Record<ActionId, number>;

  if (f.isEmpty) {
    return Object.fromEntries(
      Object.keys(p).map((k) => [k, k === "notDwelled" ? 0.8 : 0]),
    ) as Record<ActionId, number>;
  }

  if (f.hasQuestion) {
    p.reply += 0.055;
    p.quote += 0.012;
    p.click += 0.02;
    p.notDwelled -= 0.05;
  }

  // Operator = LinkedIn-on-X. Copy-link + polite reply + follow.
  // Reel = AI art/cinema LinkedIn bait. The room wants the slop-shaped post.
  if (f.aiReel) {
    p.shareViaCopyLink += 0.045;
    p.shareViaDm += 0.015;
    p.reply += 0.055;
    p.quote += 0.02;
    p.followAuthor += 0.03;
    p.favorite += 0.03;
    p.click += 0.03;
    p.photoExpand += 0.04;
    p.notDwelled -= 0.07;
    p.contDwellTime += 6;
  }

  if (f.operator && !f.aiReel && f.tribe === "none" && !f.wall) {
    p.shareViaCopyLink += 0.04;
    p.shareViaDm += 0.012;
    p.favorite += 0.04;
    p.followAuthor += 0.025;
    p.reply += f.agreeBait ? 0.06 : 0.03;
    p.quote += 0.008;
    p.contDwellTime += f.listicle || f.isLong ? 10 : 4;
    p.notDwelled -= 0.06;
  }
  if (f.announce && f.operator && !f.aiReel && f.tribe === "none" && !f.wall) {
    p.followAuthor += 0.02;
    p.click += 0.03;
  }

  // Cursed = "I all of my bit coins". Quote-the-wreck + reply pile.
  if (f.cursed && !f.hateRisk) {
    p.reply += 0.08;
    p.quote += 0.06;
    p.shareViaCopyLink += 0.02;
    p.favorite += 0.02;
    p.notDwelled -= 0.07;
    p.click += 0.02;
  }

  // Hate tokens: pile-on replies are real. So is ReportWeight −234.
  // Expected value is usually bad. The ones that "fly" didn't get reported.
  if (f.hateRisk) {
    p.reply += 0.08;
    p.quote += 0.04;
    p.report += 0.012;
    p.muteAuthor += 0.012;
    p.notInterested += 0.02;
    p.blockAuthor += 0.006;
  }

  // Scene = weird Twitter. Reply and quote, not LinkedIn screenshots.
  if (f.tribe === "milady" && !f.hateRisk) {
    p.reply += 0.07;
    p.quote += 0.05;
    p.favorite += 0.02;
    p.notDwelled -= 0.06;
    // Cold OON viewers bounce. Mutuals in the room do not.
  }

  if ((f.scene || f.openLoop || f.deadpan) && !f.cursed && !f.hateRisk && f.tribe === "none") {
    p.reply += 0.09;
    p.quote += 0.055;
    p.click += 0.025;
    p.followAuthor += 0.01;
    p.notDwelled -= 0.08;
    p.dwell += 0.06;
    p.contDwellTime += 3;
  }
  if (f.lowercaseVoice && f.scene) {
    p.quote += 0.015;
    p.reply += 0.015;
  }
  if (f.hedged && f.firstPerson && !f.operator) {
    p.reply += 0.025;
    p.quote += 0.015;
  }
  if (f.chargedTopic && !f.operator) {
    p.reply += 0.03;
    p.quote += 0.02;
    p.notInterested += 0.002;
    p.muteAuthor += 0.001;
  }
  if (f.opinionated && !f.operator) {
    p.reply += 0.03;
    p.quote += 0.025;
    p.favorite += 0.015;
  }
  if (f.shareable) {
    p.shareViaCopyLink += 0.035;
    p.shareViaDm += 0.018;
    p.share += 0.012;
    p.quote += 0.01;
    p.favorite += 0.02;
  }
  if (f.numbers >= 2) {
    p.shareViaCopyLink += 0.012;
    p.favorite += 0.015;
    p.contDwellTime += 4;
  }
  // Structured long / article / thread: click + dwell + copy-link.
  // A brick of the same length is the opposite — thumb trains NotDwelled.
  if (f.format === "long" && !f.hasUrl && !f.wall) {
    p.contDwellTime += 12;
    p.dwell += 0.1;
    p.click += f.ledeWeak ? 0.03 : 0.08;
    p.shareViaCopyLink += f.ledeWeak ? 0.01 : 0.032;
    p.notDwelled -= 0.08;
    p.reply -= 0.008;
  }
  if (f.format === "article" && !f.wall) {
    p.click += f.ledeWeak ? 0.04 : 0.12;
    p.contDwellTime += f.ledeWeak ? 6 : 18;
    p.dwell += 0.12;
    p.shareViaCopyLink += 0.03;
    p.shareViaDm += 0.01;
    p.reply -= 0.012;
    p.notDwelled -= f.ledeWeak ? 0.02 : 0.1;
  }
  if (f.format === "thread") {
    p.click += f.ledeWeak ? 0.02 : 0.06;
    p.contDwellTime += 12;
    p.dwell += 0.08;
  }
  if (f.isLong && !f.hasUrl && f.format === "short" && !f.wall) {
    p.contDwellTime += 8;
    p.dwell += 0.08;
    p.notDwelled -= 0.07;
    p.click += 0.02;
  }
  if (f.wall) {
    p.shareViaCopyLink -= 0.028;
    p.shareViaDm -= 0.008;
    p.reply -= 0.025;
    p.quote -= 0.012;
    p.followAuthor -= 0.015;
    p.favorite -= 0.02;
    p.notDwelled += 0.16;
    p.dwell -= 0.12;
    p.contDwellTime -= 10;
    p.click -= 0.03;
    p.notInterested += 0.01;
  }
  if (f.ledeWeak || f.articleAnnounce) {
    p.click -= 0.04;
    p.notDwelled += 0.05;
    p.followAuthor -= 0.008;
  }
  // Short is only thin when it has nothing to stop on.
  if (
    f.isShort &&
    !f.hasQuestion &&
    !f.openLoop &&
    !f.deadpan &&
    !f.opinionated &&
    !f.operator &&
    !f.scene &&
    !f.cursed &&
    !f.hateRisk &&
    !f.aiReel
  ) {
    p.notDwelled += 0.08;
    p.dwell -= 0.04;
    p.contDwellTime -= 2;
  }
  if (f.hasUrl) {
    p.reply -= 0.01;
    p.quote -= 0.004;
    p.notDwelled += 0.07;
    p.dwell -= 0.05;
    p.contDwellTime -= 3;
    p.openLink += 0.04;
  }
  if (f.hashtags >= 3) {
    p.notInterested += 0.025;
    p.muteAuthor += 0.008;
    p.reply -= 0.008;
    p.favorite -= 0.01;
  }
  if (f.mentions >= 4) {
    p.notInterested += 0.02;
  }
  if (f.rageBait) {
    p.reply += 0.05;
    p.quote += 0.02;
    p.report += 0.018;
    p.muteAuthor += 0.02;
    p.notInterested += 0.035;
    p.blockAuthor += 0.008;
  }
  if (f.threadCue) {
    p.contDwellTime += 10;
    p.click += 0.035;
    p.dwell += 0.05;
  }
  if (f.allCapsTokens >= 2) {
    p.notInterested += 0.015;
    p.muteAuthor += 0.006;
  }
  if (f.mediaCue) {
    p.photoExpand += 0.06;
    p.contDwellTime += 3;
  }

  p.favorite = clamp01(p.favorite);
  p.reply = clamp01(p.reply);
  p.retweet = clamp01(p.retweet);
  p.photoExpand = clamp01(p.photoExpand);
  p.videoOpen = clamp01(p.videoOpen);
  p.click = clamp01(p.click);
  p.openLink = clamp01(p.openLink);
  p.profileClick = clamp01(p.profileClick);
  p.vqv = clamp01(p.vqv);
  p.share = clamp01(p.share);
  p.shareViaDm = clamp01(p.shareViaDm);
  p.shareViaCopyLink = clamp01(p.shareViaCopyLink);
  p.dwell = clamp01(p.dwell);
  p.quote = clamp01(p.quote);
  p.quotedClick = clamp01(p.quotedClick);
  p.followAuthor = clamp01(p.followAuthor);
  p.postUnexplored = clamp01(p.postUnexplored);
  p.notInterested = clamp01(p.notInterested);
  p.blockAuthor = clamp01(p.blockAuthor);
  p.muteAuthor = clamp01(p.muteAuthor);
  p.report = clamp01(p.report);
  p.notDwelled = clamp01(p.notDwelled);
  p.contDwellTime = Math.max(0, p.contDwellTime);
  return p;
}

export function scoreDraft(text: string): ScoreResult {
  const features = extractFeatures(text);
  const lane = classifyLane(features);
  const tribe = features.tribe;
  const probs = estimateProbabilities(features);

  const actions: ActionEstimate[] = ACTION_META.map(({ id, label }) => {
    const weight = ACTION_WEIGHTS[id];
    const probability = probs[id];
    const contribution = weight * probability;
    return {
      id,
      label,
      probability,
      weight,
      contribution,
      likeEquiv: likeEquivalent(weight),
      kind: (weight < 0 ? "negative" : "positive") as ActionEstimate["kind"],
    };
  }).sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  const rawScore = actions.reduce((s, a) => s + a.contribution, 0);
  const graphRaw = rawScore;
  let coldRaw = actions.reduce((s, a) => {
    if (a.kind === "positive") return s + a.contribution * BOOSTS.oonWeightFactor;
    return s + a.contribution;
  }, 0);
  if (features.scene || features.reclaimed || features.tribe !== "none") {
    coldRaw -= 0.32;
  }
  if (features.costume) coldRaw -= 0.22;
  if (features.operator && !features.scene && features.tribe === "none") {
    coldRaw += 0.06;
  }

  const graphReach = reachFromRaw(graphRaw);
  const coldReach = reachFromRaw(coldRaw);
  const reach = graphReach;
  const grade = gradeFromReach(reach);
  const mix = voiceMix(features);
  const graph: AudienceRead = {
    id: "graph",
    label: "Mutuals",
    reach: graphReach,
    grade: gradeFromReach(graphReach),
    rawScore: graphRaw,
  };
  const cold: AudienceRead = {
    id: "cold",
    label: "Cold For You",
    reach: coldReach,
    grade: gradeFromReach(coldReach),
    rawScore: coldRaw,
  };

  const top = actions.find((a) => a.kind === "positive" && a.contribution > 0);
  const headBit = top
    ? `${top.label.toLowerCase()} (${top.weight} × p≈${(top.probability * 100).toFixed(1)}%)`
    : "nothing";
  const headlines: Record<LaneId, string> = {
    empty: "Write something. Phoenix cannot rank a blank post.",
    scene:
      tribe !== "none"
        ? `${TRIBE_META[tribe].label} room. ${lane.blurb} Scoring on ${headBit}.`
        : `Scene post. ${lane.blurb} Scoring on ${headBit}.`,
    operator: `Operator post. ${lane.blurb} Scoring on ${headBit}.`,
    reel: `Reel. ${lane.blurb} Scoring on ${headBit}.`,
    cursed: `Cursed. ${lane.blurb} Scoring on ${headBit}.`,
    volatile: `Volatile. ${lane.blurb} Top head ${headBit}.`,
    spam: `Spam-shaped. ${lane.blurb}`,
    thin: `Thin. ${lane.blurb}`,
    portable: `Portable. ${lane.blurb} Scoring on ${headBit}.`,
  };
  const formatNote = features.wall
    ? " Wall of text — that trains scroll-past, not dwell."
    : features.articleAnnounce
      ? " That's an article announcement, not the article."
      : features.format === "article" ||
          features.format === "long" ||
          features.format === "thread"
        ? ` ${FORMAT_META[features.format].blurb}`
        : "";
  const split =
    Math.abs(graphReach - coldReach) >= 12
      ? ` Mutuals ${graph.grade} ${graphReach} · Cold For You ${cold.grade} ${coldReach}.`
      : "";
  const headline = headlines[lane.id] + formatNote + split;

  return {
    features,
    lane,
    tribe,
    format: features.format,
    actions,
    rawScore,
    reach,
    grade,
    graph,
    cold,
    mix,
    headline,
    disclaimer:
      "Phoenix predicts P(action) per viewer from their engagement history. Outrank estimates those probabilities from the draft, then multiplies by the published production weights. It is a coaching instrument, not the live ranker.",
  };
}

export function effectiveMutualReplyWeight() {
  return ACTION_WEIGHTS.reply + BOOSTS.bidirectionalFollowReply;
}

export function secondPostMultiplier() {
  return (
    (1 - BOOSTS.authorDiversityFloor) * BOOSTS.authorDiversityDecay +
    BOOSTS.authorDiversityFloor
  );
}
