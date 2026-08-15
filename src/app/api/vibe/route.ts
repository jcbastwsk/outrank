import { NextResponse } from "next/server";
import { inferVibe, splitPosts } from "../../../lib/vibe";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { text?: string; posts?: string[] };
  const posts = body.posts?.length
    ? body.posts
    : splitPosts(typeof body.text === "string" ? body.text : "");
  return NextResponse.json(inferVibe(posts));
}
