"use client";

import { useEffect, useState } from "react";
import {
  VIBE_KEY,
  inferVibe,
  splitPosts,
  type VibeProfile,
} from "../lib/vibe";

export function VibeDesk({ compact = false }: { compact?: boolean }) {
  const [blob, setBlob] = useState("");
  const [profile, setProfile] = useState<VibeProfile | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(VIBE_KEY);
    if (!raw) return;
    try {
      setProfile(JSON.parse(raw) as VibeProfile);
    } catch {
      /* ignore */
    }
  }, []);

  function save() {
    const next = inferVibe(splitPosts(blob));
    setProfile(next);
    localStorage.setItem(VIBE_KEY, JSON.stringify(next));
  }

  function clear() {
    localStorage.removeItem(VIBE_KEY);
    setProfile(null);
    setBlob("");
  }

  return (
    <div className={compact ? "card p-5" : "grid gap-5 lg:grid-cols-2"}>
      <div className={compact ? "" : "card p-5"}>
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
          Your last posts
        </p>
        <textarea
          value={blob}
          onChange={(e) => setBlob(e.target.value)}
          rows={compact ? 5 : 10}
          className="field mt-3 p-3 text-sm leading-6"
          placeholder="Paste 3–8 recent posts. Blank line between each."
        />
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={save} className="btn-gold px-4 py-2 text-sm">
            Read the room
          </button>
          {profile && (
            <button type="button" onClick={clear} className="text-xs text-[var(--muted)]">
              Clear
            </button>
          )}
        </div>
      </div>
      <div className={compact ? "mt-4" : "card p-5"}>
        {profile ? (
          <>
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--gold)]">
              {Math.round(profile.confidence * 100)}% · {profile.samples} posts
            </p>
            <p className="serif mt-2 text-3xl">{profile.aesthetic.split(" — ")[0]}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-[var(--gold)]">
              {profile.cadence === "essayist"
                ? "Essay cadence"
                : profile.cadence === "sprinter"
                  ? "Short cadence"
                  : "Mixed cadence"}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{profile.note}</p>
            <ul className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
              {profile.mix.map((m) => (
                <li key={m.id} className="chip px-2 py-1">
                  {m.label} · {m.n}
                </li>
              ))}
              {(profile.formatMix ?? []).map((m) => (
                <li
                  key={`fmt-${m.id}`}
                  className="chip px-2 py-1 text-[var(--gold)]"
                >
                  {m.label} · {m.n}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm leading-6 text-[var(--muted)]">
            We can only see the draft unless you feed a few posts. One tweet is a
            mood. A handful is a room.
          </p>
        )}
      </div>
    </div>
  );
}
