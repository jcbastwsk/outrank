"use client";

import { useEffect, useState } from "react";
import {
  classifyHandle,
  HANDLE_KEY,
  saveHandle,
  type HandleRead,
} from "../lib/handle";
import { emptyIdentity, loadIdentity, saveIdentity } from "../lib/identity";

export function HandleChip({ compact = false }: { compact?: boolean }) {
  const [value, setValue] = useState("");
  const [read, setRead] = useState<HandleRead | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(HANDLE_KEY);
    if (!raw) return;
    const next = classifyHandle(raw);
    setValue(next.display);
    setRead(next);
  }, []);

  function commit(raw: string) {
    const next = saveHandle(raw);
    setValue(next.display || raw);
    setRead(next.handle ? next : null);
    const ident = loadIdentity() ?? emptyIdentity();
    ident.handle = next.handle;
    saveIdentity(ident);
  }

  return (
    <label className={compact ? "flex items-center gap-2" : "block"}>
      {!compact && (
        <span className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
          Your @
        </span>
      )}
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
        }}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        placeholder="@you"
        className={
          compact
            ? "field w-[9.5rem] px-2 py-1 text-xs"
            : "field mt-2 px-3 py-2 text-sm"
        }
        aria-label="Your X handle"
      />
      {read && (
        <span
          className={
            compact
              ? "hidden text-[10px] uppercase tracking-[0.12em] text-[var(--gold)] lg:inline"
              : "mt-2 block text-xs text-[var(--gold)]"
          }
          title={read.blurb}
        >
          {read.label}
        </span>
      )}
    </label>
  );
}
