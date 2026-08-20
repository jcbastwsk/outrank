import {
  residualNext,
  residualRead,
  RESULT_META,
  type ResidualPair,
  type ResultKind,
} from "./residual";

export const STRATEGY_KEY = "outrank.strategy";
export const COACH_LOG_KEY = "outrank.coachlog";

export type PlatformId = "x";

export type OutcomeKind =
  | "reputation"
  | "followers"
  | "replies"
  | "clients"
  | "sales"
  | "influence"
  | "other";

export const OUTCOME_META: Record<OutcomeKind, { label: string; blurb: string }> = {
  reputation: { label: "Reputation", blurb: "The right people take you seriously." },
  followers: { label: "Followers", blurb: "The graph grows." },
  replies: { label: "Replies", blurb: "Conversation, not applause." },
  clients: { label: "Clients", blurb: "Work comes from the feed." },
  sales: { label: "Sales", blurb: "The post moves money." },
  influence: { label: "Cultural influence", blurb: "Language and frames travel." },
  other: { label: "Other", blurb: "You will name it." },
};

export type Aggression = "restrained" | "measured" | "aggressive";

export const AGGRESSION_META: Record<Aggression, { label: string; blurb: string }> = {
  restrained: { label: "Restrained", blurb: "Protect the voice. Silence is allowed." },
  measured: { label: "Measured", blurb: "Push when the field opens. Hold when it does not." },
  aggressive: { label: "Aggressive", blurb: "Take territory. Still never costume." },
};

export type BeliefSource = "user" | "model" | "observed";

export type Belief = {
  id: string;
  text: string;
  source: BeliefSource;
  createdAt: string;
};

export type Learning = {
  id: string;
  at: string;
  excerpt: string;
  verdict: string;
  note: string;
};

export type { Layer, ResidualPair, ResultKind } from "./residual";

export type NextMove = {
  id: string;
  action: string;
  why: string;
  kind: "publish" | "reply" | "hold" | "develop" | "format" | "revisit";
  source: "profile" | "field" | "outcome" | "instrument";
};

export type StrategicProfile = {
  version: 1;
  platform: PlatformId;
  handle: string;
  ambition: string;
  audience: string;
  territory: string[];
  outcomes: OutcomeKind[];
  outcomeNote: string;
  voiceLock: string;
  aggression: Aggression;
  /** Past posts the user pasted. Observed by them, not fetched. */
  recentWork: string;
  beliefs: Belief[];
  learnings: Learning[];
  /** draft → prediction → logged result. The residual. */
  pairs: ResidualPair[];
  updatedAt: string;
};

export type CoachMessage = {
  id: string;
  role: "user" | "coach";
  text: string;
  at: string;
};

export function emptyStrategy(): StrategicProfile {
  return {
    version: 1,
    platform: "x",
    handle: "",
    ambition: "",
    audience: "",
    territory: [],
    outcomes: [],
    outcomeNote: "",
    voiceLock: "",
    aggression: "measured",
    recentWork: "",
    beliefs: [],
    learnings: [],
    pairs: [],
    updatedAt: new Date().toISOString(),
  };
}

export function parseTerritory(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((s) => s.replace(/^@+/, "").trim())
    .filter((s) => s.length > 1)
    .slice(0, 12);
}

export function isProfileReady(p: StrategicProfile | null | undefined): boolean {
  if (!p) return false;
  return Boolean(p.handle && p.ambition && p.audience && p.outcomes.length);
}

function nid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function belief(text: string, source: BeliefSource): Belief {
  return { id: nid(), text, source, createdAt: new Date().toISOString() };
}

