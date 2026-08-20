import { NextResponse } from "next/server";
import { PLAN_IDS, type PlanId } from "../../../lib/plans";
import {
  makeEntitlement,
  setEntitlement,
} from "../../../lib/billing";
import {
  billingOpen,
  createCheckoutSession,
  stripeConfigured,
} from "../../../lib/stripe";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    plan?: string;
    rail?: string;
    interval?: string;
    dev?: boolean;
  };
  const plan = body.plan as PlanId | undefined;
  if (!plan || !PLAN_IDS.includes(plan)) {
    return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  }
  if (plan === "scout") {
    return NextResponse.json({ url: "/app" });
  }
  const rail = body.rail === "crypto" ? "crypto" : "card";
  const interval = body.interval === "year" ? "year" : "month";

  if (!billingOpen()) {
    return NextResponse.json(
      {
        error: "billing_closed",
        message: "Checkout opens when live billing is configured.",
      },
      { status: 403 },
    );
  }

  if (stripeConfigured()) {
    try {
      const session = await createCheckoutSession(plan, rail, interval);
      if (!session.url) {
        return NextResponse.json(
          { error: "Stripe did not return a checkout URL" },
          { status: 502 },
        );
      }
      return NextResponse.json({ url: session.url });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "checkout failed" },
        { status: 502 },
      );
    }
  }

  const allowDev =
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_DEV_BILLING === "1";
  if (allowDev && body.dev) {
    await setEntitlement(makeEntitlement({ plan }));
    return NextResponse.json({ url: `/app?welcome=${plan}`, dev: true });
  }

  return NextResponse.json(
    {
      error: "stripe_not_configured",
      message:
        "Add STRIPE_SECRET_KEY to .env.local, then restart the server. In local dev you can still unlock a plan without Stripe.",
    },
    { status: 503 },
  );
}
