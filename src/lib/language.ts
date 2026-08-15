/**
 * Language risk. Detection only — never surface these lists as
 * "words that print" or coach anyone to use them.
 *
 * Three reads:
 *   hard      — racial / similar slurs. Always volatile. No in-group exception.
 *               We cannot see who is speaking. One report is −234.
 *   attack    — a reclaimed-capable slur used as a weapon (you / shut up / deserve).
 *   reclaimed — gay-room voice using fag/dyke as modifier or endearment.
 *               Still dies OON. Not a growth sticker. Not a nuke if the room is real.
 */

export type SlurKind = "none" | "hard" | "attack" | "reclaimed";

export type SlurRead = {
  kind: SlurKind;
  hateRisk: boolean;
  reclaimed: boolean;
  queerRoom: boolean;
};

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9#\s']/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function fold(w: string): string {
  return w
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/@/g, "a")
    .replace(/\$/g, "s");
}

/** Exact tokens + short stems. Word-bounded via tokenizer, so "night" is safe. */
function isHardSlur(w: string): boolean {
  const x = fold(w);
  if (
    x === "nig" ||
    x === "nigs" ||
    x === "kike" ||
    x === "kikes" ||
    x === "chink" ||
    x === "chinks" ||
    x === "gook" ||
    x === "gooks" ||
    x === "spic" ||
    x === "spics" ||
    x === "tranny" ||
    x === "trannies"
  ) {
    return true;
  }
  if (/^nigg(er|a|ah|az|uh)s?$/.test(x)) return true;
  if (/^retards?$/.test(x)) return true;
  return false;
}

function isQueerSlurToken(w: string): boolean {
  const x = fold(w);
  return (
    x === "fag" ||
    x === "fags" ||
    x === "faggot" ||
    x === "faggots" ||
    x === "fgt" ||
    x === "dyke" ||
    x === "dykes"
  );
}

const QUEER_ROOM =
  /\b(the gays|us gays|we gays|as a gay|gay ass|gay twitter|the girlies|love you fag|miss you fag|thank you fag|my fags?|faggot energy|fag behavior|so fag of|us dykes|dyke energy|my fellow gays)\b/i;

const AFFECTION =
  /\b(love you|miss you|thank you|thanks|ily)\b[\w\s,'-]{0,12}\b(fag|fags|faggot|faggots|dyke|dykes)\b/i;

const ATTACK_NEAR_SLUR =
  /\b(shut up|kill yourself|kys|hate you|fuck you)\b[\w\s,'-]{0,20}\b(fag|fags|faggot|faggots|fgt|dyke|dykes)\b|\b(you|ya) (a |are a |fucking |dumb |ugly |stupid )?(fag|fags|faggot|faggots|dyke|dykes)\b|\b(fag|fags|faggot|faggots|dyke|dykes)\b[\w\s,'-]{0,16}\b(should|deserve|need to)\b/i;

export function readSlurs(text: string): SlurRead {
  const words = tokens(text);
  const hard = words.some(isHardSlur);
  const hasQueerSlur = words.some(isQueerSlurToken);
  const queerRoom = QUEER_ROOM.test(text);
  const affection = AFFECTION.test(text);
  const attack = hasQueerSlur && ATTACK_NEAR_SLUR.test(text) && !affection;
  const inRoom = queerRoom || affection;

  if (hard) {
    return { kind: "hard", hateRisk: true, reclaimed: false, queerRoom: inRoom };
  }
  if (hasQueerSlur && attack) {
    return { kind: "attack", hateRisk: true, reclaimed: false, queerRoom: inRoom };
  }
  if (hasQueerSlur && inRoom) {
    return { kind: "reclaimed", hateRisk: false, reclaimed: true, queerRoom: true };
  }
  if (hasQueerSlur) {
    // No room evidence. Default to risk — we cannot see the speaker.
    return { kind: "attack", hateRisk: true, reclaimed: false, queerRoom: false };
  }
  return {
    kind: "none",
    hateRisk: false,
    reclaimed: false,
    queerRoom,
  };
}

/** Everyday salt. Not a nuke. Ratio-farming still is. */
export function isRageBait(text: string): boolean {
  return (
    /\b(get ratioed|ratio him|ratio her|destroyed him|destroyed her)\b/i.test(
      text,
    ) || /you won'?t believe/i.test(text)
  );
}
