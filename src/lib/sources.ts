/**
 * Official public sources for any claim we make about X ranking.
 * Commit for home-mixer/params/param.rs as of this audit.
 */
export const UPSTREAM = {
  repo: "xai-org/x-algorithm",
  repoUrl: "https://github.com/xai-org/x-algorithm",
  paramPath: "home-mixer/params/param.rs",
  paramUrl:
    "https://github.com/xai-org/x-algorithm/blob/c65aa179db7bdd61e2c2821eac87f208a105c053/home-mixer/params/param.rs",
  paramRaw:
    "https://raw.githubusercontent.com/xai-org/x-algorithm/c65aa179db7bdd61e2c2821eac87f208a105c053/home-mixer/params/param.rs",
  sha: "c65aa179db7bdd61e2c2821eac87f208a105c053",
  shaShort: "c65aa179db7b",
  fileNote: "2026-08-12T04:09:22Z",
  fetchedAt: "2026-08-16",
  bidirectionalDoc:
    "https://github.com/xai-org/x-algorithm/blob/main/docs/BIDIRECTIONAL_BOOST_CHANGE.md",
  techcrunchAug13:
    "https://techcrunch.com/2026/08/13/x-open-sources-its-ranking-algorithm-letting-users-see-if-theyve-been-shadowbanned/",
} as const;

export type ClaimClass =
  | "VERIFIED"
  | "INFERENCE"
  | "MODEL ESTIMATE"
  | "UNSUPPORTED";

export type SourceClaim = {
  claim: string;
  class: ClaimClass;
  path?: string;
  symbol?: string;
  sha?: string;
  url?: string;
  note: string;
};

export const CLAIMS: SourceClaim[] = [
  {
    claim: "Public For You scorer combines predicted per-viewer action probabilities with named weights.",
    class: "VERIFIED",
    path: "home-mixer/params/param.rs",
    sha: UPSTREAM.sha,
    url: UPSTREAM.paramUrl,
    note: "Comment in param.rs: weights multiply predicted probabilities or continuous values, not raw engagement counts.",
  },
  {
    claim: "ShareViaCopyLinkWeight default 20.0, ReplyWeight 5.0, FavoriteWeight 0.5, ReportWeight -234.0, BidirectionalFollowReplyWeightBoost 15.0, OonWeightFactor 0.75, AuthorDiversityDecay 0.5 exist as feature-switch defaults in the public file.",
    class: "VERIFIED",
    path: "home-mixer/params/param.rs",
    symbol: "ShareViaCopyLinkWeight, ReplyWeight, FavoriteWeight, ReportWeight, BidirectionalFollowReplyWeightBoost, OonWeightFactor, AuthorDiversityDecay",
    sha: UPSTREAM.sha,
    url: UPSTREAM.paramUrl,
    note: "These are published defaults in the open file. The file itself says they are mirrored from feature-switch defaults and are not raw event points.",
  },
  {
    claim: "A reply is 10× a like as accumulated events.",
    class: "UNSUPPORTED",
    path: "home-mixer/params/param.rs",
    url: UPSTREAM.paramUrl,
    note: "Source explicitly forbids reading weight ratios as count equivalences.",
  },
  {
    claim: "One report wipes 468 likes.",
    class: "UNSUPPORTED",
    path: "home-mixer/params/param.rs",
    url: UPSTREAM.paramUrl,
    note: "Source names this exact misreading and rejects it. Report prior is described as >1000× rarer than a like.",
  },
  {
    claim: "August 13 2026 expansion of the public ranking codebase.",
    class: "VERIFIED",
    url: UPSTREAM.techcrunchAug13,
    note: "TechCrunch 2026-08-13. GitHub commit 47c1bcdadfe4 same day; later param.rs tip c65aa179db7b (2026-08-14).",
  },
  {
    claim: "Bidirectional follow reply boost A/B 10 Jul, broad 20 on 13 Jul, default 15 on 24 Jul.",
    class: "VERIFIED",
    path: "docs/BIDIRECTIONAL_BOOST_CHANGE.md",
    url: UPSTREAM.bidirectionalDoc,
    note: "Official example diff in the public repo.",
  },
  {
    claim: "These defaults are the live production values served to every viewer right now.",
    class: "INFERENCE",
    path: "home-mixer/params/param.rs",
    url: UPSTREAM.paramUrl,
    note: "File is labeled feature-switch defaults. Experiments and per-request overrides exist. We do not observe the live switch table.",
  },
  {
    claim: "Outrank can predict how a draft will rank.",
    class: "MODEL ESTIMATE",
    note: "We do not run Phoenix. Any draft read is an estimate of how the text may invite or discourage predicted actions.",
  },
];
