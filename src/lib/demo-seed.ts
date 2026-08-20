import type { CoachMemory, DeskState, PostRecord, Recommendation } from "./model";

function p(
  date: string,
  text: string,
  extra: Partial<PostRecord> = {},
): PostRecord {
  return {
    id: `demo-${date}-${text.slice(0, 12)}`,
    date: `${date}T12:00:00.000Z`,
    text,
    outcome: extra.outcome ?? "unknown",
    ...extra,
  };
}

const posts: PostRecord[] = [
  p("2026-07-02", "The still is not a photograph. It is a decision about time.", {
    outcome: "worked",
    subject: "profilmic",
    intendedFunction: "aphorism",
    userRead: "This is the sentence people quote.",
  }),
  p("2026-07-05", "Synthetic cinema is not a style. It is a production circumstance.", {
    outcome: "worked",
    subject: "synthetic cinema",
    intendedFunction: "proposition",
  }),
  p("2026-07-08", "I keep being asked if the image is real. That is the wrong verb.", {
    outcome: "worked",
    intendedFunction: "observation",
  }),
  p("2026-07-11", "Profilmic: whatever stood in front of a camera. The word still works when nothing did.", {
    outcome: "worked",
    subject: "profilmic",
    intendedFunction: "proposition",
    userRead: "Terminology landed.",
  }),
  p("2026-07-14", "Let me explain again, because people keep misunderstanding the authorship point.", {
    outcome: "failed",
    intendedFunction: "argument",
    userRead: "Defensive. Felt cheap the next morning.",
  }),
  p("2026-07-15", "To be clear: I am not saying the machine is the author. I am saying the culture has no verb yet.", {
    outcome: "failed",
    intendedFunction: "argument",
    userRead: "Third explanation. Same week.",
  }),
  p("2026-07-18", "A generation is not a shot. A shot is a cut you accept.", {
    outcome: "worked",
    intendedFunction: "aphorism",
  }),
  p("2026-07-21", "If you need the prompt to complete the work, the work is not finished.", {
    outcome: "worked",
    intendedFunction: "proposition",
  }),
  p("2026-08-15", "Once again, synthetic does not mean fake. It means assembled.", {
    outcome: "failed",
    intendedFunction: "argument",
    userRead: "Reactive. Quote-tweeted by people who wanted a fight.",
  }),
  p("2026-07-27", "The audience that wants a confession will not be satisfied by a method.", {
    outcome: "worked",
    intendedFunction: "observation",
  }),
  p("2026-07-30", "Twelve seconds. No crew. Comment WORKFLOW.", {
    outcome: "undesired_reach",
    intendedFunction: "promotional",
    metrics: "high replies, wrong room",
    userRead: "Reach. Wrong people. Felt like a costume.",
  }),
  p("2026-08-02", "I do not want the still explained.", {
    outcome: "worked",
    intendedFunction: "aphorism",
  }),
  p("2026-08-13", "As I said last week, the authorship question is a category error.", {
    outcome: "failed",
    intendedFunction: "argument",
    userRead: "Fourth defensive pass.",
  }),
  p("2026-08-06", "Recognition lags the medium. That lag is the subject.", {
    outcome: "worked",
    intendedFunction: "proposition",
  }),
  p("2026-08-07", "The film example I keep not posting: the hallway that was never built.", {
    outcome: "mixed",
    intendedFunction: "observation",
  }),
  p("2026-08-08", "People in my replies want me to pick a side between craft and tool. I am not in that argument.", {
    outcome: "mixed",
    intendedFunction: "argument",
  }),
  p("2026-08-09", "A body of work is a sequence of refusals.", {
    outcome: "worked",
    intendedFunction: "aphorism",
  }),
  p("2026-08-10", "Let me be clear one more time about what I mean by authorship.", {
    outcome: "failed",
    intendedFunction: "argument",
    userRead: "Should have waited.",
  }),
  p("2026-08-11", "The machines can imitate an image. The culture cannot yet name the medium. Those are different delays.", {
    outcome: "worked",
    intendedFunction: "proposition",
  }),
  p("2026-08-12", "I will not be doing a workflow thread.", {
    outcome: "worked",
    intendedFunction: "observation",
  }),
  p("2026-08-13", "The hallway that was never built is the only honest establishing shot I have.", {
    outcome: "worked",
    intendedFunction: "observation",
    subject: "film example",
  }),
  p("2026-08-14", "If the sentence needs a second sentence, it was not the sentence.", {
    outcome: "worked",
    intendedFunction: "aphorism",
  }),
];

