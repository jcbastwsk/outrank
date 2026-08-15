/**
 * Production ranking weights mirrored from
 * https://github.com/xai-org/x-algorithm/blob/main/home-mixer/params/param.rs
 *
 * Last published default sync in that file: 2026-08-12T04:09:22Z
 * Repo drop that made these public: 2026-08-13
 *
 * We do not invent weights. When the file changes, update this snapshot
 * (or run `npm run sync-algo`) and add a changelog entry.
 */

export const ALGO_SOURCE = {
  repo: "xai-org/x-algorithm",
  file: "home-mixer/params/param.rs",
  rawUrl:
    "https://raw.githubusercontent.com/xai-org/x-algorithm/main/home-mixer/params/param.rs",
  commitNote: "Apache-2.0 For You ranker + visibility filtering",
  snapshotAt: "2026-08-12T04:09:22Z",
  publicDropAt: "2026-08-13",
};

export type WeightKind = "positive" | "negative" | "boost" | "gate";

export type WeightRow = {
  id: string;
  label: string;
  param: string;
  value: number;
  kind: WeightKind;
  unit?: "weight" | "factor" | "seconds" | "count" | "bool";
  meaning: string;
};

/** Phoenix action weights used in RankingScorer: score = Σ w_i * P(action_i). */
export const ACTION_WEIGHTS = {
  favorite: 0.5,
  reply: 5.0,
  retweet: 1.0,
  photoExpand: 0.05,
  videoOpen: 0.05,
  click: 0.4,
  openLink: 0.2,
  profileClick: 0.0,
  vqv: 0.05,
  share: 2.0,
  shareViaDm: 5.0,
  shareViaCopyLink: 20.0,
  dwell: 0.0,
  quote: 5.0,
  quotedClick: 0.05,
  quotedVqv: 0.0,
  followAuthor: 4.0,
  postUnexplored: 0.02,
  contDwellTime: 0.004,
  contClickDwellTime: 0.0,
  notInterested: -43.2,
  blockAuthor: -31.2,
  muteAuthor: -58.8,
  report: -234.0,
  notDwelled: -0.02,
} as const;

export const BOOSTS = {
  bidirectionalFollowReply: 15.0,
  bidirectionalFollowDwell: 0.0,
  authorDiversityDecay: 0.5,
  authorDiversityFloor: 0.25,
  oonWeightFactor: 0.75,
  topicOonWeightFactor: 0.5,
  coldStartImpressionThreshold: 1000,
  coldStartSlotMin: 15,
  coldStartSlotMax: 16,
  coldStartFollowerCap: 1000,
  coldStartMaxPostAgeSecs: 86400,
  ageFilterHours: 48,
} as const;

export const GATES = {
  enableRanking: true,
  enableAuthorDiversity: true,
  enableOonRescoreForInNetworkRepliesRetweets: true,
  enableBidirectionalFollowHydration: true,
  postUnexploredInNetworkOnly: true,
  valueModelMode: "weighted",
} as const;

