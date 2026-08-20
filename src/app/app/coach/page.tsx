import { CoachRoom } from "../../../components/CoachRoom";

export default async function CoachPage({
  searchParams,
}: {
  searchParams: Promise<{ analyze?: string; demo?: string }>;
}) {
  const { analyze, demo } = await searchParams;
  const startAnalyze = analyze === "1" || analyze === "post" || demo === "1";

  return (
    <div className="space-y-6">
      <div>
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
          Coach
        </p>
        <h1 className="serif text-4xl">Paste a draft</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Advice uses your profile and the posts you have already saved.
        </p>
      </div>
      <CoachRoom startAnalyze={startAnalyze} demo={demo === "1"} />
    </div>
  );
}
