"use client";

import { useMemo, useState } from "react";
import { interpretHood, SAMPLE_HOOD } from "../lib/hood";

export function HoodDrop() {
  const [raw, setRaw] = useState(JSON.stringify(SAMPLE_HOOD, null, 2));
  const report = useMemo(() => {
    try {
      return interpretHood(JSON.parse(raw));
    } catch {
      return interpretHood(raw);
    }
  }, [raw]);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
            Under the Hood JSON
          </p>
          <button
            type="button"
            className="text-xs text-[var(--gold)]"
            onClick={() => setRaw(JSON.stringify(SAMPLE_HOOD, null, 2))}
          >
            Load sample
          </button>
        </div>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={18}
          className="field mono resize-y p-4 text-[12px] leading-5"
        />
        <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
          Settings → Under the Hood on X (pilot). We only explain published
          labels. We will not help you evade visibility filters.
        </p>
      </div>
      <div className="card p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Reading</p>
        <p className="mt-3 text-lg leading-7">{report.summary}</p>
        <ul className="mt-5 space-y-3">
          {report.findings.map((f) => (
            <li key={f.label} className="panel p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="mono text-xs text-[var(--gold)]">{f.label}</span>
                <span
                  className="text-[11px] uppercase tracking-[0.12em]"
                  style={{
                    color:
                      f.severity === "block"
                        ? "var(--bad)"
                        : f.severity === "warn"
                          ? "var(--warn)"
                          : "var(--muted)",
                  }}
                >
                  {f.severity}
                  {typeof f.count === "number" ? ` · ${f.count}` : ""}
                </span>
              </div>
              <p className="mt-2 text-sm">{f.meaning}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">{f.reachEffect}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
