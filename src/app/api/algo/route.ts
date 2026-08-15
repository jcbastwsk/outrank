import { NextResponse } from "next/server";
import { diffParams, parseParamFile, WATCHED_PARAMS } from "../../../lib/changelog";
import { PARAM_SNAPSHOT } from "../../../lib/snapshot";
import { ALGO_SOURCE } from "../../../lib/weights";

export async function GET() {
  try {
    const res = await fetch(ALGO_SOURCE.rawUrl, {
      headers: { "User-Agent": "outrank-radar/0.1" },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `GitHub returned ${res.status}` },
        { status: 502 },
      );
    }
    const source = await res.text();
    const live = parseParamFile(source);
    const watchedLive: Record<string, string> = {};
    for (const key of Object.keys(PARAM_SNAPSHOT)) {
      if (live[key] !== undefined) watchedLive[key] = live[key];
    }
    const changes = diffParams(PARAM_SNAPSHOT, {
      ...PARAM_SNAPSHOT,
      ...watchedLive,
    }).filter((c) => c.key in PARAM_SNAPSHOT || WATCHED_PARAMS.includes(c.key));

    return NextResponse.json({
      source: ALGO_SOURCE,
      compared: Object.keys(PARAM_SNAPSHOT).length,
      parsed: Object.keys(live).length,
      synced: changes.length === 0,
      changes,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "fetch failed" },
      { status: 502 },
    );
  }
}
