export const PLAN_IDS = ["scout", "pro", "studio"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export type Plan = {
  id: PlanId;
  name: string;
  priceCents: number;
  period: string;
  blurb: string;
  points: string[];
  highlight?: boolean;
  cta: string;
};

export const PLANS: Plan[] = [
  {
    id: "scout",
    name: "Scout",
    priceCents: 0,
    period: "forever",
    blurb: "Read the ranker.",
    points: [
      "Published weight table",
      "3 API / extension scores per day",
      "Public algo changelog",
    ],
    cta: "Open the weights",
  },
  {
    id: "pro",
    name: "Pro",
    priceCents: 1900,
    period: "/ month",
    blurb: "Coach every draft.",
    points: [
      "Unlimited draft + extension scores",
      "Chrome extension on x.com",
      "Weight-change radar",
      "First-hour playbook",
    ],
    highlight: true,
    cta: "Start Pro",
  },
  {
    id: "studio",
    name: "Studio",
    priceCents: 4900,
    period: "/ month",
    blurb: "The whole desk.",
    points: [
      "Everything in Pro",
      "5 accounts (coming next)",
      "Under the Hood interpreter",
      "Slack / email radar (coming next)",
    ],
    cta: "Start Studio",
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
  return id === "studio";
}

export function unlimitedScores(id: PlanId) {
  return id === "pro" || id === "studio";
}

export function rank(id: PlanId) {
  return id === "studio" ? 2 : id === "pro" ? 1 : 0;
}
