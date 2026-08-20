import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc } from "../../components/LegalDoc";
import { LEGAL } from "../../lib/legal";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The contract for using Outrank.",
};

export default function TermsPage() {
  return (
    <LegalDoc kicker="Terms of Use" title="The deal." updated={LEGAL.updated}>
      <p>
        These terms are the contract between you and {LEGAL.operator} (“we,”
        “us”) for {LEGAL.product} at {LEGAL.host}. If you do not agree, do not
        use the site, the app, or the Chrome extension. Paying, clicking
        checkout, or submitting a draft is agreement.
      </p>
      <p>
        We are a small software product. We are <strong>not</strong> X, Twitter,
        xAI, or Stripe. We do not run Phoenix. We do not work for them.
      </p>

      <h2>1. What this is</h2>
      <p>
        Outrank estimates how a draft might score against the{" "}
        <strong>published</strong> For You action weights in the public{" "}
        <a href="https://github.com/xai-org/x-algorithm">xai-org/x-algorithm</a>{" "}
        repo (Apache-2.0), then tells you what to change. That estimate is a
        coaching instrument. It is not the live ranker, not a prediction of
        impressions, and not a promise you will be shown to anyone.
      </p>
      <p>
        Radar watches the public repo. Under the Hood explains labels X already
        showed you. The extension reads the compose box on x.com and sends that
        text to our API so we can score it. We do not post as you.
      </p>

      <h2>2. What this is not</h2>
      <ul>
        <li>Not legal, financial, or professional advice.</li>
        <li>Not a guarantee of reach, followers, revenue, or an unbanned account.</li>
        <li>Not a license to spam, brigades, fake engagement, or evade X safety systems.</li>
        <li>Not affiliated with, endorsed by, or sponsored by X Corp. or xAI.</li>
      </ul>
      <p>
        “X,” “Twitter,” “For You,” “Grok,” and “Phoenix” belong to their owners.
        We use those words to describe a public system. We do not claim their
        marks.
      </p>

      <h2>3. Who can use it</h2>
      <p>
        You must be at least {LEGAL.age}. If you use Outrank for a company, you
        can bind that company. You will follow X’s rules and the law where you
        live.
      </p>

      <h2>4. Your drafts and your account</h2>
      <p>
        Your posts stay yours. You give us a limited license to process what you
        paste or what the extension sends — only to score it, coach it, bill
        you, stop abuse, and keep the product running. We do not buy your voice.
        We do not claim a right to publish your drafts as ads unless you later
        say so in writing.
      </p>
      <p>
        Do not send us secrets you cannot afford to type into a website. Treat
        the compose box and the coach like the internet.
      </p>

      <h2>5. Hard no</h2>
      <p>You will not use Outrank to:</p>
      <ul>
        <li>Violate X’s terms, spam rules, or the law.</li>
        <li>
          Evade visibility filtering, Agatha, Botmaker, Scarecrow, labels, or
          any safety system. We will not help you do that. The Hood tool
          explains labels. It does not remove them.
        </li>
        <li>
          Farm reports, slurs, or threats as a growth tactic. The product will
          refuse to coach that. Using us to try anyway is a breach.
        </li>
        <li>
          Scrape us, resell our scores as if they were Phoenix, or attack the
          service.
        </li>
        <li>
          Sexual content involving anyone 17 or under, or any attempt to use
          the coach toward that. We will report it if we see it.
        </li>
      </ul>
      <p>
        We can refuse a score, suspend a plan, or ban an IP when we think this
        section is in play. We do not have to give you a debate first.
      </p>

      <h2>6. Money</h2>
      <p>
        Radar (internally Scout) is free and capped. Pro is $29/month or
        $290/year. Agency (internally Studio) is $149/month or $1,490/year.
        Those are the prices on <Link href="/pricing">/pricing</Link> unless
        checkout shows a different number — checkout wins.
      </p>
      <p>
        If you subscribe to algo-change alerts we email you only when a
        published For You default moves. That is not a marketing list.
        Unsubscribe is on every mail.
      </p>
      <p>
        Paid plans billed to a card are <strong>subscriptions</strong>. Stripe
        charges you every month until you cancel. Cancel in the Billing portal
        (the “Billing” control in the app, which is Stripe Customer Portal).
        Cancellation stops the next charge. You keep the plan until the period
        you already paid for ends, then you drop to Scout.
      </p>
      <p>
        <strong>No refunds</strong> for unused days, change of mind, X changing
        the algorithm, or your account getting restricted — unless a law where
        you live forces one. If we charge you by mistake, email us and we will
        reverse that charge.
      </p>
      <p>
        You can also pay one month in USDC (or another stablecoin Stripe
        accepts) through Stripe Checkout. That is a one-time payment, not a
        subscription. It does not auto-renew. When the month ends you drop to
        Scout unless you pay again or start a card subscription.
      </p>
      <p>
        Stripe processes the card or the wallet payment. Their terms apply to
        the payment itself. We never see your full card number or wallet seed.
        A failed payment can drop you to Scout without a funeral.
      </p>
      <p>
        If we change the price we will say so before we charge the new amount.
        Keep using a paid plan after that notice means you accept the new price.
      </p>

      <h2>7. The extension</h2>
      <p>
        You install it on purpose. It reads text in X’s compose boxes and sends
        that text to the API URL you configured (by default {LEGAL.host}). It
        does not take your X password. It does not read DMs. Uninstall it in
        Chrome if you want that to stop.
      </p>

      <h2>8. The service will break</h2>
      <p>
        X can change weights, close the repo, ban you, or ship a ranker that
        ignores everything we say. Vercel can sleep. Stripe can decline. We can
        ship a bad prior. The product is provided <strong>as is</strong> and{" "}
        <strong>as available</strong>. We disclaim all warranties to the limit
        the law allows, including merchantability, fitness for a purpose, and
        non-infringement.
      </p>

      <h2>9. If something goes wrong</h2>
      <p>
        We are not liable for lost reach, lost followers, a dropped account,
        lost profits, or X hiding you. We are not liable for indirect, special,
        or consequential damages.
      </p>
      <p>
        If a court will not let us exclude something, our total liability to
        you is capped at what you paid us in the 90 days before the claim, or
        $149, whichever is more. That cap is the deal. This is a coaching and
        reporting instrument, not a guarantee of reach.
      </p>
      <p>
        If you use Outrank to break X’s rules or the law and that blows back on
        us, you will cover the reasonable cost of that blowback. That is the
        whole indemnity.
      </p>

      <h2>10. Changes and ending it</h2>
      <p>
        We can change these terms. The date at the top is the current version.
        If you keep using Outrank after a change, you accepted it. If you hate
        the change, stop using it and cancel billing.
      </p>
      <p>
        You can stop anytime. We can stop offering the product or a plan. If we
        shut down a paid plan we will not keep charging you for it.
      </p>

      <h2>11. Law</h2>
      <p>
        These terms follow United States law, without picking a fight about
        whose conflict rules win. If we end up in court, it is in the state and
        county where the operator of Outrank lives at that time. If a piece of
        these terms is unenforceable, the rest still stands. These terms plus
        the <Link href="/privacy">Privacy Policy</Link> are the whole agreement.
      </p>
      <p>
        We skipped forced arbitration on purpose. If we have a real dispute we
        will try email first:{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
      </p>
    </LegalDoc>
  );
}
