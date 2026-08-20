"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { saveDeskPost, saveDeskProfile } from "../lib/desk-client";
import { saveHandle } from "../lib/handle";
import {
  emptyProfile,
  type Aggression,
  type OutcomeKind,
  type StrategicProfile,
} from "../lib/model";

const STEPS = ["Account", "Who shows up", "The lock", "Recent work"];

function splitPosts(raw: string): string[] {
  return raw
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8)
    .slice(0, 8);
}

export function Onboard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [existing, setExisting] = useState<StrategicProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [audience, setAudience] = useState("");
  const [avoid, setAvoid] = useState("");
  const [recentRaw, setRecentRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/coach/state", { cache: "no-store" });
        if (!res.ok) return;
        const desk = await res.json();
        const p = desk.profile as StrategicProfile | undefined;
        if (!p?.handle) return;
        setExisting(p);
        setDisplayName(p.displayName ?? "");
        setHandle(p.handle ?? "");
        setAudience(p.audience ?? "");
        setAvoid(p.avoid || p.nonnegotiables || "");
      } catch {
        /* empty desk */
      }
    })();
  }, []);

  async function finish() {
    setBusy(true);
    setErr(null);
    const base = existing ?? emptyProfile();
    const profile: StrategicProfile = {
      ...base,
      displayName: displayName.trim(),
      handle: handle.replace(/^@+/, "").trim(),
      audience: audience.trim(),
      avoid: avoid.trim(),
      nonnegotiables: avoid.trim(),
      voice: avoid.trim(),
      outcomes: base.outcomes.length ? base.outcomes : (["reputation"] as OutcomeKind[]),
      aggression: (base.aggression || "measured") as Aggression,
    };
    try {
      await saveDeskProfile(profile);
      if (profile.handle) saveHandle(profile.handle);
      for (const text of splitPosts(recentRaw)) {
        await saveDeskPost({ text, outcome: "unknown" });
      }
      router.push("/app");
    } catch {
      setErr("Could not save. Try again.");
      setBusy(false);
    }
  }

  const canNext = [
    handle.trim().length > 1,
    audience.trim().length > 8,
    avoid.trim().length > 4,
    true,
  ][step];

  return (
    <div className="mx-auto max-w-xl">
      <p className="mono text-[13px] text-[var(--gold)]">
        {String(step + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")} ·{" "}
        {STEPS[step]}
      </p>
      <div className="mt-6 space-y-5">
        {step === 0 && (
          <Q title="What is your account?">
            <p className="mb-3 text-sm text-[var(--muted)]">
              X first. We do not fetch the profile.
            </p>
            <input
              className="field mb-3 px-3 py-3 text-lg"
              placeholder="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="off"
            />
            <input
              className="field px-3 py-3 text-lg"
              placeholder="@you"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              autoComplete="off"
            />
          </Q>
        )}
        {step === 1 && (
          <Q title="If this week went well, who would have shown up?">
            <p className="mb-3 text-sm text-[var(--muted)]">
              Not a follower count. The people who would make the week count.
            </p>
            <textarea
              className="field min-h-32 p-3 text-base leading-7"
              placeholder="The room that would mean it worked."
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            />
          </Q>
        )}
        {step === 2 && (
          <Q title="What would count as a mistake?">
            <p className="mb-3 text-sm text-[var(--muted)]">
              This can veto a draft. It will not be pasted into the next move.
            </p>
            <textarea
              className="field min-h-32 p-3 text-base leading-7"
              placeholder="The register you will not trade for reach."
              value={avoid}
              onChange={(e) => setAvoid(e.target.value)}
            />
          </Q>
        )}
        {step === 3 && (
          <Q title="Paste a few recent posts.">
            <p className="mb-3 text-sm text-[var(--muted)]">
              You paste. We do not scrape. Blank line between each. Skip if
              you have none.
            </p>
            <textarea
              className="field min-h-40 p-3 text-base leading-7"
              placeholder="Post one.

Post two."
              value={recentRaw}
              onChange={(e) => setRecentRaw(e.target.value)}
            />
          </Q>
        )}
      </div>
      {err && <p className="mt-4 text-sm text-[var(--bad)]">{err}</p>}
      <div className="mt-8 flex gap-3">
        {step > 0 && (
          <button type="button" className="btn-ghost px-4 py-2 text-sm" onClick={() => setStep((s) => s - 1)}>
            Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            disabled={!canNext}
            className="btn-gold px-5 py-2 text-sm disabled:opacity-40"
            onClick={() => setStep((s) => s + 1)}
          >
            Continue
          </button>
        ) : (
          <button type="button" className="btn-gold px-5 py-2 text-sm" disabled={busy} onClick={() => void finish()}>
            {busy ? "Saving…" : "Open the desk"}
          </button>
        )}
      </div>
    </div>
  );
}

function Q({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="serif text-3xl leading-tight md:text-4xl">{title}</h1>
      <div className="mt-5">{children}</div>
    </div>
  );
}