export const WEIGHT_ROWS: WeightRow[] = [
  {
    id: "shareViaCopyLink",
    label: "Share via copy link",
    param: "ShareViaCopyLinkWeight",
    value: ACTION_WEIGHTS.shareViaCopyLink,
    kind: "positive",
    meaning:
      "Someone copies the post URL. Highest positive weight in the published ranker — 40× a like.",
  },
  {
    id: "reply",
    label: "Reply",
    param: "ReplyWeight",
    value: ACTION_WEIGHTS.reply,
    kind: "positive",
    meaning: "A public reply. 10× a like. The conversation engine of For You.",
  },
  {
    id: "quote",
    label: "Quote",
    param: "QuoteWeight",
    value: ACTION_WEIGHTS.quote,
    kind: "positive",
    meaning: "A quote post. Same weight as a reply. People adding their take.",
  },
  {
    id: "shareViaDm",
    label: "Share via DM",
    param: "ShareViaDmWeight",
    value: ACTION_WEIGHTS.shareViaDm,
    kind: "positive",
    meaning: "Forwarded in DMs. Same weight as a reply. Privately sendable posts win.",
  },
  {
    id: "followAuthor",
    label: "Follow author",
    param: "FollowAuthorWeight",
    value: ACTION_WEIGHTS.followAuthor,
    kind: "positive",
    meaning: "Viewer follows you from the post. 8× a like.",
  },
  {
    id: "share",
    label: "Share",
    param: "ShareWeight",
    value: ACTION_WEIGHTS.share,
    kind: "positive",
    meaning: "Generic share action. 4× a like.",
  },
  {
    id: "retweet",
    label: "Repost",
    param: "RetweetWeight",
    value: ACTION_WEIGHTS.retweet,
    kind: "positive",
    meaning: "A repost. Only 2× a like — weaker than a quote or a reply.",
  },
  {
    id: "favorite",
    label: "Like",
    param: "FavoriteWeight",
    value: ACTION_WEIGHTS.favorite,
    kind: "positive",
    meaning: "The baseline. Cheap, common, and now one of the weakest positive signals.",
  },
  {
    id: "click",
    label: "Post click",
    param: "ClickWeight",
    value: ACTION_WEIGHTS.click,
    kind: "positive",
    meaning: "Opening the post. Slightly below a like.",
  },
  {
    id: "openLink",
    label: "Open link",
    param: "OpenLinkWeight",
    value: ACTION_WEIGHTS.openLink,
    kind: "positive",
    meaning:
      "Clicking an outbound link. Small upside, and it usually kills dwell. Put links in a reply.",
  },
  {
    id: "photoExpand",
    label: "Photo expand",
    param: "PhotoExpandWeight",
    value: ACTION_WEIGHTS.photoExpand,
    kind: "positive",
    meaning: "Expanding an image. Tiny. Media helps more via dwell than via this head.",
  },
  {
    id: "videoOpen",
    label: "Video open",
    param: "VideoOpenWeight",
    value: ACTION_WEIGHTS.videoOpen,
    kind: "positive",
    meaning: "Opening a video. Tiny versus conversation heads.",
  },
  {
    id: "vqv",
    label: "Video quality view",
    param: "VqvWeight",
    value: ACTION_WEIGHTS.vqv,
    kind: "positive",
    meaning: "A quality video view. Present, but not the game.",
  },
  {
    id: "quotedClick",
    label: "Quoted-post click",
    param: "QuotedClickWeight",
    value: ACTION_WEIGHTS.quotedClick,
    kind: "positive",
    meaning: "Clicking through a quote. Minor.",
  },
  {
    id: "profileClick",
    label: "Profile click",
    param: "ProfileClickWeight",
    value: ACTION_WEIGHTS.profileClick,
    kind: "positive",
    meaning: "Published at 0. 'Follow for more' does not score via profile clicks.",
  },
  {
    id: "dwell",
    label: "Dwell (binary)",
    param: "DwellWeight",
    value: ACTION_WEIGHTS.dwell,
    kind: "positive",
    meaning: "The binary dwell head is currently weighted 0. Continuous dwell time still exists.",
  },
  {
    id: "contDwellTime",
    label: "Continuous dwell time",
    param: "ContDwellTimeWeight",
    value: ACTION_WEIGHTS.contDwellTime,
    kind: "positive",
    meaning: "How long they actually look. Small per-second weight; still the anti-scroll signal.",
  },
  {
    id: "bidirReply",
    label: "Mutual-follow reply boost",
    param: "BidirectionalFollowReplyWeightBoost",
    value: BOOSTS.bidirectionalFollowReply,
    kind: "boost",
    meaning:
      "Added to ReplyWeight for original posts (not replies/reposts) from accounts you mutually follow. Effective reply weight becomes 20. Rolled back from 20 → 15 on 2026-07-24.",
  },
  {
    id: "oon",
    label: "Out-of-network discount",
    param: "OonWeightFactor",
    value: BOOSTS.oonWeightFactor,
    kind: "boost",
    unit: "factor",
    meaning:
      "OON posts are multiplied by 0.75. In-network replies and reposts get the same discount.",
  },
  {
    id: "diversity",
    label: "Author diversity decay",
    param: "AuthorDiversityDecay",
    value: BOOSTS.authorDiversityDecay,
    kind: "boost",
    unit: "factor",
    meaning:
      "Each extra post from the same author in a slate is multiplied by 0.5^k, floored at 0.25. Don't dump.",
  },
  {
    id: "notDwelled",
    label: "Not dwelled",
    param: "NotDwelledWeight",
    value: ACTION_WEIGHTS.notDwelled,
    kind: "negative",
    meaning: "Scroll-past. Small per event, but it is the common death of a post.",
  },
  {
    id: "blockAuthor",
    label: "Block author",
    param: "BlockAuthorWeight",
    value: ACTION_WEIGHTS.blockAuthor,
    kind: "negative",
    meaning: "A block. Severe, but mute is worse in the published weights.",
  },
  {
    id: "notInterested",
    label: "Not interested",
    param: "NotInterestedWeight",
    value: ACTION_WEIGHTS.notInterested,
    kind: "negative",
    meaning: "'Show less' / not interested. ~86 likes of damage.",
  },
  {
    id: "muteAuthor",
    label: "Mute author",
    param: "MuteAuthorWeight",
    value: ACTION_WEIGHTS.muteAuthor,
    kind: "negative",
    meaning: "A mute. Worse than a block in this ranker (~118 likes of damage).",
  },
  {
    id: "report",
    label: "Report",
    param: "ReportWeight",
    value: ACTION_WEIGHTS.report,
    kind: "negative",
    meaning: "A report. Catastrophic. ~468 likes of damage. Do not farm this.",
  },
];

export function likeEquivalent(weight: number): number {
  return weight / ACTION_WEIGHTS.favorite;
}

export function rankedPositive() {
  return WEIGHT_ROWS.filter((w) => w.kind === "positive" && w.value > 0).sort(
    (a, b) => b.value - a.value,
  );
}

export function rankedNegative() {
  return WEIGHT_ROWS.filter((w) => w.kind === "negative").sort(
    (a, b) => a.value - b.value,
  );
}
