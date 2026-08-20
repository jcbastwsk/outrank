import { ACTION_WEIGHTS, BOOSTS, likeEquivalent } from "./weights";
import {
  ScoreResult,
  effectiveMutualReplyWeight,
  secondPostMultiplier,
} from "./score";
import type { VibeProfile } from "./vibe";

export type Play = {
  id: string;
  urgency: "now" | "next" | "never";
  title: string;
  why: string;
  source: string;
  excerpt?: string;
};

export type CoachResult = ScoreResult & {
  plays: Play[];
  primary: Play | null;
  firstHour: Play[];
  today: Play[];
  accountRisk: boolean;
};

const PLAY_PRIORITY = [
  "dont-nuke",
  "queer-costume",
  "milady-costume",
  "desk-split",
  "off-voice",
  "anon-operator",
  "fan-desk",
  "corp-desk",
  "wall",
  "article-announce",
  "link-in-reply",
  "hashtags",
  "long-first-line",
  "operator-cut",
  "article-lede",
  "keep-loop",
  "scene-cut",
  "queer-room",
  "milady-room",
  "reel-link",
  "reel-bait",
  "operator-ask",
  "operator-screenshot",
  "micro-or-essay",
  "invite-reply",
  "make-portable",
  "cursed-keep",
  "thin",
  "good",
];

function firstLine(t: string) {
  const line = t.split(/\n/)[0]?.trim() ?? "";
  return line.length > 160 ? `${line.slice(0, 157)}…` : line;
}

function clipMatch(t: string, re: RegExp) {
  const m = t.match(re);
  if (!m) return "";
  const s = m[0].trim();
  return s.length > 160 ? `${s.slice(0, 157)}…` : s;
}

