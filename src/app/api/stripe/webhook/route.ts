import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { upsertRecord, type BillingRecord } from "../../../../lib/billing";
import { getStripe } from "../../../../lib/stripe";
import type { PlanId } from "../../../../lib/plans";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not set" },
      { status: 503 },
    );
  }

  const stripe = getStripe();
  const raw = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "bad signature" },
      { status: 400 },
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const plan = session.metadata?.plan;
      const customerId =
        typeof session.customer === "string" ? session.customer : session.customer?.id;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;
      if (customerId && (plan === "pro" || plan === "studio")) {
        await upsertRecord({
          plan,
          status: "active",
          email: session.customer_details?.email ?? session.customer_email ?? undefined,
          customerId,
          subscriptionId,
          updatedAt: new Date().toISOString(),
        });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const plan = (sub.metadata?.plan as PlanId | undefined) ?? "pro";
      const status = mapStatus(sub.status);
      const rec: BillingRecord = {
        plan: plan === "studio" ? "studio" : "pro",
        status,
        customerId,
        subscriptionId: sub.id,
        updatedAt: new Date().toISOString(),
      };
      if (event.type === "customer.subscription.deleted") {
        rec.status = "canceled";
        rec.plan = "scout";
      }
      await upsertRecord(rec);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

function mapStatus(status: string): BillingRecord["status"] {
  switch (status) {
    case "active":
    case "canceled":
    case "past_due":
    case "unpaid":
    case "incomplete":
      return status;
    case "trialing":
      return "active";
    default:
      return "unpaid";
  }
}
