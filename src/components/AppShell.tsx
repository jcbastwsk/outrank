"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BillingBar } from "./BillingBar";
import { Wordmark } from "./Brand";
import { HandleChip } from "./HandleChip";

const NAV = [
  { href: "/app", label: "Command" },
  { href: "/app/coach", label: "Coach" },
  { href: "/app/radar", label: "Radar" },
  { href: "/app/hood", label: "Hood" },
  { href: "/app/curate", label: "Curate" },
  { href: "/app/vibe", label: "Vibe" },
  { href: "/app/avatar", label: "Avatar" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30">
        <div className="chrome-bar">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2 sm:px-5 md:h-16 md:flex-row md:items-center md:justify-between md:gap-3 md:py-0">
            <div className="flex items-center justify-between gap-3">
              <Wordmark href="/app" />
              <div className="flex items-center gap-2 md:hidden">
                <HandleChip compact />
                <BillingBar />
              </div>
            </div>
            <nav className="flex flex-1 items-center gap-1 overflow-x-auto text-sm">
              {NAV.map((item) => {
                const active = path === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-active={active}
                    className="tab shrink-0"
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="hidden items-center gap-3 md:flex">
              <HandleChip compact />
              <BillingBar />
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
      <p className="mx-auto max-w-6xl px-5 pb-8 text-[11px] text-[var(--muted)]">
        <Link href="/terms" className="hover:text-[var(--cyan)]">
          Terms
        </Link>
        {" · "}
        <Link href="/privacy" className="hover:text-[var(--cyan)]">
          Privacy
        </Link>
        {" · "}
        Estimates, not Phoenix. Not affiliated with X or xAI.
      </p>
    </div>
  );
}
