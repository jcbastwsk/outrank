import { SiteFooter, SiteHeader } from "../../../components/SiteHeader";
import { ConfirmCheckout } from "./confirm";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-5 py-20">
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
          Checkout
        </p>
        <h1 className="serif mt-3 text-4xl">You&apos;re in.</h1>
        <ConfirmCheckout sessionId={session_id ?? null} />
      </main>
      <SiteFooter />
    </div>
  );
}
