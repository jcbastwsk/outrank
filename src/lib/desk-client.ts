import type { CoachMemory, DeskState, PostRecord, StrategicProfile } from "./model";

async function parseDesk(res: Response): Promise<DeskState> {
  if (!res.ok) throw new Error("desk request failed");
  return (await res.json()) as DeskState;
}

export async function fetchDesk(demo = false): Promise<DeskState> {
  const res = await fetch(`/api/coach/state${demo ? "?demo=1" : ""}`, {
    cache: "no-store",
  });
  return parseDesk(res);
}

export async function postDesk(body: Record<string, unknown>): Promise<DeskState> {
  const res = await fetch("/api/coach/state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseDesk(res);
}

export async function saveDeskProfile(profile: StrategicProfile) {
  return postDesk({ action: "profile", profile });
}

export async function saveDeskPost(post: Partial<PostRecord>) {
  return postDesk({ action: "post", post });
}

export async function saveDeskMemory(memory: Partial<CoachMemory>) {
  return postDesk({ action: "memory", memory });
}

export async function correctDeskMemory(memoryId: string, memoryPatch: Partial<CoachMemory>) {
  return postDesk({ action: "correct", memoryId, memoryPatch });
}

export async function saveDeskOutcome(
  postId: string,
  post: Partial<Pick<PostRecord, "outcome" | "userRead" | "metrics">>,
) {
  return postDesk({ action: "outcome", postId, post });
}

export async function adoptDemoDesk() {
  return postDesk({ adoptDemo: true });
}

export async function seedDeskRecs() {
  return postDesk({ action: "seed-recs" });
}

export async function setRecStatus(recId: string, status: "open" | "done" | "skipped" | "expired") {
  return postDesk({ action: "rec", recId, recPatch: { status } });
}
