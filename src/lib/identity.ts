import { classifyHandle, type HandleKind, type HandleRead } from "./handle";
import { classifyLane, extractFeatures, type LaneId } from "./score";
import type { AvatarResult } from "./avatar";

export const IDENTITY_KEY = "outrank.identity";

export type NameKind = "person" | "brand" | "anon" | "emoji" | "official" | "empty";
export type DeskKind = "person" | "brand" | "fan" | "anon" | "split";
export type Fit = "aligned" | "mixed" | "split";

export type Identity = {
  handle: string;
  handleOverride?: HandleKind;
  name: string;
  bio: string;
  location: string;
  website: string;
  avatarDataUrl: string;
  avatarGrade: string;
  avatarReach: number;
  pinned: string;
  updatedAt: string;
};

export type IdentityPlay = {
  id: string;
  title: string;
  why: string;
};

export type Workshop = {
  identity: Identity;
  handle: HandleRead;
  nameKind: NameKind;
  bioLane: LaneId;
  bioChars: number;
  bioFollowCta: boolean;
  bioWe: boolean;
  pinnedLane: LaneId | "empty";
  desk: DeskKind;
  fit: Fit;
  headline: string;
  pieces: { id: string; label: string; read: string }[];
  plays: IdentityPlay[];
};

export function emptyIdentity(): Identity {
  return {
    handle: "",
    name: "",
    bio: "",
    location: "",
    website: "",
    avatarDataUrl: "",
    avatarGrade: "",
    avatarReach: 0,
    pinned: "",
    updatedAt: new Date().toISOString(),
  };
}

export function classifyName(name: string): NameKind {
  const t = name.trim();
  if (!t) return "empty";
  const letters = (t.match(/[A-Za-z]/g) ?? []).length;
  const emoji = (t.match(/\p{Extended_Pictographic}/gu) ?? []).length;
  if (emoji >= 2 && letters < 4) return "emoji";
  if (/\b(official|inc\.?|llc|hq|™|®)\b/i.test(t)) return "official";
  if (t === t.toUpperCase() && !t.includes(" ") && letters >= 4) return "official";
  if (/\b(anon|user|throwaway|alt)\b/i.test(t) || /\d{3,}/.test(t)) return "anon";
  if (/^(the |team |we are )/i.test(t) || /\b(labs|media|hq|studio|co)\b/i.test(t)) {
    return "brand";
  }
  const words = t.split(/\s+/).filter((w) => /[A-Za-z]/.test(w));
  if (words.length >= 2) return "person";
  if (/^[A-Z][a-z]+$/.test(t) || /^[A-Z][a-z]+[A-Z][a-z]+$/.test(t)) return "person";
  return "person";
}

