import { NextResponse } from "next/server";
import {
  makeEntitlement,
  setEntitlement,
  upsertRecord,
} from "../../../../lib/billing";
import { getStripe, planFromSession, stripeConfigured } from "../../../../lib/stripe";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { session_id?: string };
  const sessionId = body.session_id;
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }
  if (!stripeConfigured()) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });

  if (session.mode !== "subscription") {
    return NextResponse.json({ error: "Not a subscription session" }, { status: 400 });
  }
  if (session.status !== "complete" && session.payment_status === "unpaid") {
    return NextResponse.json({ error: "Checkout not complete" }, { status: 402 });
  }

  const plan = planFromSession(session);
  if (!plan) {
    return NextResponse.json({ error: "No plan on session" }, { status: 400 });
  }

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  if (customerId) {
    await upsertRecord({
      plan,
      status: "active",
      email: session.customer_details?.email ?? session.customer_email ?? undefined,
      customerId,
      subscriptionId,
      updatedAt: new Date().toISOString(),
    });
  }

  await setEntitlement(
    makeEntitlement({
      plan,
      email: session.customer_details?.email ?? session.customer_email ?? undefined,
      customerId,
      subscriptionId,
    }),
  );

  return NextResponse.json({ plan, email: session.customer_details?.email });
}