export function seedBeliefs(p: StrategicProfile): Belief[] {
  const out: Belief[] = [];
  if (p.ambition) {
    out.push(belief(`You want to be known for: ${p.ambition}`, "user"));
  }
  if (p.audience) {
    out.push(belief(`You want to reach: ${p.audience}`, "user"));
  }
  if (p.voiceLock) {
    out.push(belief(`Never compromise: ${p.voiceLock}`, "user"));
  }
  if (p.outcomes.length) {
    out.push(
      belief(
        `Success is ${p.outcomes.map((o) => OUTCOME_META[o].label.toLowerCase()).join(", ")} — not generic virality.`,
        "user",
      ),
    );
  }
  return out;
}

export function deriveNextMoves(p: StrategicProfile): NextMove[] {
  const moves: NextMove[] = [];
  const topic = p.ambition.trim() || "the position you are building";
  const who = p.audience.trim() || "the people you named";
  const lastPair = p.pairs[0];
  if (lastPair) {
    const nxt = residualNext(lastPair);
    moves.push({
      id: "from-residual",
      kind: nxt.kind,
      source: "outcome",
      action: nxt.action,
      why: nxt.why,
    });
  }

  const last = p.learnings[0];

  if (last && !lastPair) {
    if (last.verdict === "hold") {
      moves.push({
        id: "from-learning",
        kind: "hold",
        source: "outcome",
        action: `Do not retry the draft that earned a hold.`,
        why: last.note,
      });
    } else if (last.verdict === "revise") {
      moves.push({
        id: "from-learning",
        kind: "develop",
        source: "outcome",
        action: `Finish the circled revision before a new original.`,
        why: last.note,
      });
    } else if (last.verdict === "reply") {
      moves.push({
        id: "from-learning",
        kind: "reply",
        source: "outcome",
        action: `Put that last thought under someone else's post.`,
        why: last.note,
      });
    } else if (last.verdict === "later") {
      moves.push({
        id: "from-learning",
        kind: "hold",
        source: "outcome",
        action: `Do not recap the post you already made. Write the next claim.`,
        why: last.note,
      });
    } else if (last.verdict === "post") {
      moves.push({
        id: "from-learning",
        kind: "reply",
        source: "outcome",
        action: `Stay in the replies of what just earned a post. Do not recap it.`,
        why: last.note,
      });
    } else {
      moves.push({
        id: "from-learning",
        kind: "develop",
        source: "outcome",
        action: `Carry forward: ${last.note}`,
        why: `Saved from a previous draft (${last.verdict}).`,
      });
    }
  }

  moves.push({
    id: "publish-unfinished",
    kind: "publish",
    source: "profile",
    action: `Publish the unfinished thought about ${topic}.`,
    why: `Your stated ambition is not a thread of explanations. An unfinished claim trains ${who} to reply (weight 5) instead of scroll.`,
  });

  if (p.territory[0]) {
    moves.push({
      id: "reply-territory",
      kind: "reply",
      source: "field",
      action: `Reply into a live conversation around @${p.territory[0]} before it saturates.`,
      why: `That account occupies the territory you named. A reply is an original in someone else's thread. Mutuals still get the conversation head.`,
    });
  }

  if (p.voiceLock) {
    moves.push({
      id: "hold-voice",
      kind: "hold",
      source: "profile",
      action: `Do not post a defensive explanation. ${p.voiceLock}`,
      why: "Over-explaining reads as uncertainty. The audience that already follows you does not need a recap. Silence protects the lock.",
    });
  } else {
    moves.push({
      id: "hold-generic",
      kind: "hold",
      source: "profile",
      action: "Do not post another recap of a position they already have.",
      why: "If the last original already stated it, a second one is author-diversity decay and dilution.",
    });
  }

  if (p.outcomes.includes("influence") || p.outcomes.includes("reputation")) {
    moves.push({
      id: "name-term",
      kind: "develop",
      source: "profile",
      action: `Name one term inside ${topic} and let it travel.`,
      why: "Reputation and influence move when language is memorable. A portable line is copy-link (20), not a lecture.",
    });
  }

  if (p.outcomes.includes("clients") || p.outcomes.includes("sales")) {
    moves.push({
      id: "clients",
      kind: "publish",
      source: "profile",
      action: "Ship one native post that a buyer would forward. Link in the reply.",
      why: "Clients do not come from 'link in bio'. They come from a sentence someone pastes into a group chat.",
    });
  }

  if (p.aggression === "restrained") {
    moves.push({
      id: "quiet",
      kind: "hold",
      source: "profile",
      action: "Remain silent if today's draft is a reaction.",
      why: "You asked for restrained coaching. A reaction post trains the wrong association.",
    });
  }

  return moves.slice(0, 6);
}

