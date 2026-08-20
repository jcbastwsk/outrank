import { CoachHome } from "../../components/CoachHome";

export default async function AppHome({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { welcome } = await searchParams;

  return (
    <div className="space-y-6">
      {welcome && (
        <p className="panel px-4 py-3 text-sm text-[var(--gold)]">
          {welcome === "studio" ? "Agency" : "Pro"} is unlocked in this browser.
        </p>
      )}
      <CoachHome />
    </div>
  );
}
