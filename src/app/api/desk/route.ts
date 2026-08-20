import { NextResponse } from "next/server";
import { claimDesk, getOrCreateDesk, listDeskEvents } from "../../../lib/desk";
import { eventStats } from "../../../lib/event";

export async function GET() {
  const desk = await getOrCreateDesk();
  const events = await listDeskEvents();
  return NextResponse.json({ desk, stats: eventStats(events) });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    handle?: string;
  };
  const handle = typeof body.handle === "string" ? body.handle : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const desk = email
    ? await claimDesk(email, handle)
    : await getOrCreateDesk(handle);
  const events = await listDeskEvents();
  return NextResponse.json({ desk, stats: eventStats(events) });
}
