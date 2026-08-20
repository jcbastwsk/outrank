"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ExtensionAttach } from "../../../components/ExtensionAttach";

export function ConfirmCheckout({ sessionId }: { sessionId: string | null }) {
  const [state, setState] = useState<"wait" | "ok" | "err">("wait");
  const [plan, setPlan] = useState<string>("pro");
  const [rail, setRail] = useState<"card" | "crypto">("card");
  const [message, setMessage] = useState("Confirming with Stripe…");

  useEffect(() => {
    if (!sessionId) {
      setState("err");
      setMessage("Missing checkout session. If you just paid, open the app and refresh.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/checkout/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
        const data = (await res.json()) as {
          plan?: string;
          rail?: string;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || "Could not confirm");
        setPlan(data.plan || "pro");
        setRail(data.rail === "crypto" ? "crypto" : "card");
        setState("ok");
        window.dispatchEvent(new Event("outrank:attach"));
      } catch (e) {
        if (cancelled) return;
        setState("err");
        setMessage(e instanceof Error ? e.message : "Could not confirm checkout");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (state === "wait") {
    return <p className="mt-6 text-[var(--muted)]">{message}</p>;
  }
  if (state === "err") {
    return (
      <div className="mt-6 space-y-4">
        <p className="text-[var(--bad)]">{message}</p>
        <Link href="/pricing" className="btn-ghost inline-block px-5 py-2 text-sm">
          Back to pricing
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <p className="text-lg text-[var(--muted)]">
        {rail === "crypto" ? (
          <>
            Your <span className="text-[var(--ink)]">{plan}</span> month is
            paid in stablecoin. It does not renew. Leave this tab open with
            the extension installed so x.com scores use the paid plan.
          </>
        ) : (
          <>
            Your <span className="text-[var(--ink)]">{plan}</span> subscription
            is active. Leave this tab open with the extension installed so
            x.com scores use the paid plan.
          </>
        )}
      </p>
      <ExtensionAttach />
      <Link href="/app" className="btn-gold inline-block px-6 py-3 text-sm">
        Open the command center
      </Link>
    </div>
  );
}
