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
          Phoenix already has a model of you from what viewers did with your
          last posts. We don&apos;t. Paste a handful and we&apos;ll name the
          room, the aesthetic, and the posture — then the coach will stop
          lecturing a Milady account to write like LinkedIn.
        </p>
      </div>
      <VibeDesk />
    </div>
  );
}
