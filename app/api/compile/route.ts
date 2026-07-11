import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { compiledLessonSchema, conceptIds, type ConceptId } from "@/lib/types";
import { detectConcept, fallbackLesson } from "@/lib/catalog";

export const runtime = "nodejs";
export const maxDuration = 45;

const lessonJsonSchema = {
  type: "object",
  properties: {
    concept: { type: "string", enum: conceptIds },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    title: { type: "string" },
    objective: { type: "string" },
    keyPoints: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 },
    misconceptions: { type: "array", items: { type: "string" }, maxItems: 4 },
    sourceNote: { type: "string" },
  },
  required: ["concept", "confidence", "title", "objective", "keyPoints", "misconceptions"],
};

function validConcept(value: unknown): value is ConceptId { return typeof value === "string" && conceptIds.includes(value as ConceptId); }

export async function POST(request: Request) {
  let preferred: ConceptId = "dijkstra";
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let text = "";
    let pdf: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const item = form.get("file");
      const requested = form.get("preferredConcept");
      if (item instanceof File) pdf = item;
      if (validConcept(requested)) preferred = requested;
      if (!pdf || pdf.type !== "application/pdf") return NextResponse.json({ error: "Choose a valid PDF file." }, { status: 400 });
      if (pdf.size > 20 * 1024 * 1024) return NextResponse.json({ error: "PDFs must be 20 MB or smaller." }, { status: 413 });
      const bytes = Buffer.from(await pdf.arrayBuffer());
      const pageMarkers = bytes.toString("latin1").match(/\/Type\s*\/Page\b/g)?.length ?? 0;
      if (pageMarkers > 100) return NextResponse.json({ error: "PDFs are limited to 100 pages for this prototype." }, { status: 413 });
    } else {
      const body = await request.json();
      text = typeof body.text === "string" ? body.text.trim().slice(0, 30000) : "";
      preferred = validConcept(body.preferredConcept) ? body.preferredConcept : detectConcept(text);
      if (!text) return NextResponse.json({ error: "Paste some notes or choose a PDF first." }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) return NextResponse.json({ ...fallbackLesson(preferred), sourceNote: "Compiled locally; add GEMINI_API_KEY for source-aware personalization." });

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const instruction = `You are the LearnWorld lesson compiler. The student chose ${preferred}. Extract only source-grounded educational context for that concept. Do not invent algorithm results or execute a simulation. Return a concise objective, 2-5 key points, and likely misconceptions. Set concept to exactly ${preferred}.`;
    // The Interactions API accepts document blocks; some SDK releases still expose
    // the older Turn-only TypeScript union, so keep the compatibility cast local.
    let input: unknown;
    if (pdf) {
      let uploaded = await ai.files.upload({ file: pdf, config: { displayName: pdf.name, mimeType: "application/pdf" } });
      for (let attempt = 0; uploaded.state === "PROCESSING" && attempt < 12; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (uploaded.name) uploaded = await ai.files.get({ name: uploaded.name });
      }
      if (uploaded.state === "FAILED" || !uploaded.uri) throw new Error("The PDF could not be processed.");
      input = [{ type: "document", uri: uploaded.uri, mime_type: uploaded.mimeType ?? "application/pdf" }, { type: "text", text: instruction }];
    } else input = `${instruction}\n\nLECTURE MATERIAL:\n${text}`;

    const interaction = await ai.interactions.create({
      model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
      input: input as never,
      stream: false,
      response_format: { type: "text", mime_type: "application/json", schema: lessonJsonSchema },
    });
    const outputText = interaction.output_text || "{}";
    const parsed = compiledLessonSchema.safeParse(JSON.parse(outputText));
    if (!parsed.success || parsed.data.concept !== preferred) return NextResponse.json({ ...fallbackLesson(preferred), sourceNote: "The generated lesson was invalid, so a curated lesson was loaded." });
    return NextResponse.json(parsed.data);
  } catch (error) {
    // A lesson must remain launchable if Gemini is unavailable, rate-limited, or
    // returns an unexpected payload. Keep the diagnostic server-side only.
    const detail = error instanceof Error ? `${error.name}: ${error.message}` : "Unknown Gemini error";
    console.warn("[LearnWorld compile] Falling back to curated lesson:", detail);
    return NextResponse.json({
      ...fallbackLesson(preferred),
      sourceNote: "Gemini was unavailable, so LearnWorld loaded a curated lesson for your selected concept.",
    });
  }
}
