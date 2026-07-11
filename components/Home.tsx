"use client";

import { ArrowRight, BookOpen, Braces, FileText, FlaskConical, Network, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { conceptMeta, fallbackLesson, previewTopics } from "@/lib/catalog";
import type { CompiledLesson, ConceptId } from "@/lib/types";
import { SimulationShell } from "./SimulationShell";

const sample = `Dijkstra's algorithm finds shortest paths from a source in a graph with nonnegative edge weights. Keep a tentative distance for every node. Repeatedly choose the unvisited node with the smallest tentative distance, mark it settled, and relax each outgoing edge.`;

export default function Home() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [selected, setSelected] = useState<ConceptId>("dijkstra");
  const [lesson, setLesson] = useState<CompiledLesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  if (lesson) return <SimulationShell lesson={lesson} onExit={() => setLesson(null)} />;

  async function compile() {
    setLoading(true); setError("");
    try {
      let response: Response;
      if (file) {
        const form = new FormData(); form.append("file", file); form.append("preferredConcept", selected);
        response = await fetch("/api/compile", { method: "POST", body: form });
      } else {
        response = await fetch("/api/compile", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: text || sample, preferredConcept: selected }) });
      }
      if (!response.ok) throw new Error((await response.json()).error ?? "Could not compile this lesson.");
      setLesson(await response.json());
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not compile this lesson."); }
    finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-cream noise">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8"><div className="display text-2xl font-bold">LearnWorld<span className="text-orange">.</span></div><div className="pill hidden px-4 py-2 text-xs font-extrabold sm:block">Static notes in. Living ideas out.</div><button onClick={() => document.getElementById("studio")?.scrollIntoView()} className="btn btn-primary py-2 text-sm">Open studio <ArrowRight size={16} /></button></nav>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-14 lg:grid-cols-[1.08fr_.92fr] lg:px-8 lg:pt-24">
        <div className="fade-up"><div className="mb-6 inline-flex items-center gap-2 rounded-full bg-lime px-4 py-2 text-xs font-black uppercase tracking-wider"><FlaskConical size={15} /> Interactive learning compiler</div><h1 className="display max-w-4xl text-6xl font-bold leading-[.96] sm:text-7xl lg:text-[88px]">Don’t read the concept. <span className="text-forest">Enter it.</span></h1><p className="mt-7 max-w-2xl text-lg leading-relaxed text-ink/62">Turn lecture notes into explorable algorithm worlds. Move step by step, inspect live state, and get guidance that understands exactly where you are.</p><div className="mt-8 flex flex-wrap gap-3"><button onClick={() => document.getElementById("studio")?.scrollIntoView()} className="btn btn-lime px-6">Build a learning world <ArrowRight size={18} /></button><button onClick={() => { setText(sample); document.getElementById("studio")?.scrollIntoView(); }} className="btn border border-ink/20 bg-white">Try sample notes</button></div>
        <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm font-bold text-ink/55"><span>✓ 5 working algorithms</span><span>✓ Deterministic results</span><span>✓ AI-guided</span></div></div>
        <div className="relative hidden min-h-[520px] lg:block"><div className="absolute inset-10 rotate-3 rounded-[42px] border-2 border-ink bg-orange" /><div className="panel absolute inset-0 -rotate-2 overflow-hidden border-2 border-ink bg-white p-7"><div className="flex items-center justify-between"><span className="pill px-3 py-1 text-xs font-black">GRAPH LAB</span><span className="text-xs font-bold text-ink/40">STEP 04 / 11</span></div><div className="relative mt-7 h-[300px] rounded-3xl bg-[#eef0e7] paper-grid">{[[50,150,"A"],[160,65,"B"],[280,140,"C"],[180,235,"D"],[350,245,"E"]].map(([x,y,label],i)=><div key={String(label)} className={`absolute flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink text-lg font-black ${i < 2 ? "bg-forest text-white" : i === 2 ? "bg-orange" : "bg-white"}`} style={{left:Number(x),top:Number(y)}}>{label}</div>)}<svg className="absolute inset-0 h-full w-full" style={{zIndex:-1}} /></div><div className="mt-5 rounded-2xl bg-cream p-4"><p className="text-xs font-black uppercase text-forest">What just happened?</p><p className="mt-1 text-sm font-semibold">Node B is settled. Its distance of 4 is now final.</p></div></div></div>
      </section>

      <section id="studio" className="bg-ink px-5 py-20 text-white lg:px-8"><div className="mx-auto max-w-7xl"><div className="mb-10 max-w-3xl"><span className="text-xs font-black uppercase tracking-[.22em] text-lime">The studio</span><h2 className="display mt-3 text-4xl font-bold sm:text-6xl">What are you learning today?</h2><p className="mt-4 text-white/60">Add your material, choose a concept, and launch a working simulation.</p></div>
        <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
          <div className="rounded-[28px] bg-white p-5 text-ink sm:p-7"><div className="mb-4 flex items-center gap-3"><span className="rounded-xl bg-lime p-2"><BookOpen size={20}/></span><h3 className="display text-xl font-bold">1. Add your material</h3></div><textarea value={text} onChange={(e)=>{setText(e.target.value);setFile(null)}} placeholder="Paste lecture notes here…" className="min-h-44 w-full resize-y rounded-2xl border border-ink/15 bg-cream p-4 text-sm leading-relaxed placeholder:text-ink/35" maxLength={30000}/><div className="my-4 flex items-center gap-3 text-xs font-black uppercase text-ink/35"><span className="h-px flex-1 bg-ink/10"/>or<span className="h-px flex-1 bg-ink/10"/></div><input ref={fileInput} type="file" className="hidden" accept="application/pdf" onChange={(e)=>{const picked=e.target.files?.[0]??null;if(picked && picked.size>20*1024*1024){setError("PDFs must be 20 MB or smaller.");return;}setFile(picked);setText("")}}/><button onClick={()=>fileInput.current?.click()} className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-ink/20 p-5 font-extrabold hover:bg-cream"><UploadCloud/> {file ? file.name : "Choose a PDF (max 20 MB)"}</button></div>
          <div className="rounded-[28px] bg-[#27372f] p-5 sm:p-7"><div className="mb-4 flex items-center gap-3"><span className="rounded-xl bg-orange p-2 text-ink"><Braces size={20}/></span><h3 className="display text-xl font-bold">2. Choose a concept</h3></div><div className="grid gap-3 sm:grid-cols-2">{(Object.keys(conceptMeta) as ConceptId[]).map((id)=><button key={id} onClick={()=>setSelected(id)} className={`rounded-2xl border p-4 text-left transition ${selected===id ? "border-lime bg-lime text-ink" : "border-white/15 bg-white/5 hover:bg-white/10"}`}><div className="mb-3 flex items-center justify-between"><span className="text-xs font-black uppercase">{conceptMeta[id].template} lab</span>{conceptMeta[id].template==="graph"?<Network size={18}/>:<FileText size={18}/>}</div><p className="font-extrabold">{conceptMeta[id].label}</p><p className={`mt-1 text-xs ${selected===id?"text-ink/60":"text-white/50"}`}>{conceptMeta[id].description}</p></button>)}</div>{error&&<p role="alert" className="mt-4 rounded-xl bg-orange p-3 text-sm font-bold text-ink">{error}</p>}<button onClick={compile} disabled={loading} className="btn btn-lime mt-5 w-full py-4 text-base">{loading ? "Compiling your world…" : "Launch interactive world"}<ArrowRight size={18}/></button><button onClick={()=>setLesson(fallbackLesson(selected))} className="mt-3 w-full text-center text-xs font-bold text-white/55 underline underline-offset-4">Skip upload and use a curated lesson</button></div>
        </div></div></section>

      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="mb-9 flex items-end justify-between"><div><span className="text-xs font-black uppercase tracking-[.2em] text-forest">Next worlds</span><h2 className="display mt-2 text-4xl font-bold">The map keeps growing.</h2></div><span className="pill hidden px-4 py-2 text-xs font-black sm:block">PREVIEW ONLY</span></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{previewTopics.map((topic,i)=><article key={topic} className="panel relative overflow-hidden p-6"><div className={`mb-10 flex h-11 w-11 items-center justify-center rounded-2xl ${i%2?"bg-orange":"bg-lime"}`}><FlaskConical size={20}/></div><span className="text-[10px] font-black uppercase tracking-widest text-ink/40">In exploration</span><h3 className="display mt-1 text-2xl font-bold">{topic}</h3><p className="mt-2 text-sm text-ink/55">A future interactive environment—not a broken demo button.</p></article>)}</div></section>
      <footer className="border-t border-ink/10 px-5 py-8"><div className="mx-auto flex max-w-7xl items-center justify-between"><span className="display text-xl font-bold">LearnWorld.</span><span className="text-xs font-bold text-ink/45">Built for active understanding.</span></div></footer>
    </main>
  );
}
