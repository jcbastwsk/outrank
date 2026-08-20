"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  correctDeskMemory,
  fetchDesk,
  saveDeskProfile,
} from "../lib/desk-client";
import {
  AGGRESSION_META,
  OUTCOME_META,
  parseList,
  profileReady,
  type Aggression,
  type CoachMemory,
  type DeskState,
  type OutcomeKind,
  type StrategicProfile,
} from "../lib/model";

export function ProfileRoom({ fresh = false }: { fresh?: boolean }) {
  const [desk, setDesk] = useState<DeskState | null>(null);
  const [ready, setReady] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

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
        <h1 className="serif text-3xl">No profile yet.</h1>
        <Link href="/start" className="btn-gold mt-6 inline-block px-5 py-2 text-sm">
          Get started
        </Link>
      </div>
    );
  }

  const p = desk.profile;

  async function persist(next: StrategicProfile) {
    try {
      setDesk(await saveDeskProfile(next));
      setHint(null);
    } catch {
      setHint("Could not save. Try again.");
    }
  }

  async function patchMem(m: CoachMemory, patch: Partial<CoachMemory>) {
    try {
      setDesk(await correctDeskMemory(m.id, patch));
    } catch {
      setHint("Could not update memory.");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="mono text-[13px] text-[var(--gold)]">
          Profile · {p.displayName ? `${p.displayName} · ` : ""}@{p.handle} · X
        </p>
        <h1 className="serif mt-2 text-4xl">Your profile</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)] leading-7">
          This is what we use when we read a draft. Edit anything that is
          wrong. We do not pull this from X.
        </p>
        {fresh && (
          <p className="panel mt-4 max-w-2xl px-4 py-3 text-sm leading-6">
            Saved. Next, paste a draft you are thinking about posting.{" "}
            <Link href="/app/coach?analyze=1" className="text-[var(--cyan)] underline">
              Open the coach
            </Link>
            .
          </p>
        )}
        {hint && <p className="mt-3 text-sm text-[var(--bad)]">{hint}</p>}
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <Field k="Ambition" v={p.ambition} onChange={(ambition) => persist({ ...p, ambition })} />
        <Field k="Audience" v={p.audience} onChange={(audience) => persist({ ...p, audience })} />
        <Field
          k="Subjects"
          v={p.subjects.join(", ")}
          onChange={(raw) => persist({ ...p, subjects: parseList(raw) })}
        />
        <Field
          k="Peers"
          v={p.peers.map((t) => `@${t}`).join(" ")}
          onChange={(raw) => persist({ ...p, peers: parseList(raw) })}
        />
        <Field k="Don't do this" v={p.avoid} onChange={(avoid) => persist({ ...p, avoid, voice: avoid })} />
        <Field
          k="Non-negotiables"
          v={p.nonnegotiables}
          onChange={(nonnegotiables) => persist({ ...p, nonnegotiables })}
        />
        <Field
          k="Reputation wanted"
          v={p.reputationWanted}
          onChange={(reputationWanted) => persist({ ...p, reputationWanted })}
        />
        <Field
          k="Unacceptable attention"
          v={p.unacceptableAttention}
          onChange={(unacceptableAttention) => persist({ ...p, unacceptableAttention })}
        />
      </section>

      <section>
        <p className="mono text-[13px] text-[var(--gold)]">Outcomes</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(OUTCOME_META) as OutcomeKind[]).map((k) => (
            <li key={k}>
              <button
                type="button"
                data-active={p.outcomes.includes(k)}
                className="chip px-3 py-1.5 text-sm"
                onClick={() => {
                  const next = p.outcomes.includes(k)
                    ? p.outcomes.filter((x) => x !== k)
                    : [...p.outcomes, k];
                  if (next.length === 0) return;
                  persist({ ...p, outcomes: next });
                }}
              >
                {OUTCOME_META[k].label}
              </button>
            </li>
          ))}
        </ul>
        <p className="mono mt-5 text-[13px] text-[var(--gold)]">Aggression</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(AGGRESSION_META) as Aggression[]).map((k) => (
            <li key={k}>
              <button
                type="button"
                data-active={p.aggression === k}
                className="chip px-3 py-1.5 text-sm"
                onClick={() => persist({ ...p, aggression: k })}
              >
                {AGGRESSION_META[k].label}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <p className="mono text-[13px] text-[var(--gold)]">Notes</p>
        {desk.memories.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted)]">
            None yet. Analyze a post and log what happened.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {desk.memories.map((m) => (
              <li key={m.id} className="panel p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="mono text-[10px] uppercase text-[var(--muted)]">
                    {m.state} · {Math.round(m.confidence * 100)}%
                  </span>
                  <div className="flex gap-2 text-xs">
                    {m.state !== "confirmed" && (
                      <button type="button" onClick={() => void patchMem(m, { state: "confirmed" })}>
                        Confirm
                      </button>
                    )}
                    {m.state !== "corrected" && (
                      <button type="button" onClick={() => void patchMem(m, { state: "corrected" })}>
                        Correct
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-sm leading-6">{m.pattern}</p>
                {m.evidence && (
                  <p className="mt-2 text-xs text-[var(--muted)]">{m.evidence}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/app/coach?analyze=1" className="btn-gold px-5 py-2">
          Analyze a post
        </Link>
        <Link href="/app" className="btn-ghost px-5 py-2">
          Next moves
        </Link>
      </div>
      <p className="text-xs text-[var(--muted)]">
        <Link href="/start" className="text-[var(--cyan)] underline">
          Re-run onboarding
        </Link>{" "}
        to change the basics. Notes you confirmed stay unless you mark them wrong.
      </p>
    </div>
  );
}

function Field({
  k,
  v,
  onChange,
}: {
  k: string;
  v: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="panel p-4">
      <p className="mono text-[11px] uppercase text-[var(--muted)]">{k}</p>
      <textarea
        className="field mt-2 p-2 text-sm leading-6"
        defaultValue={v}
        key={k + v.slice(0, 24)}
        onBlur={(e) => {
          if (e.target.value !== v) onChange(e.target.value);
        }}
      />
    </div>
  );
}
