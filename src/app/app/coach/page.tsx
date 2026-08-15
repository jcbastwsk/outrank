import { DraftCoach } from "../../../components/DraftCoach";

export default function CoachPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--gold)]">Coach</p>
        <h1 className="serif text-4xl">Score the post before it ships</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Estimates Phoenix action probabilities from the text, then applies
          the published production weights. The Chrome extension does the same
          thing on x.com.
        </p>
      </div>
      <DraftCoach />
    </div>
  );
}
