"use client";

import { Lightbulb, MessageCircleQuestion, Sparkles } from "lucide-react";
import { useState } from "react";
import type { CompiledLesson, SimulationEvent, TutorResponse } from "@/lib/types";

export function TutorPanel({ lesson, snapshot, event, nextEvent }: { lesson: CompiledLesson; snapshot: unknown; event?: SimulationEvent; nextEvent?: SimulationEvent }) {
  const [response, setResponse] = useState<TutorResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function ask(mode: "explain" | "challenge" | "hint" | "summarize") {
    setLoading(true); setFeedback("");
    try {
      const result = await fetch("/api/tutor", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ schemaVersion: 1, lesson, snapshot, event, nextEvent, mode, mastery: 0, misconceptions: [] }) });
      const data=await result.json();if(!result.ok)throw new Error(data.error);setResponse(data);
    } catch {
      setResponse({ explanation: event?.message ?? lesson.keyPoints[0], question: mode === "challenge" ? "What state change do you predict next?" : "", options: [], expectedAnswer: "Use the visible frontier and active values.", hint: "Read the highlighted algorithm state.", misconception: null, difficulty: "same" });
    } finally { setLoading(false); }
  }

  return (
    <aside className="panel flex h-full flex-col p-5">
      <div className="mb-4 flex items-center gap-3"><span className="rounded-xl bg-lime p-2"><Sparkles size={18} /></span><div><h3 className="display text-lg font-bold">World guide</h3><p className="text-xs font-semibold text-ink/50">Grounded in this exact step</p></div></div>
      <div className="min-h-[145px] flex-1 rounded-2xl bg-cream p-4 text-sm leading-relaxed">
        {loading ? <p className="animate-pulse font-bold">Thinking through the current state…</p> : response ? <><p>{response.explanation}</p>{response.question && <div className="mt-4 border-l-2 border-orange pl-3"><p className="font-extrabold">{response.question}</p>{response.options.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{response.options.map((option) => <button key={option} onClick={() => setFeedback(option === response.expectedAnswer ? "Correct — that matches the deterministic next event." : `Not quite. Hint: ${response.hint}`)} className="rounded-full border border-ink/15 bg-white px-3 py-1 text-xs font-bold">{option}</button>)}</div>}{response.hint && response.options.length === 0 && <p className="mt-2 text-xs text-ink/55">Hint: {response.hint}</p>}{feedback && <p aria-live="polite" className={`mt-3 text-xs font-extrabold ${feedback.startsWith("Correct") ? "text-forest" : "text-orange"}`}>{feedback}</p>}</div>}</> : <p className="text-ink/65">Ask for a concise explanation, or challenge yourself to predict what the deterministic engine will do next.</p>}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <button className="btn border border-ink/15 bg-white text-sm" onClick={() => ask("explain")} disabled={loading}><Lightbulb size={16} /> Explain</button>
        <button className="btn btn-lime text-sm" onClick={() => ask("challenge")} disabled={loading}><MessageCircleQuestion size={16} /> Challenge me</button>
        <button className="btn border border-ink/15 bg-white text-sm" onClick={() => ask("hint")} disabled={loading}>Give a hint</button>
        <button className="btn border border-ink/15 bg-white text-sm" onClick={() => ask("summarize")} disabled={loading}>Summarize</button>
      </div>
    </aside>
  );
}
