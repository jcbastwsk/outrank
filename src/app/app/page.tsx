import Link from "next/link";
import { DraftCoach } from "../../components/DraftCoach";
import { VibeDesk } from "../../components/VibeDesk";
import { todaysPlays } from "../../lib/coach";
import { ALGO_CHANGELOG } from "../../lib/changelog";
import { ALGO_SOURCE, ACTION_WEIGHTS, BOOSTS, likeEquivalent } from "../../lib/weights";

export default async function CommandPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const plays = todaysPlays();
  const latest = ALGO_CHANGELOG[0];
  const { welcome } = await searchParams;

  return (
    <div className="space-y-8">
      {welcome && (
        <p className="rounded-2xl border border-[var(--line-strong)] bg-[var(--gold)]/10 px-4 py-3 text-sm">
          {welcome === "studio" ? "Studio" : "Pro"} is unlocked in this browser.
          The extension uses the same local API.
        </p>
      )}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
            Command
          </p>
          <h1 className="serif text-4xl">What the ranker wants today</h1>
        </div>
        <p className="text-sm text-[var(--muted)]">
          Snapshot {ALGO_SOURCE.snapshotAt} · public drop {ALGO_SOURCE.publicDropAt}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Copy-link", `${ACTION_WEIGHTS.shareViaCopyLink}`, `${likeEquivalent(ACTION_WEIGHTS.shareViaCopyLink)}× like`],
          ["Reply / quote", `${ACTION_WEIGHTS.reply}`, "conversation heads"],
          ["Mutual original", `${ACTION_WEIGHTS.reply + BOOSTS.bidirectionalFollowReply}`, "reply + bidir boost"],
          ["A report", `${ACTION_WEIGHTS.report}`, "do not farm this"],
        ].map(([k, v, s]) => (
          <div key={k} className="card p-5">
            <div className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">{k}</div>
            <div className="serif mt-2 text-3xl">{v}</div>
            <div className="mt-1 text-xs text-[var(--muted)]">{s}</div>
          </div>
        ))}
      </div>

      <section className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg">Today&apos;s plays</h2>
          <Link href="/app/radar" className="text-sm text-[var(--gold)]">
            Why these moved →
          </Link>
        </div>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {plays.map((p) => (
            <li key={p.id} className="rounded-2xl border border-[var(--line)] bg-black/20 p-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--gold)]">
                {p.urgency}
              </div>
              <h3 className="mt-1 font-medium">{p.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{p.why}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-4 text-lg">Your room</h2>
        <VibeDesk compact />
      </section>

      <section>
        <h2 className="mb-4 text-lg">Coach this draft</h2>
        <DraftCoach compact />
      </section>

      <section className="card p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--gold)]">Radar</p>
        <h2 className="mt-2 text-2xl">{latest.title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">{latest.summary}</p>
      </section>
    </div>
  );
}
