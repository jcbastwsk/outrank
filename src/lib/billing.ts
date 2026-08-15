import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import {
  SCOUT_DAILY_CAP,
  unlimitedScores,
  type PlanId,
} from "./plans";

export const ENTITLEMENT_COOKIE = "outrank_plan";
export const USAGE_COOKIE = "outrank_usage";

export type Entitlement = {
  plan: PlanId;
  email?: string;
  customerId?: string;
  subscriptionId?: string;
  exp: number;
};

export type Usage = {
  day: string;
  n: number;
};

export type BillingRecord = {
  plan: PlanId;
  status: "active" | "canceled" | "past_due" | "unpaid" | "incomplete";
  email?: string;
  customerId: string;
  subscriptionId?: string;
  updatedAt: string;
};

type Store = {
  byCustomer: Record<string, BillingRecord>;
};

const STORE = path.join(process.cwd(), "data", "billing.json");
const MONTH_MS = 32 * 24 * 60 * 60 * 1000;

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

export function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

export async function readStore(): Promise<Store> {
  try {
    return JSON.parse(await readFile(STORE, "utf8")) as Store;
  } catch {
    return { byCustomer: {} };
  }
}

export async function writeStore(store: Store) {
  await mkdir(path.dirname(STORE), { recursive: true });
  await writeFile(STORE, JSON.stringify(store, null, 2));
}

export async function upsertRecord(record: BillingRecord) {
  const store = await readStore();
  store.byCustomer[record.customerId] = record;
  await writeStore(store);
  return record;
}

export function entitlementCookie(ent: Entitlement) {
  return pack(ent);
}

export function parseEntitlement(raw: string | undefined | null): Entitlement | null {
  const ent = unpack<Entitlement>(raw);
  if (!ent || !ent.plan || !ent.exp) return null;
  if (ent.exp < Date.now()) return null;
  if (ent.plan !== "scout" && ent.plan !== "pro" && ent.plan !== "studio") {
    return null;
  }
  return ent;
}

export function parseUsage(raw: string | undefined | null): Usage {
  const u = unpack<Usage>(raw);
  const day = todayUtc();
  if (!u || u.day !== day) return { day, n: 0 };
  return { day, n: Math.max(0, Number(u.n) || 0) };
}

export async function getEntitlement(): Promise<Entitlement> {
  const jar = await cookies();
  return (
    parseEntitlement(jar.get(ENTITLEMENT_COOKIE)?.value) ?? {
      plan: "scout",
      exp: Date.now() + MONTH_MS,
    }
  );
}

export async function setEntitlement(ent: Entitlement) {
  const jar = await cookies();
  jar.set(ENTITLEMENT_COOKIE, pack(ent), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(ent.exp),
  });
}

export async function clearEntitlement() {
  const jar = await cookies();
  jar.delete(ENTITLEMENT_COOKIE);
}

export async function getUsage(): Promise<Usage> {
  const jar = await cookies();
  return parseUsage(jar.get(USAGE_COOKIE)?.value);
}

export async function bumpUsage(): Promise<Usage> {
  const next = await getUsage();
  next.n += 1;
  const jar = await cookies();
  jar.set(USAGE_COOKIE, pack(next), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(Date.now() + 48 * 60 * 60 * 1000),
  });
  return next;
}

export async function consumeScore() {
  const ent = await getEntitlement();
  if (unlimitedScores(ent.plan)) {
    return { ok: true as const, remaining: Infinity, plan: ent.plan };
  }
  const used = await getUsage();
  if (used.n >= SCOUT_DAILY_CAP) {
    return {
      ok: false as const,
      remaining: 0,
      plan: ent.plan,
      reset: used.day,
    };
  }
  const next = await bumpUsage();
  return {
    ok: true as const,
    remaining: Math.max(0, SCOUT_DAILY_CAP - next.n),
    plan: ent.plan,
  };
}

export function makeEntitlement(partial: Omit<Entitlement, "exp"> & { exp?: number }): Entitlement {
  return {
    ...partial,
    exp: partial.exp ?? Date.now() + MONTH_MS,
  };
}
