export type AlgoEvent = {
  date: string;
  title: string;
  impact: "weights" | "pipeline" | "transparency" | "experiment";
  summary: string;
  whatToDo: string;
  source: string;
  /** Show on Radar. Pipeline history stays off the instrument. */
  radar?: boolean;
};

export const ALGO_CHANGELOG: AlgoEvent[] = [
  {
    date: "2026-08-13",
    title: "X publishes ranking source and feature-switch defaults",
    impact: "transparency",
    summary:
      "param.rs publishes named coefficients used to combine predicted viewer actions. They are not accumulated event points.",
    whatToDo:
      "Treat the public file as a dated snapshot of defaults, not a live switch table for every viewer.",
    source: "https://techcrunch.com/2026/08/13/x-open-sources-its-ranking-algorithm-letting-users-see-if-theyve-been-shadowbanned/",
    radar: true,
  },
  {
    date: "2026-07-24",
    title: "Bidirectional follow reply boost 20 → 15",
    impact: "weights",
    summary:
      "BidirectionalFollowReplyWeightBoost cut 20 → 15 so more out-of-network conversation could surface.",
    whatToDo:
      "Effective mutual reply is 20, not 25. Originals only. Replies and reposts never had the boost.",
    source: "docs/BIDIRECTIONAL_BOOST_CHANGE.md",
    radar: true,
  },
  {
    date: "2026-07-13",
    title: "Mutual-follow reply boost rolls out at 20",
    impact: "weights",
    summary:
      "Broad launch of BidirectionalFollowReplyWeightBoost=20 on original posts from accounts you mutually follow. Dwell boost was tested and not shipped (still 0).",
    whatToDo:
      "Originals to mutuals, not reply-guy volume. Dwell boost was tested and left at 0.",
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

export function radarEvents() {
  return ALGO_CHANGELOG.filter((e) => e.radar);
}

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
