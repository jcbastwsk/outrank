import Stripe from "stripe";
import { planById, type PlanId } from "./plans";

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(key);
}

export function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:3000"
  );
}

export async function createCheckoutSession(planId: PlanId) {
  if (planId === "scout") {
    throw new Error("Scout is free");
  }
  const plan = planById(planId);
  if (!plan) throw new Error("Unknown plan");

  const stripe = getStripe();
  const origin = appUrl();
  const priceId =
    planId === "studio"
      ? process.env.STRIPE_PRICE_STUDIO
      : process.env.STRIPE_PRICE_PRO;

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = priceId
    ? [{ price: priceId, quantity: 1 }]
    : [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: plan.priceCents,
            recurring: { interval: "month" },
            product_data: {
              name: `Outrank ${plan.name}`,
              description: plan.blurb,
            },
          },
        },
      ];

  return stripe.checkout.sessions.create({
    mode: "subscription",
    line_items,
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing?canceled=1`,
    metadata: { plan: planId },
    subscription_data: { metadata: { plan: planId } },
  });
}

export function planFromSession(
  session: Stripe.Checkout.Session,
): PlanId | null {
  const fromMeta = session.metadata?.plan;
  if (fromMeta === "pro" || fromMeta === "studio") return fromMeta;
  const sub = session.subscription;
  if (sub && typeof sub !== "string") {
    const p = sub.metadata?.plan;
    if (p === "pro" || p === "studio") return p;
  }
  return null;
}
