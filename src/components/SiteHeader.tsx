import Link from "next/link";
import { Wordmark } from "./Brand";
import { HitCounter, Ticker } from "./Web1";
import { ALGO_SOURCE } from "../lib/weights";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30">
      <div className="chrome-bar">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Wordmark />
          <nav className="hidden items-center gap-2 text-sm sm:flex">
            <Link href="/#how" className="tab">
              How
            </Link>
            <Link href="/#weights" className="tab">
              Weights
            </Link>
            <Link href="/pricing" className="tab">
              Pricing
            </Link>
            <Link href="/install" className="tab">
              Extension
            </Link>
            <Link href="/app" className="tab">
              Open app
            </Link>
          </nav>
          <Link href="/app/coach" className="btn-gold px-4 py-2 text-sm">
            Score a draft
          </Link>
        </div>
      </div>
      <Ticker />
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t-[3px] border-[var(--hot)] bg-[#0a0018] py-8 text-sm text-[var(--muted)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5">
        <hr className="sparkle-hr" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="mono text-[15px] text-[var(--cyan)]">
            <span className="live-dot" />
            watching {ALGO_SOURCE.repo}
          </p>
          <p className="flex flex-wrap items-center gap-2">
            you are visitor <HitCounter />
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Outrank is a personal homepage for the For You ranker. Not affiliated
            with X or xAI. Best viewed in Chrome, 1024×768.
          </p>
          <div className="flex flex-wrap gap-4 font-mono text-[var(--cyan)]">
            <Link href="/terms" className="hover:text-[var(--hot)]">
              ★ terms
            </Link>
            <Link href="/privacy" className="hover:text-[var(--hot)]">
              ★ privacy
            </Link>
            <Link href="/pricing" className="hover:text-[var(--hot)]">
              ★ pricing
            </Link>
            <Link href="/app/radar" className="hover:text-[var(--hot)]">
              ★ radar
            </Link>
            <a
              href="https://github.com/xai-org/x-algorithm"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--hot)]"
            >
              ★ source algo
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
