import { NextResponse } from "next/server";
import { demoDesk } from "../../../../lib/demo-seed";
import {
  emptyProfile,
  nid,
  type CoachMemory,
  type DeskState,
  type PostRecord,
  type StrategicProfile,
} from "../../../../lib/model";
import {
  addMemory,
  addPost,
  ensureDesk,
  patchMemory,
  patchRecommendation,
  readDesk,
  setDeskCookie,
  setRecommendations,
  updatePost,
  writeDesk,
} from "../../../../lib/store";
import { deriveRecommendations } from "../../../../lib/moves";

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("demo") === "1") {
    return NextResponse.json(demoDesk());
  }
  const desk = await ensureDesk();
  return NextResponse.json(desk);
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    profile?: StrategicProfile;
    post?: Partial<PostRecord>;
    memory?: Partial<CoachMemory>;
    memoryId?: string;
    memoryPatch?: Partial<CoachMemory>;
    postId?: string;
    recId?: string;
    recPatch?: { status?: "open" | "done" | "skipped" | "expired" };
    adoptDemo?: boolean;
  };

  if (body.adoptDemo) {
    const seed = demoDesk();
    const desk = await ensureDesk();
    const next: DeskState = {
      ...seed,
      id: desk.id,
      demo: true,
      createdAt: desk.createdAt,
    };
    await writeDesk(next);
    await setDeskCookie(desk.id);
    return NextResponse.json(next);
  }

  if (body.action === "profile" && body.profile) {
    const desk = await ensureDesk();
    desk.profile = { ...emptyProfile(), ...body.profile };
    if (!desk.recommendations.some((r) => r.status === "open")) {
      desk.recommendations = deriveRecommendations(desk);
    }
    const saved = await writeDesk(desk);
    return NextResponse.json(saved);
  }

  if (body.action === "post" && body.post?.text) {
    const saved = await addPost({
      id: nid(),
      text: body.post.text,
      date: body.post.date || new Date().toISOString(),
      url: body.post.url,
      format: body.post.format,
      subject: body.post.subject,
      intendedFunction: body.post.intendedFunction,
      metrics: body.post.metrics,
      userRead: body.post.userRead,
      outcome: body.post.outcome ?? "unknown",
      relation: body.post.relation,
    });
    return NextResponse.json(saved);
  }

  if (body.action === "memory" && body.memory?.pattern) {
    const saved = await addMemory({
      id: nid(),
      pattern: body.memory.pattern,
      evidence: body.memory.evidence || "",
      confidence: body.memory.confidence ?? 0.5,
      learnedAt: new Date().toISOString(),
      state: body.memory.state ?? "provisional",
    });
    return NextResponse.json(saved);
  }

  if (body.action === "correct" && body.memoryId) {
    const saved = await patchMemory(body.memoryId, body.memoryPatch ?? {});
    return NextResponse.json(saved);
  }

  if (body.action === "outcome" && body.postId) {
    const saved = await updatePost(body.postId, {
      outcome: body.post?.outcome,
      userRead: body.post?.userRead,
      metrics: body.post?.metrics,
    });
    return NextResponse.json(saved);
  }

  if (body.action === "rec" && body.recId) {
    const saved = await patchRecommendation(body.recId, body.recPatch ?? {});
    return NextResponse.json(saved);
  }

  if (body.action === "seed-recs") {
    const desk = await ensureDesk();
    const recs = deriveRecommendations(desk);
    const saved = await setRecommendations(recs);
    return NextResponse.json(saved);
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}

export async function PUT() {
  const desk = await readDesk((await ensureDesk()).id);
  return NextResponse.json(desk);
}
