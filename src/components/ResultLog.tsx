"use client";

import { RESULT_META, type ResultKind } from "../lib/residual";

export function ResultLog({
  onPick,
}: {
  onPick: (result: ResultKind) => void;
}) {
  return (
    <div>
      <p className="mono text-[12px] text-[var(--gold)]">What actually happened</p>
      <p className="mt-1 text-sm text-[var(--muted)]">
        High engagement is not the same as the audience you named. Pick one.
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {(Object.keys(RESULT_META) as ResultKind[]).map((k) => (
          <li key={k}>
            <button
              type="button"
              className="chip px-3 py-1.5 text-left text-sm"
              onClick={() => onPick(k)}
            >
              <strong>{RESULT_META[k].label}</strong>
              <span className="mt-0.5 block text-[11px] text-[var(--muted)]">
                {RESULT_META[k].blurb}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
