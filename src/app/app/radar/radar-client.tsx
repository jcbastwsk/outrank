"use client";

import { useState } from "react";

type Diff = {
  key: string;
  from: string | null;
  to: string | null;
  watched: boolean;
};

export function RadarClient() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");
  const [changes, setChanges] = useState<Diff[]>([]);

  async function poll() {
    setStatus("loading");
    try {
      const res = await fetch("/api/algo");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "poll failed");
      setChanges(data.changes ?? []);
      setMessage(
        data.synced
          ? `Live file matches our snapshot (${data.compared} params).`
          : `${data.changes.length} param(s) drifted from the snapshot.`,
      );
      setStatus("ok");
    } catch (e) {
      setStatus("err");
      setMessage(e instanceof Error ? e.message : "Could not reach GitHub");
    }
  }

  return (
    <div className="card p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg">Poll xai-org/x-algorithm now</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Fetches param.rs and diffs it against the baked snapshot.
          </p>
        </div>
        <button
          type="button"
          onClick={poll}
          className="btn-gold px-5 py-2 text-sm"
          disabled={status === "loading"}
        >
          {status === "loading" ? "Checking…" : "Check for drift"}
        </button>
      </div>
      {message && (
        <p className="mt-4 text-sm" style={{ color: status === "err" ? "var(--bad)" : "var(--ink)" }}>
          {message}
        </p>
      )}
      {changes.length > 0 && (
        <ul className="mt-4 space-y-2 text-sm">
          {changes.slice(0, 40).map((c) => (
            <li key={c.key} className="flex flex-wrap gap-2 border-t border-[var(--line)] py-2">
              <span className="mono text-[var(--gold)]">{c.key}</span>
              {c.watched && (
                <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--warn)]">
                  watched
                </span>
              )}
              <span className="mono text-[var(--muted)]">
                {c.from ?? "∅"} → {c.to ?? "∅"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
