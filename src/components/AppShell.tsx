"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BillingBar } from "./BillingBar";
import { Wordmark } from "./Brand";

const NAV = [
  { href: "/app", label: "Command" },
  { href: "/app/coach", label: "Coach" },
  { href: "/app/radar", label: "Radar" },
  { href: "/app/hood", label: "Under the Hood" },
  { href: "/app/curate", label: "Curate" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[#09090b]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Wordmark href="/app" />
          <nav className="flex items-center gap-1 text-sm">
            {NAV.map((item) => {
              const active = path === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3 py-1.5 ${
                    active
                      ? "bg-[var(--gold)]/15 text-[var(--gold)]"
                      : "text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <BillingBar />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
