import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc } from "../../components/LegalDoc";
import { LEGAL } from "../../lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What Outrank collects, what it does not, and how to get it deleted.",
};

export default function PrivacyPage() {
  return (
    <LegalDoc kicker="Privacy Policy" title="What we touch." updated={LEGAL.updated}>
      <p>
        This policy is for {LEGAL.product} at {LEGAL.host} and the Chrome
        extension that talks to it. It is meant to be true, not decorative. If
        something here stops matching the product, the product is wrong — email{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> and we will fix the
        page.
      </p>

      <h2>1. Who we are</h2>
      <p>
        {LEGAL.operator}. Contact:{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>. We are not X and
        we are not Stripe. Stripe is its own company with its own privacy
        notice.
      </p>

      <h2>2. What we collect</h2>
      <p>
        <strong>You type it.</strong> Drafts you paste into the coach. Text the
        extension reads from X’s compose box and POSTs to{" "}
        <span className="mono">/api/analyze</span>. Past posts you drop into
        Vibe. Under the Hood JSON you paste. Curator cases if you use that
        desk.
      </p>
      <p>
        <strong>Scoring those drafts.</strong> The analyze API scores the text
        and returns the result. We do not keep a public feed of your drafts.
        Server logs (host, time, IP, user-agent) exist because Vercel runs the
        site — that is hosting, not a scrapbook.
      </p>
      <p>
        <strong>Billing.</strong> If you pay, Stripe takes your email, card,
        and billing address. We get back a customer id, a subscription id, a
        plan, and the email Stripe already has. We store that in a signed
        cookie on your browser and, when the server can write a file, in a
        billing record. We never receive your full card number.
      </p>
      <p>
        <strong>Cookies we set.</strong>{" "}
        <span className="mono">outrank_plan</span> (which plan this browser
        unlocked), <span className="mono">outrank_usage</span> (Scout’s daily
        score count), <span className="mono">outrank_curator</span> (curator
        unlock). They are first-party, httpOnly, and exist so the product
        works. They are not an ad network.
      </p>
      <p>
        <strong>On your machine only.</strong> Vibe profile, curator copies,
        and a joke hit counter live in <span className="mono">localStorage</span>.
        Clear site data and they are gone. We cannot read your localStorage
        from another computer.
      </p>
      <p>
        <strong>We do not take.</strong> Your X password. Your DMs. Your
        contacts. Access to post as you. A live Phoenix user vector. We do not
        sell a list of your drafts. We do not run a third-party ad pixel on
        this site.
      </p>

      <h2>3. Why</h2>
      <ul>
        <li>Score and coach the text you asked us to score.</li>
        <li>Charge for Pro/Studio and remember that you paid.</li>
        <li>Cap Scout so the free tier is not an open proxy.</li>
        <li>Explain Under the Hood JSON you pasted.</li>
        <li>Stop abuse and keep the lights on.</li>
      </ul>
      <p>
        That is the list. If we ever train a model on your drafts, we will say
        so here <strong>before</strong> we do it, and it will be opt-in. Today
        we do not.
      </p>

      <h2>4. Who else sees it</h2>
      <ul>
        <li>
          <strong>Stripe</strong> — payment and customer portal.{" "}
          <a href="https://stripe.com/privacy">stripe.com/privacy</a>
        </li>
        <li>
          <strong>Vercel</strong> — hosts the site and the APIs. Request logs
          live on their infrastructure.
        </li>
        <li>
          <strong>You, on purpose</strong> — if you copy a curator pack or a
          score and paste it somewhere else, that is you.
        </li>
      </ul>
      <p>
        We hand data to police or a court when the law requires it. We do not
        sell personal information as California uses that phrase. We do not
        share drafts with random “partners” for their ads.
      </p>

      <h2>5. The extension</h2>
      <p>
        It runs on x.com compose pages. It reads the draft in the tweet box and
        sends it to the API base you saved in the popup (localhost while you
        develop; {LEGAL.host} in production). Chrome can show you the
        permissions. Remove the extension and that read stops.
      </p>

      <h2>6. How long</h2>
      <p>
        Billing records last as long as we need them for taxes, chargebacks,
        and “did this person pay.” Plan cookies last about a month unless you
        refresh them by using the product. Usage cookies last a couple of days.
        Vercel logs rotate on Vercel’s schedule. localStorage lasts until you
        clear it.
      </p>
      <p>
        Want it gone? Email <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>{" "}
        from the address you used at Stripe. We will delete our billing record
        and cookies we control. We cannot delete Stripe’s copy of a charge —
        ask Stripe, or we can point you at the portal. We cannot delete a
        tweet you already posted.
      </p>

      <h2>7. Kids</h2>
      <p>
        Outrank is for people {LEGAL.age} or older. We do not want accounts
        from children. If you think we have data on someone under 13, write us
        and we will delete it.
      </p>

      <h2>8. Rights, if they apply to you</h2>
      <p>
        If you are in a place with a privacy statute (California, UK, EU, and
        the rest of that list), you can ask us what we have, correct it, or
        delete it. Email is the channel. We will not make you fax a utility
        bill unless we actually cannot tell it is you.
      </p>

      <h2>9. Security</h2>
      <p>
        HTTPS. Signed cookies. Stripe for cards. That is the stack. No product
        this size should promise you a fortress. Do not paste passwords or
        private keys into the coach.
      </p>

      <h2>10. Changes</h2>
      <p>
        The date at the top is the current version. Material changes get a new
        date. Keep using Outrank after that and you are on the new policy. The{" "}
        <Link href="/terms">Terms of Use</Link> are the rest of the contract.
      </p>
    </LegalDoc>
  );
}
