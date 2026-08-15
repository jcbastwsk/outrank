import Link from "next/link";
import { CheckoutButton } from "../../components/CheckoutButton";
import { SiteFooter, SiteHeader } from "../../components/SiteHeader";
import { PLANS } from "../../lib/plans";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string }>;
}) {
  const { canceled } = await searchParams;

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-16">
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--gold)]">Pricing</p>
        <h1 className="serif mt-3 text-5xl">Paid because the feed moves.</h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">
          The July bidirectional boost went 0 → 20 → 15 in two weeks. A static
          blog post is stale before you finish it. The product is the watch.
        </p>
        {canceled && (
          <p className="mt-6 rounded-2xl border border-[var(--line)] bg-black/30 px-4 py-3 text-sm text-[var(--muted)]">
            Checkout canceled. Nothing was charged.
          </p>
        )}
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className="card flex flex-col p-6"
              style={
                p.highlight
                  ? { borderColor: "var(--line-strong)", boxShadow: "0 0 0 1px rgba(245,185,66,0.2)" }
                  : undefined
              }
            >
              <h2 className="text-sm uppercase tracking-[0.16em] text-[var(--muted)]">
                {p.name}
              </h2>
              <p className="serif mt-3 text-5xl">
                {p.priceCents === 0 ? "$0" : `$${p.priceCents / 100}`}
                <span className="text-lg text-[var(--muted)]">{p.period}</span>
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">{p.blurb}</p>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-[var(--muted)]">
                {p.points.map((pt) => (
                  <li key={pt}>· {pt}</li>
                ))}
              </ul>
              {p.id === "scout" ? (
                <Link href="/app" className="btn-ghost mt-8 py-3 text-center text-sm">
                  {p.cta}
                </Link>
              ) : (
                <CheckoutButton plan={p.id} highlight={p.highlight}>
                  {p.cta}
                </CheckoutButton>
              )}
            </div>
          ))}
        </div>
        <p className="mt-10 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          Subscriptions run through Stripe Checkout. Add{" "}
          <span className="mono">STRIPE_SECRET_KEY</span> to{" "}
          <span className="mono">.env.local</span> for live/test charges. Without
          a key, local dev can still unlock a plan so you can try the gates. We
          will not help anyone evade X visibility or spam systems.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
