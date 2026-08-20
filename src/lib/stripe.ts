import Stripe from "stripe";
import { planById, type PlanId } from "./plans";
import { appUrl as siteAppUrl } from "./site";

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** Public checkout only when live billing is on. Test keys must not sell. */
export function billingOpen() {
  return stripeMode() === "live" || process.env.BILLING_OPEN === "1";
}

export function stripeMode(): "off" | "test" | "live" {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  if (key.startsWith("sk_test_")) return "test";
  if (key.startsWith("sk_live_")) return "live";
  return key ? "live" : "off";
}

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(key);
}

export function appUrl() {
  return siteAppUrl();
}

export type CheckoutRail = "card" | "crypto";
export type CheckoutInterval = "month" | "year";

/**
 * Card = monthly Stripe subscription.
 * Crypto = one-time USDC (and other Stripe stablecoins) for one month.
 * This account cannot put `crypto` on a subscription Checkout Session;
 * recurring wallet billing is a Stripe preview we do not have.
 */
export async function createCheckoutSession(
  planId: PlanId,
  rail: CheckoutRail = "card",
  interval: CheckoutInterval = "month",
) {
  if (planId === "scout") {
    throw new Error("Scout is free");
  }
  const plan = planById(planId);
  if (!plan) throw new Error("Unknown plan");

  const stripe = getStripe();
  const origin = appUrl();
  const success_url = `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancel_url = `${origin}/pricing?canceled=1`;

  if (rail === "crypto") {
    return stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["crypto"],
      customer_creation: "always",
      billing_address_collection: "auto",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: plan.priceCents,
            product_data: {
              name: `Outrank ${plan.name} — one month`,
              description: `${plan.blurb} Paid in stablecoin. Does not auto-renew.`,
            },
          },
        },
      ],
      success_url,
      cancel_url,
      metadata: { plan: planId, rail: "crypto" },
    });
  }

  const priceId =
    interval === "year"
      ? planId === "studio"
        ? process.env.STRIPE_PRICE_STUDIO_YEAR
        : process.env.STRIPE_PRICE_PRO_YEAR
      : planId === "studio"
        ? process.env.STRIPE_PRICE_STUDIO
        : process.env.STRIPE_PRICE_PRO;

  const amount = interval === "year" ? plan.yearCents : plan.priceCents;
  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = priceId
    ? [{ price: priceId, quantity: 1 }]
    : [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amount,
            recurring: { interval },
            product_data: {
              name: `Outrank ${plan.name}`,
              description:
                interval === "year"
                  ? `${plan.blurb} Billed annually.`
                  : plan.blurb,
            },
          },
        },
      ];

  return stripe.checkout.sessions.create({
    mode: "subscription",
    line_items,
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    success_url,
    cancel_url,
    metadata: { plan: planId, rail: "card", interval },
    subscription_data: { metadata: { plan: planId, interval } },
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
