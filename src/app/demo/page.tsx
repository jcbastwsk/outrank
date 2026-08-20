"use client";

import Link from "next/link";
import { SiteFooter, SiteHeader } from "../../components/SiteHeader";
import { DEMO_MAGIC_DRAFT, demoDesk } from "../../lib/demo-seed";
import { judgeDraft } from "../../lib/judgment";

export default function DemoPage() {
  const desk = demoDesk();
  const j = judgeDraft(DEMO_MAGIC_DRAFT, desk.profile, desk.posts, desk.memories);

  function openExample() {
    window.location.href = "/app/coach?demo=1&analyze=1";
  }

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-16">
        <p className="mono text-[13px] text-[var(--gold)]">
          Demo · {desk.profile.displayName} · @{desk.profile.handle}
        </p>
        <h1 className="serif mt-3 text-5xl">An example account</h1>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
          Mira Vale is a filmmaker. We have {desk.posts.length} of her posts on
          file. The draft below repeats an argument she has already made
          several times this week.
        </p>
        <blockquote className="serif mt-8 text-2xl leading-9">
          “{DEMO_MAGIC_DRAFT}”
        </blockquote>
        <div className="card mt-8 p-6">
          <p className="mono text-[12px] text-[var(--gold)]">
            Verdict · {j.verdict} · {j.fn}
          </p>
          <p className="serif mt-3 text-2xl leading-8">{j.why}</p>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{j.evidence}</p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" className="btn-gold px-6 py-3 text-sm" onClick={openExample}>
            Open this example
          </button>
          <Link href="/start" className="btn-ghost px-6 py-3 text-sm">
            Use my own account
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
