import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { createHmac, timingSafeEqual } from "crypto";
import type { CaseRecord } from "../../../lib/curation";
import { coachDraft } from "../../../lib/coach";
import { scoreDraft } from "../../../lib/score";

const COOKIE = "outrank_curator";
const STORE = path.join(process.cwd(), "data", "curation.json");

function curatorKey() {
  return process.env.CURATOR_KEY ?? "";
}

function allowOpen() {
  return !curatorKey() && process.env.NODE_ENV !== "production";
}

function signOk(raw: string | undefined) {
  const key = curatorKey();
  if (!key || !raw) return false;
  const mac = createHmac("sha256", key).update("curator").digest("base64url");
  const a = Buffer.from(raw);
  const b = Buffer.from(mac);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function authorized() {
  if (allowOpen()) return true;
  const jar = await cookies();
  return signOk(jar.get(COOKIE)?.value);
}

async function readCases(): Promise<CaseRecord[]> {
  try {
    return JSON.parse(await readFile(STORE, "utf8")) as CaseRecord[];
  } catch {
    return [];
  }
}

async function writeCases(cases: CaseRecord[]) {
  await mkdir(path.dirname(STORE), { recursive: true });
  await writeFile(STORE, JSON.stringify(cases, null, 2));
}

export async function GET() {
  if (!(await authorized())) {
    return NextResponse.json({ error: "locked", open: allowOpen() }, { status: 401 });
  }
  return NextResponse.json({ cases: await readCases(), open: allowOpen() });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    key?: string;
    text?: string;
    url?: string;
    context?: string;
    outcome?: CaseRecord["outcome"];
    laneOverride?: CaseRecord["laneOverride"];
  };

  if (body.key && curatorKey()) {
    if (body.key !== curatorKey()) {
      return NextResponse.json({ error: "bad key" }, { status: 401 });
    }
    const jar = await cookies();
    const mac = createHmac("sha256", curatorKey()).update("curator").digest("base64url");
    jar.set(COOKIE, mac, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return NextResponse.json({ ok: true, unlocked: true });
  }

  if (!(await authorized())) {
    return NextResponse.json({ error: "locked" }, { status: 401 });
  }

  const text = (body.text ?? "").trim();
  if (text.length < 3) {
    return NextResponse.json({ error: "Need the post text" }, { status: 400 });
  }
  const outcome = body.outcome;
  if (outcome !== "blew_up" && outcome !== "worked" && outcome !== "mid" && outcome !== "died") {
    return NextResponse.json({ error: "Need an outcome" }, { status: 400 });
  }

  const scored = coachDraft(scoreDraft(text));
  const rec: CaseRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    text,
    url: body.url?.trim() || undefined,
    context: (body.context ?? "").trim(),
    outcome,
    laneOverride: body.laneOverride,
    coach: {
      lane: scored.lane.id,
      reach: scored.reach,
      grade: scored.grade,
      headline: scored.headline,
    },
  };

  const cases = await readCases();
  cases.unshift(rec);
  try {
    await writeCases(cases.slice(0, 500));
  } catch {
    // Vercel FS is ephemeral — client still keeps a copy.
  }
  return NextResponse.json({ case: rec, persisted: true });
}
