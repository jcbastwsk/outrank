import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "../../components/SiteHeader";

export const metadata: Metadata = {
  title: "Colophon",
  description: "How OUTRANK is built, and who the scene material is for.",
};

export default function ColophonPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
        <p className="mono text-[13px] text-[var(--gold)]">Colophon</p>
        <h1 className="serif mt-3 text-5xl">How this is made</h1>
        <div className="mt-8 space-y-6 text-[var(--muted)] leading-7">
          <p>
            Outrank is a coaching site for people who post on X. The look is
            deliberate: a 1994 company page, not a modern dashboard.
          </p>
          <p>
            Draft advice is an estimate. We do not run X&apos;s ranker, and we
            are not affiliated with X or xAI.
          </p>
        </div>
        <p className="mt-10 text-sm">
          <Link href="/" className="text-[var(--cyan)] underline">
            Back
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
