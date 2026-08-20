import { NextResponse } from "next/server";
import { addSubscriber, normalizeEmail } from "../../../../lib/alerts";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    company?: string;
  };
  // Honeypot. Bots fill it; humans do not see it.
  if (body.company) {
    return NextResponse.json({ ok: true });
  }
  const email = typeof body.email === "string" ? normalizeEmail(body.email) : null;
  if (!email) {
    return NextResponse.json({ error: "bad_email" }, { status: 400 });
  }
  try {
    await addSubscriber(email);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "list_full") {
      return NextResponse.json({ error: "list_full" }, { status: 503 });
    }
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
}
