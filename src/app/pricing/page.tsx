import Link from "next/link";
import { PricingGrid } from "../../components/PricingGrid";
import { SiteFooter, SiteHeader } from "../../components/SiteHeader";
import { billingOpen } from "../../lib/stripe";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string }>;
}) {
  const { canceled } = await searchParams;
  const open = billingOpen();

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-16">
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
          Pricing
        </p>
        <h1 className="serif mt-3 text-5xl">Pricing</h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">
          Radar is free and shows the published ranking numbers. Pro is the
          coach for one account. Agency is for up to ten accounts.
        </p>
        {canceled && (
          <p className="panel mt-6 px-4 py-3 text-sm text-[var(--muted)]">
            Checkout canceled. Nothing was charged.
          </p>
        )}
        {!open && (
          <p className="panel mt-6 px-4 py-3 text-sm leading-6">
            We are not taking payment yet. You can still set up a profile and
            use the coach.
          </p>
        )}
        <PricingGrid billingOpen={open} />
        <p className="mt-10 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          Card is a Stripe subscription. USDC (via Stripe) buys the current
          month and does not renew. Recurring USDC is not on this Stripe
          account. White-label reports and the 10-account desk are forthcoming
          — Agency buyers are design partners until those ship.{" "}
          <Link href="/terms" className="text-[var(--cyan)] underline">
            Terms
          </Link>
          {" · "}
          <Link href="/privacy" className="text-[var(--cyan)] underline">
            Privacy
          </Link>
          . Cancel in Billing.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
