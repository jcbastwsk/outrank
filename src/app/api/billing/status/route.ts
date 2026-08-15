import { NextResponse } from "next/server";
import { getEntitlement, getUsage } from "../../../../lib/billing";
import { SCOUT_DAILY_CAP, unlimitedScores } from "../../../../lib/plans";
import { stripeConfigured } from "../../../../lib/stripe";

export async function GET() {
  const ent = await getEntitlement();
  const usage = await getUsage();
  return NextResponse.json({
    plan: ent.plan,
    email: ent.email ?? null,
    customerId: ent.customerId ?? null,
    stripe: stripeConfigured(),
    usage: {
      used: unlimitedScores(ent.plan) ? 0 : usage.n,
      cap: unlimitedScores(ent.plan) ? null : SCOUT_DAILY_CAP,
      remaining: unlimitedScores(ent.plan)
        ? null
        : Math.max(0, SCOUT_DAILY_CAP - usage.n),
    },
  });
}
