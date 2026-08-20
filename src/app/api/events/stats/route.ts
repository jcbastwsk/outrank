import { NextResponse } from "next/server";
import { publicEventStats } from "../../../../lib/desk";

/** Public counts only. No text. */
export async function GET() {
  const stats = await publicEventStats();
  return NextResponse.json(stats);
}
