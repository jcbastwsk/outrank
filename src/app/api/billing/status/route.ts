import { NextResponse } from "next/server";
import { resolveAuth } from "../../../../lib/billing";
import { SCOUT_DAILY_CAP, unlimitedScores } from "../../../../lib/plans";
import { stripeConfigured, stripeMode } from "../../../../lib/stripe";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET(req: Request) {
  const resolved = await resolveAuth(req);
  if (!resolved.ok) {
    return NextResponse.json({
      plan: "scout",
      email: null,
      customerId: null,
      stripe: stripeConfigured(),
      stripeMode: stripeMode(),
      source: "anon",
      attached: false,
      error: "bad_token",
      usage: { used: 0, cap: SCOUT_DAILY_CAP, remaining: SCOUT_DAILY_CAP },
    });
  }

  const { ent, usage, source } = resolved.auth;
  return NextResponse.json({
    plan: ent.plan,
    email: ent.email ?? null,
    customerId: ent.customerId ?? null,
    stripe: stripeConfigured(),
    stripeMode: stripeMode(),
    source,
    attached: source !== "anon",
    usage: {
      used: unlimitedScores(ent.plan) ? 0 : usage.n,
      cap: unlimitedScores(ent.plan) ? null : SCOUT_DAILY_CAP,
      remaining: unlimitedScores(ent.plan)
        ? null
        : Math.max(0, SCOUT_DAILY_CAP - usage.n),
    },
  });
}
