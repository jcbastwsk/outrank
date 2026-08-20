import type { CoachMemory, PostRecord, StrategicProfile } from "./model";

export type DraftFunction =
  | "aphorism"
  | "proposition"
  | "observation"
  | "joke"
  | "provocation"
  | "announcement"
  | "reply"
  | "question"
  | "scene-signal"
  | "argument"
  | "promotional"
  | "thread-open"
  | "article-lead"
  | "image-caption"
  | "ambiguity"
  | "empty";

export type Verdict =
  | "post"
  | "revise"
  | "wait"
  | "reply"
  | "format"
  | "develop"
  | "hold";

export const VERDICT_LABEL: Record<Verdict, string> = {
  post: "Post unchanged",
  revise: "Revise",
  wait: "Wait",
  reply: "Reply instead",
  format: "Change format",
  develop: "Develop further",
  hold: "Do not post",
};

export type Judgment = {
  fn: DraftFunction;
  verdict: Verdict;
  why: string;
  effect: string;
  audience: string;
  options: string[];
  evidence: string;
  confidence: number;
  missing: string;
  bannedPhrases: string[];
};

const BANNED = [
  "no hook",
  "no loop",
  "no lesson",
  "thin",
  "engagement sludge",
  "go viral",
  "10×",
  "468 likes",
];

