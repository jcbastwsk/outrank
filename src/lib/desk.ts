import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import { cookies } from "next/headers";
import path from "path";
import {
  EVENT_SCHEMA,
  eventStats,
  type CandidateEvent,
} from "./event";

export const DESK_COOKIE = "outrank_desk";
const YEAR_MS = 400 * 24 * 60 * 60 * 1000;
const STORE = path.join(process.cwd(), "data", "desks.json");

export type Desk = {
  id: string;
  email: string;
  handle: string;
  createdAt: string;
};

type Store = {
  desks: Record<string, Desk>;
  events: CandidateEvent[];
};

type DeskToken = {
  deskId: string;
  exp: number;
};

function secret() {
  return (
    process.env.DESK_SECRET ||
    process.env.BILLING_SECRET ||
    process.env.STRIPE_SECRET_KEY ||
    "dev-outrank-desk"
  );
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function pack(data: object) {
  const payload = Buffer.from(JSON.stringify(data), "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function unpack<T>(raw: string | undefined | null): T | null {
  if (!raw) return null;
  const [payload, mac] = raw.split(".");
  if (!payload || !mac) return null;
  const expected = sign(payload);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export function nid() {
  return `${Date.now().toString(36)}-${randomBytes(4).toString("hex")}`;
}

async function readStore(): Promise<Store> {
  try {
    return JSON.parse(await readFile(STORE, "utf8")) as Store;
  } catch {
    return { desks: {}, events: [] };
  }
}

async function writeStore(store: Store) {
  await mkdir(path.dirname(STORE), { recursive: true });
  await writeFile(STORE, JSON.stringify(store, null, 2));
}

export function parseDeskToken(raw: string | undefined | null): DeskToken | null {
  const tok = unpack<DeskToken>(raw);
  if (!tok?.deskId || !tok.exp || tok.exp < Date.now()) return null;
  return tok;
}

export function deskCookieValue(deskId: string) {
  return pack({ deskId, exp: Date.now() + YEAR_MS });
}

export async function getOrCreateDesk(handle = ""): Promise<Desk> {
  const jar = await cookies();
  const tok = parseDeskToken(jar.get(DESK_COOKIE)?.value);
  const store = await readStore();
  if (tok && store.desks[tok.deskId]) {
    const desk = store.desks[tok.deskId];
    if (handle && !desk.handle) {
      desk.handle = handle.replace(/^@+/, "").trim();
      await writeStore(store);
    }
    return desk;
  }
  const desk: Desk = {
    id: nid(),
    email: "",
    handle: handle.replace(/^@+/, "").trim(),
    createdAt: new Date().toISOString(),
  };
  store.desks[desk.id] = desk;
  await writeStore(store);
  jar.set(DESK_COOKIE, deskCookieValue(desk.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
  return desk;
}

export async function claimDesk(email: string, handle = ""): Promise<Desk> {
  const desk = await getOrCreateDesk(handle);
  const store = await readStore();
  const row = store.desks[desk.id];
  if (!row) return desk;
  row.email = email.trim().toLowerCase();
  if (handle) row.handle = handle.replace(/^@+/, "").trim();
  await writeStore(store);
  return row;
}

export async function appendEvent(
  partial: Omit<CandidateEvent, "schema" | "id" | "deskId" | "at"> & {
    id?: string;
  },
): Promise<CandidateEvent> {
  const desk = await getOrCreateDesk(partial.handle);
  const store = await readStore();
  const event: CandidateEvent = {
    schema: EVENT_SCHEMA,
    id: partial.id || nid(),
    deskId: desk.id,
    at: new Date().toISOString(),
    ...partial,
    handle: partial.handle || desk.handle,
  };
  store.events = [event, ...store.events.filter((e) => e.id !== event.id)].slice(
    0,
    4000,
  );
  await writeStore(store);
  return event;
}

export async function patchEvent(
  id: string,
  patch: Partial<Pick<CandidateEvent, "publishedAt" | "observation" | "classification">>,
): Promise<CandidateEvent | null> {
  const desk = await getOrCreateDesk();
  const store = await readStore();
  const event = store.events.find((e) => e.id === id && e.deskId === desk.id);
  if (!event) return null;
  if (patch.publishedAt !== undefined) event.publishedAt = patch.publishedAt;
  if (patch.observation !== undefined) event.observation = patch.observation;
  if (patch.classification !== undefined) event.classification = patch.classification;
  await writeStore(store);
  return event;
}

export async function listDeskEvents(): Promise<CandidateEvent[]> {
  const desk = await getOrCreateDesk();
  const store = await readStore();
  return store.events.filter((e) => e.deskId === desk.id);
}

export async function publicEventStats() {
  const store = await readStore();
  return eventStats(store.events);
}

export function fingerprintText(text: string) {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}
