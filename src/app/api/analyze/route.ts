import { NextResponse } from "next/server";
import { consumeScore } from "../../../lib/billing";
import { coachDraft } from "../../../lib/coach";
import { scoreDraft } from "../../../lib/score";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(req: Request) {
  const quota = await consumeScore();
  if (!quota.ok) {
    return NextResponse.json(
      {
        error: "scout_limit",
        message: "Scout includes 3 API scores per day. Upgrade to Pro for unlimited.",
        remaining: 0,
        plan: quota.plan,
      },
      { status: 402 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { text?: string };
  const text = typeof body.text === "string" ? body.text : "";
  const result = coachDraft(scoreDraft(text));
  return NextResponse.json({
    ...result,
    billing: { plan: quota.plan, remaining: quota.remaining },
  });
}
