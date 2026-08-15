import Link from "next/link";
import { Wordmark } from "./Brand";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[#09090b]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Wordmark />
        <nav className="hidden items-center gap-7 text-sm text-[var(--muted)] sm:flex">
          <Link href="/#how" className="hover:text-[var(--ink)]">
            How it works
          </Link>
          <Link href="/#weights" className="hover:text-[var(--ink)]">
            Live weights
          </Link>
          <Link href="/pricing" className="hover:text-[var(--ink)]">
            Pricing
          </Link>
          <Link href="/install" className="hover:text-[var(--ink)]">
            Extension
          </Link>
          <Link href="/app" className="hover:text-[var(--ink)]">
            Open app
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/app/coach" className="btn-gold px-4 py-2 text-sm">
            Score a draft
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--line)] py-10 text-sm text-[var(--muted)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 sm:flex-row sm:items-center sm:justify-between">
        <p>Outrank watches xai-org/x-algorithm. Not affiliated with X or xAI.</p>
        <div className="flex gap-5">
          <Link href="/pricing">Pricing</Link>
          <Link href="/app/radar">Radar</Link>
          <a href="https://github.com/xai-org/x-algorithm" target="_blank" rel="noreferrer">
            Source algo
          </a>
        </div>
      </div>
    </footer>
  );
}