export function loadStrategy(): StrategicProfile | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STRATEGY_KEY);
  if (!raw) return null;
  try {
    return { ...emptyStrategy(), ...(JSON.parse(raw) as StrategicProfile) };
  } catch {
    return null;
  }
}

export function saveStrategy(p: StrategicProfile) {
  if (typeof window === "undefined") return;
  const next = { ...p, updatedAt: new Date().toISOString() };
  localStorage.setItem(STRATEGY_KEY, JSON.stringify(next));
}

export function loadCoachLog(): CoachMessage[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(COACH_LOG_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CoachMessage[];
  } catch {
    return [];
  }
}

export function saveCoachLog(msgs: CoachMessage[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(COACH_LOG_KEY, JSON.stringify(msgs.slice(-80)));
}

export function addLearning(
  p: StrategicProfile,
  learning: Omit<Learning, "id" | "at">,
): StrategicProfile {
  const entry: Learning = {
    ...learning,
    id: nid(),
    at: new Date().toISOString(),
  };
  const nextBelief = belief(learning.note, "model");
  return {
    ...p,
    learnings: [entry, ...p.learnings].slice(0, 40),
    beliefs: [nextBelief, ...p.beliefs].slice(0, 40),
    updatedAt: new Date().toISOString(),
  };
}

export function addPair(
  p: StrategicProfile,
  pair: Omit<ResidualPair, "id" | "at" | "layer"> & { result: ResultKind },
): StrategicProfile {
  const entry: ResidualPair = {
    ...pair,
    id: nid(),
    at: new Date().toISOString(),
    layer: RESULT_META[pair.result].layer,
  };
  const read = residualRead([entry, ...p.pairs]);
  return {
    ...p,
    pairs: [entry, ...p.pairs].slice(0, 80),
    beliefs: [belief(read.note, "observed"), ...p.beliefs].slice(0, 40),
    updatedAt: new Date().toISOString(),
  };
}

/** Honest fallback when the conversational model is not connected. */
export function localCoachReply(
  text: string,
  profile: StrategicProfile | null,
): string {
  if (!profile || !isProfileReady(profile)) {
    return "I do not have a Strategic Profile yet. Start coaching first. Then ask again.";
  }
  const t = text.toLowerCase();
  if (/what should i (do|post)/.test(t)) {
    return `Publish an unfinished thought about ${profile.ambition}. Do not recap. Do not costume. ${profile.voiceLock ? `Lock: ${profile.voiceLock}` : ""}`.trim();
  }
  if (/silent|hold|don't post|dont post/.test(t)) {
    return profile.aggression === "restrained"
      ? "Yes. Hold if this is a reaction. You asked for restrained coaching."
      : "Hold if it dilutes the lock. Otherwise ship the unfinished claim and stay in the replies.";
  }
  if (/rewrite|make it viral|hooks?|go viral/.test(t)) {
    return "I will not rewrite you into engagement copy. Name the move, keep the sentence yours.";
  }
  const last = profile.learnings[0];
  return `I am working from what you told me: known for “${profile.ambition}”, reaching “${profile.audience}”. Success is ${profile.outcomes.map((o) => OUTCOME_META[o].label.toLowerCase()).join(", ")}, not generic virality. I will not rewrite you into engagement copy. ${profile.voiceLock ? `I will not compromise: ${profile.voiceLock}` : "Name a voice lock on the profile if there is a line I must never cross."}${last ? ` Last saved learning: ${last.note}` : ""}`;
}
