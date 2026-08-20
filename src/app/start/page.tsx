import type { Metadata } from "next";
import { Onboard } from "../../components/Onboard";
import { SiteFooter, SiteHeader } from "../../components/SiteHeader";

export const metadata: Metadata = {
  title: "Get started",
  description: "A few questions so Outrank can advise the next post on X.",
};

export default function StartPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-16">
        <p className="mono text-[13px] text-[var(--gold)]">Get started · X</p>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
          Four questions. What would count as a mistake can veto a draft. We
          do not download your X profile.
        </p>
        <div className="mt-10">
          <Onboard />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
