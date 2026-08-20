<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Outrank

Paid Chrome extension + web coach. Published X For You weights × estimated P(action). We do not run Phoenix.

## The hook

Anyone can compute `score = Σ w_i × P̂(action_i | text)` from the public file. Phoenix is `P(action | viewer, author, candidate)`. We will never have that.

The asset is the **residual**: for this desk, this format, this Mutuals/Cold split — what actually happened, and which layer failed (`rank` / `suppress` / `slate`). When `param.rs` moves, recompute the physics. The residual still applies. A screenshot of the weights table cannot clone that.

The coach is the interface. The residual is the machinery. User-facing: “X says A. Your last N posts say A + Δ.”

Public copy: published coefficients are feature-switch defaults, not event points. Never “10× a like,” “468 likes,” or “production weights.” Label VERIFIED / INFERENCE / MODEL ESTIMATE / USER OUTCOME. Strategic Profile lives on the server behind `outrank_desk`.

Canonical unit (`src/lib/event.ts`): Brief → Candidate → Prediction → Publish → Observation → Classification → Residual → next brief. Events persist in `data/desks.json` behind `outrank_desk`. localStorage is a cache, not the moat.

Do not put an LLM on the live scoring path. Do not invent outcomes. Do not add rooms, agency PDFs, or a second analyzer. Empty residual is an honest empty. Public weights are non-proprietary — flaunt them.

## The unknown need

Operators think they need more posts, more likes, a growth template. They need to know which published head they are actually playing for — copy-link (20), reply/quote/DM (5), mutual-follow originals (reply 5+15), not likes (0.5). One original. Stay in the replies. 48-hour AgeFilter. Do not dump. Do not nuke the account.

If a change does not make that fact land harder for a paying operator, do not ship it.

## Money

Radar $0 (weights + 3 scores/day). Pro $29 / $290 year (coach + extension, one account). Agency $149 / $1,490 year (ten accounts). Do not add a fourth rung. Do not sell “grader only.” The subscription is the coach and the receipt when weights move.

Buyer is people who post on purpose. Scene/fat-tail OC is supply to steal a shape from, not the ICP.

## Hard rules

- Weights come from `xai-org/x-algorithm` `home-mixer/params/param.rs` via `src/lib/weights.ts` + `src/lib/snapshot.ts`. Never invent them.
- P(action) is a heuristic prior (`src/lib/score.ts`). Call it a coach, never the live ranker.
- Do not help anyone evade visibility filters, spam rules, Agatha, or abuse systems. Under the Hood is explained, not gamed.
- Hate / report-farming: detect, warn, refuse to tune. ReportWeight is −234.
- Do not add lanes, tribes, or format types unless a paying operator is failing in a way the current ones cannot name. Prefer retuning a prior.
- Do not put an LLM on the live scoring path. The wedge is published weights + honest priors.
- Work in this repo (`/home/jcb/src/outrank`), not `$HOME`.
- No AI-isms on the site. Never “vibes,” “load-bearing,” “playbook,” “unlock your,” “journey,” or consultant gloss. Say the number or the desk. The room feature is called Room.

## R&D

Procedure: `.grok/skills/outrank-rd/SKILL.md`. Cycle: `/outrank-rd` or `/workflow outrank-rd`. Never auto-edit the scorer.

```
npm run rd:fixtures   # known drafts must not regress
npm run rd:watch      # param.rs vs snapshot; quiet when synced
```

Human gate on every prior change. Curator packs (`/app/curate`, drop JSON in `research/packs/`) are labeled reality. Fixtures are the floor.

## Before you build

Ask: what do they need that they do not know they need? Then ask: is this a wild goose chase? If you cannot name the published weight or the desk it serves, stop.
