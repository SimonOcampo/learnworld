import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { compiledLessonSchema, tutorResponseSchema } from "@/lib/types";

const tutorJsonSchema = {
  type: "object",
  properties: {
    explanation: { type: "string" }, question: { type: "string" },
    options: { type: "array", items: { type: "string" }, maxItems: 4 }, expectedAnswer: { type: "string" },
    hint: { type: "string" }, misconception: { type: ["string", "null"] }, difficulty: { type: "string", enum: ["easier", "same", "harder"] },
  },
  required: ["explanation", "question", "options", "expectedAnswer", "hint", "misconception", "difficulty"],
};

function localTutor(body: Record<string, unknown>) {
  const event = body.event as { message?: string; kind?: string } | undefined;
  const nextEvent = body.nextEvent as { message?: string; focus?: string[] } | undefined;
  const challenge = body.mode === "challenge";
  const expected = nextEvent?.focus?.at(-1) ?? "Complete";
  const snapshot = body.snapshot as { distances?: Record<string, unknown>; values?: number[] } | undefined;
  const candidates = snapshot?.distances ? Object.keys(snapshot.distances) : snapshot?.values ? snapshot.values.map((_, index) => String(index)) : [];
  const options = challenge ? [...new Set([expected, ...candidates.filter((item) => item !== expected)])].slice(0, 4) : [];
  return tutorResponseSchema.parse({
    explanation: event?.message ?? "The simulation is at its initial state. Inspect the active data structure before advancing.",
    question: challenge ? nextEvent ? "Which node or index is the focus of the next deterministic event?" : "The algorithm is complete. What result did it produce?" : "",
    options, expectedAnswer: expected,
    hint: nextEvent?.message ?? "Read the final live variables.", misconception: null, difficulty: "same",
  });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid tutor request." }, { status: 400 }); }
  const lesson = compiledLessonSchema.safeParse(body.lesson);
  if (!lesson.success) return NextResponse.json({ error: "Invalid lesson context." }, { status: 400 });
  if (!process.env.GEMINI_API_KEY) return NextResponse.json(localTutor(body));

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const interaction = await ai.interactions.create({
      model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
      stream: false,
      input: `You are a concise, encouraging algorithm tutor. Never change or contradict the deterministic simulation state. Mode: ${body.mode === "challenge" ? "challenge" : "explain"}. Ground your response in this exact JSON. For a challenge, use the supplied deterministic nextEvent as the answer source and make expectedAnswer exactly its final focus value. Ask at most one question.\n${JSON.stringify({ lesson: lesson.data, snapshot: body.snapshot, latestEvent: body.event, nextEvent: body.nextEvent })}`,
      response_format: { type: "text", mime_type: "application/json", schema: tutorJsonSchema },
    });
    const outputText = interaction.output_text || "{}";
    const parsed = tutorResponseSchema.safeParse(JSON.parse(outputText));
    return NextResponse.json(parsed.success ? parsed.data : localTutor(body));
  } catch { return NextResponse.json(localTutor(body)); }
}
