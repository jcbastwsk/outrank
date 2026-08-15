# Outrank

The X For You algorithm is public. Outrank watches it and tells you how to get shown.

This is a paid Chrome extension + web coach. It does **not** run Phoenix (the Grok ranker). It estimates action probabilities from a draft, then multiplies by the **published production weights** in [`xai-org/x-algorithm`](https://github.com/xai-org/x-algorithm) `home-mixer/params/param.rs`.

```
Final score = Σ (weight_i × P(action_i))
```

Snapshot baked in: **2026-08-12T04:09:22Z** (the file X made public on 2026-08-13).

## Why this exists

Tweet Hunter / Typefully / SuperX guess. As of 13 Aug 2026 the weights are in the repo:

| Head | Weight | vs a like |
| --- | --- | --- |
| Share via copy link | 20.0 | 40× |
| Reply / quote / DM share | 5.0 | 10× |
| Mutual-follow original reply boost | +15.0 | reply becomes 20 |
| Follow author | 4.0 | 8× |
| Like | 0.5 | 1× |
| Profile click | 0.0 | dead |
| Mute | −58.8 | brutal |
| Report | −234.0 | catastrophic |

We will not help anyone evade visibility filters, spam rules, or abuse systems. Under the Hood is explained, not gamed.

## Domain

Production host: **https://outrank.coach**

Deploy the GitHub repo to Vercel, add the domain, then at the registrar:

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | `10.0.1.2` (or whatever Vercel’s domain card shows) |
| CNAME | `www` | `cname.vercel-dns.com` |

Set Vercel env `NEXT_PUBLIC_APP_URL=https://outrank.coach` and `STRIPE_SECRET_KEY` (test until you go live).

## Run

Needs Node 22+ on `PATH` (`~/.local/bin` on this machine).

```bash
cd src/outrank
npm run dev
```

- Marketing: http://localhost:3000
- Coach: http://localhost:3000/app/coach
- Radar: http://localhost:3000/app/radar
- Under the Hood: http://localhost:3000/app/hood
- Pricing: http://localhost:3000/pricing

Poll live weights:

```bash
npm run sync-algo
```

## Chrome extension

1. Chrome → `chrome://extensions` → Developer mode
2. Load unpacked → `extension/`
3. Open x.com, start a post. The panel scores against your local app (`http://localhost:3000`). Change the API URL in the extension popup when you deploy.

## Paid plans

| Plan | Price | What |
| --- | --- | --- |
| Scout | $0 | Weights + changelog + 3 API/extension scores per day |
| Pro | $19/mo | Unlimited scores, Chrome extension, radar |
| Studio | $49/mo | Pro + Under the Hood interpreter |

Checkout is Stripe Checkout (subscription). Copy `.env.example` to `.env.local` and set `STRIPE_SECRET_KEY`. Optional `STRIPE_PRICE_PRO` / `STRIPE_PRICE_STUDIO` pin dashboard prices; otherwise Checkout creates $19 / $49 monthly prices inline.

Webhook (subscription cancel/update):

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Put the signing secret in `STRIPE_WEBHOOK_SECRET`. Without a key, local pricing still offers **unlock Pro/Studio on this machine** so you can try the gates.

Entitlements live in a signed httpOnly cookie plus `data/billing.json` (gitignored).

## Layout

```
src/lib/          weights, scorer, coach, hood interpreter
src/app/          Next.js marketing + app + APIs
extension/        Manifest V3 content script
scripts/          live param.rs pull
```
