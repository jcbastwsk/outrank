import type { Metadata } from "next";
import { AvatarDesk } from "../../../components/AvatarDesk";
import { ACTION_WEIGHTS } from "../../../lib/weights";

export const metadata: Metadata = {
  title: "Avatar",
  description: "Score an X avatar as a 40px thumbnail. Not a Phoenix head.",
};

export default function AvatarPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
          Avatar
        </p>
        <h1 className="serif text-4xl">Does the chip still look like you</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          ProfileClickWeight is published at {ACTION_WEIGHTS.profileClick}.
          Nobody follows you because they clicked the egg. They reply because
          they recognized the circle in a pile. We crop like X, shrink to 80 /
          48 / 32, and score contrast — in this browser, not our server.
        </p>
      </div>
      <AvatarDesk />
    </div>
  );
}
