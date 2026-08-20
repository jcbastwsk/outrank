import Image from "next/image";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "../components/SiteHeader";
import { UPSTREAM } from "../lib/sources";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-8 pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:pt-24">
          <div>
            <p className="mono text-[15px] text-[var(--cyan)]">
              <span className="live-dot" />
              Coaching for X
            </p>
            <h1 className="serif mt-5 text-5xl leading-[1.05] tracking-tight md:text-7xl">
              Build a body of work,
              <span className="gold-text"> not a content calendar.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--muted)]">
              Outrank is a coach for people who post on purpose. You say what
              you want to be known for. It keeps your recent posts on file and
              tells you whether the next one helps or just repeats you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/start" className="btn-gold px-6 py-3 text-sm">
                Get started
              </Link>
              <Link href="/app/coach?analyze=1" className="btn-ghost px-6 py-3 text-sm">
                Try a draft
              </Link>
            </div>
          </div>
          <div className="htm-window">
            <div className="htm-title">
              <span>Outrank</span>
              <span className="htm-btns" aria-hidden="true">
                <i>_</i>
                <i>□</i>
                <i>×</i>
              </span>
            </div>
            <div className="scanline overflow-hidden">
              <Image
                src="/hero2.jpg"
                alt="A CRT on a particle-board desk, starfield tapestry, lava lamp"
                width={1600}
                height={900}
                className="h-full w-full object-cover"
                priority
              />
            </div>
            <p className="htm-status mono">
              outrank.coach · not affiliated with X or xAI
            </p>
          </div>
        </section>

        <hr className="sparkle-hr mx-auto max-w-6xl" />

        <section id="how" className="mx-auto max-w-6xl px-5 py-16">
          <p className="mono text-[15px] text-[var(--gold)]">How it works</p>
          <h2 className="serif mt-2 text-4xl">Most tools help you post more.</h2>
          <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
            This one helps you decide whether to post at all. After a few
            questions, you can paste a draft and get a straight answer: post it,
            change it, wait, reply to someone else, or leave it.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="card p-6">
              <div className="mono text-xs text-[var(--gold)]">01</div>
              <h3 className="mt-3 text-xl">A short start</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Your account, who should show up if the week worked, what
                would count as a mistake, and a few posts you paste.
              </p>
            </div>
            <div className="card p-6">
              <div className="mono text-xs text-[var(--gold)]">02</div>
              <h3 className="mt-3 text-xl">A reading of the draft</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                We look at the draft next to what you have already said, not
                next to a growth template.
              </p>
            </div>
            <div className="card p-6">
              <div className="mono text-xs text-[var(--gold)]">03</div>
              <h3 className="mt-3 text-xl">What happened</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                After it goes out, you mark whether it did what you wanted. The
                next note uses that.
              </p>
            </div>
          </div>
          <p className="mt-6 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            X published some of its ranking numbers. We keep a copy on{" "}
            <Link href="/weights" className="text-[var(--cyan)] underline">
              Weights
            </Link>{" "}
            and watch the public file on{" "}
            <a href={UPSTREAM.repoUrl} className="text-[var(--cyan)] underline">
              GitHub
            </a>
            . That is background. The coach is the product.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-8">
          <div className="card p-8 md:p-10">
            <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
              Example
            </p>
            <h2 className="serif mt-2 text-3xl md:text-4xl">
              See it on a sample account
            </h2>
            <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
              Mira Vale is a filmmaker in the example. She has explained the
              same authorship point too many times this week. The coach tells
              her to wait.
            </p>
            <Link href="/demo" className="mt-6 inline-block text-sm text-[var(--gold)]">
              Open the example →
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16">
          <div className="card flex flex-col items-start justify-between gap-6 p-8 md:flex-row md:items-center md:p-12">
            <div>
              <h2 className="serif text-4xl">Start with what would count as a mistake.</h2>
              <p className="mt-3 max-w-xl text-[var(--muted)]">
                Four questions. We do not download your X profile.
              </p>
            </div>
            <Link href="/start" className="btn-gold px-6 py-3 text-sm">
              Get started
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
