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
};

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

  if (!f.hasQuestion && !f.opinionated && !f.isEmpty) {
    plays.push({
      id: "invite-reply",
      urgency: "now",
      title: "End with a specific question or a sharp claim",
      why: `You are leaving ReplyWeight ${ACTION_WEIGHTS.reply} and QuoteWeight ${ACTION_WEIGHTS.quote} on the table. Phoenix cannot predict a reply you didn't invite.`,
      source: "ReplyWeight / QuoteWeight",
    });
  }

  if (!f.shareable && !f.isEmpty) {
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

  if (f.isShort && !f.hasQuestion && !f.opinionated && !f.isEmpty) {
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
  };
}

export const SAMPLE_DRAFTS = [
  {
    label: "Link dump",
    text: "New blog post is up!! Check it out 🔥 https://example.com/my-startup-essay #startup #buildinpublic #ai #growth",
  },
  {
    label: "Soft take",
    text: "Consistency is the real growth hack on X.",
  },
  {
    label: "Ranker-aware",
    text: "The For You ranker now weights a copy-link share at 20.0 and a like at 0.5. If you want reach, write one sentence a group chat would pass around — not something people politely heart. What's the last post you actually sent to someone?",
  },
];
