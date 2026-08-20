import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import {
  emptyProfile,
  type CoachMemory,
  type DeskState,
  type PostRecord,
  type Recommendation,
  type StrategicProfile,
} from "./model";

export const DESK_COOKIE = "outrank_desk";
const DIR = path.join(process.cwd(), "data", "desks");

function secret() {
  return (
    process.env.BILLING_SECRET ||
    process.env.STRIPE_SECRET_KEY ||
    "dev-outrank-billing"
  );
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function packSession(id: string) {
  const payload = Buffer.from(JSON.stringify({ id }), "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function unpackSession(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const [payload, mac] = raw.split(".");
  if (!payload || !mac) return null;
  const expected = sign(payload);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      id?: string;
    };
    return data.id && /^[a-z0-9-]+$/i.test(data.id) ? data.id : null;
  } catch {
    return null;
  }
}

export function emptyDesk(id: string, demo = false): DeskState {
  return {
    id,
    demo,
    createdAt: new Date().toISOString(),
    profile: emptyProfile(),
    posts: [],
    memories: [],
    recommendations: [],
  };
}

function fileFor(id: string) {
  return path.join(DIR, `${id}.json`);
}

export async function readDesk(id: string): Promise<DeskState | null> {
  try {
    const raw = JSON.parse(await readFile(fileFor(id), "utf8")) as DeskState;
    return {
      ...emptyDesk(id),
      ...raw,
      profile: { ...emptyProfile(), ...raw.profile },
      posts: raw.posts ?? [],
      memories: raw.memories ?? [],
      recommendations: raw.recommendations ?? [],
    };
  } catch {
    return null;
  }
}

export async function writeDesk(state: DeskState) {
  await mkdir(DIR, { recursive: true });
  const next = { ...state, profile: { ...state.profile, updatedAt: new Date().toISOString() } };
  await writeFile(fileFor(state.id), JSON.stringify(next, null, 2));
  return next;
}

export async function currentDeskId(): Promise<string | null> {
  const jar = await cookies();
  return unpackSession(jar.get(DESK_COOKIE)?.value);
}

export async function setDeskCookie(id: string) {
  const jar = await cookies();
  jar.set(DESK_COOKIE, packSession(id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
}

export async function ensureDesk(): Promise<DeskState> {
  const existing = await currentDeskId();
  if (existing) {
    const desk = await readDesk(existing);
    if (desk) return desk;
  }
  const id = randomBytes(9).toString("hex");
  const desk = emptyDesk(id);
  await writeDesk(desk);
  await setDeskCookie(id);
  return desk;
}

export async function saveProfile(profile: StrategicProfile) {
  const desk = await ensureDesk();
  desk.profile = { ...emptyProfile(), ...profile };
  return writeDesk(desk);
}

export async function addPost(post: PostRecord) {
  const desk = await ensureDesk();
  desk.posts = [post, ...desk.posts].slice(0, 200);
  return writeDesk(desk);
}

export async function addMemory(mem: CoachMemory) {
  const desk = await ensureDesk();
  desk.memories = [mem, ...desk.memories].slice(0, 80);
  return writeDesk(desk);
}

export async function setRecommendations(recs: Recommendation[]) {
  const desk = await ensureDesk();
  desk.recommendations = recs;
  return writeDesk(desk);
}

export async function patchMemory(id: string, patch: Partial<CoachMemory>) {
  const desk = await ensureDesk();
  desk.memories = desk.memories.map((m) => (m.id === id ? { ...m, ...patch } : m));
  return writeDesk(desk);
}

export async function updatePost(id: string, patch: Partial<PostRecord>) {
  const desk = await ensureDesk();
  desk.posts = desk.posts.map((p) => (p.id === id ? { ...p, ...patch } : p));
  return writeDesk(desk);
}

export async function patchRecommendation(id: string, patch: Partial<Recommendation>) {
  const desk = await ensureDesk();
  desk.recommendations = desk.recommendations.map((r) =>
    r.id === id ? { ...r, ...patch } : r,
  );
  return writeDesk(desk);
}
