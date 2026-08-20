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

export type ApiToken = {
  kind: "ext";
  plan: PlanId;
  email?: string;
  customerId?: string;
  subscriptionId?: string;
  usage: Usage;
  exp: number;
};

export type AuthSource = "bearer" | "cookie" | "anon";

export type AuthContext = {
  ent: Entitlement;
  usage: Usage;
  source: AuthSource;
};

export function bearerFromRequest(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(\S+)/i.exec(header.trim());
  return match?.[1] ?? null;
}

export function parseApiToken(raw: string | undefined | null): ApiToken | null {
  const tok = unpack<ApiToken>(raw);
  if (!tok || tok.kind !== "ext" || !tok.plan || !tok.exp) return null;
  if (tok.exp < Date.now()) return null;
  if (tok.plan !== "scout" && tok.plan !== "pro" && tok.plan !== "studio") {
    return null;
  }
  const day = todayUtc();
  const n = tok.usage?.day === day ? Math.max(0, Number(tok.usage.n) || 0) : 0;
  return {
    kind: "ext",
    plan: tok.plan,
    email: tok.email,
    customerId: tok.customerId,
    subscriptionId: tok.subscriptionId,
    exp: tok.exp,
    usage: { day, n },
  };
}

export function issueApiToken(ent: Entitlement, usage: Usage): string {
  const day = todayUtc();
  const payload: ApiToken = {
    kind: "ext",
    plan: ent.plan,
    email: ent.email,
    customerId: ent.customerId,
    subscriptionId: ent.subscriptionId,
    exp: ent.exp,
    usage:
      usage.day === day
        ? { day, n: Math.max(0, Number(usage.n) || 0) }
        : { day, n: 0 },
  };
  return pack(payload);
}

export function mergeUsage(a: Usage, b: Usage): Usage {
  const day = todayUtc();
  const an = a.day === day ? a.n : 0;
  const bn = b.day === day ? b.n : 0;
  return { day, n: Math.max(an, bn) };
}

function asEntitlement(tok: ApiToken): Entitlement {
  return {
    plan: tok.plan,
    email: tok.email,
    customerId: tok.customerId,
    subscriptionId: tok.subscriptionId,
    exp: tok.exp,
  };
}

export async function resolveAuth(req: Request): Promise<
  | { ok: true; auth: AuthContext }
  | { ok: false; error: "bad_token" }
> {
  const raw = bearerFromRequest(req);
  if (raw) {
    const tok = parseApiToken(raw);
    if (!tok) return { ok: false, error: "bad_token" };
    return {
      ok: true,
      auth: { ent: asEntitlement(tok), usage: tok.usage, source: "bearer" },
    };
  }

  const jar = await cookies();
  const ent = parseEntitlement(jar.get(ENTITLEMENT_COOKIE)?.value);
  const usage = parseUsage(jar.get(USAGE_COOKIE)?.value);
  if (ent) {
    return { ok: true, auth: { ent, usage, source: "cookie" } };
  }
  return {
    ok: true,
    auth: {
      ent: { plan: "scout", exp: Date.now() + MONTH_MS },
      usage,
      source: "anon",
    },
  };
}

export async function mintApiToken(req: Request) {
  const jar = await cookies();
  const cookieEnt = parseEntitlement(jar.get(ENTITLEMENT_COOKIE)?.value);
  const cookieUsage = parseUsage(jar.get(USAGE_COOKIE)?.value);
  const raw = bearerFromRequest(req);
  const bearerTok = raw ? parseApiToken(raw) : null;

  const ent =
    cookieEnt ??
    (bearerTok ? asEntitlement(bearerTok) : makeEntitlement({ plan: "scout" }));
  const usage = bearerTok
    ? mergeUsage(cookieUsage, bearerTok.usage)
    : cookieUsage;
  const token = issueApiToken(ent, usage);
  return { token, ent, usage, upgraded: Boolean(cookieEnt && bearerTok && cookieEnt.plan !== bearerTok.plan) };
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

export type ConsumeResult =
  | {
      ok: true;
      remaining: number;
      plan: PlanId;
      token: string;
      source: AuthSource;
    }
  | {
      ok: false;
      remaining: 0;
      plan: PlanId;
      reset: string;
      token: string;
      source: AuthSource;
      error: "bad_token" | "need_token" | "scout_limit";
    };

export async function consumeScore(req: Request): Promise<ConsumeResult> {
  const resolved = await resolveAuth(req);
  if (!resolved.ok) {
    return {
      ok: false,
      remaining: 0,
      plan: "scout",
      reset: todayUtc(),
      token: "",
      source: "anon",
      error: "bad_token",
    };
  }

  const { ent, usage, source } = resolved.auth;
  if (source === "anon") {
    return {
      ok: false,
      remaining: 0,
      plan: "scout",
      reset: usage.day,
      token: "",
      source,
      error: "need_token",
    };
  }

  if (unlimitedScores(ent.plan)) {
    return {
      ok: true,
      remaining: Infinity,
      plan: ent.plan,
      token: issueApiToken(ent, usage),
      source,
    };
  }

  if (usage.n >= SCOUT_DAILY_CAP) {
    return {
      ok: false,
      remaining: 0,
      plan: ent.plan,
      reset: usage.day,
      token: issueApiToken(ent, usage),
      source,
      error: "scout_limit",
    };
  }

  const next: Usage = { day: todayUtc(), n: usage.n + 1 };
  if (source === "cookie") {
    const jar = await cookies();
    jar.set(USAGE_COOKIE, pack(next), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(Date.now() + 48 * 60 * 60 * 1000),
    });
  }

  return {
    ok: true,
    remaining: Math.max(0, SCOUT_DAILY_CAP - next.n),
    plan: ent.plan,
    token: issueApiToken(ent, next),
    source,
  };
}

export function makeEntitlement(partial: Omit<Entitlement, "exp"> & { exp?: number }): Entitlement {
  return {
    ...partial,
    exp: partial.exp ?? Date.now() + MONTH_MS,
  };
}
