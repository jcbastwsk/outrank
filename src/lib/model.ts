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
  followers: { label: "Followers", blurb: "More people follow you." },
  replies: { label: "Replies", blurb: "People write back." },
  clients: { label: "Clients", blurb: "Work comes from the posts." },
  sales: { label: "Sales", blurb: "A post that sells something." },
  influence: { label: "Influence", blurb: "Your language gets picked up." },
  other: { label: "Other", blurb: "Something else." },
};

export type Aggression = "restrained" | "measured" | "aggressive";

export const AGGRESSION_META: Record<Aggression, { label: string; blurb: string }> = {
  restrained: { label: "Restrained", blurb: "Hold back unless it is clearly worth posting." },
  measured: { label: "Measured", blurb: "Push when it helps. Wait when it doesn't." },
  aggressive: { label: "Aggressive", blurb: "Take more swings. Still sound like yourself." },
};

export type EvidenceKind = "verified" | "estimate" | "user";

export type StrategicProfile = {
  version: 2;
  platform: PlatformId;
  displayName: string;
  handle: string;
  ambition: string;
  subjects: string[];
  audience: string;
  outcomes: OutcomeKind[];
  outcomeNote: string;
  reputationWanted: string;
  acceptableAttention: string;
  unacceptableAttention: string;
  voice: string;
  avoid: string;
  nonnegotiables: string;
  peers: string[];
  rivals: string[];
  scenes: string;
  preferredFormats: string;
  hypotheses: string;
  aggression: Aggression;
  corrections: string;
  updatedAt: string;
};

export type PostRecord = {
  id: string;
  text: string;
  url?: string;
  date: string;
  format?: string;
  subject?: string;
  intendedFunction?: string;
  metrics?: string;
  userRead?: string;
  outcome?: "worked" | "failed" | "mixed" | "undesired_reach" | "unknown";
  relation?: string;
};

export type MemoryState = "provisional" | "confirmed" | "corrected";

export type CoachMemory = {
  id: string;
  pattern: string;
  evidence: string;
  confidence: number;
  learnedAt: string;
  state: MemoryState;
};

export type RecKind =
  | "publish"
  | "revise"
  | "wait"
  | "reply"
  | "format"
  | "develop"
  | "hold";

export type Recommendation = {
  id: string;
  action: string;
  why: string;
  goal: string;
  evidence: string;
  confidence: number;
  kind: RecKind;
  timing?: string;
  status: "open" | "done" | "skipped" | "expired";
};

export type DeskState = {
  id: string;
  demo: boolean;
  createdAt: string;
  profile: StrategicProfile;
  posts: PostRecord[];
  memories: CoachMemory[];
  recommendations: Recommendation[];
};

export function emptyProfile(): StrategicProfile {
  return {
    version: 2,
    platform: "x",
    displayName: "",
    handle: "",
    ambition: "",
    subjects: [],
    audience: "",
    outcomes: [],
    outcomeNote: "",
    reputationWanted: "",
    acceptableAttention: "",
    unacceptableAttention: "",
    voice: "",
    avoid: "",
    nonnegotiables: "",
    peers: [],
    rivals: [],
    scenes: "",
    preferredFormats: "",
    hypotheses: "",
    aggression: "measured",
    corrections: "",
    updatedAt: new Date().toISOString(),
  };
}

export function profileReady(p: StrategicProfile | null | undefined): boolean {
  if (!p) return false;
  return Boolean(p.handle && p.audience && (p.avoid || p.nonnegotiables));
}

export function nid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function parseList(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((s) => s.replace(/^@+/, "").trim())
    .filter((s) => s.length > 1)
    .slice(0, 16);
}

/** First clause only. Never paste the whole profile into a move. */
export function topicLine(raw: string, max = 48): string {
  const t = raw.trim();
  if (!t) return "";
  const first = (t.split(/[.;\n]/)[0] ?? t).trim();
  if (first.length <= max) return first.replace(/[.,]+$/, "");
  return `${first.slice(0, max).replace(/\s+\S*$/, "").replace(/[.,]+$/, "")}…`;
}

export function firstHandle(peers: string[]): string {
  const raw = peers[0] ?? "";
  return raw.replace(/^@+/, "").split(/[\s,]+/)[0] ?? "";
}
