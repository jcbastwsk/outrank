export type HandleKind = "named" | "anon" | "fan" | "corp" | "bot" | "unknown";

export type HandleRead = {
  raw: string;
  handle: string;
  display: string;
  kind: HandleKind;
  label: string;
  blurb: string;
};

export const HANDLE_KEY = "outrank.handle";

const KIND_META: Record<HandleKind, { label: string; blurb: string }> = {
  named: {
    label: "Named",
    blurb: "A real-looking @. Tech bros almost never hide. Phoenix already has a person, not a bit.",
  },
  anon: {
    label: "Anon",
    blurb: "Throwaway shape — anime + digits, user38491. A 10-lessons thread from this @ is a costume.",
  },
  fan: {
    label: "Fan",
    blurb: "Stan / updates / (x)fan. The graph follows a subject, not you. Don't suddenly fundraise.",
  },
  corp: {
    label: "Corp",
    blurb: "Brand desk. Official, HQ, support. Scene wrecks and room slurs read as a social intern.",
  },
  bot: {
    label: "Bot-shaped",
    blurb: "Looks automated. Humans bounce. We will not help you farm that.",
  },
  unknown: {
    label: "Unknown",
    blurb: "Put the @ in. Even a wrong guess makes the desk feel like yours.",
  },
};

export function normalizeHandle(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//i, "");
  s = s.replace(/^@+/, "");
  s = s.replace(/\/.*$/, "");
  s = s.replace(/[^A-Za-z0-9_]/g, "");
  return s.slice(0, 15);
}

const CORP =
  /(official|newsroom|support|helpdesk|careers|pressdesk|corporate|theteam|weare)|(hq|inc|llc|corp)$/;
const CORP_NAMES =
  /^(openai|google|meta|tesla|spacex|stripe|vercel|xai|nasa|nytimes|wsj|bloomberg|reuters)$/;
const FAN = /(fan|stan|army|base|spoilers)\d*$|_fan$|^fan_/;
const BOT = /(bot$|_bot_|gpt|llm)/;
const ANON_PREFIX = /^(anon|throwaway|user|alt|priv|deleted|real)/;

export function classifyHandle(raw: string): HandleRead {
  const handle = normalizeHandle(raw);
  const empty = !handle;
  const lower = handle.toLowerCase();
  const digits = (handle.match(/\d/g) ?? []).length;
  const typedCamel = /[a-z][A-Z]/.test(handle);

  let kind: HandleKind = "unknown";
  if (empty) kind = "unknown";
  else if (BOT.test(lower)) kind = "bot";
  else if (CORP.test(lower) || CORP_NAMES.test(lower)) kind = "corp";
  else if (FAN.test(lower)) kind = "fan";
  else if (
    digits >= 3 ||
    /\d{4,}$/.test(handle) ||
    ANON_PREFIX.test(lower)
  ) {
    kind = "anon";
  } else if (
    typedCamel ||
    handle.includes("_") ||
    (digits <= 1 && handle.length >= 3 && /[aeiouy]/i.test(handle))
  ) {
    kind = "named";
  } else if (digits >= 2) {
    kind = "anon";
  } else {
    kind = "named";
  }

  const meta = KIND_META[kind];
  return {
    raw,
    handle,
    display: handle ? `@${handle}` : "",
    kind,
    label: meta.label,
    blurb: meta.blurb,
  };
}

export function loadHandle(): HandleRead | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(HANDLE_KEY);
  if (!raw) return null;
  const read = classifyHandle(raw);
  return read.handle ? read : null;
}

export function saveHandle(raw: string): HandleRead {
  const read = classifyHandle(raw);
  if (typeof window !== "undefined") {
    if (read.handle) localStorage.setItem(HANDLE_KEY, read.handle);
    else localStorage.removeItem(HANDLE_KEY);
  }
  return read;
}
