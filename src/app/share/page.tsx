export default function SharePage() {
  return (
    <main className="mx-auto max-w-xl px-5 py-16">
      <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
        Send to Taylor
      </p>
      <h1 className="serif mt-3 text-4xl">Download, then attach</h1>
      <p className="mt-4 leading-7 text-[var(--muted)]">
        Do not download the zip from this page. Chrome OS blocks localhost
        zip downloads. In Gmail, paperclip → Linux files, and attach from
        there.
      </p>
      <p className="mt-8 text-sm text-[var(--muted)]">
        Use <span className="mono text-[var(--ink)]">http://localhost:3000</span>{" "}
        from Chromebook Chrome.{" "}
        <span className="mono">penguin.linux.test</span> will not resolve unless
        mDNS is installed in Linux.
      </p>
      <p className="mt-3 text-sm text-[var(--muted)]">
        To: taylorneal.dev@gmail.com
        <br />
        Subject: Outrank — first look (X algo coach)
      </p>
    </main>
  );
}
