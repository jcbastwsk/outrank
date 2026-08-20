"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchDesk, seedDeskRecs, setRecStatus } from "../lib/desk-client";
import { deriveRecommendations } from "../lib/moves";
import { profileReady, topicLine, type DeskState } from "../lib/model";

export function CoachHome() {
  const [desk, setDesk] = useState<DeskState | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        let d = await fetchDesk();
        const open = d.recommendations.filter((r) => r.status === "open");
        const pasted = open.some(
          (r) =>
            r.action.length > 120 ||
            r.evidence.length > 120 ||
            (d.profile.ambition && r.action.includes(d.profile.ambition.slice(0, 32))),
        );
        if (profileReady(d.profile) && (!open.length || pasted)) {
          d = await seedDeskRecs();
        }
        setDesk(d);
      } catch {
        setDesk(null);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (!ready) {
    return <p className="mono text-sm text-[var(--muted)]">Loading…</p>;
  }

  if (!desk || !profileReady(desk.profile)) {
    return (
      <div className="card max-w-xl p-8">
        <p className="mono text-[13px] text-[var(--gold)]">Next moves</p>
        <h1 className="serif mt-2 text-4xl">We don&apos;t have a profile yet.</h1>
        <p className="mt-4 text-[var(--muted)] leading-7">
          Answer a few questions first. Then this page can suggest what to do
          next.
        </p>
        <Link href="/start" className="btn-gold mt-6 inline-block px-5 py-2 text-sm">
          Get started
        </Link>
      </div>
    );
  }

  const p = desk.profile;
  const moves = desk.recommendations.filter((r) => r.status === "open");
  const shown = moves.length ? moves : deriveRecommendations(desk);
  const mems = desk.memories.filter((m) => m.state !== "corrected").slice(0, 4);
  const last = desk.posts[0];

  return (
    <div className="space-y-8">
      <div>
        <p className="mono text-[13px] text-[var(--gold)]">
          {p.displayName ? `${p.displayName} · ` : ""}@{p.handle} · X
        </p>
        <h1 className="serif mt-2 text-4xl md:text-5xl">What you should do next</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          {desk.posts.length} saved posts. {desk.memories.length} notes on file.
        </p>
      </div>

      <section className="grid gap-3 md:grid-cols-2">
        <Fact
          q="Who should show up"
          a={topicLine(p.audience, 72) || "—"}
          kind="user"
        />
        <Fact
          q="How you are being read"
          a={mems[0]?.pattern ?? "We only know what you have told us so far."}
          kind={mems[0] ? "observed" : "interpretation"}
        />
        <Fact
          q="Last saved post"
          a={last ? `“${last.text.slice(0, 140)}” · ${last.outcome ?? "unknown"}` : "None yet."}
          kind={last ? "observed" : "interpretation"}
        />
        <Fact
          q="What you asked us not to do"
          a={
            p.avoid || p.nonnegotiables
              ? "A lock is on file. Open Profile to read it."
              : "Nothing written down yet."
          }
          kind="user"
        />
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="mono text-[13px] text-[var(--gold)]">Next moves</p>
            <h2 className="serif mt-1 text-3xl">Ranked actions</h2>
          </div>
          <Link href="/app/coach?analyze=1" className="text-sm text-[var(--cyan)]">
            Analyze a draft →
          </Link>
        </div>
        <ol className="mt-5 space-y-3">
          {shown.map((m, i) => (
            <li key={m.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="mono text-[12px] text-[var(--gold)]">
                  {String(i + 1).padStart(2, "0")} · {m.kind}
                </p>
                <span className="mono text-[11px] text-[var(--muted)]">
                  {Math.round(m.confidence * 100)}%
                </span>
              </div>
              <h3 className="mt-2 text-[17px] leading-7">{m.action}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{m.why}</p>
              {m.status === "open" && desk.recommendations.some((r) => r.id === m.id) && (
                <div className="mt-3 flex gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => void setRecStatus(m.id, "done").then(setDesk)}
                  >
                    Done
                  </button>
                  <button
                    type="button"
                    onClick={() => void setRecStatus(m.id, "skipped").then(setDesk)}
                  >
                    Skip
                  </button>
                </div>
              )}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Fact({
  q,
  a,
  kind,
}: {
  q: string;
  a: string;
  kind: "observed" | "interpretation" | "user";
}) {
  return (
    <div className="panel p-5">
      <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">{kind}</p>
      <h2 className="mt-2 text-[15px]">{q}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{a}</p>
    </div>
  );
}
