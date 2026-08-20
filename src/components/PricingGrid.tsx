"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckoutButton } from "./CheckoutButton";
import { PLANS } from "../lib/plans";

export function PricingGrid({ billingOpen = false }: { billingOpen?: boolean }) {
  const [interval, setInterval] = useState<"month" | "year">("year");

  return (
    <>
      <div className="mt-8 flex gap-2">
        <button
          type="button"
          className="chip px-4 py-2 text-sm"
          data-active={interval === "month"}
          onClick={() => setInterval("month")}
        >
          Monthly
        </button>
        <button
          type="button"
          className="chip px-4 py-2 text-sm"
          data-active={interval === "year"}
          onClick={() => setInterval("year")}
        >
          Annual · two months free
        </button>
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {PLANS.map((p) => {
          const annual = interval === "year" && p.yearCents > 0;
          const shown = annual ? p.yearCents / 100 : p.priceCents / 100;
          return (
            <div
              key={p.id}
              className="card flex flex-col p-6"
              style={
                p.highlight
                  ? {
                      borderColor: "var(--line-strong)",
                      boxShadow: "0 0 0 1px rgba(245,185,66,0.2)",
                    }
                  : undefined
              }
            >
              <h2 className="text-sm uppercase tracking-[0.16em] text-[var(--muted)]">
                {p.name}
              </h2>
              <p className="serif mt-3 text-5xl">
                {p.priceCents === 0 ? "$0" : `$${shown}`}
                <span className="text-lg text-[var(--muted)]">
                  {" "}
                  {p.priceCents === 0 ? p.period : annual ? "/ year" : p.period}
                </span>
              </p>
              {annual && (
                <p className="mt-1 text-xs text-[var(--gold)]">
                  ${p.priceCents / 100}/mo billed yearly
                </p>
              )}
              <p className="mt-2 text-sm text-[var(--muted)]">{p.blurb}</p>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-[var(--muted)]">
                {p.points.map((pt) => (
                  <li key={pt}>· {pt}</li>
                ))}
                {p.soon?.map((pt) => (
                  <li key={pt}>
                    · {pt}{" "}
                    <span className="forthcoming">forthcoming</span>
                  </li>
                ))}
              </ul>
              {p.id === "scout" ? (
                <Link
                  href="/app/radar"
                  className="btn-ghost mt-8 py-3 text-center text-sm"
                >
                  {p.cta}
                </Link>
              ) : billingOpen ? (
                <CheckoutButton
                  plan={p.id}
                  highlight={p.highlight}
                  interval={interval}
                >
                  {p.cta}
                  {annual ? " · annual" : ""}
                </CheckoutButton>
              ) : (
                <Link href="/start" className="btn-gold mt-8 py-3 text-center text-sm">
                  Build your profile
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
