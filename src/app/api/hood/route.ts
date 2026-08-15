import { NextResponse } from "next/server";
import { interpretHood } from "../../../lib/hood";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  return NextResponse.json(interpretHood(body));
}
