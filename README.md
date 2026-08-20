# Outrank

A persistent strategic coach for people with a point of view. You remain the author. Outrank remembers the work and recommends the next move.

Published ranking defaults from [`xai-org/x-algorithm`](https://github.com/xai-org/x-algorithm) `home-mixer/params/param.rs` are a supporting layer. They are coefficients on predicted viewer actions, not event points. Outrank does **not** run Phoenix.

Snapshot of published defaults: **2026-08-12T04:09:22Z**.

```
score = Σ (weight_i × P(action_i))
```

We will not help anyone evade visibility filters, spam rules, or abuse systems.

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
- Start: http://localhost:3000/start
- Coach: http://localhost:3000/app/coach
- Profile: http://localhost:3000/app/profile
- Results: http://localhost:3000/app/results
- Radar: http://localhost:3000/app/radar
- Demo: http://localhost:3000/demo
- Pricing: http://localhost:3000/pricing

Poll live weights:

```bash
npm run sync-algo
npm run rd:watch      # quiet when param.rs matches the snapshot
npm run rd:fixtures   # known drafts must not regress
```

R&D cycle (no auto-edit): `/outrank-rd`. Doctrine in `AGENTS.md`.

## Chrome extension

1. Chrome → `chrome://extensions` → Developer mode
2. Load unpacked → `extension/` (on Chrome OS: Linux files → `Outrank-extension`)
3. Open this site (`/install` or `/app`) so the extension can attach a signed plan token. x.com cannot see the billing cookie.
4. Open x.com, start a post. The panel scores against your local app (`http://localhost:3000`). Change the API URL in the extension popup when you deploy.

`/api/analyze` requires that token (or the site cookie). Without it the extension is not Pro, and Scout is not silently unlimited.

## Paid plans

| Plan | Price | What |
| --- | --- | --- |
| Radar | $0 | Weights, changelog, email when a default moves, 3 draft scores/day |
| Pro | $29/mo or $290/yr | Coach + extension, 1 account, unlimited scores, Under the Hood |
| Agency | $149/mo or $1,490/yr | Pro + 10 accounts, white-label reports, Slack radar (last two forthcoming) |

Checkout is Stripe Checkout. Card is a monthly subscription. USDC is a one-time month (Stripe cannot put crypto on a subscription for this account). Copy `.env.example` to `.env.local` and set `STRIPE_SECRET_KEY`. Enable **Stablecoins and Crypto** in the Stripe Dashboard. Optional `STRIPE_PRICE_PRO` / `STRIPE_PRICE_STUDIO` pin dashboard prices for the card rail; crypto always uses inline `price_data`.

Webhook (subscription cancel/update):

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Put the signing secret in `STRIPE_WEBHOOK_SECRET`. Without a key, local pricing still offers **unlock Pro/Studio on this machine** so you can try the gates.

Entitlements live in a signed httpOnly cookie plus `data/billing.json` (gitignored). The extension carries a separate signed bearer token minted at `POST /api/billing/token`.

## Layout

```
src/lib/          weights, scorer, coach, hood interpreter
src/app/          Next.js marketing + app + APIs
extension/        Manifest V3 content script
scripts/          live param.rs pull
```
