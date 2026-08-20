import Link from "next/link";
import { Wordmark } from "./Brand";
import { Ticker } from "./Web1";

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
            <Link href="/weights" className="tab">
              Weights
            </Link>
            <Link href="/pricing" className="tab">
              Pricing
            </Link>
            <Link href="/demo" className="tab">
              Demo
            </Link>
          </nav>
          <Link href="/start" className="btn-gold px-4 py-2 text-sm">
            Get started
          </Link>
        </div>
      </div>
      <Ticker />
      <div className="corp-bar">
        <span>Coaching for public accounts</span>
        <span className="corp-bar-rule" aria-hidden="true" />
        <span>Not affiliated with X or xAI</span>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5">
        <hr className="sparkle-hr" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="mono text-[14px] text-[var(--cyan)]">
            <span className="live-dot" />
            OUTRANK · outrank.coach
          </p>
          <p className="mono text-[13px]">Chrome · 1024×768</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-xl leading-6">
            Outrank coaches people who post on X. Not affiliated with X or xAI.
          </p>
          <div className="flex flex-wrap gap-4 font-mono text-[13px] text-[var(--cyan)]">
            <Link href="/terms" className="hover:text-[var(--hot)]">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-[var(--hot)]">
              Privacy
            </Link>
            <Link href="/pricing" className="hover:text-[var(--hot)]">
              Pricing
            </Link>
            <Link href="/colophon" className="hover:text-[var(--hot)]">
              Colophon
            </Link>
            <Link href="/weights" className="hover:text-[var(--hot)]">
              Weights
            </Link>
            <a
              href="https://github.com/xai-org/x-algorithm"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--hot)]"
            >
              x-algorithm
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
