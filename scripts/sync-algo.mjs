#!/usr/bin/env node
/**
 * Fetch the live param.rs and print watched-weight diffs.
 * Usage: node scripts/sync-algo.mjs
 */
const URL =
  "https://raw.githubusercontent.com/xai-org/x-algorithm/main/home-mixer/params/param.rs";

const WATCHED = [
  "FavoriteWeight",
  "ReplyWeight",
  "BidirectionalFollowReplyWeightBoost",
  "ShareViaCopyLinkWeight",
  "QuoteWeight",
  "ReportWeight",
  "MuteAuthorWeight",
  "OonWeightFactor",
];

function parseParamFile(source) {
  const out = {};
  for (const block of source.split("param!(").slice(1)) {
    const end = block.indexOf(");");
    if (end === -1) continue;
    const parts = block.slice(0, end).split(",").map((s) => s.trim());
    if (parts.length < 4) continue;
    if (!/^[A-Za-z0-9_]+$/.test(parts[0])) continue;
    out[parts[0]] = parts.slice(3).join(",").trim();
  }
  return out;
}

const res = await fetch(URL, { headers: { "User-Agent": "outrank-sync/0.1" } });
if (!res.ok) {
  console.error("fetch failed", res.status);
  process.exit(1);
}
const src = await res.text();
const params = parseParamFile(src);
console.log(`parsed ${Object.keys(params).length} params from ${URL}`);
for (const key of WATCHED) {
  console.log(`${key}=${params[key] ?? "MISSING"}`);
}
