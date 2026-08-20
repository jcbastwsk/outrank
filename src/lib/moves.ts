import { nid, type DeskState, type Recommendation } from "./model";

export function deriveRecommendations(desk: DeskState): Recommendation[] {
  const recs: Recommendation[] = [];
  const p = desk.profile;
  const failed = desk.posts.filter((x) => x.outcome === "failed").slice(0, 4);
  const defensiveMem = desk.memories.find(
    (m) => m.state !== "corrected" && /defensive|reactive|restat/i.test(m.pattern),
  );
  const termMem = desk.memories.find(
    (m) => m.state !== "corrected" && /terminolog|aphoris|sentence/i.test(m.pattern),
  );

  if (defensiveMem || failed.length >= 2) {
    recs.push({
      id: nid(),
      kind: "wait",
      action:
        "Do not post another defensive explanation this week. Keep the first sentence. Attach a concrete example tomorrow.",
      why: defensiveMem
        ? defensiveMem.pattern
        : `${failed.length} recent posts you marked failed were restatements.`,
      goal: p.outcomes[0] ?? "reputation",
      evidence: defensiveMem?.evidence || failed.map((x) => x.date.slice(0, 10)).join(", "),
      confidence: defensiveMem ? defensiveMem.confidence : 0.62,
      timing: "After 24 hours without an original.",
      status: "open",
    });
  }

  recs.push({
    id: nid(),
    kind: "publish",
    action: "Write the next unfinished claim. Do not recap the last one.",
    why: termMem
      ? termMem.pattern
      : "One new sentence. Not a restatement.",
    goal: p.outcomes.includes("influence") ? "influence" : p.outcomes[0] ?? "reputation",
    evidence: desk.posts[0] ? "Against the last saved post, not the intake form." : "No posts on file yet.",
    confidence: desk.posts.length ? 0.58 : 0.4,
    status: "open",
  });

  if (p.aggression === "restrained") {
    recs.push({
      id: nid(),
      kind: "hold",
      action: "Skip it if you are only reacting to someone.",
      why: "You asked us to be restrained. A reaction post is usually not worth it.",
      goal: "reputation",
      evidence: "You chose restrained coaching.",
      confidence: 0.66,
      status: "open",
    });
  }

  return recs.slice(0, 6);
}
