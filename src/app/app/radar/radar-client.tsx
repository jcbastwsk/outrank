"use client";

import { useState } from "react";
import type { LiveDiff, RadarChange } from "../../../lib/radar";

export function RadarClient({ initial }: { initial: LiveDiff }) {
  const [diff, setDiff] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function poll() {
    setBusy(true);
    try {
      const res = await fetch("/api/algo", { cache: "no-store" });
      const data = (await res.json()) as LiveDiff & { error?: string };
      if (data.snapshotAt) {
        setDiff(data);
        return;
      }
      setDiff({
        ...diff,
        error: data.error || "poll failed",
      });
    } catch (e) {
      setDiff({
        ...diff,
        error: e instanceof Error ? e.message : "Could not reach GitHub",
      });
    } finally {
      setBusy(false);
    }
  }

  const failed = Boolean(diff.error && diff.parsed === 0);
  const state = failed ? "DOWN" : diff.synced ? "SYNCED" : "DRIFT";
  const stateColor =
    state === "SYNCED" ? "var(--good)" : state === "DRIFT" ? "var(--gold)" : "var(--bad)";

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mono text-[12px] uppercase tracking-[0.16em] text-[var(--muted)]">
            Compared with the public file
          </p>
          <p className="serif mt-1 text-3xl" style={{ color: stateColor }}>
            {state === "SYNCED" ? "Unchanged" : state === "DRIFT" ? "Changed" : "Couldn't check"}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {failed
              ? diff.error
              : diff.synced
                ? `The public file still matches our ${diff.snapshotAt.slice(0, 10)} copy (${diff.compared} values).`
                : `${diff.changes.length} value(s) in the public file no longer match our copy.`}
          </p>
        </div>
        <button
          type="button"
          onClick={poll}
          className="btn-gold shrink-0 px-5 py-2 text-sm"
          disabled={busy}
        >
          {busy ? "Checking…" : "Check now"}
        </button>
      </div>
      {diff.changes.length > 0 && (
        <ul className="border-t border-[var(--line)]">
          {diff.changes.map((c: RadarChange) => (
            <li
              key={c.key}
              className="flex flex-col gap-1 border-t border-[var(--line)] px-5 py-3 first:border-t-0 sm:flex-row sm:items-baseline sm:gap-4"
            >
              <div className="sm:w-56">
                <div className="text-sm">{c.label}</div>
                <div className="mono text-[11px] text-[var(--muted)]">{c.key}</div>
              </div>
              <div className="mono text-sm text-[var(--gold)]">
                {c.from ?? "∅"} → {c.to ?? "∅"}
              </div>
              <p className="flex-1 text-sm text-[var(--muted)]">{c.play}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
