import Link from "next/link";
import { HoodDrop } from "../../../components/HoodDrop";
import { getEntitlement } from "../../../lib/billing";
import { canUseHood } from "../../../lib/plans";

export default async function HoodPage() {
  const ent = await getEntitlement();
  if (!canUseHood(ent.plan)) {
    return (
      <div className="card max-w-xl p-8">
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
          Under the Hood
        </p>
        <h1 className="serif mt-2 text-4xl">The suppression receipt is on Pro.</h1>
        <p className="mt-3 text-[var(--muted)] leading-7">
          Visibility labels can drop you from For You. Drop the JSON. Get
          which labels are actually hiding the account. Radar stays free.
        </p>
        <Link href="/pricing" className="btn-gold mt-6 inline-block px-5 py-2 text-sm">
          See Pro · $29/mo
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
          Under the Hood
        </p>
        <h1 className="serif text-4xl">What X just labeled you</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Eligible accounts can download a month of visibility labels from
          x.com/i/under_the_hood. We map those names onto the published
          visibility-filtering rules. We explain. We do not help you hide.
        </p>
      </div>
      <HoodDrop />
    </div>
  );
}
