import { ACTION_WEIGHTS, BOOSTS, likeEquivalent } from "./weights";
import {
  ScoreResult,
  effectiveMutualReplyWeight,
  secondPostMultiplier,
} from "./score";

export type Play = {
  id: string;
  urgency: "now" | "next" | "never";
  title: string;
  why: string;
  source: string;
};

export type CoachResult = ScoreResult & {
  plays: Play[];
  firstHour: Play[];
  today: Play[];
  accountRisk: boolean;
};

export function isAccountRisk(score: ScoreResult): boolean {
  const report = score.actions.find((a) => a.id === "report")?.contribution ?? 0;
  return (
    score.features.hateRisk ||
    score.features.rageBait ||
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

export function coachDraft(score: ScoreResult): CoachResult {
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

  if (f.hasUrl) {
    plays.push({
      id: "link-in-reply",
      urgency: "now",
      title: "Move the link to the first reply",
      why: `OpenLinkWeight is only ${ACTION_WEIGHTS.openLink}, and a link trains scroll-past (NotDwelled ${ACTION_WEIGHTS.notDwelled}) plus lost dwell. Native post for distribution, reply for the URL.`,
      source: "OpenLinkWeight + NotDwelledWeight + ContDwellTimeWeight",
    });
  }

  if (score.lane.id === "operator") {
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

  if (score.lane.id === "volatile" || f.hateRisk || f.rageBait) {
    plays.push({
      id: "dont-nuke",
      urgency: "never",
      title: "Do not nuke the account",
      why: `This can print replies and still kill distribution. ReportWeight is ${ACTION_WEIGHTS.report} (~${Math.abs(likeEquivalent(ACTION_WEIGHTS.report)).toFixed(0)} likes each). Mute is ${ACTION_WEIGHTS.muteAuthor}. Those pile into Agatha / safety labels / visibility-filtering. A drop label hides you from people who don't follow you. We will not help you tune this.`,
      source: "ReportWeight + MuteAuthorWeight + visibility-filtering",
    });
  }

  if ((score.lane.id === "scene" || f.openLoop || f.deadpan) && !f.cursed && !f.hateRisk) {
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
    if (f.isLong) {
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
    !f.cursed &&
    !f.hateRisk &&
    !f.isEmpty
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
    !f.cursed &&
    !f.hateRisk &&
    !f.isEmpty
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
      urgency: "never",
      title: "Rewrite without the insult",
      why: `You may pick up replies and also ReportWeight ${ACTION_WEIGHTS.report} and MuteAuthorWeight ${ACTION_WEIGHTS.muteAuthor}. The negative heads dominate.`,
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

  if (f.threadCue) {
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

  if (!f.isEmpty && plays.length === 0) {
    plays.push({
      id: "good",
      urgency: "next",
      title: "This is aimed at the right heads",
      why: "Protect it: no outbound link, stay for the replies, don't stack another original on top.",
      source: "RankingScorer + AuthorDiversity",
    });
  }

  return {
    ...score,
    plays,
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
    label: "Open loop",
    text: "I'm pretty sure I was lied to big time about N Korea",
  },
  {
    label: "Cursed",
    text: "I all of my bit coins",
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
