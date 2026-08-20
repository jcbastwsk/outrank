import { ACTION_WEIGHTS, ALGO_SOURCE, BOOSTS } from "./weights";
import { RESULT_META, type Layer, type ResultKind } from "./residual";

/** Schema version. Bump when the event shape changes. */
export const EVENT_SCHEMA = 1 as const;

export type PhysicsSnapshot = {
  snapshotAt: string;
  copyLink: number;
  reply: number;
  retweet: number;
  like: number;
  oon: number;
  diversityDecay: number;
  ageHours: number;
};

export type Prediction = {
  graph: number;
  cold: number;
  verdict: string;
  grade: string;
  lane: string;
};

export type Observation = {
  at: string;
  /** User-stated. Never scraped. Null if they only classified. */
  impressions: number | null;
  notes: string;
};

export type Classification = {
  at: string;
  result: ResultKind;
  layer: Layer;
  note: string;
};

/**
 * Canonical unit. Brief → Candidate → Prediction → Publish →
 * Observation → Classification → Residual → next brief.
 */
export type CandidateEvent = {
  schema: typeof EVENT_SCHEMA;
  id: string;
  deskId: string;
  handle: string;
  at: string;
  text: string;
  excerpt: string;
  format: string;
  physics: PhysicsSnapshot;
  prediction: Prediction;
  publishedAt: string | null;
  observation: Observation | null;
  classification: Classification | null;
};

export function physicsNow(): PhysicsSnapshot {
  return {
    snapshotAt: ALGO_SOURCE.snapshotAt,
    copyLink: ACTION_WEIGHTS.shareViaCopyLink,
    reply: ACTION_WEIGHTS.reply,
    retweet: ACTION_WEIGHTS.retweet,
    like: ACTION_WEIGHTS.favorite,
    oon: BOOSTS.oonWeightFactor,
    diversityDecay: BOOSTS.authorDiversityDecay,
    ageHours: BOOSTS.ageFilterHours,
  };
}

export function classify(
  result: ResultKind,
  note = "",
): Classification {
  return {
    at: new Date().toISOString(),
    result,
    layer: RESULT_META[result].layer,
    note,
  };
}

export function isResolved(e: CandidateEvent): boolean {
  return Boolean(e.classification);
}

export function eventStats(events: CandidateEvent[]) {
  const predicted = events.length;
  const resolved = events.filter(isResolved).length;
  return { predicted, resolved, open: predicted - resolved };
}
