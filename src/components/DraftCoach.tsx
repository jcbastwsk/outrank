"use client";

import { useEffect, useMemo, useState } from "react";
import { coachDraft, SAMPLE_DRAFTS, type CoachResult } from "../lib/coach";
import { scoreDraft } from "../lib/score";
import { VIBE_KEY, type VibeProfile } from "../lib/vibe";

function gradeColor(g: string) {
  if (g === "S" || g === "A") return "var(--good)";
  if (g === "B") return "var(--gold)";
  if (g === "C") return "var(--warn)";
  return "var(--bad)";
}

export function DraftCoach({ compact = false }: { compact?: boolean }) {
  const [text, setText] = useState(
    SAMPLE_DRAFTS.find((s) => s.label === "Open loop")?.text ?? SAMPLE_DRAFTS[0].text,
  );
  const [posted, setPosted] = useState(false);
  const [vibe, setVibe] = useState<VibeProfile | null>(null);
  useEffect(() => {
    const raw = localStorage.getItem(VIBE_KEY);
    if (!raw) return;
    try {
      setVibe(JSON.parse(raw) as VibeProfile);
    } catch {
      /* ignore */
    }
  }, []);
  const result: CoachResult = useMemo(
    () => coachDraft(scoreDraft(text), vibe),
    [text, vibe],
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      {result.accountRisk && (
        <div
          className="rounded-2xl border px-4 py-3 text-sm leading-6 lg:col-span-2"
          style={{ borderColor: "var(--bad)", background: "rgba(255,93,93,0.08)", color: "var(--bad)" }}
        >
          <strong>Do not nuke the account.</strong> Replies can print. Reports
          are −234 in the published ranker. Labels from this lane can drop you
          out of For You for people who don’t follow you. We will not help you
          tune it.
        </div>
      )}
      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
          <span>Draft</span>
          <span className="mono">{result.features.chars}/280+</span>
        </div>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setPosted(false);
          }}
          rows={compact ? 7 : 10}
          className="w-full resize-y rounded-xl border border-[var(--line)] bg-black/40 p-4 text-[15px] leading-7 outline-none focus:border-[var(--gold)]"
          placeholder="Paste the post you're about to publish…"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {SAMPLE_DRAFTS.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => {
                setText(s.text);
                setPosted(false);
              }}
              className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--muted)] hover:text-[var(--ink)]"
            >
              {s.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPosted(true)}
            className="ml-auto rounded-full border border-[var(--line-strong)] px-3 py-1 text-xs text-[var(--gold)]"
          >
            I just posted this
          </button>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
              Reach index
            </p>
            <p className="serif mt-1 text-5xl" style={{ color: gradeColor(result.grade) }}>
              {result.reach}
              <span className="ml-2 text-2xl text-[var(--muted)]">{result.grade}</span>
            </p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-[var(--gold)]">
              {result.lane.label}
              {result.tribe !== "none" && result.lane.label.toLowerCase() !== "milady"
                ? ` · ${result.tribe}`
                : ""}
            </p>
          </div>
          <div className="text-right text-xs text-[var(--muted)]">
            <div className="mono">raw {result.rawScore.toFixed(3)}</div>
            <div>Σ wᵢ · P̂ᵢ</div>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-[var(--ink)]/90">{result.headline}</p>

        <div className="mt-5 space-y-2">
          {result.actions
            .filter((a) => Math.abs(a.contribution) > 0.004)
            .slice(0, compact ? 5 : 8)
            .map((a) => (
              <div key={a.id} className="grid grid-cols-[1fr_auto] items-center gap-3 text-sm">
                <div>
                  <div className="flex justify-between text-[13px]">
                    <span>{a.label}</span>
                    <span className="mono text-[var(--muted)]">
                      {a.weight} × {(a.probability * (a.id === "contDwellTime" ? 1 : 100)).toFixed(a.id === "contDwellTime" ? 1 : 1)}
                      {a.id === "contDwellTime" ? "s" : "%"}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, Math.abs(a.contribution) * (a.kind === "negative" ? 8 : 40))}%`,
                        background: a.kind === "negative" ? "var(--bad)" : "var(--gold)",
                      }}
                    />
                  </div>
                </div>
                <span
                  className="mono w-16 text-right text-xs"
                  style={{ color: a.contribution < 0 ? "var(--bad)" : "var(--gold)" }}
                >
                  {a.contribution >= 0 ? "+" : ""}
                  {a.contribution.toFixed(3)}
                </span>
              </div>
            ))}
        </div>
      </div>

      <div className="card p-5 lg:col-span-2">
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
          {posted ? "First-hour playbook" : "Do this before you post"}
        </p>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {(posted ? result.firstHour : result.plays).map((play) => (
            <li key={play.id} className="rounded-2xl border border-[var(--line)] bg-black/25 p-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-[var(--gold)]">
                {play.urgency}
              </div>
              <h3 className="mt-1 text-[15px] font-medium">{play.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{play.why}</p>
              <p className="mono mt-3 text-[11px] text-[var(--muted)]/70">{play.source}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs leading-5 text-[var(--muted)]">{result.disclaimer}</p>
      </div>
    </div>
  );
}
