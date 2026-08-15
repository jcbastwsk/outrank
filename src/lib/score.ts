import {
  ACTION_WEIGHTS,
  BOOSTS,
  likeEquivalent,
} from "./weights";

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

export type ScoreResult = {
  features: DraftFeatures;
  actions: ActionEstimate[];
  rawScore: number;
  reach: number;
  grade: "F" | "D" | "C" | "B" | "A" | "S";
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

export function extractFeatures(text: string): DraftFeatures {
  const t = text.trim();
  const hashtags = (t.match(/#\w+/g) ?? []).length;
  const mentions = (t.match(/@\w+/g) ?? []).length;
  const numbers = (t.match(/\b\d+(\.\d+)?x?\b/g) ?? []).length;
  return {
    text: t,
    chars: t.length,
    hasUrl: /https?:\/\/|www\./i.test(t),
    hasQuestion: /\?/.test(t),
    hashtags,
    mentions,
    numbers,
    opinionated:
      /(unpopular|hot take|i think|actually|wrong|the reason|nobody|everyone|stop |most .+ is|here's what|here is what)/i.test(
        t,
      ),
    shareable:
      /(send this|screenshot|cheat sheet|framework|playbook|weights?|copy this|pass this|group chat|here is|here's)/i.test(
        t,
      ),
    rageBait:
      /(idiot|stupid|clown|destroyed|ratio|you won'?t believe|wake up)/i.test(t),
    threadCue: /(^\s*1\/|\bthread\b|a few thoughts|let me explain)/i.test(t),
    mediaCue: /\[(image|video|photo|gif)\]|\.(png|jpg|gif|mp4)\b/i.test(t),
    allCapsTokens: (t.match(/\b[A-Z]{4,}\b/g) ?? []).length,
    isShort: t.length > 0 && t.length < 80,
    isLong: t.length > 220,
    isEmpty: t.length < 8,
  };
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
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
  if (f.opinionated) {
    p.reply += 0.035;
    p.quote += 0.028;
    p.favorite += 0.025;
    p.shareViaCopyLink += 0.006;
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
  if (f.isLong && !f.hasUrl) {
    p.contDwellTime += 8;
    p.dwell += 0.08;
    p.notDwelled -= 0.07;
    p.click += 0.02;
  }
  if (f.isShort && !f.hasQuestion) {
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

  // Map typical drafts (~ -0.5 .. 2.8) onto a 0–100 reach index.
  const reach = Math.round(clamp01((rawScore + 0.8) / 3.4) * 100);

  const grade: ScoreResult["grade"] =
    reach >= 88 ? "S" : reach >= 75 ? "A" : reach >= 60 ? "B" : reach >= 45 ? "C" : reach >= 30 ? "D" : "F";

  const top = actions.find((a) => a.kind === "positive" && a.contribution > 0);
  const headline = features.isEmpty
    ? "Write something. Phoenix cannot rank a blank post."
    : top
      ? `This draft is mostly scoring on ${top.label.toLowerCase()} (${top.weight} × p≈${(top.probability * 100).toFixed(1)}%).`
      : "This draft is not exciting any positive head.";

  return {
    features,
    actions,
    rawScore,
    reach,
    grade,
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
