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
          Phoenix already has a model of you. Drop your @ — even if we never
          hit the API, the shape of the handle is a tell (named, anon, fan,
          corp). Then paste a handful of posts so the coach stops lecturing a
          Milady account to write like LinkedIn.
        </p>
      </div>
      <VibeDesk />
    </div>
  );
}
