import { NextResponse } from "next/server";
import { getEntitlement } from "../../../../lib/billing";
import { appUrl, getStripe, stripeConfigured } from "../../../../lib/stripe";

export async function POST() {
  if (!stripeConfigured()) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
  }
  const ent = await getEntitlement();
  if (!ent.customerId) {
    return NextResponse.json(
      { error: "No Stripe customer on this session. Check out first." },
      { status: 400 },
    );
  }
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: ent.customerId,
    return_url: `${appUrl()}/app`,
  });
  return NextResponse.json({ url: session.url });
}
