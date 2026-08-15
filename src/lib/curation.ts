import type { LaneId } from "./score";

export const OUTCOMES = ["blew_up", "worked", "mid", "died"] as const;
export type Outcome = (typeof OUTCOMES)[number];

export type CaseRecord = {
  id: string;
  createdAt: string;
  text: string;
  url?: string;
  context: string;
  outcome: Outcome;
  laneOverride?: LaneId;
  coach: {
    lane: LaneId;
    reach: number;
    grade: string;
    headline: string;
  };
};

export const OUTCOME_LABEL: Record<Outcome, string> = {
  blew_up: "Blew up",
  worked: "Worked",
  mid: "Mid",
  died: "Died",
};

export function renderPack(cases: CaseRecord[]): string {
  const lines = [
    "# Outrank curator pack",
    "",
    `Cases: ${cases.length}. Use these to retune lanes and priors.`,
    "",
  ];
  for (const c of cases) {
    lines.push(`## ${c.outcome} — ${c.coach.lane} / coach ${c.coach.grade} ${c.coach.reach}`);
    lines.push("");
    lines.push("```");
    lines.push(c.text);
    lines.push("```");
    if (c.url) lines.push(`URL: ${c.url}`);
    if (c.laneOverride) lines.push(`Human lane: ${c.laneOverride}`);
    lines.push(`Coach: ${c.coach.headline}`);
    if (c.context.trim()) {
      lines.push("");
      lines.push(`Context: ${c.context.trim()}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
