import { NextResponse } from "next/server";
import { mintApiToken } from "../../../../lib/billing";
import { SCOUT_DAILY_CAP, unlimitedScores } from "../../../../lib/plans";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(req: Request) {
  const { token, ent, usage } = await mintApiToken(req);
  return NextResponse.json({
    token,
    plan: ent.plan,
    email: ent.email ?? null,
    exp: ent.exp,
    usage: {
      used: unlimitedScores(ent.plan) ? 0 : usage.n,
      cap: unlimitedScores(ent.plan) ? null : SCOUT_DAILY_CAP,
      remaining: unlimitedScores(ent.plan)
        ? null
        : Math.max(0, SCOUT_DAILY_CAP - usage.n),
    },
  });
}