function excerptFor(id: string, text: string): string | undefined {
  if (id === "dont-nuke") return undefined;
  if (id === "link-in-reply") return clipMatch(text, /https?:\/\/\S+/i) || firstLine(text);
  if (id === "hashtags") {
    const tags = text.match(/#\w+/g);
    return tags ? tags.slice(0, 4).join(" ") : undefined;
  }
  if (id === "article-announce" || id === "long-first-line" || id === "article-lede" || id === "wall" || id === "operator-cut") {
    return firstLine(text);
  }
  if (id === "keep-loop" || id === "scene-cut" || id === "charged") {
    return (
      clipMatch(
        text,
        /(lied to|pretty sure|nobody (talks|says)|the thing about|i was wrong about|big time|wait until)/i,
      ) || firstLine(text)
    );
  }
  if (id === "milady-room" || id === "milady-costume") {
    return clipMatch(text, /\b(milady|remilia|radbro)s?\b/i) || firstLine(text);
  }
  if (id === "cursed-keep") return firstLine(text);
  if (id === "queer-room" || id === "queer-costume") {
    return clipMatch(text, /\b(the gays|us gays|as a gay|gay ass|the girlies)\b/i) || firstLine(text);
  }
  return firstLine(text) || undefined;
}

function pickPrimary(plays: Play[], text: string): Play | null {
  if (!plays.length) return null;
  const never = plays.filter((p) => p.urgency === "never");
  const pool = never.length ? never : plays;
  const rank = (p: Play) => {
    const i = PLAY_PRIORITY.indexOf(p.id);
    return i === -1 ? 400 + (p.urgency === "now" ? 0 : 40) : i;
  };
  const chosen = [...pool].sort((a, b) => rank(a) - rank(b))[0];
  const excerpt = excerptFor(chosen.id, text);
  return excerpt ? { ...chosen, excerpt } : chosen;
}

export function isAccountRisk(score: ScoreResult): boolean {
  const report = score.actions.find((a) => a.id === "report")?.contribution ?? 0;
  return (
    score.features.hateRisk ||
    score.lane.id === "volatile" ||
    report < -0.4
  );
}

export function todaysPlays(): Play[] {
  return [
    {
      id: "copy-link",
      urgency: "now",
      title: "Write something a group chat would pass around",
      why: `ShareViaCopyLinkWeight is ${ACTION_WEIGHTS.shareViaCopyLink} — ${likeEquivalent(ACTION_WEIGHTS.shareViaCopyLink)}× a like. That is the strongest positive head in the published ranker.`,
      source: "home-mixer/params/param.rs → ShareViaCopyLinkWeight",
    },
    {
      id: "conversation",
      urgency: "now",
      title: "Ask for a take, not a heart",
      why: `ReplyWeight and QuoteWeight are both ${ACTION_WEIGHTS.reply}. A reply is ${likeEquivalent(ACTION_WEIGHTS.reply)}× a like. Likes are a rounding error.`,
      source: "home-mixer/params/param.rs → ReplyWeight, QuoteWeight",
    },
    {
      id: "fat-tail",
      urgency: "next",
      title: "Steal the shape from scene OC, not the in-jokes",
      why: "A fat tail of posters mint original posts that only mean something in a room they already trained. Phoenix is per-viewer. OON is ×0.75. Operators buy the tool; they should copy the unfinished one-breath shape, not pretend they are that account.",
      source: "OonWeightFactor + per-viewer Phoenix",
    },
    {
      id: "mutuals",
      urgency: "now",
      title: "Ship originals to mutuals, not reply-guy content",
      why: `Mutual-follow originals get ReplyWeight + ${BOOSTS.bidirectionalFollowReply} = ${effectiveMutualReplyWeight()}. Replies and reposts do not get the boost. This rolled back from 20 → 15 on 24 Jul 2026.`,
      source: "docs/BIDIRECTIONAL_BOOST_CHANGE.md + ranking_scorer.rs",
    },
    {
      id: "no-dump",
      urgency: "next",
      title: "One original at a time",
      why: `Author diversity multiplies each extra post by ${BOOSTS.authorDiversityDecay}^k, floor ${BOOSTS.authorDiversityFloor}. Your second post in a slate is ~${secondPostMultiplier().toFixed(2)}×.`,
      source: "AuthorDiversityDecay / AuthorDiversityFloor",
    },
    {
      id: "no-rage",
      urgency: "never",
      title: "Do not farm reports",
      why: `ReportWeight is ${ACTION_WEIGHTS.report}. One report wipes ~${Math.abs(likeEquivalent(ACTION_WEIGHTS.report)).toFixed(0)} likes. Mute (${ACTION_WEIGHTS.muteAuthor}) is worse than block (${ACTION_WEIGHTS.blockAuthor}).`,
      source: "NotInterested / Mute / Block / Report weights",
    },
  ];
}

export function coachDraft(score: ScoreResult, vibe?: VibeProfile | null): CoachResult {
  const f = score.features;
  const plays: Play[] = [];

  if (f.isEmpty) {
    plays.push({
      id: "empty",
      urgency: "now",
      title: "Draft the post first",
      why: "The ranker scores a post against a viewer's history. There is nothing to score yet.",
      source: "Phoenix ranking input",
    });
  }

  if (f.wall) {
    plays.push({
      id: "wall",
      urgency: "now",
      title: "This is a brick. Cut it or break it.",
      why: "Length without paragraph breaks is not an article. Viewers train NotDwelled (−0.02 each) and never generate the click (0.4) or dwell (0.004/s) a real essay earns. Same AgeFilter as a shitpost — 48 hours.",
      source: "NotDwelledWeight + ClickWeight + ContDwellTimeWeight",
    });
  }
  if (f.articleAnnounce) {
    plays.push({
      id: "article-announce",
      urgency: "now",
      title: "Don't announce the article. Be the first line.",
      why: "Phoenix ranks this teaser, not the piece below the fold. 'I wrote an article' is a like farm. Put the claim in sentence one. Body — or the actual X Article — is for the people who click.",
      source: "ClickWeight + ShareViaCopyLinkWeight",
    });
  }
  if (f.format === "article" && !f.articleAnnounce) {
    plays.push({
      id: "article-lede",
      urgency: "now",
      title: "The first 200 characters are the post",
      why: "Phoenix ranks a candidate, not your whole essay. If the lede is 'I wrote an article,' nobody clicks. A claim or an unfinished thought — then the body earns click (0.4) and dwell (0.004/s). Copy-link is how articles travel.",
      source: "ClickWeight + ContDwellTimeWeight + ShareViaCopyLinkWeight",
    });
  }
  if (f.wall || (f.format === "long" && f.ledeWeak)) {
    plays.push({
      id: "long-first-line",
      urgency: "now",
      title: "Line one has to work as a tweet",
      why: "A long post still dies in the slate if the first line is throat-clearing. Same 48-hour AgeFilter as a 40-character joke.",
      source: "AgeFilter 48h + first-candidate scoring",
    });
  }
  if (
    (f.format === "micro" || f.format === "short") &&
    score.lane.id === "thin" &&
    !f.articleAnnounce
  ) {
    plays.push({
      id: "micro-or-essay",
      urgency: "next",
      title: "Either one breath or an article — not a soggy paragraph",
      why: "Micro needs a loop or a wreck. Articles need a lede and dwell. The dead zone is 80–280 characters of advice with no ask — too long to stop the thumb, too short to be the piece.",
      source: "Format prior",
    });
  }
  if (score.lane.id === "operator" && (f.wall || f.format === "long") && !f.listicle) {
    plays.push({
      id: "operator-cut",
      urgency: "now",
      title: "One lesson. Not a diary.",
      why: "Operator posts score on a screenshottable line plus an ask. A 1,000-character recap is LinkedIn-in-the-composer. Cut to the numbered list or publish it as an article with a lede.",
      source: "ShareViaCopyLinkWeight + format prior",
    });
  }

  if (f.hasUrl) {
    plays.push({
      id: "link-in-reply",
      urgency: "now",
      title: "Move the link to the first reply",
      why: `OpenLinkWeight is only ${ACTION_WEIGHTS.openLink}, and a link trains scroll-past (NotDwelled ${ACTION_WEIGHTS.notDwelled}) plus lost dwell. Native post for distribution, reply for the URL.`,
      source: "OpenLinkWeight + NotDwelledWeight + ContDwellTimeWeight",
    });
  }

  if (score.lane.id === "reel" || f.aiReel) {
    plays.push({
      id: "reel-bait",
      urgency: "now",
      title: "Lean into the LinkedIn skeleton",
      why: "In the AI art/cinema room the operator template is native: a still, a number (seconds, generations, dollars), and “workflow in the thread.” Don’t hide the bait. Don’t dump the prompt in the same post — that’s the reply engine.",
      source: "ShareViaCopyLinkWeight + ReplyWeight + FollowAuthorWeight",
    });
    if (f.hasUrl) {
      plays.push({
        id: "reel-link",
        urgency: "now",
        title: "Native still first, YouTube in the reply",
        why: "The feed pays for on-platform dwell and photo-expand. The Vimeo/YT link is a reply, not the post.",
        source: "OpenLinkWeight vs PhotoExpand / dwell",
      });
    }
  }

  if (score.lane.id === "operator" && !f.wall) {
    plays.push({
      id: "operator-screenshot",
      urgency: "now",
      title: "One lesson per post, then ask a real question",
      why: "Operator posts score on copy-link (20) and a polite reply. A numbered lesson people screenshot plus “what would you add?” is the whole machine. Don’t bury the line under a career recap.",
      source: "ShareViaCopyLinkWeight + ReplyWeight",
    });
    if (!f.agreeBait && !f.hasQuestion) {
      plays.push({
        id: "operator-ask",
        urgency: "now",
        title: "Close with a specific ask, not a 🙏",
        why: "Grateful/humbled without a question is a like farm. Likes are 0.5. Ask for a disagreement or a missing item.",
        source: "ReplyWeight vs FavoriteWeight",
      });
    }
    if (f.announce && f.hasUrl) {
      plays.push({
        id: "operator-link",
        urgency: "now",
        title: "Ship the news native, link in the reply",
        why: "The announcement can ride follow + copy-link. The URL still trains scroll-past.",
        source: "OpenLinkWeight + FollowAuthorWeight",
      });
    }
  }

  if (score.lane.id === "cursed" || f.cursed) {
    plays.push({
      id: "cursed-keep",
      urgency: "now",
      title: "Do not fix the grammar",
      why: "The wreck is the hook. “I all of my bit coins” gets quotes because it looks like a real person just ate glass. Correct it and it's a sad finance tweet.",
      source: "QuoteWeight + ReplyWeight — cursed prior",
    });
  }

  if (score.lane.id === "volatile" || f.hateRisk) {
    plays.push({
      id: "dont-nuke",
      urgency: "never",
      title: "Do not nuke the account",
      why: `This can print replies and still kill distribution. ReportWeight is ${ACTION_WEIGHTS.report} (~${Math.abs(likeEquivalent(ACTION_WEIGHTS.report)).toFixed(0)} likes each). Mute is ${ACTION_WEIGHTS.muteAuthor}. Those pile into Agatha / safety labels / visibility-filtering. A drop label hides you from people who don't follow you. We will not help you tune this.`,
      source: "ReportWeight + MuteAuthorWeight + visibility-filtering",
    });
  }

  const inMiladyRoom = vibe?.tribe === "milady";
  const inQueerRoom = vibe?.tribe === "queer";
  const inOperatorRoom = vibe?.posture === "operator" && (vibe.confidence ?? 0) >= 0.5;
  const offVoice =
    Boolean(vibe && vibe.samples >= 3 && vibe.confidence >= 0.5) &&
    ((inMiladyRoom && score.lane.id === "operator") ||
      (inQueerRoom && score.lane.id === "operator") ||
      (inOperatorRoom &&
        (score.lane.id === "scene" || f.tribe === "milady" || f.tribe === "queer") &&
        f.costume) ||
      (vibe?.posture === "reel" && score.lane.id === "operator" && !f.aiReel));

  const handleKind = vibe?.handleKind;
  if (vibe?.desk === "split") {
    plays.push({
      id: "desk-split",
      urgency: "now",
      title: "Fix the desk before you ship another original",
      why: "Name, @, bio, and pin already disagree. Phoenix has a viewer-side model. Another costume on top of a split profile is how you look like a different account.",
      source: "Identity workshop + per-viewer Phoenix",
    });
  }

  if (handleKind === "named" && f.cursed && !f.hateRisk) {
    plays.push({
      id: "named-desk",
      urgency: "next",
      title: "This @ is a person. The wreck still works.",
      why: `@${vibe?.handle} reads as a real name. Tech accounts almost never hide. A cursed line from a named desk is a bit they chose. Don't "fix" it into a lesson.`,
      source: "Handle prior + cursed prior",
    });
  }
  if (handleKind === "anon" && score.lane.id === "operator") {
    plays.push({
      id: "anon-operator",
      urgency: "now",
      title: "A throwaway @ giving lessons is a bit",
      why: `@${vibe?.handle} is anon-shaped (digits, alt, anime-serial). “10 things I learned” from that desk reads as a dropshipper. Stay in the wreck or get a name.`,
      source: "Handle prior vs operator lane",
    });
  }
  if (handleKind === "fan" && (score.lane.id === "operator" || f.announce)) {
    plays.push({
      id: "fan-desk",
      urgency: "now",
      title: "Fan accounts don't ship announcements",
      why: `@${vibe?.handle} looks like a stan/updates handle. The graph follows a subject, not a founder. A fundraise or “we just shipped” is a costume.`,
      source: "Handle prior vs FollowAuthorWeight",
    });
  }
  if (
    handleKind === "corp" &&
    (score.lane.id === "cursed" ||
      score.lane.id === "scene" ||
      f.tribe === "queer" ||
      f.tribe === "milady")
  ) {
    plays.push({
      id: "corp-desk",
      urgency: "now",
      title: "This is a brand handle",
      why: `@${vibe?.handle} reads HQ / official / support. Scene wrecks and room slang from a corp @ look like a social intern. Brands score on copy-link and a real ask — not on bits.`,
      source: "Handle prior vs mute / NotInterested",
    });
  }

  if (offVoice && vibe) {
    plays.push({
      id: "off-voice",
      urgency: "now",
      title: "This isn't your room",
      why: `Your last ${vibe.samples} posts read as ${vibe.aesthetic}. This draft is ${score.lane.label}. Phoenix already has a viewer-side model of you. Costume-switching looks like a different account.`,
      source: "Per-viewer Phoenix + room read",
    });
  }

  if (
    vibe &&
    vibe.samples >= 3 &&
    vibe.cadence === "sprinter" &&
    (f.format === "article" || f.format === "long" || f.wall)
  ) {
    plays.push({
      id: "format-mismatch",
      urgency: "next",
      title: "Your room knows you as one breath",
      why: `Your last ${vibe.samples} posts are shorts. An essay from a sprinter account reads like a different person unless the first line would work as one of your tweets. Phoenix is per-viewer.`,
      source: "Per-viewer Phoenix + format cadence",
    });
  }
  if (
    vibe &&
    vibe.samples >= 3 &&
    vibe.cadence === "essayist" &&
    (f.format === "micro" || f.format === "short") &&
    score.lane.id === "thin"
  ) {
    plays.push({
      id: "format-mismatch-essay",
      urgency: "next",
      title: "Your readers click. This is a status update.",
      why: "You usually ship long/article. A thin short from an essay account doesn't generate the click + dwell your graph is trained on. Either write the piece or cut to a claim.",
      source: "Per-viewer Phoenix + format cadence",
    });
  }

  if (f.tribe === "queer" || f.reclaimed) {
    plays.push({
      id: "queer-room",
      urgency: "now",
      title: "The room hears a modifier. For You hears a slur.",
      why: inQueerRoom
        ? "You're already in that graph. Don't explain the joke. Don't turn a room word into a growth template. Cold viewers still generate Report (−234) and Mute (−58.8)."
        : "In-group gay voice can use a word as endearment that a cold OON viewer reports. Phoenix is per-viewer (OON ×0.75). We will not coach you to use it. If you are not in this room, that is a costume.",
      source: "Per-viewer Phoenix + ReportWeight + OonWeightFactor",
    });
    if (f.costume) {
      plays.push({
        id: "queer-costume",
        urgency: "never",
        title: "That's a costume",
        why: "Operator skeleton plus a room slur reads as extraction. The room will mute it. The paying buyer steals unfinished one-breath craft — not the in-joke.",
        source: "MuteAuthorWeight + scene graph",
      });
    }
  }

  if (f.tribe === "milady") {
    plays.push({
      id: "milady-room",
      urgency: "now",
      title: "This only lands in the Remilia graph",
      why: inMiladyRoom
        ? "You're already in the room. Don't explain Remilia. Don't suddenly write a 10-lessons thread. One breath, then live in the replies."
        : "Milady is a room, not a growth tactic. Mutuals who already live there will reply. A cold For You viewer sees a private joke (OON ×0.75). Don't explain Remilia. Don't append gm milady to a fundraise.",
      source: "Per-viewer Phoenix + OonWeightFactor",
    });
    if (f.costume) {
      plays.push({
        id: "milady-costume",
        urgency: "never",
        title: "That's a costume",
        why: "Operator skeleton plus a milady sticker reads as extraction. The room will mute it. The paying buyer should steal unfinished one-breath craft from this scene — not the skin.",
        source: "MuteAuthorWeight + scene graph",
      });
    }
  }

  if (
    (score.lane.id === "scene" || f.openLoop || f.deadpan) &&
    !f.cursed &&
    !f.hateRisk &&
    f.tribe === "none" &&
    !f.wall &&
    f.format !== "article" &&
    f.format !== "long"
  ) {
    plays.push({
      id: "keep-loop",
      urgency: "now",
      title: "Do not explain it in the same post",
      why: "The replies exist because the thought is unfinished. Spell it out and you get a blog sentence. Answer in the replies — each one is weight 5.",
      source: "ReplyWeight / QuoteWeight — scene prior",
    });
    plays.push({
      id: "scene-context",
      urgency: "next",
      title: "This only hits a room you already trained",
      why: "Fat-tail OC. Phoenix scores per viewer. Mutuals who have been eating your last 20 posts will reply. A cold OON viewer (×0.75) sees a fragment. Don't industrialize this. If you sell to operators, steal the one-breath shape — not the in-joke.",
      source: "OonWeightFactor 0.75 + per-viewer Phoenix",
    });
    if (f.format === "micro" || f.format === "short") {
      plays.push({
        id: "scene-cut",
        urgency: "now",
        title: "Cut it until it feels unfinished",
        why: "The NK-shape is one breath. A paragraph of context is Operator voice wearing a Scene costume.",
        source: "Scene prior vs dwell-on-thread",
      });
    }
  }

  if (
    !f.hasQuestion &&
    !f.opinionated &&
    !f.openLoop &&
    !f.deadpan &&
    !f.operator &&
    !f.aiReel &&
    !f.cursed &&
    !f.hateRisk &&
    f.tribe === "none" &&
    !f.isEmpty &&
    !f.wall &&
    f.format !== "article" &&
    f.format !== "long"
  ) {
    plays.push({
      id: "invite-reply",
      urgency: "now",
      title: "End with a specific question or a sharp claim",
      why: `You are leaving ReplyWeight ${ACTION_WEIGHTS.reply} and QuoteWeight ${ACTION_WEIGHTS.quote} on the table. Phoenix cannot predict a reply you didn't invite.`,
      source: "ReplyWeight / QuoteWeight",
    });
  }

  if (
    !f.shareable &&
    !f.openLoop &&
    !f.deadpan &&
    !f.operator &&
    !f.aiReel &&
    !f.cursed &&
    !f.hateRisk &&
    f.tribe === "none" &&
    !f.isEmpty &&
    !f.wall &&
    f.format !== "article" &&
    !f.articleAnnounce
  ) {
    plays.push({
      id: "make-portable",
      urgency: "now",
      title: "Make one sentence screenshottable",
      why: `Copy-link shares are weighted ${ACTION_WEIGHTS.shareViaCopyLink}. A portable line — a number, a framework, a named mechanism — is what people send.`,
      source: "ShareViaCopyLinkWeight",
    });
  }

  if (f.hashtags >= 3) {
    plays.push({
      id: "hashtags",
      urgency: "now",
      title: "Drop the hashtag pile",
      why: "Three or more hashtags look like spam to both humans and classifiers. That lifts NotInterested and Mute, which dwarf any discovery upside.",
      source: "NotInterestedWeight / MuteAuthorWeight + Grox classifiers",
    });
  }

  if (f.rageBait) {
    plays.push({
      id: "rage",
      urgency: "next",
      title: "Ratio-farming lifts reports too",
      why: `"Idiot" is just speech. "Ratio him" is a pile-on. The pile-on is what lifts Report (${ACTION_WEIGHTS.report}) and Mute (${ACTION_WEIGHTS.muteAuthor}).`,
      source: "ReportWeight / MuteAuthorWeight",
    });
  }

  if (f.chargedTopic && !f.rageBait) {
    plays.push({
      id: "charged",
      urgency: "next",
      title: "Stay for the conversation, don't escalate",
      why: "Loaded topics lift reply and quote priors. They also lift NotInterested and Mute a little. The published report head is −234 — do not turn this into an insult thread.",
      source: "ReplyWeight vs NotInterested / Mute / Report",
    });
  }

  if (
    f.isShort &&
    !f.hasQuestion &&
    !f.opinionated &&
    !f.openLoop &&
    !f.deadpan &&
    !f.operator &&
    !f.scene &&
    !f.aiReel &&
    !f.cursed &&
    !f.hateRisk &&
    !f.isEmpty
  ) {
    plays.push({
      id: "thin",
      urgency: "next",
      title: "This is easy to scroll past",
      why: `Binary DwellWeight is currently 0, but NotDwelledWeight (${ACTION_WEIGHTS.notDwelled}) and continuous dwell still exist. Give the eye something to stop on.`,
      source: "DwellWeight=0, NotDwelledWeight, ContDwellTimeWeight",
    });
  }

  if (f.format === "thread") {
    plays.push({
      id: "thread",
      urgency: "next",
      title: "Keep the first tweet self-contained",
      why: "The first post is what Phoenix ranks into For You. If tweet 1 is only a hook, a lot of viewers never generate the dwell/click the rest needs.",
      source: "AgeFilter 48h + first-candidate scoring",
    });
  }

  if (ACTION_WEIGHTS.profileClick === 0 && /follow (me|for more)|link in bio/i.test(f.text)) {
    plays.push({
      id: "no-profile-cta",
      urgency: "next",
      title: "Skip 'follow for more'",
      why: "ProfileClickWeight is published at 0. A follow from the post still scores (FollowAuthorWeight 4.0), but clicking the profile does not.",
      source: "ProfileClickWeight = 0, FollowAuthorWeight = 4.0",
    });
  }

  const firstHour: Play[] = [
    {
      id: "stay",
      urgency: "now",
      title: "Stay in the replies for 30–60 minutes",
      why: "Each public reply is weight 5. Your reply back keeps the conversation warm, which is what Phoenix is predicting for the next viewer.",
      source: "ReplyWeight",
    },
    {
      id: "no-second",
      urgency: "now",
      title: "Do not post another original yet",
      why: `Author diversity will discount the new one (decay ${BOOSTS.authorDiversityDecay}, floor ${BOOSTS.authorDiversityFloor}) and steal attention from this one.`,
      source: "AuthorDiversityDecay",
    },
    {
      id: "seed",
      urgency: "now",
      title: "Seed the first reply yourself if it's quiet",
      why: "A specific follow-up question from you is a legitimate reply. It is not a loophole — it is conversation, which the ranker is built to predict.",
      source: "ReplyWeight",
    },
    {
      id: "window",
      urgency: "next",
      title: "You have 48 hours in For You, not a week",
      why: `AgeFilter drops posts older than ${BOOSTS.ageFilterHours} hours before scoring. After that you are out of the candidate set.`,
      source: "home-mixer AgeFilter",
    },
  ];

  if (f.format === "article" || (f.format === "long" && !f.wall)) {
    firstHour.unshift({
      id: "essay-stay",
      urgency: "now",
      title: "Stay for the people who click, not a reply pile",
      why: "Long-form scores on click (0.4), dwell (0.004/s), and copy-link (20). Don't post a summary tweet after it — author diversity will discount both.",
      source: "ClickWeight + ContDwellTimeWeight + AuthorDiversityDecay",
    });
  }

  if (!f.isEmpty && plays.length === 0) {
    plays.push({
      id: "good",
      urgency: "next",
      title: "This is aimed at the right heads",
      why: "Protect it: no outbound link, stay for the replies, don't stack another original on top.",
      source: "RankingScorer + AuthorDiversity",
    });
  }

  const primary = f.isEmpty ? null : pickPrimary(plays, f.text);

  return {
    ...score,
    plays: primary ? [primary, ...plays.filter((p) => p.id !== primary.id)] : plays,
    primary,
    firstHour,
    today: todaysPlays(),
    accountRisk: isAccountRisk(score),
  };
}

export const SAMPLE_DRAFTS = [
  {
    label: "Operator",
    text: "After 10 years of building companies, here's what I wish I'd known at 25:\n\n1. Distribution is the product\n2. Hire slower than feels sane\n3. The real moat is taste\n\nWhat would you add?",
  },
  {
    label: "Reel",
    text: "Just dropped a 12 second film. No crew. No camera. 47 generations in Kling.\n\nWorkflow in the thread — comment FILM and I'll send it.",
  },
  {
    label: "Open loop",
    text: "I'm pretty sure I was lied to big time about N Korea",
  },
  {
    label: "Milady",
    text: "very milady of the timeline today. remilia forever",
  },
  {
    label: "Cursed",
    text: "I all of my bit coins",
  },
  {
    label: "Article",
    text: `The feed is not a magazine. It's a slot machine that happens to rank essays if the first line slaps.

Phoenix still only sees a candidate. Click 0.4. Dwell 0.004 a second. Copy-link 20. If your lede is "I wrote something," you already lost.

I. The 48-hour window
Same AgeFilter as a shitpost. Your 4,000 words die at hour 49.

II. Who actually finishes
Almost nobody. The people who copy the URL are the whole game.

III. What to do
Put the claim in sentence one. Body is for the few who click.`,
  },
  {
    label: "Long",
    text: `The first 200 characters are the post. Everything after that is optional.

Phoenix does not rank your word count. It ranks a candidate in a slate. Click 0.4. Dwell 0.004 a second. Copy-link 20. Same 48-hour AgeFilter as a joke.

If line one is "I've been thinking," you already lost the thumb. Put the claim where a tweet would go. Let the rest earn the people who stopped.`,
  },
  {
    label: "Wall",
    text: "I have been thinking a lot about distribution lately and I wanted to share some thoughts because I think people get this wrong. Distribution is not something you add later it is the whole product and if you wait until the thing is finished you already lost. Most founders I talk to still treat it like a marketing problem when it is really a design problem and the earlier you start the easier it gets. I wish someone had told me this ten years ago when I was still hiding in the building phase. Anyway here is what I have learned after a decade of shipping things that nobody saw. You have to be in the feed every day you have to have a point of view and you have to make things people can send. That is the whole game. I will write more about this later. Consistency is the real growth hack if I am being honest and I think a lot of people are going to disagree with me but that is fine.",
  },
  {
    label: "Soft take",
    text: "Consistency is the real growth hack on X.",
  },
  {
    label: "Link dump",
    text: "New blog post is up!! Check it out 🔥 https://example.com/my-startup-essay #startup #buildinpublic #ai #growth",
  },
];
