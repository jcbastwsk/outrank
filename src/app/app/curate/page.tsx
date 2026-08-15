import { CuratorDesk } from "./desk";

export default function CuratePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
          Curator
        </p>
        <h1 className="serif text-4xl">What actually blew up</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Paste a post, say what happened, add the context only a human has.
          We snapshot what the coach thought. Export a pack and drop it in
          chat next time we retune.
        </p>
      </div>
      <CuratorDesk />
    </div>
  );
}
