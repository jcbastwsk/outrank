import { SiteFooter, SiteHeader } from "../../components/SiteHeader";

const STEPS = [
  {
    n: "01",
    t: "Keep this Linux terminal running",
    d: "Chrome is on the Chromebook. Outrank’s server is in penguin (this terminal). Leave npm run dev up. Closing the terminal kills the coach.",
  },
  {
    n: "02",
    t: "chrome://extensions",
    d: "Type that in the Chromebook Chrome address bar. Turn on Developer mode (top right). Linux cannot open that page for you.",
  },
  {
    n: "03",
    t: "Load unpacked from Linux files",
    d: "Click Load unpacked. Left sidebar → Linux files → Outrank-extension. Select that folder. Not src/outrank, not the repo root.",
  },
  {
    n: "04",
    t: "Pin it, then compose",
    d: "Puzzle piece → pin Outrank. Click it. It should say Connected. Then open x.com and start a post — gold panel, bottom right.",
  },
];

export default function InstallPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-16">
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
          Chrome OS · penguin
        </p>
        <h1 className="serif mt-3 text-5xl">This terminal is not your browser</h1>
        <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
          You are in the Linux VM. Extensions install in Chromebook Chrome.
          The two talk over port 3000.
        </p>
        <ol className="mt-10 space-y-4">
          {STEPS.map((s) => (
            <li key={s.n} className="card p-5">
              <div className="mono text-xs text-[var(--gold)]">{s.n}</div>
              <h2 className="mt-2 text-xl">{s.t}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{s.d}</p>
            </li>
          ))}
        </ol>
        <div className="card mt-8 p-5 text-sm leading-6">
          <p className="mono text-xs uppercase tracking-[0.16em] text-[var(--gold)]">
            If it says it can&apos;t connect
          </p>
          <p className="mt-2 text-[var(--muted)]">
            In the Outrank popup, set API to{" "}
            <span className="mono text-[var(--ink)]">
              http://penguin.linux.test:3000
            </span>{" "}
            and Save & test. That is Chrome OS&apos;s name for this Linux VM.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
