"use client";

import { ArrowLeft, CheckCircle2, Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { arrayScenarios, conceptMeta, graphScenario } from "@/lib/catalog";
import { engines, type ArraySnapshot, type GraphSnapshot } from "@/lib/engines";
import type { ArrayScenario, CompiledLesson, ConceptId, GraphScenario, SimulationEvent, SimulationRun } from "@/lib/types";
import { ArrayLab } from "./ArrayLab";
import { GraphLab } from "./GraphLab";
import { TutorPanel } from "./TutorPanel";

const pseudocode: Record<ConceptId, string[]> = {
  dijkstra: ["distance[source] ← 0", "while reachable nodes remain", "  settle smallest tentative distance", "  for each unvisited neighbor", "    relax edge if path is shorter", "return distances"],
  bfs: ["queue ← [source]", "while queue is not empty", "  visit front of queue", "  for each undiscovered neighbor", "    discover and enqueue neighbor", "return traversal"],
  dfs: ["stack ← [source]", "while stack is not empty", "  visit top of stack", "  for each undiscovered neighbor", "    discover and push neighbor", "return traversal"],
  binary_search: ["low ← 0; high ← n - 1", "while low ≤ high", "  mid ← floor((low + high) / 2)", "  compare values[mid] with target", "  discard impossible half", "return found or not found"],
  insertion_sort: ["sorted prefix starts at index 0", "for i from 1 to n - 1", "  key ← values[i]", "  compare key with prefix", "  shift larger values right", "  place key in the gap", "return values"],
};

type Run = SimulationRun<GraphSnapshot> | SimulationRun<ArraySnapshot>;

export function SimulationShell({ lesson, onExit }: { lesson: CompiledLesson; onExit: () => void }) {
  const concept = lesson.concept;
  const meta = conceptMeta[concept];
  const isGraph = meta.template === "graph";
  const [graph, setGraph] = useState<GraphScenario>(graphScenario);
  const [array, setArray] = useState<ArrayScenario>(isGraph ? arrayScenarios.binary_search : arrayScenarios[concept as "binary_search" | "insertion_sort"]);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const run = useMemo<Run>(() => {
    if (concept === "dijkstra") return engines.dijkstra.initialize(graph);
    if (concept === "bfs") return engines.bfs.initialize(graph);
    if (concept === "dfs") return engines.dfs.initialize(graph);
    if (concept === "binary_search") return engines.binary_search.initialize(array);
    return engines.insertion_sort.initialize(array);
  }, [concept, graph, array]);
  const max = run.events.length;
  const snapshot = run.states[Math.min(step, run.states.length - 1)];
  const event: SimulationEvent | undefined = step ? run.events[step - 1] : undefined;
  const nextEvent: SimulationEvent | undefined = run.events[step];
  const complete = step >= max;

  useEffect(() => { setStep(0); setPlaying(false); }, [run]);
  useEffect(() => {
    if (!playing) return;
    if (complete) { setPlaying(false); return; }
    const timer = window.setTimeout(() => setStep((value) => Math.min(value + 1, max)), 850);
    return () => window.clearTimeout(timer);
  }, [playing, step, complete, max]);

  const graphSnapshot = isGraph ? snapshot as GraphSnapshot : null;
  const arraySnapshot = !isGraph ? snapshot as ArraySnapshot : null;
  const updateGraphSource = (source: string) => setGraph((value) => ({ ...value, source }));
  const updateTarget = (target: number) => setArray((value) => ({ ...value, target }));

  return (
    <main className="min-h-screen bg-cream pb-12">
      <header className="border-b border-ink/10 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4 lg:px-8">
          <button onClick={onExit} className="flex items-center gap-2 text-sm font-extrabold"><ArrowLeft size={18} /> Back to concepts</button>
          <div className="hidden items-center gap-2 text-sm font-bold sm:flex"><span className="h-2 w-2 rounded-full bg-forest" /> Deterministic engine active</div>
          <span className="display text-xl font-bold">LearnWorld<span className="text-orange">.</span></span>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 py-7 lg:px-8">
        <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div><div className="mb-2 flex items-center gap-2"><span className="pill px-3 py-1 text-xs font-black uppercase">{meta.template} lab</span><span className="text-xs font-bold text-ink/45">Step {Math.min(step, max)} of {max}</span></div><h1 className="display text-4xl font-bold md:text-5xl">{lesson.title}</h1><p className="mt-2 max-w-3xl text-ink/60">{lesson.objective}</p></div>
          {isGraph && <div className="flex flex-wrap items-center gap-3"><label className="flex items-center gap-2 text-sm font-bold">Start node<select className="rounded-xl border border-ink/20 bg-white px-3 py-2" value={graph.source} onChange={(e) => updateGraphSource(e.target.value)}>{graph.nodes.map((node) => <option key={node.id}>{node.id}</option>)}</select></label>{concept === "dijkstra" && <label className="flex items-center gap-2 text-sm font-bold">Edge<select aria-label="Edge to edit" className="rounded-xl border border-ink/20 bg-white px-3 py-2" value={graph.edges[0]?.id} onChange={(e) => { const edge = graph.edges.find((item) => item.id === e.target.value); if (edge) setGraph((value) => ({ ...value, edges: [edge, ...value.edges.filter((item) => item.id !== edge.id)] })); }}>{graph.edges.map((edge) => <option key={edge.id} value={edge.id}>{edge.source}–{edge.target}</option>)}</select><input aria-label="Edge weight" className="w-20 rounded-xl border border-ink/20 bg-white px-3 py-2" type="number" min="0" max="99" value={graph.edges[0]?.weight ?? 0} onChange={(e) => { const weight = Math.max(0, Math.min(99, Number(e.target.value))); setGraph((value) => ({ ...value, edges: value.edges.map((edge, index) => index === 0 ? { ...edge, weight } : edge) })); }} /></label>}</div>}
          {concept === "binary_search" && <label className="flex items-center gap-2 text-sm font-bold">Target<input className="w-24 rounded-xl border border-ink/20 bg-white px-3 py-2" type="number" value={array.target ?? 0} onChange={(e) => updateTarget(Number(e.target.value))} /></label>}
        </section>

        <div className="mb-6 h-2 overflow-hidden rounded-full bg-ink/10"><div className="h-full rounded-full bg-forest transition-all" style={{ width: `${max ? (step / max) * 100 : 0}%` }} /></div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="panel p-4 md:p-5">
            {graphSnapshot ? <GraphLab scenario={graph} snapshot={graphSnapshot} weighted={concept === "dijkstra"} /> : arraySnapshot ? <ArrayLab snapshot={arraySnapshot} concept={concept as "binary_search" | "insertion_sort"} /> : null}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2"><button className="btn border border-ink/15 bg-white" onClick={() => { setPlaying(false); setStep(0); }}><RotateCcw size={17} /> Reset</button><button className="btn btn-primary" onClick={() => setPlaying((value) => !value)} disabled={complete}>{playing ? <Pause size={17} /> : <Play size={17} />}{playing ? "Pause" : "Autoplay"}</button><button className="btn btn-lime" onClick={() => { setPlaying(false); setStep((value) => Math.min(value + 1, max)); }} disabled={complete}><SkipForward size={17} /> Next step</button></div>
              <div aria-live="polite" className={`flex min-h-12 flex-1 items-center rounded-2xl px-4 py-2 text-sm font-bold md:max-w-xl ${complete ? "bg-lime" : "bg-cream"}`}>{complete && <CheckCircle2 className="mr-2 shrink-0" size={18} />}{event?.message ?? "Ready. Predict the first operation, then take a step."}</div>
            </div>
          </section>
          <TutorPanel lesson={lesson} snapshot={snapshot} event={event} nextEvent={nextEvent} />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <section className="panel p-5"><h2 className="display mb-4 text-xl font-bold">Pseudocode</h2><ol className="space-y-1 font-mono text-xs">{pseudocode[concept].map((line, index) => <li key={line} className={`rounded-lg px-3 py-2 ${event?.codeLine === index ? "bg-lime font-black" : "text-ink/60"}`}><span className="mr-3 text-ink/30">{index + 1}</span>{line}</li>)}</ol></section>
          <section className="panel p-5"><h2 className="display mb-4 text-xl font-bold">Live variables</h2>{graphSnapshot ? <dl className="space-y-3 text-sm"><Data label="Current" value={graphSnapshot.current ?? "—"} /><Data label="Frontier" value={graphSnapshot.frontier.join(", ") || "empty"} /><Data label="Visited" value={graphSnapshot.visited.join(" → ") || "none"} />{concept === "dijkstra" && <Data label="Distances" value={Object.entries(graphSnapshot.distances).map(([k, v]) => `${k}:${v ?? "∞"}`).join("  ")} />}</dl> : arraySnapshot && <dl className="space-y-3 text-sm"><Data label="Range" value={arraySnapshot.low === null ? "—" : `${arraySnapshot.low}–${arraySnapshot.high}`} /><Data label="Midpoint" value={arraySnapshot.mid ?? "—"} /><Data label="Comparing" value={arraySnapshot.comparing.join(", ") || "none"} /><Data label="Result" value={arraySnapshot.complete ? arraySnapshot.found === null && concept === "binary_search" ? "Not found" : "Complete" : "In progress"} /></dl>}</section>
          <section className="panel p-5"><h2 className="display mb-4 text-xl font-bold">Event trail</h2><div className="space-y-2">{run.events.slice(Math.max(0, step - 4), step).reverse().map((item, i) => <div key={`${step}-${i}`} className="rounded-xl border border-ink/10 bg-white p-3 text-xs"><span className="mr-2 font-black uppercase text-forest">{item.kind}</span>{item.message}</div>)}{step === 0 && <p className="text-sm text-ink/50">Your algorithm trace will appear here.</p>}</div></section>
        </div>
      </div>
    </main>
  );
}

function Data({ label, value }: { label: string; value: string | number }) { return <div className="flex items-start justify-between gap-4 border-b border-ink/10 pb-2"><dt className="font-bold text-ink/50">{label}</dt><dd className="text-right font-extrabold">{value}</dd></div>; }
