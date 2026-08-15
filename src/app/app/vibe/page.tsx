import { VibeDesk } from "../../../components/VibeDesk";

export default function VibePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
          Vibe
        </p>
        <h1 className="serif text-4xl">What room are you in</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Phoenix already has a model of you. The{" "}
          <a href="/app/identity" className="text-[var(--cyan)] underline">
            identity workshop
          </a>{" "}
          is the chrome. This page is the last posts. Together they stop the
          coach lecturing a Milady account to write like LinkedIn.
        </p>
      </div>
      <VibeDesk />
    </div>
  );
}