const DEFENSIVE_RE =
  /(let me (explain|be clear)|once again|as I said|i already|to be clear|people (still |keep )?(don'?t get|misunderstand)|one more time)/i;

export function isDefensive(text: string) {
  return DEFENSIVE_RE.test(text);
}

export function inferFunction(text: string): DraftFunction {
  const t = text.trim();
  if (t.length < 4) return "empty";
  if (/^\s*(re:|@\w+)/i.test(t) && t.length < 200) return "reply";
  if (/https?:\/\//i.test(t) && /(buy|sale|course|link in bio|use code)/i.test(t)) {
    return "promotional";
  }
  if (/announce|we (just |')?(shipped|launched|raised)|i'm (joining|leaving)/i.test(t)) {
    return "announcement";
  }
  if (/^(thread:|1\/|🧵)/im.test(t)) return "thread-open";
  if (t.length > 500 && /(^#{1,3}\s|I\.\s)/m.test(t)) return "article-lead";
  if (/\?/.test(t) && t.length < 220) return "question";
  if (/(haha|lmao|lol\b|joke is)/i.test(t)) return "joke";
  if (/(gm |milady|remilia|real ones)/i.test(t)) return "scene-signal";
  if (/(caption:|\[image\]|\[photo\])/i.test(t)) return "image-caption";
  if (isDefensive(t) || (/(therefore|the reason|argue|claim that)/i.test(t) && t.length > 160)) {
    return "argument";
  }
  if (/(nobody (talks|says)|they told us|the quiet part)/i.test(t)) return "provocation";
  const conceptual =
    /(machine|image|medium|culture|form|work|author|cinema|camera|photograph|language|attention)/i.test(
      t,
    );
  const shortClaim = t.length < 280 && !/\?/.test(t) && !/https?:/.test(t);
  if (shortClaim && conceptual && /^(the |a |an |what )/i.test(t)) return "aphorism";
  if (shortClaim && conceptual) return "proposition";
  if (shortClaim && !/(excited|humbled|grateful|lessons? I)/i.test(t)) return "observation";
  if (t.length < 90 && !/[.!?]$/.test(t)) return "ambiguity";
  return "observation";
}

function article(fn: string) {
  return /^[aeiou]/i.test(fn) ? "an" : "a";
}

function stems(s: string) {
  return [...new Set(s.toLowerCase().match(/[a-z]{4,}/g) ?? [])].map((w) =>
    w.length > 6 ? w.slice(0, 6) : w,
  );
}

function overlapWords(a: string, b: string) {
  const aw = stems(a);
  const bw = new Set(stems(b));
  if (!aw.length) return 0;
  let n = 0;
  for (const w of aw) if (bw.has(w)) n += 1;
  return n / aw.length;
}

function countRecentOnTopic(posts: PostRecord[], text: string, days = 7) {
  const now = Date.now();
  const window = days * 86400000;
  return posts.filter((p) => {
    const t = Date.parse(p.date);
    if (!Number.isFinite(t) || now - t > window) return false;
    return overlapWords(text, p.text) > 0.18;
  }).length;
}

export function judgeDraft(
  text: string,
  profile: StrategicProfile | null,
  posts: PostRecord[] = [],
  memories: CoachMemory[] = [],
): Judgment {
  const fn = inferFunction(text);
  const bannedPhrases: string[] = [];
  const ambitionHit = profile ? overlapWords(profile.ambition + " " + profile.subjects.join(" "), text) : 0;
  const avoidHit = profile?.avoid ? overlapWords(profile.avoid, text) : 0;
  const promoVoice = /(humbled|thrilled to announce|so grateful|authentic|relatable|link in bio)/i.test(
    text,
  );
  const recentSame = countRecentOnTopic(posts, text, 7);
  const defensive = isDefensive(text);
  const priorDefensive = posts.filter((p) => {
    const t = Date.parse(p.date);
    if (!Number.isFinite(t) || Date.now() - t > 7 * 86400000) return false;
    return isDefensive(p.text) && overlapWords(text, p.text) > 0.08;
  });
  const filmExample = posts.find((p) =>
    /hallway|film example|establishing shot/i.test(p.text + " " + (p.subject ?? "")),
  );
  const nth = priorDefensive.length + 1;

  let verdict: Verdict = "post";
  let why = "";
  let effect = "";
  let audience = "";
  let confidence = 0.55;
  let missing = profile ? "" : "No profile yet.";

  if (fn === "empty") {
    verdict = "hold";
    why = "There is no draft.";
    effect = "Nothing would go out.";
    audience = "No one.";
    confidence = 1;
  } else if (promoVoice && (profile?.avoid || profile?.nonnegotiables)) {
    verdict = "hold";
    why = `This reads like an ad. You asked us not to write that way${profile?.avoid ? `: ${profile.avoid}` : "."}`;
    effect = "It would make the account look like a sales page.";
    audience = "People shopping for tips, not the people you said you want.";
    confidence = 0.78;
  } else if (defensive && priorDefensive.length >= 2) {
    verdict = "wait";
    const ordinal =
      nth === 3 ? "third" : nth === 4 ? "fourth" : nth === 5 ? "fifth" : `${nth}th`;
    const filmBit = filmExample
      ? " Keep the first sentence, attach the film example, and wait until tomorrow."
      : " Keep the first sentence. Do not recap the argument.";
    why = `This is your ${ordinal} defensive explanation of the same authorship argument in seven days. The terminology is strong, but publishing this version would make your position appear reactive.${filmBit}`;
    effect = "Turns a named position into a defense. The account starts looking like it is losing.";
    audience = "Intended readers already have the claim. Hostile readers get a fresh quote.";
    confidence = 0.84;
  } else if (fn === "aphorism" || fn === "proposition" || fn === "observation") {
    if (recentSame >= 3) {
      verdict = "wait";
      why = `This is ${article(fn)} ${fn}. You have already posted ${recentSame} close versions this week. Another one will look like you are arguing with yourself.`;
      effect = "It repeats a point people already have.";
      audience = "People who follow you already know the sentence. Critics will quote the pile.";
      confidence = 0.72;
    } else if (ambitionHit < 0.05 && profile) {
      verdict = "develop";
      why = `This is ${article(fn)} ${fn}. It does not obviously connect to “${profile.ambition}.” Fine to keep — just not as today's main post.`;
      effect = "It may sit oddly next to the work you said you are building.";
      audience = "Some people may like it. The people you named may not know why it is yours.";
      confidence = 0.5;
      missing = "How does this sit next to the last three posts?";
    } else {
      verdict = "post";
      why = `This is ${article(fn)} ${fn}. It is finished. Post it as one sentence. Don't explain it underneath.`;
      effect = "It adds to the work if you leave it alone. Explaining it in the same post weakens it.";
      audience = "People who already care will take it as a claim. Others may find it vague. That is the trade.";
      confidence = profile ? 0.64 : 0.42;
    }
  } else if (fn === "announcement" || fn === "promotional") {
    verdict = profile?.aggression === "aggressive" ? "revise" : "hold";
    why = "This is an announcement, not the work you said you care about.";
    effect = "Attention goes to a product update instead of the writing.";
    audience = "People who click offers, not the people you named.";
    confidence = 0.7;
  } else if (defensive && priorDefensive.length >= 1) {
    verdict = "wait";
    why = "This restates a point you already made. Wait.";
    effect = "It makes the account look like it is losing an argument.";
    audience = "People on your side are tired of it. Critics get a fresh quote.";
    confidence = 0.68;
  } else if (fn === "question" && profile?.aggression === "restrained") {
    verdict = "revise";
    why = "A question will pull a lot of answers. You asked us to be restrained.";
    effect = "You will get conversation. It may not be the kind you want.";
    audience = "Whoever likes to answer, which is not always your audience.";
    confidence = 0.52;
  } else if (avoidHit > 0.2) {
    verdict = "hold";
    why = "This uses language you asked us not to use.";
    effect = "It breaks a rule you set.";
    audience = "Whoever you were trying not to sound like.";
    confidence = 0.74;
  } else {
    verdict = "revise";
    why = `This reads as ${article(fn)} ${fn}. It can go out if it sounds like you. Don't add a second paragraph explaining it.`;
    effect = "Hard to tell yet whether it helps or just spends attention.";
    audience = "Depends on who already knows the last posts.";
    confidence = 0.45;
    missing = missing || "A couple of logged results would help.";
  }

  const mem = memories.find((m) => m.state !== "corrected" && overlapWords(m.pattern, text) > 0.12);
  const evidence = [
    profile?.ambition
      ? `You said you want to be known for ${profile.ambition}.`
      : "No profile yet.",
    profile?.avoid ? "A voice lock is on file. It is not quoted here." : "",
    posts[0]
      ? `Last saved post (${posts[0].date.slice(0, 10)}): “${posts[0].text.slice(0, 80)}”`
      : "No earlier posts saved yet.",
    mem ? `Earlier note: ${mem.pattern}` : "",
    priorDefensive.length
      ? `${priorDefensive.length} similar restatements in the last week.`
      : recentSame
        ? `${recentSame} similar posts in the last week.`
        : "",
    filmExample ? `Unused example on file: “${filmExample.text.slice(0, 80)}”` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const options: string[] = [];
  if (verdict === "post") {
    options.push("Publish as one sentence. Do not explain it underneath.");
    options.push("Hold it for a morning when you have not posted in 24 hours.");
  } else if (verdict === "wait") {
    options.push("Keep the first sentence. Attach one concrete example tomorrow, not a recap.");
    options.push("Reply with the sentence under someone else's post instead of originating.");
  } else if (verdict === "hold") {
    options.push("Do not rewrite this into a friendlier version. Drop it.");
    options.push("If the idea is real, write a new sentence that does not apologize.");
  } else if (verdict === "develop") {
    options.push("Name the term you are actually adding.");
    options.push("File it. Return after the next original.");
  } else {
    options.push("Cut to the first claim.");
    options.push("Make it a reply if it only exists to answer someone.");
  }

  const lower = `${why} ${effect}`.toLowerCase();
  for (const p of BANNED) {
    if (lower.includes(p)) bannedPhrases.push(p);
  }

  return {
    fn,
    verdict,
    why: why.trim(),
    effect,
    audience,
    options: options.slice(0, 3),
    evidence,
    confidence,
    missing,
    bannedPhrases,
  };
}

export function assertAphorismSafe(j: Judgment) {
  if (j.fn !== "aphorism" && j.fn !== "proposition") {
    throw new Error(`expected aphorism/proposition, got ${j.fn}`);
  }
  if (j.bannedPhrases.length) {
    throw new Error(`banned coaching language: ${j.bannedPhrases.join(", ")}`);
  }
  if (/hook|loop|lesson|thin/i.test(j.why)) {
    throw new Error("doctrine leak in why");
  }
}
