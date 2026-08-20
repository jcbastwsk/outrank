import { NextResponse } from "next/server";
import { consumeScore } from "../../../lib/billing";
import { briefDraft } from "../../../lib/brief";
import { coachDraft } from "../../../lib/coach";
import { scoreDraft } from "../../../lib/score";
import type { StrategicProfile } from "../../../lib/strategy";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(req: Request) {
  const quota = await consumeScore(req);
  if (!quota.ok && quota.error === "bad_token") {
    return NextResponse.json(
      {
        error: "bad_token",
        message:
          "Extension token expired. Open outrank.coach once so we can attach your plan.",
      },
      { status: 401 },
    );
  }
  if (!quota.ok && quota.error === "need_token") {
    return NextResponse.json(
      {
        error: "need_token",
        message:
          "Open outrank.coach once with the extension on. That attaches your plan to this browser.",
      },
      { status: 401 },
    );
  }
  if (!quota.ok) {
    return NextResponse.json(
      {
        error: "scout_limit",
        message:
          "Scout includes 3 API scores per day. Upgrade to Pro for unlimited.",
        remaining: 0,
        plan: quota.plan,
        billing: { plan: quota.plan, remaining: 0, token: quota.token },
      },
      { status: 402 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    text?: string;
    profile?: StrategicProfile | null;
  };
  const text = typeof body.text === "string" ? body.text : "";
  const result = body.profile
    ? briefDraft(text, body.profile)
    : coachDraft(scoreDraft(text));
  return NextResponse.json({
    ...result,
    billing: {
      plan: quota.plan,
      remaining: quota.remaining === Infinity ? null : quota.remaining,
      token: quota.token,
    },
  });
}
