import { NextResponse } from "next/server";
import {
  localCoachReply,
  type CoachMessage,
  type StrategicProfile,
} from "../../../../lib/strategy";

const MODEL = "grok-4.5";
const BASE = "https://api.x.ai/v1";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    message?: string;
    profile?: StrategicProfile | null;
    history?: CoachMessage[];
  };
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json({ error: "empty" }, { status: 400 });
  }

  const profile = body.profile ?? null;
  const key = process.env.XAI_API_KEY;
  if (!key) {
    return NextResponse.json({
      text: localCoachReply(message, profile),
      mode: "local",
      message:
        "Conversational model is not connected. Coaching is from the Strategic Profile and the instrument.",
    });
  }

  try {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.35,
        messages: [
          { role: "system", content: systemPrompt(profile) },
          ...(Array.isArray(body.history) ? body.history : [])
            .slice(-12)
            .map((m) => ({
              role: m.role === "coach" ? "assistant" : "user",
              content: m.text,
            })),
          { role: "user", content: message },
        ],
      }),
    });
    if (!res.ok) {
      return NextResponse.json({
        text: localCoachReply(message, profile),
        mode: "local",
        message: `Model refused (${res.status}). Using the local coach.`,
      });
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return NextResponse.json({
        text: localCoachReply(message, profile),
        mode: "local",
        message: "Empty model reply. Using the local coach.",
      });
    }
    return NextResponse.json({ text, mode: "xai" });
  } catch {
    return NextResponse.json({
      text: localCoachReply(message, profile),
      mode: "local",
      message: "Model call failed. Using the local coach.",
    });
  }
}

function systemPrompt(profile: StrategicProfile | null): string {
  const memory = profile
    ? [
        `Handle: @${profile.handle} (X)`,
        `Ambition: ${profile.ambition}`,
        `Audience: ${profile.audience}`,
        `Territory: ${profile.territory.map((t) => `@${t}`).join(" ") || "(none named)"}`,
        `Outcomes: ${profile.outcomes.join(", ") || "(unspecified)"}`,
        profile.outcomeNote ? `Outcome note: ${profile.outcomeNote}` : "",
        `Voice lock: ${profile.voiceLock || "(none named)"}`,
        `Aggression: ${profile.aggression}`,
        `Beliefs: ${profile.beliefs.map((b) => `[${b.source}] ${b.text}`).join(" | ") || "(none)"}`,
        `Recent learnings: ${profile.learnings
          .slice(0, 6)
          .map((l) => `${l.verdict}: ${l.note}`)
          .join(" | ") || "(none)"}`,
      ]
        .filter(Boolean)
        .join("\n")
    : "No Strategic Profile yet. Tell them to start coaching at /start.";

  return `You are OUTRANK, a persistent social-media coach for a public life on X.
The user remains the author and performer. You study the field, remember them, and advise the next move.

Never:
- rewrite them into generic engagement language, hooks, or marketing copy
- invent analytics, follower counts, or live conversation data
- pretend you can see their X account or Phoenix
- optimize for virality unless they named that as an outcome

Always:
- separate observed data, interpretation, prediction, and what they stated
- protect the voice lock
- be willing to say: post it, revise this passage, save it, make it a video, reply with it, or do not post
- be observant, controlled, incisive, slightly competitive
- optimize for their chosen form of success

Strategic Profile:
${memory}`;
}
