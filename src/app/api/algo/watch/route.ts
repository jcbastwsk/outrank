import { NextResponse } from "next/server";
import { dispatchDrift, watchAuthorized } from "../../../../lib/alerts";
import { fetchLiveDiff } from "../../../../lib/radar";

/** Public GET returns state. Authorized GET also mails the list on new drift. */
export async function GET(req: Request) {
  const diff = await fetchLiveDiff();
  const failed = Boolean(diff.error && diff.parsed === 0);
  const state = failed ? "DOWN" : diff.synced ? "SYNCED" : "DRIFT";
  const status = failed ? 502 : 200;
  let mailed: { sent: number; reason?: string } | undefined;
  if (!failed && watchAuthorized(req)) {
    mailed = await dispatchDrift(diff);
  }
  return NextResponse.json(
    {
      state,
      snapshotAt: diff.snapshotAt,
      checkedAt: diff.checkedAt,
      compared: diff.compared,
      parsed: diff.parsed,
      changes: diff.changes,
      error: diff.error,
      mailed,
    },
    { status },
  );
}
