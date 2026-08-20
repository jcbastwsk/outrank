"use client";

import { useEffect, useMemo, useState } from "react";
import { noAutofill } from "../lib/autofill";
import {
  fetchDesk,
  saveDeskMemory,
  saveDeskOutcome,
  saveDeskPost,
} from "../lib/desk-client";
import { DEMO_MAGIC_DRAFT } from "../lib/demo-seed";
import { judgeDraft, VERDICT_LABEL, type Judgment } from "../lib/judgment";
import { profileReady, type DeskState } from "../lib/model";

const OUTCOMES = [
  { id: "worked", label: "Worked", blurb: "The right people responded." },
  { id: "failed", label: "Failed", blurb: "It did not do what you wanted." },
  { id: "mixed", label: "Mixed", blurb: "Some good, some not." },
  { id: "undesired_reach", label: "Wrong audience", blurb: "It spread, but to the wrong people." },
  { id: "unknown", label: "Too soon", blurb: "Too early to tell." },
] as const;

export function CoachRoom({
  startAnalyze = false,
  demo = false,
}: {
  startAnalyze?: boolean;
  demo?: boolean;
}) {
  const [desk, setDesk] = useState<DeskState | null>(null);
  const [draft, setDraft] = useState(demo ? DEMO_MAGIC_DRAFT : "");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [locked, setLocked] = useState<Judgment | null>(null);
  const [logged, setLogged] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [read, setRead] = useState("");

  useEffect(() => {
    void fetchDesk(demo)
      .then(setDesk)
      .catch(() => setHint("Could not load your profile."));
  }, [demo]);

  const live: Judgment | null = useMemo(() => {
    if (!draft.trim()) return null;
    return judgeDraft(draft, desk?.profile ?? null, desk?.posts ?? [], desk?.memories ?? []);
  }, [draft, desk]);
  const judgment = locked ?? live;

  async function saveLearning() {
    if (!judgment || !desk) return;
    try {
      const afterPost = await saveDeskPost({
        text: draft,
        intendedFunction: judgment.fn,
        date: new Date().toISOString(),
        outcome: "unknown",
      });
      const newest = afterPost.posts[0];
      const afterMem = await saveDeskMemory({
        pattern: judgment.why,
        evidence: judgment.evidence,
        confidence: judgment.confidence,
        state: "provisional",
      });
      setDesk(afterMem);
      setSavedId(newest?.id ?? null);
      setLocked(judgment);
      setLogged(false);
      setHint(null);
    } catch {
      setHint("Saved locally only if the server refused. Try again.");
    }
  }

  async function logOutcome(outcome: (typeof OUTCOMES)[number]["id"]) {
    if (!savedId) return;
    try {
      const next = await saveDeskOutcome(savedId, {
        outcome,
        userRead: read.trim() || judgment?.why,
      });
      const mem = await saveDeskMemory({
        pattern:
          outcome === "worked"
            ? `This kind of ${judgment?.fn ?? "post"} worked for the position.`
            : outcome === "undesired_reach"
              ? "Reach arrived from the wrong room. Do not chase it."
              : outcome === "failed"
                ? `A ${judgment?.fn ?? "post"} in this register failed. Do not repeat it this week.`
                : `Outcome ${outcome} on a ${judgment?.fn ?? "draft"}.`,
        evidence: draft.slice(0, 160),
        confidence: 0.55,
        state: "provisional",
      });
      setDesk(mem.posts.length ? mem : next);
      setLogged(true);
    } catch {
      setHint("Outcome did not write.");
    }
  }

  const ready = profileReady(desk?.profile);

  return (
    <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="card p-5">
        <textarea
          {...noAutofill}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setSavedId(null);
            setLocked(null);
            setLogged(false);
          }}
          rows={14}
          className="field resize-y p-4 text-[20px] leading-7 placeholder:text-[#71767b]"
          placeholder="What's happening?"
        />
        {startAnalyze && !draft && (
          <p className="mt-3 text-xs text-[var(--muted)]">Paste a draft. The coach reads it against the profile.</p>
        )}
      </div>
      <div className="card p-5">
        {!judgment ? (
          <p className="serif text-2xl text-[#71767b]">What&apos;s happening?</p>
        ) : (
          <>
            <p className="mono text-[12px] text-[var(--gold)]">
              Verdict · {VERDICT_LABEL[judgment.verdict]} · {judgment.fn}
            </p>
            <p className="serif mt-2 text-2xl leading-8">{judgment.why}</p>
            <dl className="mt-5 space-y-3 text-sm leading-6">
              <div>
                <dt className="mono text-[10px] uppercase text-[var(--muted)]">What this would do</dt>
                <dd className="mt-1">{judgment.effect}</dd>
              </div>
              <div>
                <dt className="mono text-[10px] uppercase text-[var(--muted)]">How people will read it</dt>
                <dd className="mt-1">{judgment.audience}</dd>
              </div>
              <div>
                <dt className="mono text-[10px] uppercase text-[var(--muted)]">Options</dt>
                <dd className="mt-1">
                  <ul className="list-disc space-y-1 pl-4">
                    {judgment.options.map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                </dd>
              </div>
              <div>
                <dt className="mono text-[10px] uppercase text-[var(--muted)]">
                  Why we think this · {Math.round(judgment.confidence * 100)}%
                </dt>
                <dd className="mt-1 text-[var(--muted)]">{judgment.evidence}</dd>
              </div>
              {judgment.missing && (
                <div>
                  <dt className="mono text-[10px] uppercase text-[var(--muted)]">What we don&apos;t know</dt>
                  <dd className="mt-1 text-[var(--muted)]">{judgment.missing}</dd>
                </div>
              )}
            </dl>
            {hint && <p className="mt-4 text-xs text-[var(--bad)]">{hint}</p>}
            {demo ? (
              <p className="mt-6 text-sm text-[var(--muted)]">
                This is an example. It is not saved to your account.{" "}
                <a href="/start" className="text-[var(--cyan)] underline">
                  Start with your own
                </a>
                .
              </p>
            ) : (
            <button
              type="button"
              className="btn-gold mt-6 px-4 py-2 text-sm"
              onClick={() => void saveLearning()}
              disabled={!ready}
            >
              {savedId ? "Saved" : "Save"}
            </button>
            )}
            {savedId && !logged && (
              <div className="mt-5">
                <p className="mono text-[12px] text-[var(--gold)]">What happened</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  A lot of replies is not the same as the people you wanted.
                </p>
                <input
                  className="field mt-3 px-3 py-2 text-sm"
                  placeholder="Your read (optional)"
                  value={read}
                  onChange={(e) => setRead(e.target.value)}
                />
                <ul className="mt-3 flex flex-wrap gap-2">
                  {OUTCOMES.map((o) => (
                    <li key={o.id}>
                      <button
                        type="button"
                        className="chip px-3 py-1.5 text-left text-sm"
                        onClick={() => void logOutcome(o.id)}
                      >
                        <strong>{o.label}</strong>
                        <span className="mt-0.5 block text-[11px] text-[var(--muted)]">
                          {o.blurb}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {logged && (
              <p className="mt-5 text-sm leading-6">
                Saved. See it on{" "}
                <a href="/app/results" className="text-[var(--cyan)] underline">
                  Results
                </a>
                .
              </p>
            )}
            {!ready && (
              <p className="mt-3 text-xs text-[var(--muted)]">
                <a href="/start" className="text-[var(--cyan)] underline">
                  Start coaching
                </a>{" "}
                first so this is about your account.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
