"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { planLabel, type PlanId } from "../lib/plans";

type Status = {
  plan: PlanId;
  stripe: boolean;
  usage: { remaining: number | null; cap: number | null };
};

export function BillingBar() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    fetch("/api/billing/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  if (!status) {
    return (
      <Link href="/pricing" className="btn-gold px-3 py-1.5 text-xs">
        Pro
      </Link>
    );
  }

  if (status.plan === "scout") {
    return (
      <Link href="/pricing" className="btn-gold px-3 py-1.5 text-xs">
        Pro
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="tab text-[var(--gold)]">
        {planLabel(status.plan)}
      </span>
      <ManageBilling />
    </div>
  );
}

function ManageBilling() {
  const [busy, setBusy] = useState(false);
  async function open() {
    setBusy(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string };
      if (data.url) window.location.href = data.url;
    } finally {
      setBusy(false);
    }
  }
  return (
    <button
      type="button"
      onClick={open}
      disabled={busy}
      className="text-xs text-[var(--muted)] hover:text-[var(--ink)]"
    >
      {busy ? "…" : "Billing"}
    </button>
  );
}
