import { NextResponse } from "next/server";
import { appendEvent, listDeskEvents } from "../../../lib/desk";
import { classify, physicsNow, type Prediction } from "../../../lib/event";
import type { ResultKind } from "../../../lib/residual";

export async function GET() {
  const events = await listDeskEvents();
  return NextResponse.json({ events });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    text?: string;
    excerpt?: string;
    handle?: string;
    format?: string;
    prediction?: Prediction;
    result?: ResultKind;
    note?: string;
    published?: boolean;
  };
  const text = typeof body.text === "string" ? body.text : "";
  if (!text.trim() && !body.excerpt) {
    return NextResponse.json({ error: "empty" }, { status: 400 });
  }
  const event = await appendEvent({
    handle: body.handle ?? "",
    text,
    excerpt: (body.excerpt || text).slice(0, 200),
    format: body.format ?? "unknown",
    physics: physicsNow(),
    prediction: body.prediction ?? {
      graph: 0,
      cold: 0,
      verdict: "",
      grade: "",
      lane: "",
    },
    publishedAt: body.published ? new Date().toISOString() : null,
    observation: null,
    classification: body.result
      ? classify(body.result, body.note ?? "")
      : null,
  });
  return NextResponse.json({ event });
}
