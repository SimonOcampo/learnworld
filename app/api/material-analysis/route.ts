import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { builtInSkills } from "@/lib/catalog/repository";

export const runtime = "nodejs";
export const maxDuration = 45;

const aiSchema = z.object({
  summary: z.string().min(1).max(260),
  skillIds: z.array(z.string()).max(8)
});

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function heuristicMatches(input: string, limit = 8) {
  const source = normalize(input);
  if (!source) return [] as string[];

  const scored = builtInSkills
    .map((skill) => {
      const phrases = [skill.title, ...skill.aliases, ...skill.keywords].map(normalize).filter(Boolean);
      const exact = phrases.reduce((acc, phrase) => acc + (source.includes(phrase) ? 3 : 0), 0);
      const words = new Set(phrases.flatMap((phrase) => phrase.split(" ")).filter((word) => word.length > 2));
      const overlap = [...words].reduce((acc, word) => acc + (source.includes(word) ? 1 : 0), 0);
      return { id: skill.id, score: exact + overlap };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.id);

  return scored;
}

export async function POST(request: Request) {
  try {
    const type = request.headers.get("content-type") ?? "";
    let title = "";
    let text = "";
    let pdf: File | null = null;

    if (type.includes("multipart/form-data")) {
      const form = await request.formData();
      title = String(form.get("title") ?? "").trim();
      const item = form.get("file");
      if (!(item instanceof File)) return NextResponse.json({ error: "Choose a PDF file." }, { status: 400 });
      pdf = item;
      if (pdf.type !== "application/pdf") return NextResponse.json({ error: "Choose a valid PDF file." }, { status: 400 });
      if (pdf.size > 20 * 1024 * 1024) return NextResponse.json({ error: "PDFs must be 20 MB or smaller." }, { status: 413 });
      const head = Buffer.from(await pdf.slice(0, 5).arrayBuffer()).toString("ascii");
      if (head !== "%PDF-") return NextResponse.json({ error: "The uploaded file is not a valid PDF." }, { status: 400 });
    } else {
      const body = await request.json();
      title = typeof body.title === "string" ? body.title.trim() : "";
      text = typeof body.text === "string" ? body.text.trim().slice(0, 30000) : "";
      if (!title && !text) return NextResponse.json({ error: "Add text or a title to analyze." }, { status: 400 });
    }

    const quickMatches = heuristicMatches([title, text, pdf?.name ?? ""].join(" "));
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        summary: quickMatches.length
          ? "Matched likely skills from lecture keywords. Review and adjust before starting the teaching arena."
          : "No strong automatic match yet. Select skills manually, then start teaching.",
        skillIds: quickMatches
      });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const choices = builtInSkills.map((skill) => ({ id: skill.id, title: skill.title, description: skill.description }));
    const instruction = `You are mapping lecture material to CS skills for an educational app. Return JSON only with this shape: {"summary": string, "skillIds": string[]}. Select 1-8 IDs from the provided catalog. Prefer high precision. Catalog: ${JSON.stringify(choices)}.`;

    const input = pdf
      ? await (async () => {
          const uploaded = await ai.files.upload({ file: pdf, config: { displayName: pdf.name, mimeType: "application/pdf" } });
          if (!uploaded.uri) throw new Error("PDF processing failed.");
          return [
            { type: "document", uri: uploaded.uri, mime_type: "application/pdf" },
            { type: "text", text: `${instruction}\nLecture title: ${title || pdf.name}` }
          ];
        })()
      : `${instruction}\nLecture title: ${title}\n<MATERIAL>${text}</MATERIAL>`;

    const result = await ai.interactions.create({
      model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
      input: input as never,
      stream: false,
      response_format: { type: "text", mime_type: "application/json" }
    });

    const parsed = aiSchema.parse(JSON.parse(result.output_text || "{}"));
    const validIds = parsed.skillIds.filter((id) => builtInSkills.some((skill) => skill.id === id));
    const merged = [...new Set([...validIds, ...quickMatches])].slice(0, 8);

    return NextResponse.json({ summary: parsed.summary, skillIds: merged });
  } catch {
    return NextResponse.json({
      summary: "Using local keyword matching because AI analysis is unavailable right now.",
      skillIds: []
    });
  }
}
