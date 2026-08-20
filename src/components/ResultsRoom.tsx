"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  correctDeskMemory,
  fetchDesk,
  saveDeskOutcome,
} from "../lib/desk-client";
import { profileReady, type DeskState, type PostRecord } from "../lib/model";

const OUTCOMES: { id: NonNullable<PostRecord["outcome"]>; label: string }[] = [
  { id: "worked", label: "Worked" },
  { id: "failed", label: "Failed" },
  { id: "mixed", label: "Mixed" },
  { id: "undesired_reach", label: "Wrong audience" },
  { id: "unknown", label: "Unknown" },
];

export function ResultsRoom() {
  const [desk, setDesk] = useState<DeskState | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void fetchDesk()
      .then(setDesk)
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return <p className="mono text-sm text-[var(--muted)]">Loading…</p>;
  }
  if (!desk || !profileReady(desk.profile)) {
    return (
      <div className="card max-w-xl p-8">
        <h1 className="serif text-3xl">No results yet.</h1>
        <Link href="/start" className="btn-gold mt-6 inline-block px-5 py-2 text-sm">
          Start coaching
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="mono text-[13px] text-[var(--gold)]">Results · @{desk.profile.handle}</p>
        <h1 className="serif mt-2 text-4xl">What happened</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)] leading-7">
          After a post goes out, mark whether it did what you wanted. If a note
          is wrong, say so.
        </p>
      </div>

      <section>
        <p className="mono text-[13px] text-[var(--gold)]">Posts</p>
        {desk.posts.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted)]">
            None saved.{" "}
            <Link href="/app/coach?analyze=1" className="text-[var(--cyan)] underline">
              Analyze a draft
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {desk.posts.map((post) => (
              <li key={post.id} className="card p-5">
                <p className="mono text-[11px] text-[var(--gold)]">
                  {post.date.slice(0, 10)} · {post.intendedFunction || "unlabeled"} ·{" "}
                  {post.outcome ?? "unknown"}
                </p>
                <p className="serif mt-2 text-xl leading-7">“{post.text}”</p>
                {post.userRead && (
                  <p className="mt-2 text-sm text-[var(--muted)]">{post.userRead}</p>
                )}
                <ul className="mt-3 flex flex-wrap gap-2">
                  {OUTCOMES.map((o) => (
                    <li key={o.id}>
                      <button
                        type="button"
                        data-active={post.outcome === o.id}
                        className="chip px-3 py-1 text-xs"
                        onClick={() =>
                          void saveDeskOutcome(post.id, { outcome: o.id }).then(setDesk)
                        }
                      >
                        {o.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <p className="mono text-[13px] text-[var(--gold)]">Notes</p>
        {desk.memories.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted)]">Nothing learned yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {desk.memories.map((m) => (
              <li key={m.id} className="panel p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="mono text-[10px] uppercase text-[var(--muted)]">
                    {m.state} · {m.learnedAt.slice(0, 10)}
                  </span>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        void correctDeskMemory(m.id, { state: "confirmed" }).then(setDesk)
                      }
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void correctDeskMemory(m.id, { state: "corrected" }).then(setDesk)
                      }
                    >
                      This is wrong
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-sm leading-6">{m.pattern}</p>
                {m.evidence && <p className="mt-2 text-xs text-[var(--muted)]">{m.evidence}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