function bioFlags(bio: string) {
  const t = bio.trim();
  const f = extractFeatures(t);
  const lane = t.length < 2 ? ("empty" as LaneId) : classifyLane(f).id;
  return {
    lane: lane === "empty" ? ("thin" as LaneId) : lane,
    chars: t.length,
    followCta: /follow (me|for more)|link in bio|👇|⬇️/i.test(t),
    we: /\b(we('re| are)?|our team|we're building)\b/i.test(t),
    empty: t.length < 2,
  };
}

function deskFromHandle(kind: HandleKind): DeskKind | null {
  if (kind === "named") return "person";
  if (kind === "corp") return "brand";
  if (kind === "fan") return "fan";
  if (kind === "anon" || kind === "bot") return "anon";
  return null;
}

export function workshopIdentity(
  raw: Identity,
  avatar?: AvatarResult | null,
): Workshop {
  const handle = classifyHandle(raw.handle);
  if (raw.handleOverride && raw.handleOverride !== "unknown") {
    handle.kind = raw.handleOverride;
  }
  const nameKind = classifyName(raw.name);
  const bio = bioFlags(raw.bio);
  const pinnedText = raw.pinned.trim();
  const pinnedF = pinnedText ? extractFeatures(pinnedText) : null;
  const pinnedLane: LaneId | "empty" = pinnedF
    ? classifyLane(pinnedF).id
    : "empty";

  const votes: DeskKind[] = [];
  const fromHandle = deskFromHandle(handle.kind);
  if (fromHandle) votes.push(fromHandle);
  if (nameKind === "person") votes.push("person");
  if (nameKind === "brand" || nameKind === "official") votes.push("brand");
  if (nameKind === "anon") votes.push("anon");
  if (bio.we || bio.lane === "operator") votes.push(bio.we ? "brand" : "person");
  if (bio.lane === "scene" || bio.lane === "cursed") votes.push("anon");
  if (pinnedLane === "operator") votes.push("person");
  if (pinnedLane === "cursed" || pinnedLane === "scene") votes.push("anon");

  const counts = new Map<DeskKind, number>();
  for (const v of votes) counts.set(v, (counts.get(v) ?? 0) + 1);
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const top = ranked[0];
  const second = ranked[1];
  let desk: DeskKind = top?.[0] ?? "person";
  let fit: Fit = "aligned";
  if (!top || top[1] <= 1) fit = "mixed";
  if (second && second[1] >= 2 && second[0] !== top[0]) {
    desk = "split";
    fit = "split";
  }
  if (fromHandle === "fan" && (bio.lane === "operator" || pinnedLane === "operator")) {
    desk = "split";
    fit = "split";
  }
  if (fromHandle === "anon" && (bio.lane === "operator" || bio.we)) {
    desk = "split";
    fit = "split";
  }
  if (fromHandle === "brand" && (pinnedLane === "cursed" || pinnedLane === "scene")) {
    desk = "split";
    fit = "split";
  }

  const pieces = [
    { id: "handle", label: "@", read: handle.handle ? `${handle.display} · ${handle.label}` : "missing" },
    { id: "name", label: "Name", read: nameKind },
    { id: "bio", label: "Bio", read: bio.empty ? "empty" : bio.lane },
    {
      id: "pfp",
      label: "PFP",
      read: avatar
        ? `${avatar.grade} chip`
        : raw.avatarGrade
          ? `${raw.avatarGrade} chip`
          : "missing",
    },
    { id: "pinned", label: "Pinned", read: pinnedLane },
  ];

  const plays: IdentityPlay[] = [];
  if (!handle.handle) {
    plays.push({
      id: "need-at",
      title: "Put the @ in",
      why: "The desk has to belong to someone. Even a wrong guess at the handle shape changes how we read the rest.",
    });
  }
  if (nameKind === "empty") {
    plays.push({
      id: "need-name",
      title: "The display name is the first line of the profile",
      why: "People see name + circle before they see a tweet. An empty name is a default egg with extra steps.",
    });
  }
  if (nameKind === "emoji") {
    plays.push({
      id: "emoji-name",
      title: "A name made of stickers",
      why: "It vanishes in a reply list. One word a human can say out loud.",
    });
  }
  if (bio.followCta) {
    plays.push({
      id: "bio-follow",
      title: "Skip 'follow for more' / link in bio",
      why: "ProfileClickWeight is 0. The bio is for a sentence they can remember, not a CTA the ranker ignores.",
    });
  }
  if (bio.empty && handle.kind === "named") {
    plays.push({
      id: "bio-empty",
      title: "Named accounts need one sentence",
      why: "A real name and a blank bio looks unfinished. One claim. Not a resume.",
    });
  }
  if (bio.chars > 160) {
    plays.push({
      id: "bio-long",
      title: "X will cut this",
      why: `Bios cap at 160. You are at ${bio.chars}. The cut is the last thing they read.`,
    });
  }
  if (pinnedLane === "empty" && (desk === "person" || desk === "brand")) {
    plays.push({
      id: "pin",
      title: "Pin the portable one",
      why: "New visitors get one free post. Pin the screenshottable line, not a ratio or a hello.",
    });
  }
  if (pinnedLane === "thin") {
    plays.push({
      id: "pin-thin",
      title: "The pin is a status update",
      why: "That is the first original they see. Make it the copy-link post or the unfinished claim — not 'gm'.",
    });
  }
  if (fit === "split") {
    plays.push({
      id: "split",
      title: "This is two desks taped together",
      why: "Phoenix already has a viewer-side model of you. An anon @ with a founder bio, or HQ with a scene pin, reads as a different account. Pick one desk.",
    });
  }
  const chipBad = (avatar?.grade ?? raw.avatarGrade) === "F" || (avatar?.grade ?? raw.avatarGrade) === "D";
  if (chipBad && handle.kind === "named") {
    plays.push({
      id: "chip",
      title: "The name is a person. The circle is mud.",
      why: "Reply piles are name + chip. If the 40px crop dies, you are a gray dot next to a real name.",
    });
  }
  if (raw.website && bio.followCta) {
    plays.push({
      id: "website",
      title: "The website field exists. The bio CTA does not help.",
      why: "Put the URL in the website slot. Keep the bio as a sentence.",
    });
  }
  if (plays.length === 0) {
    plays.push({
      id: "tight",
      title: "The chrome matches the desk",
      why: "Don't costume a fundraise onto it. Don't swap the PFP every week. Recognition is a memory.",
    });
  }

  const deskLabel: Record<DeskKind, string> = {
    person: "Named desk",
    brand: "Brand desk",
    fan: "Fan desk",
    anon: "Anon desk",
    split: "Split desk",
  };
  const headline =
    fit === "split"
      ? `${deskLabel[desk]}. The surfaces disagree. Pick one.`
      : fit === "mixed"
        ? `${deskLabel[desk]}, still thin. Fill the holes.`
        : `${deskLabel[desk]}. The chrome is one person.`;

  return {
    identity: raw,
    handle,
    nameKind,
    bioLane: bio.lane,
    bioChars: bio.chars,
    bioFollowCta: bio.followCta,
    bioWe: bio.we,
    pinnedLane,
    desk,
    fit,
    headline,
    pieces,
    plays,
  };
}

export function loadIdentity(): Identity | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(IDENTITY_KEY);
  if (!raw) return null;
  try {
    return { ...emptyIdentity(), ...(JSON.parse(raw) as Identity) };
  } catch {
    return null;
  }
}

export function saveIdentity(id: Identity) {
  if (typeof window === "undefined") return;
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(id));
}