const memories: CoachMemory[] = [
  {
    id: "m1",
    pattern: "You are becoming associated with synthetic cinema and the profilmic break.",
    evidence: "Posts 2026-07-02, 07-11, 08-06 named the terms and were marked worked.",
    confidence: 0.82,
    learnedAt: "2026-08-06T12:00:00.000Z",
    state: "confirmed",
  },
  {
    id: "m2",
    pattern: "Your strongest posts introduce memorable terminology and stop.",
    evidence: "The still / profilmic / assembled. User said these are the sentences people quote.",
    confidence: 0.8,
    learnedAt: "2026-08-02T12:00:00.000Z",
    state: "confirmed",
  },
  {
    id: "m3",
    pattern: "Defensive restatements of authorship in the same week make the position look reactive.",
    evidence: "07-14, 07-15, 08-10, 08-13, 08-15. User labeled failed / should have waited.",
    confidence: 0.86,
    learnedAt: "2026-08-10T12:00:00.000Z",
    state: "confirmed",
  },
  {
    id: "m4",
    pattern: "You do not want language normalized into marketing copy or workflow bait.",
    evidence: "User non-negotiable. 07-30 'comment WORKFLOW' was undesired_reach.",
    confidence: 0.9,
    learnedAt: "2026-07-30T12:00:00.000Z",
    state: "confirmed",
  },
];

const recommendations: Recommendation[] = [
  {
    id: "r1",
    kind: "wait",
    action:
      "Do not post another defensive explanation of authorship this week. Keep the first sentence. Attach the hallway film example tomorrow.",
    why: "Five close restatements since mid-July. The terminology is strong. Another recap would look reactive.",
    goal: "reputation",
    evidence: "Memory m3. Posts 08-04 and 08-10 labeled failed.",
    confidence: 0.84,
    timing: "After 24 hours without an original.",
    status: "open",
  },
  {
    id: "r2",
    kind: "publish",
    action: "Publish the unfinished thought about recognition lagging the medium. Do not explain it.",
    why: "This is the claim the last successful posts already earned.",
    goal: "influence",
    evidence: "08-06 and 08-11 marked worked.",
    confidence: 0.7,
    status: "open",
  },
  {
    id: "r3",
    kind: "hold",
    action: "Do not ship a workflow, a still-plus-ask, or a 'what would you add'.",
    why: "That register already produced the wrong room.",
    goal: "reputation",
    evidence: "07-30 undesired_reach. Non-negotiable m4.",
    confidence: 0.88,
    status: "open",
  },
];

export function demoDesk(): DeskState {
  const desk: DeskState = {
    id: "demo",
    demo: true,
    createdAt: "2026-07-01T00:00:00.000Z",
    profile: {
      version: 2,
      platform: "x",
      displayName: "",
      handle: "",
      ambition: "",
      subjects: [],
      audience: "",
      outcomes: [],
      outcomeNote: "",
      reputationWanted: "",
      acceptableAttention: "",
      unacceptableAttention: "",
      voice: "",
      avoid: "",
      nonnegotiables: "",
      peers: [],
      rivals: [],
      scenes: "",
      preferredFormats: "",
      hypotheses: "",
      aggression: "measured",
      corrections: "",
      updatedAt: "2026-08-16T00:00:00.000Z",
    },
    posts: [],
    memories: [],
    recommendations: [],
  };
  desk.profile = {
    version: 2,
    platform: "x",
    displayName: "Mira Vale",
    handle: "mira_still",
    ambition: "synthetic cinema and the profilmic break",
    subjects: ["profilmic", "synthetic cinema", "authorship", "recognition lag"],
    audience: "people who take images seriously, not prompt tourists",
    outcomes: ["reputation", "influence"],
    outcomeNote: "Correct-audience seriousness. Not tutorial reach.",
    reputationWanted: "Intellectual authority about new image-making. Not a tool account.",
    acceptableAttention: "Citation, argument, quiet follow from other makers.",
    unacceptableAttention: "Workflow requests, 'is this real', pile-on authorship fights.",
    voice: "Short conceptual sentences. No lesson. No ask.",
    avoid: "Do not normalize my language into marketing copy. No humbled, no workflow, no authentic.",
    nonnegotiables: "I remain the author. The machine is a circumstance, not a personality.",
    peers: ["hito_steyerl", "farocki_bot"],
    rivals: ["ai_cinema_tips"],
    scenes: "post-photographic theory, small film Twitter",
    preferredFormats: "aphorism, short proposition, occasional observation. Almost never thread.",
    hypotheses: "Naming the delay between imitation and recognition is the work.",
    aggression: "restrained",
    corrections: "Do not call me a prompt artist.",
    updatedAt: "2026-08-16T00:00:00.000Z",
  };
  desk.posts = posts;
  desk.memories = memories;
  desk.recommendations = recommendations;
  return desk;
}

export const DEMO_MAGIC_DRAFT =
  "Let me explain one more time what I mean by authorship, because people still don't get it.";
