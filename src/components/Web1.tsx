"use client";

export function Ticker() {
  const text = `outrank.coach   coaching for X   established 2026   not affiliated with X or xAI     `;
  return (
    <div className="ticker" aria-hidden="true">
      <span className="ticker-live">OUTRANK</span>
      <div className="ticker-mask">
        <div className="ticker-track">
          {text}
          {text}
        </div>
      </div>
    </div>
  );
}
