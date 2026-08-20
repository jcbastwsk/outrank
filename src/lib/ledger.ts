export type LedgerRow = {
  week: string;
  draft: string;
  estimate: string;
  outcome: string;
  miss: boolean;
  note: string;
};

/** Public calibration. Empty until design partners log outcomes. */
export const LEDGER: LedgerRow[] = [];

export const LEDGER_PROMISE =
  "Weekly. Draft → our estimate → what happened. Misses stay on the page. No fabricated rows.";
