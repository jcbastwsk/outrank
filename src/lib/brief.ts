import { coachDraft, type CoachResult } from "./coach";
import { residualRead } from "./residual";
import { scoreDraft } from "./score";
import type { StrategicProfile } from "./strategy";

export type Verdict = "post" | "revise" | "later" | "video" | "reply" | "hold";

export const VERDICT_META: Record<Verdict, { label: string; blurb: string }> = {
  post: { label: "Post it unchanged", blurb: "It advances the position. Do not sand it." },
  revise: { label: "Revise this passage", blurb: "The idea is yours. One stretch is wrong." },
  later: { label: "Save it for later", blurb: "Right thought, wrong hour." },
  video: { label: "Make it a video", blurb: "The claim wants a still and a duration, not another paragraph." },
  reply: { label: "Reply with it instead", blurb: "This belongs under someone else's post, not as your original." },
  hold: { label: "Do not post this", blurb: "It dilutes the desk or risks the account." },
};

export type Dimension = {
  id: string;
  label: string;
  read: string;
  kind: "observed" | "interpretation" | "prediction";
};

export type Brief = CoachResult & {
  verdict: Verdict;
  dimensions: Dimension[];
  learningNote: string;
};

function overlap(a: string, b: string) {
  const aw = new Set(a.toLowerCase().match(/[a-z]{4,}/g) ?? []);
  const bw = b.toLowerCase();
  let n = 0;
  for (const w of aw) if (bw.includes(w)) n++;
  return aw.size ? n / aw.size : 0;
}

