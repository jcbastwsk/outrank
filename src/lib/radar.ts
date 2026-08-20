import {
  diffParams,
  parseParamFile,
  WATCHED_PARAMS,
} from "./changelog";
import { PARAM_SNAPSHOT } from "./snapshot";
import {
  ACTION_WEIGHTS,
  ALGO_SOURCE,
  BOOSTS,
  WEIGHT_ROWS,
} from "./weights";

export type RadarChange = {
  key: string;
  from: string | null;
  to: string | null;
  watched: boolean;
  label: string;
  play: string;
};

export type LiveDiff = {
  synced: boolean;
  compared: number;
  parsed: number;
  snapshotAt: string;
  checkedAt: string;
  error?: string;
  changes: RadarChange[];
};

/** One line an operator can act on. Missing keys fall back to the param name. */
const PARAM_PLAY: Record<string, string> = {
  ShareViaCopyLinkWeight: "Highest published positive coefficient. One portable line.",
  ReplyWeight: "Conversation coefficient. Not an event-count equivalent.",
  QuoteWeight: "Same published coefficient as a reply.",
  ShareViaDmWeight: "Same published coefficient as a reply.",
  FollowAuthorWeight: "Follow from the post. Published coefficient 4.0.",
  ShareWeight: "Generic share. Weaker than copy-link in the published file.",
  FavoriteWeight: "The baseline coefficient. Cheap. Do not write for this.",
  RetweetWeight: "A repost. Published coefficient 1.0.",
  OpenLinkWeight: "Small upside. Put the URL in a reply.",
  ProfileClickWeight: "Published at 0. Skip 'follow for more'.",
  DwellWeight: "Binary dwell is 0. Continuous time still exists.",
  ContDwellTimeWeight: "Seconds they look. Anti-scroll, small per tick.",
  BidirectionalFollowReplyWeightBoost:
    "Added to Reply on originals from mutuals. Replies and reposts do not get it.",
  BidirectionalFollowDwellWeightBoost: "Tested. Not shipped. Still 0.",
  OonWeightFactor: "Out-of-network multiplier. Cold For You is discounted.",
  AuthorDiversityDecay: "Each extra original in a slate is cheaper.",
  AuthorDiversityFloor: "Dump floor. Do not stack originals.",
  NotInterestedWeight: "Show-less. Dwarfs a like.",
  MuteAuthorWeight: "Worse than a block in this ranker.",
  BlockAuthorWeight: "Severe. Mute is worse.",
  ReportWeight: "Catastrophic. We do not coach this.",
};

export function paramLabel(key: string): string {
  return WEIGHT_ROWS.find((w) => w.param === key)?.label ?? key;
}

export function paramPlay(key: string): string {
  return PARAM_PLAY[key] ?? "Published default. We do not invent a play.";
}

export function decorateChange(c: {
  key: string;
  from: string | null;
  to: string | null;
  watched: boolean;
}): RadarChange {
  return {
    ...c,
    label: paramLabel(c.key),
    play: paramPlay(c.key),
  };
}

export async function fetchLiveDiff(): Promise<LiveDiff> {
  const checkedAt = new Date().toISOString();
  try {
    const res = await fetch(ALGO_SOURCE.rawUrl, {
      headers: { "User-Agent": "outrank-radar/0.1" },
      cache: "no-store",
    });
    if (!res.ok) {
      return {
        synced: false,
        compared: Object.keys(PARAM_SNAPSHOT).length,
        parsed: 0,
        snapshotAt: ALGO_SOURCE.snapshotAt,
        checkedAt,
        error: `GitHub returned ${res.status}`,
        changes: [],
      };
    }
    const live = parseParamFile(await res.text());
    const compared: Record<string, string> = { ...PARAM_SNAPSHOT };
    for (const key of Object.keys(PARAM_SNAPSHOT)) {
      if (live[key] !== undefined) compared[key] = live[key];
    }
    const raw = diffParams(PARAM_SNAPSHOT, compared).filter(
      (c) => c.key in PARAM_SNAPSHOT || WATCHED_PARAMS.includes(c.key),
    );
    return {
      synced: raw.length === 0,
      compared: Object.keys(PARAM_SNAPSHOT).length,
      parsed: Object.keys(live).length,
      snapshotAt: ALGO_SOURCE.snapshotAt,
      checkedAt,
      changes: raw.map(decorateChange),
    };
  } catch (e) {
    return {
      synced: false,
      compared: Object.keys(PARAM_SNAPSHOT).length,
      parsed: 0,
      snapshotAt: ALGO_SOURCE.snapshotAt,
      checkedAt,
      error: e instanceof Error ? e.message : "fetch failed",
      changes: [],
    };
  }
}

export type StandingLine = {
  knob: string;
  value: string;
  order: string;
};

export function standingOrder(): StandingLine[] {
  return [
    {
      knob: "Copy-link",
      value: String(ACTION_WEIGHTS.shareViaCopyLink),
      order: "Highest published positive coefficient. Write something a group chat passes.",
    },
    {
      knob: "Reply / quote / DM",
      value: String(ACTION_WEIGHTS.reply),
      order: "Published coefficient 5.0. Conversation, not applause.",
    },
    {
      knob: "Mutual original",
      value: String(ACTION_WEIGHTS.reply + BOOSTS.bidirectionalFollowReply),
      order: `Reply ${ACTION_WEIGHTS.reply} + boost ${BOOSTS.bidirectionalFollowReply}. Originals only.`,
    },
    {
      knob: "Age / dump",
      value: `${BOOSTS.ageFilterHours}h / ${BOOSTS.authorDiversityDecay}`,
      order: "One original. Second post in a slate is half-price. Window is two days.",
    },
    {
      knob: "Report",
      value: String(ACTION_WEIGHTS.report),
      order: "Do not farm this. We will not coach it.",
    },
  ];
}

export type WatchedKnob = {
  param: string;
  label: string;
  value: string;
  play: string;
  kind: "positive" | "negative" | "boost" | "other";
};

export function watchedKnobs(): WatchedKnob[] {
  return WATCHED_PARAMS.map((param) => {
    const row = WEIGHT_ROWS.find((w) => w.param === param);
    return {
      param,
      label: row?.label ?? param,
      value: PARAM_SNAPSHOT[param] ?? (row ? String(row.value) : "—"),
      play: paramPlay(param),
      kind: row?.kind === "negative" || row?.kind === "boost" || row?.kind === "positive"
        ? row.kind
        : "other",
    };
  });
}
