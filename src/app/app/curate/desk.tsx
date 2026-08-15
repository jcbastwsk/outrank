"use client";

import { useEffect, useMemo, useState } from "react";
import {
  OUTCOME_LABEL,
  OUTCOMES,
  renderPack,
  type CaseRecord,
  type Outcome,
} from "../../../lib/curation";
import { coachDraft } from "../../../lib/coach";
import { scoreDraft } from "../../../lib/score";

const LS = "outrank.curation";

export function CuratorDesk() {
  const [locked, setLocked] = useState(false);
  const [key, setKey] = useState("");
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [context, setContext] = useState("");
  const [outcome, setOutcome] = useState<Outcome>("blew_up");
  const [msg, setMsg] = useState("");

  const preview = useMemo(
    () => (text.trim().length > 2 ? coachDraft(scoreDraft(text)) : null),
    [text],
  );

  useEffect(() => {
    const local = localStorage.getItem(LS);
    if (local) {
      try {
        setCases(JSON.parse(local) as CaseRecord[]);
      } catch {
        /* ignore */
      }
    }
    fetch("/api/curate")
      .then(async (r) => {
        if (r.status === 401) {
          setLocked(true);
          return;
        }
        const d = (await r.json()) as { cases?: CaseRecord[] };
        if (d.cases?.length) {
          setCases(d.cases);
          localStorage.setItem(LS, JSON.stringify(d.cases));
        }
      })
      .catch(() => undefined);
  }, []);

  function persist(next: CaseRecord[]) {
    setCases(next);
    localStorage.setItem(LS, JSON.stringify(next));
  }

  async function unlock() {
    const res = await fetch("/api/curate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    if (!res.ok) {
      setMsg("Wrong key.");
      return;
    }
    setLocked(false);
    setMsg("");
  }

  async function save() {
    const res = await fetch("/api/curate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, url, context, outcome }),
    });
    const d = (await res.json()) as { case?: CaseRecord; error?: string };
    if (!res.ok || !d.case) {
      setMsg(d.error || "Could not save");
      return;
    }
    persist([d.case, ...cases.filter((c) => c.id !== d.case!.id)]);
    setText("");
    setUrl("");
    setContext("");
    setMsg("Logged.");
  }

  function copyPack() {
    void navigator.clipboard.writeText(renderPack(cases));
    setMsg("Pack copied. Paste it in the Grok chat.");
  }

  if (locked) {
    return (
      <div className="card max-w-md p-6">
        <p className="text-sm text-[var(--muted)]">
          Set <span className="mono">CURATOR_KEY</span> on the server, then
          unlock.
        </p>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="mt-4 w-full rounded-xl border border-[var(--line)] bg-black/40 px-3 py-2"
          placeholder="Curator key"
        />
        <button type="button" onClick={unlock} className="btn-gold mt-4 px-4 py-2 text-sm">
          Unlock
        </button>
        {msg && <p className="mt-3 text-sm text-[var(--bad)]">{msg}</p>}
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="card space-y-3 p-5">
        <label className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
          The post
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          className="w-full rounded-xl border border-[var(--line)] bg-black/40 p-3 text-sm leading-6 outline-none focus:border-[var(--gold)]"
          placeholder="Paste the tweet that actually moved…"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full rounded-xl border border-[var(--line)] bg-black/40 px-3 py-2 text-sm"
          placeholder="URL (optional)"
        />
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-[var(--line)] bg-black/40 p-3 text-sm leading-6 outline-none focus:border-[var(--gold)]"
          placeholder="Context only you have — who posted, what the room knew, why it hit…"
        />
        <div className="flex flex-wrap gap-2">
          {OUTCOMES.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setOutcome(o)}
              className={`rounded-full border px-3 py-1 text-xs ${
                outcome === o
                  ? "border-[var(--gold)] text-[var(--gold)]"
                  : "border-[var(--line)] text-[var(--muted)]"
              }`}
            >
              {OUTCOME_LABEL[o]}
            </button>
          ))}
        </div>
        <button type="button" onClick={save} className="btn-gold px-4 py-2 text-sm">
          Log this case
        </button>
        {msg && <p className="text-sm text-[var(--muted)]">{msg}</p>}
      </div>

      <div className="card p-5">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
          Coach snapshot
        </p>
        {preview ? (
          <div className="mt-3 space-y-2">
            <p className="serif text-4xl">
              {preview.reach}
              <span className="ml-2 text-xl text-[var(--muted)]">{preview.grade}</span>
            </p>
            <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--gold)]">
              {preview.lane.label}
            </p>
            <p className="text-sm leading-6 text-[var(--muted)]">{preview.headline}</p>
            {preview.accountRisk && (
              <p className="text-sm" style={{ color: "var(--bad)" }}>
                Account-nuke flag is on.
              </p>
            )}
          </div>
        ) : (
          <p className="mt-3 text-sm text-[var(--muted)]">
            Paste a post to see what the coach would have said.
          </p>
        )}
      </div>

      <div className="card p-5 lg:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
            Case file · {cases.length}
          </p>
          <button type="button" onClick={copyPack} className="text-xs text-[var(--gold)]">
            Copy pack for Grok
          </button>
        </div>
        <ul className="mt-4 space-y-3">
          {cases.length === 0 && (
            <li className="text-sm text-[var(--muted)]">No cases yet.</li>
          )}
          {cases.map((c) => (
            <li key={c.id} className="rounded-2xl border border-[var(--line)] bg-black/20 p-4">
              <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-[var(--gold)]">
                <span>{OUTCOME_LABEL[c.outcome]}</span>
                <span className="text-[var(--muted)]">
                  coach {c.coach.lane} {c.coach.grade} {c.coach.reach}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{c.text}</p>
              {c.context && (
                <p className="mt-2 text-sm text-[var(--muted)]">{c.context}</p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
