import { NextResponse } from "next/server";
import { fetchLiveDiff } from "../../../lib/radar";

export async function GET() {
  const diff = await fetchLiveDiff();
  if (diff.error && diff.parsed === 0) {
    return NextResponse.json({ error: diff.error, ...diff }, { status: 502 });
  }
  return NextResponse.json(diff);
}
