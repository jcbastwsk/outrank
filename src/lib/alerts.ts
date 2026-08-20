import { createHash, createHmac, timingSafeEqual } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { LEGAL } from "./legal";
import type { LiveDiff, RadarChange } from "./radar";
import { appUrl } from "./site";

export type Subscriber = {
  email: string;
  token: string;
  at: string;
};

type Store = {
  subscribers: Subscriber[];
};

const STORE = path.join(process.cwd(), "data", "alerts.json");
const MAX_LIST = 5000;

function secret() {
  return (
    process.env.ALERT_SECRET ||
    process.env.BILLING_SECRET ||
    process.env.STRIPE_SECRET_KEY ||
    "dev-outrank-alerts"
  );
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("hex").slice(0, 32);
}

export function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (email.length < 5 || email.length > 120) return null;
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email)) return null;
  return email;
}

export async function readAlerts(): Promise<Store> {
  try {
    return JSON.parse(await readFile(STORE, "utf8")) as Store;
  } catch {
    return { subscribers: [] };
  }
}

async function writeAlerts(store: Store) {
  await mkdir(path.dirname(STORE), { recursive: true });
  await writeFile(STORE, JSON.stringify(store, null, 2));
}

export async function addSubscriber(email: string): Promise<Subscriber> {
  const store = await readAlerts();
  const existing = store.subscribers.find((s) => s.email === email);
  if (existing) return existing;
  if (store.subscribers.length >= MAX_LIST) {
    throw new Error("list_full");
  }
  const next: Subscriber = {
    email,
    token: sign(email),
    at: new Date().toISOString(),
  };
  store.subscribers.push(next);
  await writeAlerts(store);
  return next;
}

export async function dropSubscriber(token: string): Promise<boolean> {
  const store = await readAlerts();
  const before = store.subscribers.length;
  store.subscribers = store.subscribers.filter((s) => {
    const a = Buffer.from(s.token);
    const b = Buffer.from(token);
    return a.length !== b.length || !timingSafeEqual(a, b);
  });
  if (store.subscribers.length === before) return false;
  await writeAlerts(store);
  return true;
}

export function changeFingerprint(changes: RadarChange[]): string {
  return createHash("sha256")
    .update(
      changes
        .map((c) => `${c.key}:${c.from ?? ""}->${c.to ?? ""}`)
        .sort()
        .join("|"),
    )
    .digest("hex")
    .slice(0, 24);
}

export function composeAlert(diff: LiveDiff): { subject: string; text: string } {
  const lead = diff.changes.find((c) => c.watched) ?? diff.changes[0];
  const subject = lead
    ? `${lead.label} ${lead.from ?? "∅"} → ${lead.to ?? "∅"}`
    : "A published For You default moved";
  const lines = diff.changes.map(
    (c) => `• ${c.label}: ${c.from ?? "∅"} → ${c.to ?? "∅"}\n  ${c.play}`,
  );
  const origin = appUrl();
  const text = [
    "A published For You default moved. This is the play, not a recap.",
    "",
    ...lines,
    "",
    `Table: ${origin}/weights`,
    "Estimates from the published file. We do not invent a receipt we do not have.",
    "",
    `Questions: ${LEGAL.email}`,
  ].join("\n");
  return { subject, text };
}

function resendKey() {
  return process.env.RESEND_API_KEY ?? "";
}

function fromAddress() {
  return process.env.ALERT_FROM || "OUTRANK <alerts@outrank.coach>";
}

export function alertsConfigured() {
  return Boolean(resendKey());
}

export function watchAuthorized(req: Request) {
  const expected = process.env.CRON_SECRET || process.env.RADAR_WATCH_SECRET;
  if (!expected) return false;
  const got = req.headers.get("authorization") ?? "";
  const want = `Bearer ${expected}`;
  const a = Buffer.from(got);
  const b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function sendOne(
  to: string,
  subject: string,
  text: string,
  unsub: string,
  idempotencyKey: string,
): Promise<boolean> {
  const key = resendKey();
  if (!key) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [to],
      subject,
      text: `${text}\n\nStop these: ${unsub}`,
      headers: {
        "List-Unsubscribe": `<${unsub}>`,
      },
    }),
  });
  return res.ok || res.status === 409;
}

export async function dispatchDrift(diff: LiveDiff): Promise<{
  sent: number;
  reason?: string;
}> {
  if (diff.synced || diff.changes.length === 0) {
    return { sent: 0, reason: "synced" };
  }
  if (!resendKey()) {
    return { sent: 0, reason: "no_resend_key" };
  }
  const { subject, text } = composeAlert(diff);
  const fp = changeFingerprint(diff.changes);
  const origin = appUrl();
  const store = await readAlerts();
  let sent = 0;
  for (const sub of store.subscribers) {
    const unsub = `${origin}/api/alerts/unsubscribe?t=${encodeURIComponent(sub.token)}`;
    const ok = await sendOne(sub.email, subject, text, unsub, `${fp}:${sub.email}`);
    if (ok) sent += 1;
  }
  return { sent };
}
