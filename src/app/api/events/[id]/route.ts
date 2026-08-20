import { NextResponse } from "next/server";
import { patchEvent } from "../../../../lib/desk";
import { classify } from "../../../../lib/event";
import type { ResultKind } from "../../../../lib/residual";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as {
    result?: ResultKind;
    note?: string;
    published?: boolean;
    impressions?: number | null;
    observationNotes?: string;
  };
  const event = await patchEvent(id, {
    publishedAt: body.published ? new Date().toISOString() : undefined,
    observation:
      body.impressions != null || body.observationNotes
        ? {
            at: new Date().toISOString(),
            impressions:
              typeof body.impressions === "number" ? body.impressions : null,
            notes: body.observationNotes ?? "",
          }
        : undefined,
    classification: body.result
      ? classify(body.result, body.note ?? "")
      : undefined,
  });
  if (!event) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ event });
}
