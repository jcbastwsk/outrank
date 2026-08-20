import { NextResponse } from "next/server";
import { dropSubscriber } from "../../../../lib/alerts";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("t") ?? "";
  const ok = token ? await dropSubscriber(token) : false;
  const html = `<!doctype html>
<meta charset="utf-8">
<title>OUTRANK alerts</title>
<body style="background:#0b0d10;color:#e8e4d9;font-family:Georgia,serif;padding:4rem 1.5rem">
  <p style="color:#c4a35a;letter-spacing:.14em;text-transform:uppercase;font-size:12px">Alerts</p>
  <h1>${ok ? "You are off the list." : "That link did not match a subscriber."}</h1>
  <p style="color:#8b8680">Algo-change mail only. We will not write you again from this list.</p>
  <p><a href="/weights" style="color:#7ec8c8">Back to the weights</a></p>
</body>`;
  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
