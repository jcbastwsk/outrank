/**
 * Fetch live param.rs and diff against the baked snapshot.
 * Exit 0 + "SYNCED" when nothing we snapshot moved.
 * Exit 1 + "DRIFT" when it did. Extra live params are ignored.
 */
import { PARAM_SNAPSHOT } from "../src/lib/snapshot";
import { diffParams, parseParamFile, WATCHED_PARAMS } from "../src/lib/changelog";
import { ALGO_SOURCE } from "../src/lib/weights";

async function main() {
  const res = await fetch(ALGO_SOURCE.rawUrl, {
    headers: { "User-Agent": "outrank-rd-watch/0.1" },
  });
  if (!res.ok) {
    console.error(`FETCH ${res.status} ${ALGO_SOURCE.rawUrl}`);
    process.exit(2);
  }

  const live = parseParamFile(await res.text());
  const compared: Record<string, string> = { ...PARAM_SNAPSHOT };
  for (const key of Object.keys(PARAM_SNAPSHOT)) {
    if (live[key] !== undefined) compared[key] = live[key];
  }

  const changes = diffParams(PARAM_SNAPSHOT, compared).filter(
    (c) => c.key in PARAM_SNAPSHOT || WATCHED_PARAMS.includes(c.key),
  );

  if (changes.length === 0) {
    console.log(`SYNCED  ${Object.keys(PARAM_SNAPSHOT).length} params  ${ALGO_SOURCE.snapshotAt}`);
    process.exit(0);
  }

  console.log(`DRIFT  ${changes.length} param(s)`);
  for (const c of changes) {
    const flag = c.watched ? "WATCHED" : "     ";
    console.log(`${flag}  ${c.key}  ${c.from ?? "∅"} → ${c.to ?? "∅"}`);
  }
  process.exit(1);
}

main();
