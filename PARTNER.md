# Outrank — partner look

**Date:** 15 Aug 2026  
**What this is:** a paid Chrome extension + web coach that watches X’s open-sourced For You algorithm and tells creators how to get shown.

X published the real ranking weights on 13 Aug 2026 (`xai-org/x-algorithm`). Existing tools (Tweet Hunter, Typefully, SuperX) still guess. Outrank reads the published formula:

```
Final score = Σ (weightᵢ × P(actionᵢ))
```

We do **not** run Phoenix (X’s Grok ranker) for every viewer. We estimate action probabilities from the draft, then multiply by the **production weights**. It is a coaching instrument, not a shadow ranker. We will not help anyone evade visibility, spam, or abuse systems.

## What to click

Unzip, then from the folder (needs Node 22+):

```bash
npm install
npm run dev
```

Open:

| Page | URL |
| --- | --- |
| Marketing | http://localhost:3000 |
| Command + coach | http://localhost:3000/app |
| Radar (live GitHub weight poll) | http://localhost:3000/app/radar |
| Under the Hood | http://localhost:3000/app/hood |
| Pricing / Stripe | http://localhost:3000/pricing |
| Chrome OS extension install | http://localhost:3000/install |

Try three drafts in the coach: a link+hashtag dump, a bland one-liner, and a question people would copy-link. They should score very differently.

## The ranking facts we are betting on

These are the published defaults as of the 12 Aug 2026 snapshot:

| Signal | Weight | vs a like |
| --- | --- | --- |
| Copy-link share | 20.0 | 40× |
| Reply / quote / DM share | 5.0 | 10× |
| Mutual-follow original (reply + boost) | 20 | 40× |
| Like | 0.5 | 1× |
| Profile click | 0 | dead |
| Mute | −58.8 | worse than a block |
| Report | −234 | catastrophic |

The mutual-follow reply boost went 0 → 20 → 15 in two weeks (July 2026). That is why this is a subscription, not a blog post.

## Product / money

| Plan | Price | What’s in |
| --- | --- | --- |
| Scout | $0 | Weights, changelog, 3 API/extension scores per day |
| Pro | $19/mo | Unlimited scores, extension, radar |
| Studio | $49/mo | Pro + Under the Hood interpreter |

Stripe Checkout is wired. Test mode works once `STRIPE_SECRET_KEY` is in `.env.local`. No live charges yet.

## Honest status (15 Aug)

- Working local app + Chrome extension (load unpacked)
- Radar polls GitHub and diffs watched weights (last check: in sync)
- Stripe code is in; live keys not in the repo
- Git repo exists locally; GitHub remote is reserved (`jstwsk/outrank`) but the empty GitHub repo has not been created yet, so there is no public link
- No production deploy (Vercel etc.) yet
- Chrome OS: extension loads in Chromebook Chrome from **Linux files → Outrank-extension**; the server stays in the penguin VM

## What we want from you

1. Does the wedge land? (“We watch the open-source ranker” vs another growth tool.)
2. Are $19 / $49 the right rungs?
3. Who is buyer #1 — creators, agencies, or operators with multiple accounts?
4. Anything here we should not say in public (legal / X ToS / “maximize reach” framing)?

Reply on those four. The rest is implementation.