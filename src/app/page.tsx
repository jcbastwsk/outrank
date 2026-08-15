import Image from "next/image";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "../components/SiteHeader";
import {
  ACTION_WEIGHTS,
  ALGO_SOURCE,
  likeEquivalent,
  rankedNegative,
  rankedPositive,
} from "../lib/weights";
import { ALGO_CHANGELOG } from "../lib/changelog";
import { effectiveMutualReplyWeight } from "../lib/score";

export default function Home() {
  const positives = rankedPositive().slice(0, 6);
  const negatives = rankedNegative();
  const latest = ALGO_CHANGELOG[0];

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-8 pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:pt-24">
          <div>
            <p className="mono text-[15px] text-[var(--cyan)]">
              <span className="live-dot" />
              watching {ALGO_SOURCE.repo} · snapshot {ALGO_SOURCE.snapshotAt.slice(0, 10)}
            </p>
            <h1 className="serif mt-4 text-5xl leading-[1.05] tracking-tight md:text-7xl">
              The algorithm is public.
              <span className="gold-text"> We watch it for you.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--muted)]">
              Built for people who post for a living. We also read the fat tail
              of scene OC — the unfinished posts that only mean something in a
              room you already trained — so you can steal the shape, not the
              costume.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/app/coach" className="btn-gold px-6 py-3 text-sm">
                Score a draft
              </Link>
              <Link href="/app/radar" className="btn-ghost px-6 py-3 text-sm">
                Open the radar
              </Link>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-[var(--muted)]">Copy-link share</dt>
                <dd className="serif text-3xl text-[var(--gold)]">
                  {likeEquivalent(ACTION_WEIGHTS.shareViaCopyLink)}×
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">A reply</dt>
                <dd className="serif text-3xl">{likeEquivalent(ACTION_WEIGHTS.reply)}×</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">A like</dt>
                <dd className="serif text-3xl">1×</dd>
              </div>
            </dl>
          </div>
          <div className="scanline card overflow-hidden">
            <Image
              src="/hero2.jpg"
              alt="A CRT on a particle-board desk, starfield tapestry, lava lamp"
              width={1600}
              height={900}
              className="h-full w-full object-cover"
              priority
            />
          </div>
        </section>

        <hr className="sparkle-hr mx-auto max-w-6xl" />

        <section id="weights" className="mx-auto max-w-6xl px-5 py-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="mono text-[15px] text-[var(--gold)]">
                ★ live published weights ★
              </p>
              <h2 className="serif mt-2 text-4xl">Not vibes. The actual heads.</h2>
            </div>
            <Link href="/app" className="text-sm text-[var(--gold)]">
              Full command center →
            </Link>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="text-left text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                  <tr>
                    <th className="px-5 py-3">Positive head</th>
                    <th className="px-5 py-3">Weight</th>
                    <th className="px-5 py-3">vs like</th>
                  </tr>
                </thead>
                <tbody>
                  {positives.map((w) => (
                    <tr key={w.id} className="border-t border-[var(--line)]">
                      <td className="px-5 py-3">{w.label}</td>
                      <td className="mono px-5 py-3 text-[var(--gold)]">{w.value}</td>
                      <td className="mono px-5 py-3">{likeEquivalent(w.value)}×</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="text-left text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                  <tr>
                    <th className="px-5 py-3">Negative head</th>
                    <th className="px-5 py-3">Weight</th>
                    <th className="px-5 py-3">vs like</th>
                  </tr>
                </thead>
                <tbody>
                  {negatives.map((w) => (
                    <tr key={w.id} className="border-t border-[var(--line)]">
                      <td className="px-5 py-3">{w.label}</td>
                      <td className="mono px-5 py-3 text-[var(--bad)]">{w.value}</td>
                      <td className="mono px-5 py-3">
                        {likeEquivalent(w.value).toFixed(0)}×
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            Formula, from{" "}
            <span className="mono">home-mixer/scorers/ranking_scorer.rs</span>:{" "}
            <span className="text-[var(--ink)]">Final score = Σ (weightᵢ × P(actionᵢ))</span>
            . Mutual-follow originals add {ACTION_WEIGHTS.reply}+
            {effectiveMutualReplyWeight() - ACTION_WEIGHTS.reply} on the reply
            head. Profile clicks are published at 0.
          </p>
        </section>

        <section id="how" className="mx-auto max-w-6xl px-5 py-8">
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
            The product
          </p>
          <h2 className="serif mt-2 text-4xl">A plugin that sits on the ranker.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                n: "01",
                t: "Radar",
                d: "Poll GitHub for param.rs. When a weight moves, you get the plain-language play — the way the July 20→15 mutual-follow rollback should have landed in your Slack.",
              },
              {
                n: "02",
                t: "Compose coach",
                d: "Chrome extension plus a web coach. Operator drafts get copy-link + a real ask. Scene drafts get a context check: this only lands if the last 20 posts trained the reader.",
              },
              {
                n: "03",
                t: "First hour + Under the Hood",
                d: "After you post: stay, don't dump, seed the conversation. Drop X's new transparency JSON and we'll tell you which labels actually hide you.",
              },
            ].map((s) => (
              <div key={s.n} className="card p-6">
                <div className="mono text-xs text-[var(--gold)]">{s.n}</div>
                <h3 className="mt-3 text-xl">{s.t}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16">
          <div className="card p-8 md:p-10">
            <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
              Latest drop · {latest.date}
            </p>
            <h2 className="serif mt-2 text-3xl md:text-4xl">{latest.title}</h2>
            <p className="mt-4 max-w-3xl text-[var(--muted)] leading-7">{latest.summary}</p>
            <p className="mt-4 max-w-3xl leading-7">{latest.whatToDo}</p>
            <Link href="/app/radar" className="mt-6 inline-block text-sm text-[var(--gold)]">
              See the full radar →
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20">
          <div className="card flex flex-col items-start justify-between gap-6 p-8 md:flex-row md:items-center md:p-12">
            <div>
              <h2 className="serif text-4xl">$19 / month. Operators pay. Scene is the tail.</h2>
              <p className="mt-3 max-w-xl text-[var(--muted)]">
                Buyers are people who post on purpose. The weirdo tail mints
                original posts we still have to score — Phoenix already does.
              </p>
            </div>
            <Link href="/pricing" className="btn-gold px-6 py-3 text-sm">
              See plans
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
