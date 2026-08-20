import type { CandidateEvent, Prediction } from "./event";
import type { ResultKind } from "./residual";

export async function ensureDesk(handle = "") {
  const res = await fetch("/api/desk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ handle }),
  });
  return res.json() as Promise<{
    desk: { id: string; handle: string };
    stats: { predicted: number; resolved: number; open: number };
  }>;
}

export async function fetchEvents(): Promise<CandidateEvent[]> {
  const res = await fetch("/api/events");
  const data = (await res.json()) as { events?: CandidateEvent[] };
  return data.events ?? [];
}

export async function createEvent(input: {
  text: string;
  excerpt?: string;
  handle?: string;
  format?: string;
  prediction?: Prediction;
}): Promise<CandidateEvent> {
  const res = await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as { event?: CandidateEvent; error?: string };
  if (!res.ok || !data.event) throw new Error(data.error || "save_failed");
  return data.event;
}

export async function classifyEvent(
  id: string,
  result: ResultKind,
  note = "",
): Promise<CandidateEvent> {
  const res = await fetch(`/api/events/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ result, note, published: true }),
  });
  const data = (await res.json()) as { event?: CandidateEvent; error?: string };
  if (!res.ok || !data.event) throw new Error(data.error || "patch_failed");
  return data.event;
}
