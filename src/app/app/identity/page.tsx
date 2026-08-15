import type { Metadata } from "next";
import { IdentityDesk } from "../../../components/IdentityDesk";

export const metadata: Metadata = {
  title: "Identity",
  description: "Workshop the X desk: name, @, bio, PFP, pinned.",
};

export default function IdentityPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
          Identity
        </p>
        <h1 className="serif text-4xl">Is this one desk</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Name, @, bio, circle, pin. We do not fetch X. We do not score
          Phoenix. We ask whether a cold viewer meets one person or three
          costumes. Override the @ guess if we get it wrong.
        </p>
      </div>
      <IdentityDesk />
    </div>
  );
}
