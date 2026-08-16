"use client";

import { ACTION_WEIGHTS, BOOSTS } from "../lib/weights";

export function Ticker() {
  const text = `ShareViaCopyLink ${ACTION_WEIGHTS.shareViaCopyLink}   Reply ${ACTION_WEIGHTS.reply}   Quote ${ACTION_WEIGHTS.quote}   Mutual original ${ACTION_WEIGHTS.reply + BOOSTS.bidirectionalFollowReply}   Report ${ACTION_WEIGHTS.report}   Mute ${ACTION_WEIGHTS.muteAuthor}   AgeFilter ${BOOSTS.ageFilterHours}h   OON ×${BOOSTS.oonWeightFactor}     `;
  return (
    <div className="ticker" aria-hidden="true">
      <span className="ticker-live">LIVE</span>
      <div className="ticker-mask">
        <div className="ticker-track">
          {text}
          {text}
        </div>
      </div>
    </div>
  );
}
