import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "../../components/SiteHeader";
import { fetchLiveDiff } from "../../lib/radar";
import { UPSTREAM } from "../../lib/sources";
import { ALGO_SOURCE, rankedNegative, rankedPositive } from "../../lib/weights";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Published ranking defaults",
  description:
    "Feature-switch defaults from xai-org/x-algorithm home-mixer/params/param.rs. Coefficients, not event points.",
};

export default async function WeightsPage() {
  const live = await fetchLiveDiff();
  const positives = rankedPositive();
  const negatives = rankedNegative();
  const failed = Boolean(live.error && live.parsed === 0);
  const state = failed ? "DOWN" : live.synced ? "MATCH" : "DRIFT";

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-16">
        <p className="mono text-[13px] text-[var(--gold)]">
          From the public file · {ALGO_SOURCE.snapshotAt.slice(0, 10)} ·{" "}
          {UPSTREAM.shaShort}
        </p>
        <h1 className="serif mt-3 text-5xl">Published ranking numbers</h1>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
          These numbers come from{" "}
          <a href={UPSTREAM.paramUrl} className="text-[var(--cyan)] underline">
            {ALGO_SOURCE.repo}/{ALGO_SOURCE.file}
          </a>
          . X uses them to combine predicted actions (a reply, a like, a
          copy-link, and so on). They are not points you can add up like a
          scoreboard, and they may not be what every viewer is served today.
        </p>

        <div className="panel mt-8 px-5 py-4">
          <p className="mono text-[12px] text-[var(--gold)]">
            {state} · checked {live.checkedAt.slice(0, 19)}Z
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {failed
              ? live.error
              : live.synced
                ? `Public param.rs matches the ${ALGO_SOURCE.snapshotAt.slice(0, 10)} snapshot.`
                : `${live.changes.length} published default(s) moved in the public file.`}
          </p>
        </div>

        <section className="mt-14 grid gap-4 lg:grid-cols-2">
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
                <tr>
                  <th className="px-5 py-3">Positive head</th>
                  <th className="px-5 py-3">Coefficient</th>
                </tr>
              </thead>
              <tbody>
                {positives.map((w) => (
                  <tr key={w.id} className="border-t border-[var(--line)]">
                    <td className="px-5 py-3">{w.label}</td>
                    <td className="mono px-5 py-3 text-[var(--gold)]">{w.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
                <tr>
                  <th className="px-5 py-3">Negative head</th>
                  <th className="px-5 py-3">Coefficient</th>
                </tr>
              </thead>
              <tbody>
                {negatives.map((w) => (
                  <tr key={w.id} className="border-t border-[var(--line)]">
                    <td className="px-5 py-3">{w.label}</td>
                    <td className="mono px-5 py-3 text-[var(--bad)]">{w.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-8 max-w-3xl text-sm leading-6 text-[var(--muted)]">
          Formula, from{" "}
          <span className="mono">home-mixer/scorers/ranking_scorer.rs</span>:
          score = Σ (weightᵢ × P(actionᵢ)). These are the published numbers,
          not the live ranker.{" "}
          <a href={UPSTREAM.repoUrl} className="text-[var(--cyan)] underline">
            Source
          </a>
          {" · "}
          <Link href="/app/radar" className="text-[var(--cyan)] underline">
            Radar
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
