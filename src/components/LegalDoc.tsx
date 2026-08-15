import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "./SiteHeader";

export function LegalDoc({
  kicker,
  title,
  updated,
  children,
}: {
  kicker: string;
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-16">
        <p className="mono text-[15px] text-[var(--gold)]">{kicker}</p>
        <h1 className="serif mt-3 text-5xl">{title}</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">Last updated {updated}</p>
        <div className="legal-prose mt-10">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
