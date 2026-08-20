/**
 * The proprietary layer.
 *
 * Anyone can multiply published weights by a text prior:
 *   score = Σ w_i × P̂(action_i | text)
 * Phoenix is P(action | viewer, author, candidate). We do not have that.
 *
 * What we keep is the residual: for this desk, this format, this predicted
 * Mutuals/Cold split — what actually happened, and which layer failed.
 *
 *   rank      — the physics (weights, OON, 48h, diversity)
 *   suppress  — a visibility label (Under the Hood)
 *   slate     — they spent the second original
 *   unknown   — not enough to say
 *
 * When param.rs moves, recompute the physics. The residual still applies.
 * That is the asset a screenshot of the weights table cannot clone.
 */

export type ResultKind =
  | "right_room"
  | "wrong_viral"
  | "dead"
  | "suppressed"
  | "conflict"
  | "clients";

export const RESULT_META: Record<
  ResultKind,
  { label: string; blurb: string; layer: Layer }
> = {
  right_room: {
    label: "Right room",
    blurb: "The people you named showed up.",
    layer: "rank",
  },
  wrong_viral: {
    label: "Wrong virality",
    blurb: "Reach without the audience you chose.",
    layer: "rank",
  },
  dead: {
    label: "Dead",
    blurb: "Nothing. The prior was high or the slot was spent.",
    layer: "unknown",
  },
  suppressed: {
    label: "Labeled",
    blurb: "A visibility filter, not the ranker.",
    layer: "suppress",
  },
  conflict: {
    label: "Useful fight",
    blurb: "The right argument, on purpose.",
    layer: "rank",
  },
  clients: {
    label: "Work appeared",
    blurb: "A buyer, a brief, an inbound.",
    layer: "rank",
  },
};

export type Layer = "rank" | "suppress" | "slate" | "unknown";

export type ResidualPair = {
  id: string;
  at: string;
  excerpt: string;
  verdict: string;
  predictedGraph: number;
  predictedCold: number;
  format: string;
  result: ResultKind;
  layer: Layer;
  note: string;
};

export function residualRead(pairs: ResidualPair[]): {
  n: number;
  note: string;
  last: ResidualPair | null;
} {
  const last = pairs[0] ?? null;
  if (!last) {
    return {
      n: 0,
      note: "No outcomes logged. The prior is uncalibrated for this desk.",
      last: null,
    };
  }
  const right = pairs.filter((p) => p.result === "right_room" || p.result === "clients").length;
  const wrong = pairs.filter((p) => p.result === "wrong_viral").length;
  const dead = pairs.filter((p) => p.result === "dead").length;
  const labeled = pairs.filter((p) => p.result === "suppressed").length;
  const bits = [
    last.result === "right_room"
      ? "Last time the named audience showed up. Do not recap it."
      : last.result === "wrong_viral"
        ? "Last time it traveled to the wrong room. Do not chase that shape."
        : last.result === "dead"
          ? "Last predicted-good draft died. Treat the prior as hot until we know why."
          : last.result === "suppressed"
            ? "Last death was a label, not the ranker. Drop the JSON before another original."
            : last.result === "clients"
              ? "Last time work appeared. Stay in that claim. Do not costume."
              : "Last time the fight was useful. Do not sand it.",
  ];
  if (pairs.length >= 3) {
    bits.push(
      `On this desk: ${right} right-room, ${wrong} wrong-viral, ${dead} dead, ${labeled} labeled of ${pairs.length}.`,
    );
  }
  return { n: pairs.length, note: bits.join(" "), last };
}

export function residualNext(last: ResidualPair): { action: string; why: string; kind: "hold" | "reply" | "develop" | "publish" } {
  if (last.result === "suppressed") {
    return {
      kind: "hold",
      action: "Do not post another original. Drop the Under the Hood JSON first.",
      why: "A label hid the last one. Ranking advice will not unstick a filter.",
    };
  }
  if (last.result === "wrong_viral") {
    return {
      kind: "hold",
      action: "Do not ship another portable recap. Write for the named room only.",
      why: last.note || "Wrong virality trains the graph you said you do not want.",
    };
  }
  if (last.result === "dead") {
    return {
      kind: "reply",
      action: "Reply into a live thread instead of another original.",
      why: "The last original did not pay. A reply still gets the conversation head without spending the slate.",
    };
  }
  if (last.result === "clients" || last.result === "right_room") {
    return {
      kind: "reply",
      action: "Stay in the replies of what just worked. Do not recap it as a new original.",
      why: last.note || "The audience already has the claim. Author-diversity will tax a second post.",
    };
  }
  return {
    kind: "develop",
    action: "Keep the unfinished edge. Do not sand the fight.",
    why: last.note || "Useful conflict is an outcome you named.",
  };
}
