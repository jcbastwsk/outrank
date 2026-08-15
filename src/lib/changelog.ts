export type AlgoEvent = {
  date: string;
  title: string;
  impact: "weights" | "pipeline" | "transparency" | "experiment";
  summary: string;
  whatToDo: string;
  source: string;
};

export const ALGO_CHANGELOG: AlgoEvent[] = [
  {
    date: "2026-08-13",
    title: "Production weights and visibility filtering go public",
    impact: "transparency",
    summary:
      "xai-org/x-algorithm expands 10–15×. home-mixer/params/param.rs now publishes the live-default action weights. Visibility filtering, Scarecrow/Botmaker, Agatha, SimClusters, and Phoenix training code ship. Under the Hood report launches for eligible accounts.",
    whatToDo:
      "Treat the published weights as the source of truth. Recalibrate every playbook that still cites the 2023 Heavy Ranker numbers (those are stale).",
    source: "https://github.com/xai-org/x-algorithm + TechCrunch 2026-08-13",
  },
  {
    date: "2026-07-24",
    title: "Bidirectional follow reply boost 20 → 15",
    impact: "weights",
    summary:
      "After the World Cup weekend, X cut BidirectionalFollowReplyWeightBoost from 20.0 to 15.0 so more OON conversation (people you don't mutually follow) could surface.",
    whatToDo:
      "Mutuals still matter — effective reply weight is 5+15=20, not 25. Originals only; replies and reposts never got this boost.",
    source: "docs/BIDIRECTIONAL_BOOST_CHANGE.md",
  },
  {
    date: "2026-07-13",
    title: "Mutual-follow reply boost rolls out at 20",
    impact: "weights",
    summary:
      "Broad launch of BidirectionalFollowReplyWeightBoost=20 on original posts from accounts you mutually follow. Dwell boost was tested and not shipped (still 0).",
    whatToDo:
      "Prioritize original posts over reply-guy volume if you want the boost. Build a real mutual graph in your niche.",
    source: "docs/BIDIRECTIONAL_BOOST_CHANGE.md",
  },
  {
    date: "2026-07-10",
    title: "Bidirectional boost A/B test starts",
    impact: "experiment",
    summary:
      "Small percentages of viewers assigned boost values of 5, 10, 15, or 20. Most users still at 0.",
    whatToDo: "Ignore anecdata from this week — feeds were split on purpose.",
    source: "docs/BIDIRECTIONAL_BOOST_CHANGE.md",
  },
  {
    date: "2026-05-15",
    title: "Grox, ads blender, Phoenix pipeline",
    impact: "pipeline",
    summary:
      "Largest 2026 commit before August: Grox classifiers, ads module, phoenix/run_pipeline.py, more hydrators and sources.",
    whatToDo:
      "Content is classified, not just engaged with. Spam-shaped posts get filtered before ranking.",
    source: "xai-org/x-algorithm May 15 2026 commit",
  },
  {
    date: "2026-01-20",
    title: "Grok-powered Phoenix ranker open-sourced",
    impact: "pipeline",
    summary:
      "xAI replaces the old Scala Heavy Ranker dump with a Rust/Python Phoenix transformer and commits to public updates.",
    whatToDo:
      "Stop optimizing for 2023 hand-tuned features (TweepCred thresholds, static 13.5 reply weights). The heads are predicted, then weighted.",
    source: "github.com/xai-org/x-algorithm",
  },
];

export const WATCHED_PARAMS = [
  "FavoriteWeight",
  "ReplyWeight",
  "BidirectionalFollowReplyWeightBoost",
  "BidirectionalFollowDwellWeightBoost",
  "RetweetWeight",
  "ShareViaCopyLinkWeight",
  "ShareViaDmWeight",
  "ShareWeight",
  "QuoteWeight",
  "FollowAuthorWeight",
  "OpenLinkWeight",
  "ProfileClickWeight",
  "DwellWeight",
  "ContDwellTimeWeight",
  "NotInterestedWeight",
  "MuteAuthorWeight",
  "BlockAuthorWeight",
  "ReportWeight",
  "OonWeightFactor",
  "AuthorDiversityDecay",
  "AuthorDiversityFloor",
];

export function parseParamFile(source: string): Record<string, string> {
  const out: Record<string, string> = {};
  const blocks = source.split("param!(").slice(1);
  for (const block of blocks) {
    const end = block.indexOf(");");
    if (end === -1) continue;
    const parts = block
      .slice(0, end)
      .split(",")
      .map((s) => s.trim());
    if (parts.length < 4) continue;
    const name = parts[0];
    if (!/^[A-Za-z0-9_]+$/.test(name)) continue;
    out[name] = parts.slice(3).join(",").trim();
  }
  return out;
}

export function diffParams(
  previous: Record<string, string>,
  next: Record<string, string>,
) {
  const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);
  const changes: {
    key: string;
    from: string | null;
    to: string | null;
    watched: boolean;
  }[] = [];
  for (const key of keys) {
    const from = previous[key] ?? null;
    const to = next[key] ?? null;
    if (from !== to) {
      changes.push({
        key,
        from,
        to,
        watched: WATCHED_PARAMS.includes(key),
      });
    }
  }
  changes.sort((a, b) => Number(b.watched) - Number(a.watched) || a.key.localeCompare(b.key));
  return changes;
}
