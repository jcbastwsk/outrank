"use client";

import { useEffect, useState } from "react";
import { ACTION_WEIGHTS, BOOSTS } from "../lib/weights";

export function HitCounter() {
  const [n, setN] = useState(128047);
  useEffect(() => {
    const key = "outrank.hits";
    const prev = Number(localStorage.getItem(key) || 128047);
    const next = Number.isFinite(prev) ? prev + 1 : 128048;
    localStorage.setItem(key, String(next));
    setN(next);
  }, []);
  const digits = String(Math.max(0, n)).padStart(7, "0").slice(-7);
  return (
    <span className="hit-counter" title="You are visitor">
      {digits.split("").map((d, i) => (
        <span key={i}>{d}</span>
      ))}
    </span>
  );
}

export function Ticker() {
  const text = `★ LIVE ★  ShareViaCopyLink ${ACTION_WEIGHTS.shareViaCopyLink}  ·  Reply ${ACTION_WEIGHTS.reply}  ·  Quote ${ACTION_WEIGHTS.quote}  ·  Mutual original ${ACTION_WEIGHTS.reply + BOOSTS.bidirectionalFollowReply}  ·  Report ${ACTION_WEIGHTS.report}  ·  Mute ${ACTION_WEIGHTS.muteAuthor}  ·  AgeFilter ${BOOSTS.ageFilterHours}h  ·  OON ×${BOOSTS.oonWeightFactor}  ·  Best viewed in Chrome · 1024×768  ★  `;
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track">
        {text}
        {text}
      </div>
    </div>
  );
}
