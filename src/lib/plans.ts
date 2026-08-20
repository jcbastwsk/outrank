export const PLAN_IDS = ["scout", "pro", "studio"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export type Plan = {
  id: PlanId;
  name: string;
  priceCents: number;
  yearCents: number;
  period: string;
  blurb: string;
  points: string[];
  soon?: string[];
  highlight?: boolean;
  cta: string;
};

/** Display names. Internal ids stay scout/pro/studio so existing entitlements still match. */
export function planLabel(id: PlanId) {
  return id === "studio" ? "Agency" : id === "pro" ? "Pro" : "Radar";
}

export const PLANS: Plan[] = [
  {
    id: "scout",
    name: "Radar",
    priceCents: 0,
    yearCents: 0,
    period: "forever",
    blurb: "The published ranking table.",
    points: [
      "Current numbers from the public X ranking file",
      "A note if those numbers change",
      "Three draft readings a day",
    ],
    cta: "Open Radar",
  },
  {
    id: "pro",
    name: "Pro",
    priceCents: 2900,
    yearCents: 29000,
    period: "/ month",
    blurb: "The coach for one X account.",
    points: [
      "A saved profile",
      "Draft advice against your recent posts",
      "A record of what happened",
      "A note if the public ranking numbers change",
    ],
    highlight: true,
    cta: "Start Pro",
  },
  {
    id: "studio",
    name: "Agency",
    priceCents: 14900,
    yearCents: 149000,
    period: "/ month",
    blurb: "Up to ten accounts.",
    points: [
      "Everything in Pro",
      "Ten accounts",
      "Simple client reports",
    ],
    soon: ["Ten-account workspace", "Client PDF", "Slack notes"],
    cta: "Start Agency",
  },
];

export const SCOUT_DAILY_CAP = 3;

export function planById(id: string | null | undefined): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function isPaidPlan(id: PlanId) {
  return id === "pro" || id === "studio";
}

export function canUseHood(id: PlanId) {
  return id === "pro" || id === "studio";
}

export function unlimitedScores(id: PlanId) {
  return id === "pro" || id === "studio";
}

export function rank(id: PlanId) {
  return id === "studio" ? 2 : id === "pro" ? 1 : 0;
}
