/**
 * Interpreter for X's "Under the Hood" transparency export.
 * https://x.com/i/under_the_hood
 *
 * We map published label names onto what visibility-filtering does
 * with them. We do not help anyone evade those systems.
 */

export type HoodFinding = {
  label: string;
  count?: number;
  severity: "info" | "warn" | "block";
  meaning: string;
  reachEffect: string;
};

export type HoodReport = {
  rawKeys: string[];
  findings: HoodFinding[];
  summary: string;
};

const LABEL_GUIDE: {
  match: RegExp;
  severity: HoodFinding["severity"];
  meaning: string;
  reachEffect: string;
}[] = [
  {
    match: /search.?ban|search_exclusion|do.?not.?amplify|drop/i,
    severity: "block",
    meaning: "A visibility label that can drop the post from recommendation surfaces.",
    reachEffect:
      "For You will not show this to people who do not already follow you. Followers may still see it.",
  },
  {
    match: /spam|scam|inauthentic|automation|bot/i,
    severity: "block",
    meaning: "Spam / inauthentic-behavior scores (Grox, BDSM, Agatha).",
    reachEffect:
      "High-recall spam rules drop OON recommendations. The same post can still be allowed to followers.",
  },
  {
    match: /nsfw|adult|graphic|gore|violent.?media/i,
    severity: "warn",
    meaning: "Media or text classified as adult/graphic.",
    reachEffect:
      "Usually interstitial, not a hard drop — and OON SimClusters filters can exclude the author entirely for non-followers.",
  },
  {
    match: /abuse|harass|hate/i,
    severity: "block",
    meaning: "Safety label from enforcement or classifiers.",
    reachEffect: "Likely DROP in visibility-filtering. Do not try to skirt this.",
  },
  {
    match: /low.?quality|clickbait/i,
    severity: "warn",
    meaning: "Quality classifier on the post or account.",
    reachEffect: "Deprioritized before or during ranking. Rewrite; don't obfuscate.",
  },
  {
    match: /mute|block|not.?interested/i,
    severity: "warn",
    meaning: "Aggregate of viewer-side negative actions on you.",
    reachEffect:
      "Each event is a huge negative head (mute −58.8, not-interested −43.2, block −31.2). The account-level pile-up also feeds Agatha.",
  },
  {
    match: /report/i,
    severity: "block",
    meaning: "Reports against the account or posts.",
    reachEffect: "ReportWeight is −234. This is the fastest way to fall out of For You.",
  },
  {
    match: /premium|verified|subscription/i,
    severity: "info",
    meaning: "Subscription / verification related label.",
    reachEffect: "Mostly eligibility (subscriber-only posts), not a ranking head.",
  },
  {
    match: /impressions?|views?/i,
    severity: "info",
    meaning: "Distribution statistic, not a penalty.",
    reachEffect:
      "Authors under 1,000 impressions can receive the cold-start slot boost (positions 15–16) if they also have <1,000 followers and the post is <24h old.",
  },
];

function asRecord(input: unknown): Record<string, unknown> {
  if (typeof input === "string") {
    try {
      return asRecord(JSON.parse(input));
    } catch {
      return { _unparsed: input };
    }
  }
  if (Array.isArray(input)) {
    return { items: input };
  }
  if (input && typeof input === "object") {
    return input as Record<string, unknown>;
  }
  return { value: input };
}

function flatten(
  obj: Record<string, unknown>,
  prefix = "",
): { key: string; value: unknown }[] {
  const rows: { key: string; value: unknown }[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      rows.push(...flatten(v as Record<string, unknown>, key));
    } else {
      rows.push({ key, value: v });
    }
  }
  return rows;
}

export function interpretHood(input: unknown): HoodReport {
  const rec = asRecord(input);
  const rows = flatten(rec);
  const findings: HoodFinding[] = [];

  for (const row of rows) {
    const blob = `${row.key} ${String(row.value)}`;
    const hit = LABEL_GUIDE.find((g) => g.match.test(blob));
    if (!hit) continue;
    const count =
      typeof row.value === "number"
        ? row.value
        : Array.isArray(row.value)
          ? row.value.length
          : undefined;
    if (count === 0) continue;
    findings.push({
      label: row.key,
      count,
      severity: hit.severity,
      meaning: hit.meaning,
      reachEffect: hit.reachEffect,
    });
  }

  if (findings.length === 0) {
    findings.push({
      label: "No matching visibility labels",
      severity: "info",
      meaning:
        "Nothing in this export matched a known visibility-impacting label name. Either the account is clean, or X used a name we have not catalogued yet.",
      reachEffect:
        "If reach is still dead, look at ranking (weights, diversity, 48h age) before assuming a shadowban.",
    });
  }

  const blocked = findings.filter((f) => f.severity === "block").length;
  const warned = findings.filter((f) => f.severity === "warn").length;
  const summary =
    blocked > 0
      ? `${blocked} label${blocked === 1 ? "" : "s"} can drop you from recommendations. Fix the underlying behavior — do not try to evade the filter.`
      : warned > 0
        ? `${warned} warning-level label${warned === 1 ? "" : "s"}. These usually shrink OON reach rather than hide you from followers.`
        : "No drop-level labels detected in this file.";

  return {
    rawKeys: rows.map((r) => r.key),
    findings,
    summary,
  };
}

export const SAMPLE_HOOD = {
  account: {
    labels_30d: {
      spam_high_recall: 0,
      nsfw_author: 0,
      abuse_enforcement: 0,
    },
    negative_feedback_30d: {
      not_interested: 14,
      mute: 3,
      block: 1,
      report: 0,
    },
  },
  posts: [
    { id: "1", labels: ["low_quality"], impressions: 420 },
    { id: "2", labels: [], impressions: 8100 },
  ],
};
