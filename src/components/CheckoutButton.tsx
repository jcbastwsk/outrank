"use client";

import { useState } from "react";
import type { PlanId } from "../lib/plans";

export function CheckoutButton({
  plan,
  children,
  highlight,
}: {
  plan: PlanId;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [needDev, setNeedDev] = useState(false);

  async function go(dev = false) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, dev }),
      });
      const data = (await res.json()) as {
        url?: string;
        error?: string;
        message?: string;
      };
      if (res.status === 503 && data.error === "stripe_not_configured") {
        setNeedDev(true);
        setErr(data.message ?? "Stripe is not configured yet.");
        return;
      }
      if (!res.ok || !data.url) {
        throw new Error(data.message || data.error || "Checkout failed");
      }
      window.location.href = data.url;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 space-y-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => go(false)}
        className={
          highlight
            ? "btn-gold w-full py-3 text-center text-sm disabled:opacity-60"
            : "btn-ghost w-full py-3 text-center text-sm disabled:opacity-60"
        }
      >
        {busy ? "Redirecting…" : children}
      </button>
      {needDev && (
        <button
          type="button"
          disabled={busy}
          onClick={() => go(true)}
          className="w-full text-center text-xs text-[var(--gold)]"
        >
          No Stripe key — unlock {plan} locally
        </button>
      )}
      {err && <p className="text-xs leading-5 text-[var(--bad)]">{err}</p>}
    </div>
  );
}