export function briefDraft(text: string, profile: StrategicProfile | null): Brief {
  const scored = coachDraft(scoreDraft(text), null);
  const f = scored.features;
  const dims: Dimension[] = [];

  const voiceHit = profile?.voiceLock
    ? overlap(profile.voiceLock, text)
    : 0;
  const ambitionHit = profile?.ambition ? overlap(profile.ambition, text) : 0;

  let voice = "No profile yet. This is the instrument only.";
  if (profile) {
    if (f.costume) voice = "Costume. The draft borrows a room you did not claim.";
    else if (profile.voiceLock && voiceHit < 0.05 && f.operator && /relatable|authentic|humbled/i.test(text)) {
      voice = "This is sliding toward marketing copy you said you would not become.";
    } else if (f.operator && profile.aggression === "restrained") {
      voice = "Operator skeleton on a restrained desk. Check that the ask is not a costume.";
    } else {
      voice = "It still sounds like the desk you described.";
    }
  }
  dims.push({
    id: "voice",
    label: "Voice fidelity",
    read: voice,
    kind: "interpretation",
  });

  const novel =
    f.openLoop || f.deadpan || f.cursed
      ? "Has an unfinished or broken edge. That is novelty."
      : f.listicle || f.announce
        ? "Familiar machine. Fine if that is the desk. Not new."
        : "No new term, no unfinished claim.";
  dims.push({ id: "novelty", label: "Novelty", read: novel, kind: "interpretation" });

  const clear = f.wall
    ? "A brick. The first line is the only candidate."
    : f.ledeWeak || f.articleAnnounce
      ? "Throat-clearing. The claim is not in sentence one."
      : f.isEmpty
        ? "Nothing to read."
        : "Readable.";
  dims.push({ id: "clarity", label: "Clarity", read: clear, kind: "observed" });

  const strat =
    !profile
      ? "No strategic profile. Relevance is unknown."
      : ambitionHit > 0.12 || overlap(profile.audience, text) > 0.1
        ? `Touches the ambition / audience you named.`
        : "Does not obviously advance the territory you claimed.";
  dims.push({
    id: "strategy",
    label: "Strategic relevance",
    read: strat,
    kind: "interpretation",
  });

  const gap = scored.graph.reach - scored.cold.reach;
  const interpret =
    f.reclaimed
      ? "In-room this is a modifier. Cold For You hears a slur."
      : gap >= 12
        ? `Mutuals ${scored.graph.grade}. Cold For You ${scored.cold.grade}. The room will get it; the field may not.`
        : "In-graph and cold reads are close.";
  dims.push({
    id: "audience",
    label: "Audience interpretation",
    read: interpret,
    kind: "prediction",
  });

  const misread = f.hateRisk
    ? "Likely reported. We will not tune this."
    : f.chargedTopic
      ? "Loaded topic. Some will hear an insult you did not write."
      : f.reclaimed
        ? "OON misread is the feature and the risk."
        : "No obvious trap.";
  dims.push({
    id: "misread",
    label: "Likely misreading",
    read: misread,
    kind: "prediction",
  });

  const lastLearning = profile?.learnings[0];
  const lastHit = lastLearning
    ? overlap(`${lastLearning.excerpt} ${lastLearning.note}`, text)
    : 0;
  const recentOverlap =
    profile?.recentWork ? overlap(profile.recentWork, text) : 0;
  const residual = profile?.pairs?.length
    ? residualRead(profile.pairs).note
    : null;
  const recent =
    residual
      ? residual
      : profile?.recentWork && recentOverlap > 0.2
        ? "Close to work you already pasted. Risk of repeating yourself."
        : profile?.learnings[0]
          ? `Last saved learning: ${profile.learnings[0].note}`
          : profile?.recentWork
            ? "Does not obviously repeat the posts you pasted."
            : "No recent work on the profile yet.";
  dims.push({
    id: "recent",
    label: "Relation to recent work",
    read: recent,
    kind: profile?.recentWork || profile?.learnings[0] ? "observed" : "interpretation",
  });

  const advance =
    f.hateRisk || f.costume
      ? "Dilutes or endangers the position."
      : ambitionHit > 0.12 || f.openLoop || (f.operator && (profile?.outcomes.includes("clients") ?? false))
        ? "Advances the larger position if you stay in the replies."
        : "Neutral. Does not obviously build or spend reputation.";
  dims.push({
    id: "advance",
    label: "Advance or dilute",
    read: advance,
    kind: "interpretation",
  });

  const costumeVoice =
    Boolean(profile?.voiceLock) &&
    /humbled|thrilled to announce|so grateful|let me explain|relatable|authentic/i.test(text);

  let verdict: Verdict = "post";
  if (f.isEmpty) verdict = "hold";
  else if (f.hateRisk) verdict = "hold";
  else if (f.costume) verdict = "hold";
  else if (costumeVoice) {
    verdict = profile?.aggression === "aggressive" ? "revise" : "hold";
  } else if (
    profile?.aggression === "restrained" &&
    (f.announce || /defensive|let me explain|actually/i.test(text))
  ) {
    verdict = "hold";
  } else if (f.wall || f.ledeWeak || f.articleAnnounce) verdict = "revise";
  else if (f.hasUrl && !f.aiReel) verdict = "revise";
  else if (f.aiReel && (f.operator || f.announce || f.listicle || f.hasUrl)) {
    verdict = "video";
  }
  else if (recentOverlap > 0.25) {
    verdict = "later";
  } else if (lastLearning && lastHit > 0.28) {
    if (lastLearning.verdict === "hold") verdict = "hold";
    else if (lastLearning.verdict === "later") verdict = "later";
    else if (lastLearning.verdict === "reply") verdict = "reply";
    else if (lastLearning.verdict === "revise") verdict = "revise";
  } else if (
    profile?.territory.length &&
    f.format === "micro" &&
    !f.openLoop &&
    !f.operator &&
    ambitionHit < 0.12
  ) {
    verdict = "reply";
  } else if (ambitionHit < 0.05 && profile && !f.openLoop && !f.shareable && scored.lane.id === "thin") {
    verdict = "later";
  } else if (ambitionHit >= 0.12 && profile) {
    verdict = "post";
  } else if (scored.primary?.id === "keep-loop" || scored.grade === "A" || scored.grade === "S") {
    verdict = "post";
  } else if (scored.lane.id === "thin") {
    verdict = "revise";
  }

  const learningNote =
    verdict === "hold"
      ? profile?.voiceLock
        ? `Hold. Protect: ${profile.voiceLock}`
        : "Hold. This draft spends reputation without buying position."
      : verdict === "revise"
        ? `Revise the circled passage before it ships.`
        : verdict === "reply"
          ? "This is a reply, not an original."
          : `This draft is ${verdict}. ${dims.find((d) => d.id === "advance")?.read ?? ""}`;

  return {
    ...scored,
    verdict,
    dimensions: dims,
    learningNote,
  };
}
