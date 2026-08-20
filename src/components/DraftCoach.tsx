"use client";

import { useEffect, useMemo, useState } from "react";
import { coachDraft, SAMPLE_DRAFTS, type CoachResult } from "../lib/coach";
import { FORMAT_META, scoreDraft, type AudienceRead } from "../lib/score";
import { noAutofill } from "../lib/autofill";
import { classifyHandle, HANDLE_KEY } from "../lib/handle";
import { loadIdentity, workshopIdentity } from "../lib/identity";
import { VIBE_KEY, type VibeProfile } from "../lib/vibe";

function gradeColor(g: string) {
  if (g === "S" || g === "A") return "var(--good)";
  if (g === "B") return "var(--gold)";
  if (g === "C") return "var(--warn)";
  return "var(--bad)";
}

function AudienceCard({ read }: { read: AudienceRead }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
        {read.label}
      </p>
      <p className="serif mt-1 text-4xl" style={{ color: gradeColor(read.grade) }}>
        {read.reach}
        <span className="ml-1 text-xl text-[var(--muted)]">{read.grade}</span>
      </p>
    </div>
  );
}

export function DraftCoach({ compact = false }: { compact?: boolean }) {
  const [text, setText] = useState("");
  const [posted, setPosted] = useState(false);
  const [vibe, setVibe] = useState<VibeProfile | null>(null);
  useEffect(() => {
    const raw = localStorage.getItem(VIBE_KEY);
    const handleRaw = localStorage.getItem(HANDLE_KEY);
    const handle = handleRaw ? classifyHandle(handleRaw) : null;
    let next: VibeProfile | null = null;
    if (raw) {
      try {
        next = JSON.parse(raw) as VibeProfile;
      } catch {
        next = null;
      }
    }
    const ident = loadIdentity();
    const shop = ident ? workshopIdentity(ident) : null;
    const kind = shop?.handle.kind ?? handle?.kind;
    const who = shop?.handle.handle ?? handle?.handle;
    if (who) {
      next = {
        ...(next ?? {
          updatedAt: new Date().toISOString(),
          samples: 0,
          posture: "thin",
          tribe: "none",
          aesthetic: shop?.headline ?? handle?.label ?? "Unknown",
          confidence: 0.4,
          mix: [],
          formatMix: [],
          cadence: "mixed",
          note: shop?.headline ?? handle?.blurb ?? "",
        }),
        handle: who,
        handleKind: kind,
        desk: shop?.desk,
      };
    }
    if (next) setVibe(next);
  }, []);
  const result: CoachResult = useMemo(
    () => coachDraft(scoreDraft(text), vibe),
    [text, vibe],
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      {result.accountRisk && !result.features.isEmpty && (
        <div
          className="panel px-4 py-3 text-sm leading-6 lg:col-span-2"
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
          <span className="mono">
            {result.features.isEmpty
              ? "—"
              : `${FORMAT_META[result.format].label}${result.features.wall ? " · wall" : ""} · ${result.features.chars}${result.features.paragraphs > 1 ? ` · ${result.features.paragraphs}¶` : ""}`}
          </span>
        </div>
        <textarea
          {...noAutofill}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setPosted(false);
          }}
          rows={compact ? 7 : 10}
          className="field resize-y p-4 text-[20px] leading-7 placeholder:text-[#71767b] placeholder:opacity-100"
          placeholder="What's happening?"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {SAMPLE_DRAFTS.map((s) => (
            <button
              key={s.label}
              type="button"
              suppressHydrationWarning
              onClick={() => {
                setText(s.text);
                setPosted(false);
              }}
              className="chip px-3 py-1 text-xs"
            >
              {s.label}
            </button>
          ))}
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => setPosted(true)}
            className="chip ml-auto px-3 py-1 text-xs text-[var(--gold)]"
          >
            I just posted this
          </button>
        </div>
      </div>

      <div className="card p-5">
        {result.features.isEmpty ? (
          <p className="serif text-2xl leading-8 text-[#71767b]">What&apos;s happening?</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <AudienceCard read={result.graph} />
              <AudienceCard read={result.cold} />
            </div>
            {result.mix.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {result.mix.map((v) => (
                  <li key={v.id} className="chip px-2 py-1 text-[11px]">
                    {v.label} · {Math.round(v.weight * 100)}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-[var(--gold)]">
              {FORMAT_META[result.format].label}
              {result.features.wall ? " · wall" : ""}
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--ink)]/90">{result.headline}</p>
            <div className="mt-5 space-y-2">
              {result.actions
                .filter((a) => Math.abs(a.contribution) > 0.004)
                .slice(0, compact ? 4 : 6)
                .map((a) => (
                  <div key={a.id} className="grid grid-cols-[1fr_auto] items-center gap-3 text-sm">
                    <div>
                      <div className="flex justify-between text-[13px]">
                        <span>{a.label}</span>
                        <span className="mono text-[var(--muted)]">
                          {a.weight} × {(a.probability * (a.id === "contDwellTime" ? 1 : 100)).toFixed(1)}
                          {a.id === "contDwellTime" ? "s" : "%"}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden bg-white/5">
                        <div
                          className="h-full"
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
          </>
        )}
      </div>

      <div className="card p-5 lg:col-span-2">
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
          {result.features.isEmpty
            ? "Waiting"
            : posted
              ? "First hour"
              : "Do this before you post"}
        </p>
        {result.features.isEmpty ? (
          <p className="mt-4 serif text-xl text-[#71767b]">What&apos;s happening?</p>
        ) : posted ? (
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {result.firstHour.slice(0, 2).map((play) => (
              <li key={play.id} className="panel p-4">
                <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--gold)]">
                  {play.urgency}
                </div>
                <h3 className="mt-1 text-[15px] font-medium">{play.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{play.why}</p>
              </li>
            ))}
          </ul>
        ) : result.primary ? (
          <div className="panel mt-4 p-5">
            <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--gold)]">
              {result.primary.urgency}
            </div>
            {result.primary.excerpt && (
              <p className="serif mt-3 text-xl leading-7 text-[var(--ink)]">
                “{result.primary.excerpt}”
              </p>
            )}
            <h3 className="mt-3 text-[17px] font-medium">{result.primary.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{result.primary.why}</p>
            <p className="mono mt-3 text-[11px] text-[var(--muted)]/70">{result.primary.source}</p>
          </div>
        ) : null}
        {!result.features.isEmpty && (
        <p className="mt-4 text-xs leading-5 text-[var(--muted)]">{result.disclaimer}</p>
        )}
      </div>
    </div>
  );
}
