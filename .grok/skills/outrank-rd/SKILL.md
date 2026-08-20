---
name: outrank-rd
description: >
  Run Outrank's research cycle: watch published X ranking weights, score
  fixture and curator drafts, find coach mismatches, propose at most three
  small prior changes, never auto-edit. Use when the user says run the loop,
  retune, calibrate, harvest posts, algo watch, R&D cycle, check param.rs
  drift, or runs /outrank-rd.
---

# Outrank R&D

Doctrine lives in `/home/jcb/src/outrank/AGENTS.md`. Read it. Do not duplicate it here.

Work in `/home/jcb/src/outrank`.

## Cycle

1. **Watch.** `npm run rd:watch`. If `param.rs` drifted: report which watched params moved and what the coach should say now. Do not patch `weights.ts` / `snapshot.ts` / `changelog.ts` until the user says yes.
2. **Measure.** `npm run rd:fixtures`. Goldens failing is a regression, not a research idea. Fix or justify before proposing new priors.
3. **Harvest (optional).** At most 8 public posts. Mix of operator drafts that printed and ones that died. Prefer X search. Skip hate, slurs, evasion how-tos. Paste into the report; do not invent engagement.
4. **Score harvest + packs.** `research/packs/*.json` and `data/curation.json` if present (`blew_up|worked|mid|died`). A blew-up graded D/F, or a died graded A/S, is a mismatch. Observed likes are a noisy proxy — say so.
5. **Propose at most 3 changes.** Each must be one prior, one feature flag, or one coach sentence. Name the file and the published weight it serves. Name how fixtures would catch a mistake (`kill_if`).
6. **Kill clutter.** Drop anything that adds a lane/tribe, chases scene sociology, puts an LLM on live scoring, coaches evasion, or cannot be falsified.
7. **Stop.** Write the report. Do not edit `src/lib/score.ts` or `src/lib/coach.ts` until the user accepts a proposal.

## Commands

```
npm run rd:fixtures
npm run rd:fixtures -- --score "draft text"
npm run rd:watch
```

Saved workflow: `/outrank-rd` (same cycle, no auto-edit).

## Output

A short report: drift (or synced), fixture result, mismatches, ≤3 proposals with `kill_if`. Empty proposals is a valid win.
