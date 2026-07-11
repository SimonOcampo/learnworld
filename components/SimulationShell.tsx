"use client";

import { ArrowLeft, CheckCircle2, Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, type SetStateAction } from "react";
import { conceptMeta } from "@/lib/catalog";
import { defaultInputs, validateRegistration, type RegisteredRun, type SimulationInputs } from "@/lib/simulations/registry";
import { cloneInputs, defaultRandomSettings, randomInputs, validateInputs, type RandomSettings } from "@/lib/simulations/scenario-utils";
import type {
  ArrayScenario,
  CompiledLesson,
  ConceptId,
  GraphScenario,
  SimulationEvent,
  MemoryScenario,
  SequenceScenario,
  CallStackScenario,
  LinkedScenario,
  LinearAdtScenario,
  ComplexityScenario,
  TreeScenario,
  TrieScenario,
  BitwiseScenario,
  RecurrenceScenario,
  BacktrackingScenario,
  BloomScenario,
  GreedyScenario,
  DPScenario
} from "@/lib/types";
import {
  type ArraySnapshot,
  type GraphSnapshot,
  type MemorySnapshot,
  type SequenceSnapshot,
  type CallStackSnapshot,
  type LinkedSnapshot,
  type LinearAdtSnapshot,
  type ComplexitySnapshot,
  type TreeSnapshot,
  type TrieSnapshot,
  type BitwiseSnapshot,
  type RecurrenceSnapshot,
  type BacktrackingSnapshot,
  type BloomSnapshot,
  type GreedySnapshot,
  type DPSnapshot
} from "@/lib/engines";
import { TutorPanel } from "./TutorPanel";
import { ScenarioEditor } from "./simulations/ScenarioEditor";

const ArrayLab = dynamic(() => import("./ArrayLab").then((module) => module.ArrayLab), { loading: () => <VisualizationLoading /> });
const GraphLab = dynamic(() => import("./GraphLab").then((module) => module.GraphLab), { ssr: false, loading: () => <VisualizationLoading /> });

const MemoryLab = dynamic(() => import("./simulations/MemoryLab").then((module) => module.MemoryLab), { loading: () => <VisualizationLoading /> });
const SequenceLab = dynamic(() => import("./simulations/SequenceLab").then((module) => module.SequenceLab), { loading: () => <VisualizationLoading /> });
const CallStackLab = dynamic(() => import("./simulations/CallStackLab").then((module) => module.CallStackLab), { loading: () => <VisualizationLoading /> });
const LinkedLab = dynamic(() => import("./simulations/LinkedLab").then((module) => module.LinkedLab), { loading: () => <VisualizationLoading /> });
const LinearAdtLab = dynamic(() => import("./simulations/LinearAdtLab").then((module) => module.LinearAdtLab), { loading: () => <VisualizationLoading /> });
const ComplexityLab = dynamic(() => import("./simulations/ComplexityLab").then((module) => module.ComplexityLab), { loading: () => <VisualizationLoading /> });
const TreeLab = dynamic(() => import("./simulations/TreeLab").then((module) => module.TreeLab), { loading: () => <VisualizationLoading /> });
const TrieLab = dynamic(() => import("./simulations/TrieLab").then((module) => module.TrieLab), { loading: () => <VisualizationLoading /> });
const BitwiseLab = dynamic(() => import("./simulations/BitwiseLab").then((module) => module.BitwiseLab), { loading: () => <VisualizationLoading /> });
const RecurrenceLab = dynamic(() => import("./simulations/RecurrenceLab").then((module) => module.RecurrenceLab), { loading: () => <VisualizationLoading /> });
const BacktrackingLab = dynamic(() => import("./simulations/BacktrackingLab").then((module) => module.BacktrackingLab), { loading: () => <VisualizationLoading /> });
const BloomLab = dynamic(() => import("./simulations/BloomLab").then((module) => module.BloomLab), { loading: () => <VisualizationLoading /> });
const GreedyLab = dynamic(() => import("./simulations/GreedyLab").then((module) => module.GreedyLab), { loading: () => <VisualizationLoading /> });
const DpLab = dynamic(() => import("./simulations/DpLab").then((module) => module.DpLab), { loading: () => <VisualizationLoading /> });

const pseudocode: Record<ConceptId, string[]> = {
  dijkstra: ["distance[source] ← 0", "while reachable nodes remain", "  settle smallest tentative distance", "  for each unvisited neighbor", "    relax edge if path is shorter", "return distances"],
  bfs: ["queue ← [source]", "while queue is not empty", "  visit front of queue", "  for each undiscovered neighbor", "    discover and enqueue neighbor", "return traversal"],
  dfs: ["stack ← [source]", "while stack is not empty", "  visit top of stack", "  for each undiscovered neighbor", "    discover and push neighbor", "return traversal"],
  binary_search: ["low ← 0; high ← n - 1", "while low ≤ high", "  mid ← floor((low + high) / 2)", "  compare values[mid] with target", "  discard impossible half", "return found or not found"],
  insertion_sort: ["sorted prefix starts at index 0", "for i from 1 to n - 1", "  key ← values[i]", "  compare key with prefix", "  shift larger values right", "  place key in the gap", "return values"],
  pointers: ["ptr ← &var", "*ptr ← value", "dereference ptr to read/write"],
  structures: ["define struct Type { fields }", "instantiate struct instance", "access fields using dot operator"],
  dynamic_memory_allocation: ["ptr ← allocate memory (heap)", "use allocated memory block", "free memory to prevent leaks"],
  strings: ["initialize char array ending in '\\0'", "traverse characters until '\\0'", "perform safe read or write"],
  arrays: ["allocate contiguous memory of size N", "access element at index i directly", "traverse or modify elements"],
  recursion: ["check base case", "if base case met, return value", "else make recursive call with arg - 1", "unwind stack and return values"],
  linked_lists: ["start at head node", "traverse node.next pointers", "link/unlink nodes for insertion/deletion"],
  skip_lists: ["start at top express level", "traverse right while key < target", "drop down to lower level if key >= target", "search lower level for match"],
  stacks: ["push item to top of stack", "pop item from top of stack (LIFO)"],
  queues: ["enqueue item at rear of queue", "dequeue item from front of queue (FIFO)"],
  algorithm_analysis: ["count primitive operations", "express growth in terms of input size N"],
  growth_of_functions: ["compare asymptotic growth rates", "order: O(1) < O(log n) < O(n) < O(n log n) < O(n^2)"],
  big_o: ["find constant c and n0 such that:", "f(n) ≤ c * g(n) for all n ≥ n0"],
  big_omega: ["find constant c and n0 such that:", "f(n) ≥ c * g(n) for all n ≥ n0"],
  big_theta: ["find constants c1, c2, n0 such that:", "c1 * g(n) ≤ f(n) ≤ c2 * g(n) for all n ≥ n0"],
  binary_trees: ["traverse left subtree recursively", "visit root node", "traverse right subtree recursively"],
  binary_search_trees: ["if key < root, search left subtree", "if key > root, search right subtree", "else return root"],
  heaps: ["extract root element (min/max)", "swap with last element and bubble down", "bubble up new elements to restore heap order"],
  avl_trees: ["insert element as standard BST", "calculate balance factor at each ancestor", "perform single/double rotation if unbalanced"],
  b_trees: ["search keys in current node", "if found return; else follow child pointer", "split full nodes during insertion"],
  red_black_trees: ["insert node as red", "recolor or rotate to fix red-red violation", "ensure root and null leaves are black"],
  treaps: ["insert node with random priority", "rotate node up to restore heap priority order", "maintain BST key order invariant"],
  tries: ["start at trie root node", "for each char in search word/prefix", "  follow child matching char", "  if child doesn't exist, not found", "return node.isEndOfWord / match"],
  bitwise_operators: ["align operands in binary form", "apply bitwise logic at each column", "shift bits left or right for SHL/SHR"],
  master_theorem: ["identify constants a, b and f(n)", "compare f(n) growth with n^(log_b a)", "determine Case 1, 2, or 3 complexity"],
  divide_and_conquer: ["divide problem into subproblems", "solve subproblems recursively", "combine subproblem solutions"],
  backtracking: ["try candidate option at current step", "if candidate leads to solution, return success", "else undo choice (backtrack) and try next"],
  bloom_filters: ["initialize bitset of size m to 0", "apply k independent hash functions to key", "for insert: set all hashed bits to 1", "for query: check if all hashed bits are 1"],
  greedy_algorithms: ["sort candidates by greedy criteria (e.g. ratio)", "loop through sorted candidates", "take candidate if capacity allows"],
  dynamic_programming: ["define recurrence based on subproblems", "initialize base cases in grid", "fill remaining grid cells in dependency order", "read final answer from grid corner"]
};

export function SimulationShell({ lesson, onExit, embedded = false, onComplete }: { lesson: CompiledLesson; onExit: () => void; embedded?: boolean; onComplete?: () => void }) {
  const concept = lesson.concept;
  const meta = conceptMeta[concept];
  const isGraph = meta.template === "graph";
  const treeOperations = concept === "heaps"
    ? ["insert", "extract-min"] as const
    : concept === "b_trees"
      ? ["insert", "delete", "search"] as const
      : ["traverse", "search", "insert", "delete"] as const;
  const defaults = useMemo(() => defaultInputs(concept), [concept]);

  const [draftInputs, setDraftInputs] = useState<SimulationInputs>(() => cloneInputs(defaults));
  const [appliedInputs, setAppliedInputs] = useState<SimulationInputs>(() => cloneInputs(defaults));
  const [randomSettings, setRandomSettings] = useState<RandomSettings>(defaultRandomSettings);
  const { graph, array, memory, sequence, callStack, linked, linearAdt, complexity, tree, trie, bitwise, recurrence, backtracking, bloom, greedy, dp } = draftInputs;
  const updateInput = <K extends keyof SimulationInputs>(key: K, update: SetStateAction<SimulationInputs[K]>) => setDraftInputs(current => ({ ...current, [key]: typeof update === "function" ? (update as (value: SimulationInputs[K]) => SimulationInputs[K])(current[key]) : update }));
  const setGraph = (update: SetStateAction<GraphScenario>) => updateInput("graph", update);
  const setArray = (update: SetStateAction<ArrayScenario>) => updateInput("array", update);
  const setMemory = (update: SetStateAction<MemoryScenario>) => updateInput("memory", update);
  const setSequence = (update: SetStateAction<SequenceScenario>) => updateInput("sequence", update);
  const setCallStack = (update: SetStateAction<CallStackScenario>) => updateInput("callStack", update);
  const setLinked = (update: SetStateAction<LinkedScenario>) => updateInput("linked", update);
  const setLinearAdt = (update: SetStateAction<LinearAdtScenario>) => updateInput("linearAdt", update);
  const setComplexity = (update: SetStateAction<ComplexityScenario>) => updateInput("complexity", update);
  const setTree = (update: SetStateAction<TreeScenario>) => updateInput("tree", update);
  const setTrie = (update: SetStateAction<TrieScenario>) => updateInput("trie", update);
  const setBitwise = (update: SetStateAction<BitwiseScenario>) => updateInput("bitwise", update);
  const setRecurrence = (update: SetStateAction<RecurrenceScenario>) => updateInput("recurrence", update);
  const setBacktracking = (update: SetStateAction<BacktrackingScenario>) => updateInput("backtracking", update);
  const setBloom = (update: SetStateAction<BloomScenario>) => updateInput("bloom", update);
  const setGreedy = (update: SetStateAction<GreedyScenario>) => updateInput("greedy", update);
  const setDp = (update: SetStateAction<DPScenario>) => updateInput("dp", update);

  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const completionSent = useRef(false);

  useEffect(() => {
    const next = cloneInputs(defaults);
    setDraftInputs(next);
    setAppliedInputs(cloneInputs(next));
  }, [defaults]);

  const validation = useMemo(() => validateInputs(concept, draftInputs), [concept, draftInputs]);
  const hasValidationErrors = Object.keys(validation).length > 0;
  const applyDraft = () => {
    if (hasValidationErrors) return;
    setAppliedInputs(cloneInputs(draftInputs));
    setStep(0);
    setPlaying(false);
  };

  const run = useMemo<RegisteredRun>(() => {
    return validateRegistration(concept).initialize({
      ...appliedInputs
    });
  }, [
    concept,
    appliedInputs
  ]);

  const max = run.events.length;
  const snapshot = run.states[Math.min(step, run.states.length - 1)];
  const event: SimulationEvent | undefined = step ? run.events[step - 1] : undefined;
  const nextEvent: SimulationEvent | undefined = run.events[step];
  const complete = step >= max;

  useEffect(() => { setStep(0); setPlaying(false); completionSent.current = false; }, [run]);
  useEffect(() => { if (complete && !completionSent.current) { completionSent.current = true; onComplete?.(); } }, [complete, onComplete]);
  useEffect(() => {
    if (!playing) return;
    if (complete) { setPlaying(false); return; }
    const timer = window.setTimeout(() => setStep((value) => Math.min(value + 1, max)), 850);
    return () => window.clearTimeout(timer);
  }, [playing, step, complete, max]);

  const graphSnapshot = isGraph ? snapshot as GraphSnapshot : null;
  const arraySnapshot = meta.template === "array" ? snapshot as ArraySnapshot : null;

  const updateGraphSource = (source: string) => setGraph((value) => ({ ...value, source }));
  const updateTarget = (target: number) => setArray((value) => ({ ...value, target }));

  const renderLiveVariables = () => {
    if (isGraph && graphSnapshot) {
      return (
        <dl className="space-y-3 text-sm">
          <Data label="Current" value={graphSnapshot.current ?? "—"} />
          <Data label="Frontier" value={graphSnapshot.frontier.join(", ") || "empty"} />
          <Data label="Visited" value={graphSnapshot.visited.join(" → ") || "none"} />
          {concept === "dijkstra" && <Data label="Distances" value={Object.entries(graphSnapshot.distances).map(([k, v]) => `${k}:${v ?? "∞"}`).join("  ")} />}
        </dl>
      );
    }
    if (meta.template === "array" && arraySnapshot) {
      return (
        <dl className="space-y-3 text-sm">
          <Data label="Range" value={arraySnapshot.low === null ? "—" : `${arraySnapshot.low}–${arraySnapshot.high}`} />
          <Data label="Midpoint" value={arraySnapshot.mid ?? "—"} />
          <Data label="Comparing" value={arraySnapshot.comparing.join(", ") || "none"} />
          <Data label="Result" value={arraySnapshot.complete ? arraySnapshot.found === null && concept === "binary_search" ? "Not found" : "Complete" : "In progress"} />
        </dl>
      );
    }
    if (meta.template === "memory") {
      const s = snapshot as MemorySnapshot;
      return (
        <dl className="space-y-3 text-sm">
          <Data label="Variables Count" value={s?.variables?.length ?? 0} />
          <Data label="Heap Count" value={s?.heapAllocations?.length ?? 0} />
          <Data label="Statement Idx" value={s?.currentStatementIndex ?? "—"} />
        </dl>
      );
    }
    if (meta.template === "sequence") {
      const s = snapshot as SequenceSnapshot;
      return (
        <dl className="space-y-3 text-sm">
          <Data label="Elements Count" value={s?.elements?.length ?? 0} />
          <Data label="Active Index" value={s?.activeIndex ?? "—"} />
          <Data label="Target Index" value={s?.targetIndex ?? "—"} />
        </dl>
      );
    }
    if (meta.template === "call-stack") {
      const s = snapshot as CallStackSnapshot;
      return (
        <dl className="space-y-3 text-sm">
          <Data label="Stack Depth" value={s?.stack?.length ?? 0} />
          <Data label="Return Value" value={s?.returnValue ?? "—"} />
        </dl>
      );
    }
    if (meta.template === "linked") {
      const s = snapshot as LinkedSnapshot;
      return (
        <dl className="space-y-3 text-sm">
          <Data label="Head ID" value={s?.head ?? "—"} />
          <Data label="Current Node" value={s?.currentNodeId ?? "—"} />
          <Data label="Prev Node" value={s?.prevNodeId ?? "—"} />
        </dl>
      );
    }
    if (meta.template === "linear-adt") {
      const s = snapshot as LinearAdtSnapshot;
      return (
        <dl className="space-y-3 text-sm">
          <Data label="Items Count" value={s?.items?.length ?? 0} />
          <Data label="Active Item" value={s?.activeItem ?? "—"} />
        </dl>
      );
    }
    if (meta.template === "complexity") {
      const s = snapshot as ComplexitySnapshot;
      return (
        <dl className="space-y-3 text-sm">
          <Data label="f(n)" value={s?.f_n ?? "—"} />
          <Data label="g(n)" value={s?.g_n ?? "—"} />
          <Data label="Current n" value={s?.currentN ?? "—"} />
          <Data label="f(n) value" value={s?.f_val ?? "—"} />
          {s?.g_val !== null && <Data label="g(n) value" value={s?.g_val ?? "—"} />}
        </dl>
      );
    }
    if (meta.template === "tree") {
      const s = snapshot as TreeSnapshot;
      return (
        <dl className="space-y-3 text-sm">
          <Data label="Root ID" value={s?.rootId ?? "—"} />
          <Data label="Current Node" value={s?.currentNodeId ?? "—"} />
          <Data label="Path Nodes" value={s?.traversalOrder?.length ?? 0} />
        </dl>
      );
    }
    if (meta.template === "trie") {
      const s = snapshot as TrieSnapshot;
      return (
        <dl className="space-y-3 text-sm">
          <Data label="Root ID" value={s?.rootId ?? "—"} />
          <Data label="Current Node" value={s?.currentNodeId ?? "—"} />
          <Data label="Current Word" value={s?.currentWord ?? "—"} />
        </dl>
      );
    }
    if (meta.template === "bitwise") {
      const s = snapshot as BitwiseSnapshot;
      return (
        <dl className="space-y-3 text-sm">
          <Data label="Operand A" value={s?.operandA ?? "—"} />
          {s?.operandB !== null && <Data label="Operand B" value={s?.operandB ?? "—"} />}
          <Data label="Result" value={s?.result ?? "—"} />
          <Data label="Bit Index" value={s?.currentBitIndex ?? "—"} />
        </dl>
      );
    }
    if (meta.template === "recurrence") {
      const s = snapshot as RecurrenceSnapshot;
      return (
        <dl className="space-y-3 text-sm">
          <Data label="Critical Exp" value={s?.log_b_a?.toFixed(2) ?? "—"} />
          {s?.applicableCase && <Data label="Case" value={s?.applicableCase} />}
          {s?.currentSubproblemSize !== undefined && <Data label="Subproblem Size" value={s?.currentSubproblemSize.toFixed(1)} />}
          {s?.subproblemCount !== undefined && <Data label="Subproblem Count" value={s?.subproblemCount} />}
        </dl>
      );
    }
    if (meta.template === "decision-tree") {
      const s = snapshot as BacktrackingSnapshot;
      return (
        <dl className="space-y-3 text-sm">
          <Data label="Problem" value={s?.problem ?? "—"} />
          <Data label="Success" value={s?.success ? "True" : "False"} />
        </dl>
      );
    }
    if (meta.template === "probabilistic") {
      const s = snapshot as BloomSnapshot;
      return (
        <dl className="space-y-3 text-sm">
          <Data label="Bitset Size" value={s?.size ?? "—"} />
          <Data label="Hashes Count" value={s?.hashes ?? "—"} />
          {s?.lastInserted && <Data label="Last Inserted" value={s?.lastInserted} />}
          {s?.lastQueried && <Data label="Last Queried" value={s?.lastQueried} />}
        </dl>
      );
    }
    if (meta.template === "greedy") {
      const s = snapshot as GreedySnapshot;
      return (
        <dl className="space-y-3 text-sm">
          <Data label="Capacity" value={s?.capacity ?? "—"} />
          <Data label="Current Value" value={s?.currentValue ?? "—"} />
          <Data label="Current Weight" value={s?.currentWeight ?? "—"} />
        </dl>
      );
    }
    if (meta.template === "dp-grid") {
      const s = snapshot as DPSnapshot;
      return (
        <dl className="space-y-3 text-sm">
          <Data label="Current Row" value={s?.currentRow ?? "—"} />
          <Data label="Current Col" value={s?.currentCol ?? "—"} />
        </dl>
      );
    }
    return <p className="text-sm text-ink/50">No live variables for this template.</p>;
  };

  return (
    <main className={embedded ? "rounded-[28px] border-2 border-ink bg-cream pb-6 overflow-hidden" : "min-h-screen bg-cream pb-12"}>
      {!embedded && <header className="border-b border-ink/10 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4 lg:px-8">
          <button onClick={onExit} className="flex items-center gap-2 text-sm font-extrabold"><ArrowLeft size={18} /> Back to concepts</button>
          <div className="hidden items-center gap-2 text-sm font-bold sm:flex"><span className="h-2 w-2 rounded-full bg-forest" /> Deterministic engine active</div>
          <span className="display text-xl font-bold">LearnWorld<span className="text-orange">.</span></span>
        </div>
      </header>}

      <div className="mx-auto max-w-[1500px] px-5 py-7 lg:px-8">
        <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div><div className="mb-2 flex items-center gap-2"><span className="pill px-3 py-1 text-xs font-black uppercase">{meta.template} lab</span><span className="text-xs font-bold text-ink/45">Step {Math.min(step, max)} of {max}</span></div><h1 className="display text-4xl font-bold md:text-5xl">{lesson.title}</h1><p className="mt-2 max-w-3xl text-ink/60">{lesson.objective}</p></div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn btn-primary" onClick={applyDraft} disabled={hasValidationErrors}><Play size={17} /> Run simulation</button>
            <button className="btn border border-ink/15 bg-white" onClick={() => setDraftInputs(randomInputs(concept, draftInputs, randomSettings))}>Randomize</button>
            <button className="btn border border-ink/15 bg-white" onClick={() => setDraftInputs(cloneInputs(defaults))}>Restore defaults</button>
          </div>
          {false && <div className="flex flex-wrap items-center gap-3">
            {isGraph && (
              <>
                <label className="flex items-center gap-2 text-sm font-bold">
                  Start node
                  <select className="rounded-xl border border-ink/20 bg-white px-3 py-2" value={graph.source} onChange={(e) => updateGraphSource(e.target.value)}>
                    {graph.nodes.map((node) => <option key={node.id}>{node.id}</option>)}
                  </select>
                </label>
                {concept === "dijkstra" && (
                  <label className="flex items-center gap-2 text-sm font-bold">
                    Edge
                    <select aria-label="Edge to edit" className="rounded-xl border border-ink/20 bg-white px-3 py-2" value={graph.edges[0]?.id} onChange={(e) => { const edge = graph.edges.find((item) => item.id === e.target.value); if (edge) setGraph((value) => ({ ...value, edges: [edge, ...value.edges.filter((item) => item.id !== edge.id)] })); }}>
                      {graph.edges.map((edge) => <option key={edge.id} value={edge.id}>{edge.source}–{edge.target}</option>)}
                    </select>
                    <input aria-label="Edge weight" className="w-20 rounded-xl border border-ink/20 bg-white px-3 py-2" type="number" min="0" max="99" value={graph.edges[0]?.weight ?? 0} onChange={(e) => { const weight = Math.max(0, Math.min(99, Number(e.target.value))); setGraph((value) => ({ ...value, edges: value.edges.map((edge, index) => index === 0 ? { ...edge, weight } : edge) })); }} />
                  </label>
                )}
              </>
            )}

            {concept === "binary_search" && (
              <label className="flex items-center gap-2 text-sm font-bold">
                Target
                <input className="w-24 rounded-xl border border-ink/20 bg-white px-3 py-2" type="number" value={array.target ?? 0} onChange={(e) => updateTarget(Number(e.target.value))} />
              </label>
            )}

            {meta.template === "memory" && (
              <label className="flex items-center gap-2 text-sm font-bold">
                Statements (comma-sep)
                <input
                  className="w-48 rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs"
                  value={memory.statements?.join(", ") ?? ""}
                  onChange={(e) => {
                    const stmts = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                    setMemory(val => ({ ...val, statements: stmts }));
                  }}
                />
              </label>
            )}

            {meta.template === "sequence" && (
              <>
                <label className="flex items-center gap-2 text-sm font-bold">
                  Elements
                  <input
                    className="w-32 rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs"
                    value={sequence.elements.join(", ")}
                    onChange={(e) => {
                      const elms = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                      setSequence(val => ({ ...val, elements: elms }));
                    }}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-bold">
                  Op
                  <select
                    className="rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs"
                    value={sequence.operationType}
                    onChange={(e) => setSequence(val => ({ ...val, operationType: e.target.value as any }))}
                  >
                    <option value="traverse">traverse</option>
                    <option value="read">read</option>
                    <option value="write">write</option>
                  </select>
                </label>
                {sequence.operationType !== "traverse" && (
                  <label className="flex items-center gap-2 text-sm font-bold">
                    Tgt Idx
                    <input
                      className="w-16 rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs"
                      type="number"
                      value={sequence.targetIndex ?? 0}
                      onChange={(e) => setSequence(val => ({ ...val, targetIndex: Number(e.target.value) }))}
                    />
                  </label>
                )}
              </>
            )}

            {meta.template === "call-stack" && (
              <label className="flex items-center gap-2 text-sm font-bold">
                Initial N
                <input
                  className="w-16 rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs"
                  type="number"
                  min="1"
                  max="5"
                  value={callStack.initialArg}
                  onChange={(e) => setCallStack(val => ({ ...val, initialArg: Math.max(1, Math.min(5, Number(e.target.value))) }))}
                />
              </label>
            )}

            {meta.template === "linked" && (
              <>
                <label className="flex items-center gap-2 text-sm font-bold">
                  Values
                  <input
                    className="w-32 rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs"
                    value={linked.values.join(", ")}
                    onChange={(e) => {
                      const vals = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                      setLinked(val => ({ ...val, values: vals }));
                    }}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-bold">
                  Op
                  <select
                    className="rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs"
                    value={linked.operation}
                    onChange={(e) => setLinked(val => ({ ...val, operation: e.target.value as any }))}
                  >
                    <option value="search">search</option>
                    <option value="insert">insert</option>
                    <option value="delete">delete</option>
                    <option value="reverse">reverse</option>
                  </select>
                </label>
                {linked.operation !== "reverse" && (
                  <label className="flex items-center gap-2 text-sm font-bold">
                    Operand
                    <input
                      className="w-16 rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs"
                      value={linked.operand ?? ""}
                      onChange={(e) => setLinked(val => ({ ...val, operand: e.target.value }))}
                    />
                  </label>
                )}
              </>
            )}

            {meta.template === "linear-adt" && (
              <label className="flex items-center gap-2 text-sm font-bold">
                Init Values
                <input
                  className="w-32 rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs"
                  value={linearAdt.values.join(", ")}
                  onChange={(e) => {
                    const vals = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                    setLinearAdt(val => ({ ...val, values: vals }));
                  }}
                />
              </label>
            )}

            {meta.template === "complexity" && (
              <>
                <label className="flex items-center gap-2 text-sm font-bold">
                  f(n)
                  <input
                    className="w-20 rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs"
                    value={complexity.f_n}
                    onChange={(e) => setComplexity(val => ({ ...val, f_n: e.target.value }))}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-bold">
                  g(n)
                  <input
                    className="w-20 rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs"
                    value={complexity.g_n}
                    onChange={(e) => setComplexity(val => ({ ...val, g_n: e.target.value }))}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-bold">
                  c
                  <input
                    className="w-12 rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs"
                    type="number"
                    value={complexity.c ?? 1}
                    onChange={(e) => setComplexity(val => ({ ...val, c: Number(e.target.value) }))}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-bold">
                  n₀
                  <input
                    className="w-12 rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs"
                    type="number"
                    value={complexity.n0 ?? 1}
                    onChange={(e) => setComplexity(val => ({ ...val, n0: Number(e.target.value) }))}
                  />
                </label>
              </>
            )}

            {meta.template === "tree" && (
              <>
                <label className="flex items-center gap-2 text-sm font-bold">
                  Initial values
                  <input
                    aria-label="Initial tree values"
                    className="w-44 rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs"
                    placeholder={concept === "binary_trees" ? "10, 5, 15, null, 7" : "10, 5, 15, 2, 7"}
                    value={tree.nodes.map((node) => node ?? "null").join(", ")}
                    onChange={(e) => {
                      const vals = e.target.value.split(",").map((value) => {
                        const token = value.trim().toLowerCase();
                        if (!token || token === "null" || token === "none" || token === "-") return null;
                        const number = Number(token);
                        return Number.isFinite(number) ? number : null;
                      });
                      setTree(val => ({ ...val, nodes: vals }));
                    }}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-bold">
                  Action
                  <select
                    className="rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs"
                    value={tree.operation ?? "traverse"}
                    onChange={(e) => setTree(val => ({ ...val, operation: e.target.value as "insert" | "delete" | "search" | "traverse" | "extract-min" }))}
                  >
                    {treeOperations.map((operation) => <option key={operation} value={operation}>{operation.replace("-", " ")}</option>)}
                  </select>
                </label>
                {(tree.operation ?? "traverse") !== "traverse" && tree.operation !== "extract-min" && (
                  <label className="flex items-center gap-2 text-sm font-bold">
                    {(tree.operation === "search") ? "Target" : "Value"}
                    <input
                      className="w-16 rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs"
                      type="number"
                      value={tree.searchTarget ?? 0}
                      onChange={(e) => setTree(val => ({ ...val, searchTarget: Number(e.target.value) }))}
                    />
                  </label>
                )}
                {concept === "b_trees" && (
                  <label className="flex items-center gap-2 text-sm font-bold">
                    Minimum degree
                    <input
                      aria-label="B-tree minimum degree"
                      className="w-16 rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs"
                      type="number"
                      min="2"
                      max="8"
                      value={tree.btreeOrder ?? 2}
                      onChange={(e) => setTree(val => ({ ...val, btreeOrder: Math.max(2, Math.min(8, Number(e.target.value) || 2)) }))}
                    />
                  </label>
                )}
                {(tree.operation ?? "traverse") === "traverse" && (
                  <label className="flex items-center gap-2 text-sm font-bold">
                    Order
                    <select
                      className="rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs"
                      value={tree.traversalOrder ?? "inorder"}
                      onChange={(e) => setTree(val => ({ ...val, traversalOrder: e.target.value as "preorder" | "inorder" | "postorder" }))}
                    >
                      <option value="inorder">inorder</option>
                      <option value="preorder">preorder</option>
                      <option value="postorder">postorder</option>
                    </select>
                  </label>
                )}
                <span className="max-w-sm text-xs font-semibold text-ink/50">
                  {concept === "binary_trees" ? "Use null to leave a level-order child empty." : "Values rebuild the starting tree; choose an action to trace next."}
                </span>
              </>
            )}

            {meta.template === "trie" && (
              <>
                <label className="flex items-center gap-2 text-sm font-bold">
                  Words
                  <input
                    className="w-32 rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs"
                    value={trie.words.join(", ")}
                    onChange={(e) => {
                      const wds = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                      setTrie(val => ({ ...val, words: wds }));
                    }}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-bold">
                  Prefix
                  <input
                    className="w-20 rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs"
                    value={trie.searchPrefix}
                    onChange={(e) => setTrie(val => ({ ...val, searchPrefix: e.target.value }))}
                  />
                </label>
              </>
            )}

            {meta.template === "bitwise" && (
              <>
                <label className="flex items-center gap-2 text-sm font-bold">
                  Op A
                  <input
                    className="w-16 rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs"
                    type="number"
                    value={bitwise.operandA}
                    onChange={(e) => setBitwise(val => ({ ...val, operandA: Number(e.target.value) }))}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-bold">
                  Op B
                  <input
                    className="w-16 rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs"
                    type="number"
                    value={bitwise.operandB ?? 0}
                    onChange={(e) => setBitwise(val => ({ ...val, operandB: Number(e.target.value) }))}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-bold">
                  Operator
                  <select
                    className="rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs"
                    value={bitwise.operator}
                    onChange={(e) => setBitwise(val => ({ ...val, operator: e.target.value as any }))}
                  >
                    <option value="AND">AND</option>
                    <option value="OR">OR</option>
                    <option value="XOR">XOR</option>
                    <option value="NOT">NOT</option>
                    <option value="SHL">SHL</option>
                    <option value="SHR">SHR</option>
                  </select>
                </label>
              </>
            )}

            {meta.template === "recurrence" && (
              <>
                <label className="flex items-center gap-2 text-sm font-bold">
                  a
                  <input
                    className="w-12 rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs"
                    type="number"
                    value={recurrence.a}
                    onChange={(e) => setRecurrence(val => ({ ...val, a: Number(e.target.value) }))}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-bold">
                  b
                  <input
                    className="w-12 rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs"
                    type="number"
                    value={recurrence.b}
                    onChange={(e) => setRecurrence(val => ({ ...val, b: Number(e.target.value) }))}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-bold">
                  f(n)
                  <input
                    className="w-20 rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs"
                    value={recurrence.fn}
                    onChange={(e) => setRecurrence(val => ({ ...val, fn: e.target.value }))}
                  />
                </label>
              </>
            )}

            {meta.template === "decision-tree" && (
              <label className="flex items-center gap-2 text-sm font-bold">
                Board Size
                <input
                  className="w-16 rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs"
                  type="number"
                  min="4"
                  max="8"
                  value={backtracking.size}
                  onChange={(e) => setBacktracking(val => ({ ...val, size: Math.max(4, Math.min(8, Number(e.target.value))) }))}
                />
              </label>
            )}

            {meta.template === "probabilistic" && (
              <>
                <label className="flex items-center gap-2 text-sm font-bold">
                  Inserts
                  <input
                    className="w-24 rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs"
                    value={bloom.insertions.join(", ")}
                    onChange={(e) => {
                      const ins = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                      setBloom(val => ({ ...val, insertions: ins }));
                    }}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-bold">
                  Queries
                  <input
                    className="w-24 rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs"
                    value={bloom.queries.join(", ")}
                    onChange={(e) => {
                      const qrs = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                      setBloom(val => ({ ...val, queries: qrs }));
                    }}
                  />
                </label>
              </>
            )}

            {meta.template === "greedy" && (
              <label className="flex items-center gap-2 text-sm font-bold">
                Capacity
                <input
                  className="w-16 rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs"
                  type="number"
                  value={greedy.capacity}
                  onChange={(e) => setGreedy(val => ({ ...val, capacity: Number(e.target.value) }))}
                />
              </label>
            )}

            {meta.template === "dp-grid" && (
              <>
                <label className="flex items-center gap-2 text-sm font-bold">
                  Str A
                  <input
                    className="w-16 rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs"
                    value={dp.stringA}
                    onChange={(e) => setDp(val => ({ ...val, stringA: e.target.value }))}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-bold">
                  Str B
                  <input
                    className="w-16 rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs"
                    value={dp.stringB}
                    onChange={(e) => setDp(val => ({ ...val, stringB: e.target.value }))}
                  />
                </label>
              </>
            )}
          </div>}
        </section>

        <div className="mb-6">
          <ScenarioEditor concept={concept} inputs={draftInputs} errors={validation} randomSettings={randomSettings} onChange={setDraftInputs} onRandomSettingsChange={setRandomSettings} />
        </div>

        <div className="mb-6 h-2 overflow-hidden rounded-full bg-ink/10"><div className="h-full rounded-full bg-forest transition-all" style={{ width: `${max ? (step / max) * 100 : 0}%` }} /></div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="panel p-4 md:p-5">
            {meta.template === "graph" && graphSnapshot && <GraphLab scenario={appliedInputs.graph} snapshot={graphSnapshot} weighted={concept === "dijkstra"} />}
            {meta.template === "array" && arraySnapshot && <ArrayLab snapshot={arraySnapshot} concept={concept as "binary_search" | "insertion_sort"} />}
            {meta.template === "memory" && <MemoryLab snapshot={snapshot as MemorySnapshot} />}
            {meta.template === "sequence" && <SequenceLab snapshot={snapshot as SequenceSnapshot} />}
            {meta.template === "call-stack" && <CallStackLab snapshot={snapshot as CallStackSnapshot} />}
            {meta.template === "linked" && <LinkedLab snapshot={snapshot as LinkedSnapshot} />}
            {meta.template === "linear-adt" && <LinearAdtLab snapshot={snapshot as LinearAdtSnapshot} concept={concept} />}
            {meta.template === "complexity" && <ComplexityLab snapshot={snapshot as ComplexitySnapshot} />}
            {meta.template === "tree" && <TreeLab snapshot={snapshot as TreeSnapshot} layoutKey={JSON.stringify(tree)} nodeTheme={["binary_trees", "binary_search_trees", "avl_trees", "treaps"].includes(lesson.concept) ? "dijkstra" : "default"} />}
            {meta.template === "trie" && <TrieLab snapshot={snapshot as TrieSnapshot} layoutKey={JSON.stringify(trie)} />}
            {meta.template === "bitwise" && <BitwiseLab snapshot={snapshot as BitwiseSnapshot} />}
            {meta.template === "recurrence" && <RecurrenceLab snapshot={snapshot as RecurrenceSnapshot} />}
            {meta.template === "decision-tree" && <BacktrackingLab snapshot={snapshot as BacktrackingSnapshot} />}
            {meta.template === "probabilistic" && <BloomLab snapshot={snapshot as BloomSnapshot} />}
            {meta.template === "greedy" && <GreedyLab snapshot={snapshot as GreedySnapshot} />}
            {meta.template === "dp-grid" && <DpLab snapshot={snapshot as DPSnapshot} />}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2"><button className="btn border border-ink/15 bg-white" onClick={() => { setPlaying(false); setStep(0); }}><RotateCcw size={17} /> Reset</button><button className="btn btn-primary" onClick={() => setPlaying((value) => !value)} disabled={complete}>{playing ? <Pause size={17} /> : <Play size={17} />}{playing ? "Pause" : "Autoplay"}</button><button className="btn btn-lime" onClick={() => { setPlaying(false); setStep((value) => Math.min(value + 1, max)); }} disabled={complete}><SkipForward size={17} /> Next step</button></div>
              <div aria-live="polite" className={`flex min-h-12 flex-1 items-center rounded-2xl px-4 py-2 text-sm font-bold md:max-w-xl ${complete ? "bg-lime" : "bg-cream"}`}>{complete && <CheckCircle2 className="mr-2 shrink-0" size={18} />}{event?.message ?? "Ready. Predict the first operation, then take a step."}</div>
            </div>
          </section>
          <TutorPanel lesson={lesson} snapshot={snapshot} event={event} nextEvent={nextEvent} />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <section className="panel p-5"><h2 className="display mb-4 text-xl font-bold">Pseudocode</h2><ol className="space-y-1 font-mono text-xs">{(pseudocode[concept] ?? []).map((line, index) => <li key={line} className={`rounded-lg px-3 py-2 ${event?.codeLine === index ? "bg-lime font-black" : "text-ink/60"}`}><span className="mr-3 text-ink/30">{index + 1}</span>{line}</li>)}</ol></section>
          <section className="panel p-5"><h2 className="display mb-4 text-xl font-bold">Live variables</h2>{renderLiveVariables()}</section>
          <section className="panel p-5"><h2 className="display mb-4 text-xl font-bold">Event trail</h2><div className="space-y-2">{run.events.slice(Math.max(0, step - 4), step).reverse().map((item, i) => <div key={`${step}-${i}`} className="rounded-xl border border-ink/10 bg-white p-3 text-xs"><span className="mr-2 font-black uppercase text-forest">{item.kind}</span>{item.message}</div>)}{step === 0 && <p className="text-sm text-ink/50">Your algorithm trace will appear here.</p>}</div></section>
        </div>
      </div>
    </main>
  );
}

function Data({ label, value }: { label: string; value: string | number }) { return <div className="flex items-start justify-between gap-4 border-b border-ink/10 pb-2"><dt className="font-bold text-ink/50">{label}</dt><dd className="text-right font-extrabold">{value}</dd></div>; }
function VisualizationLoading() { return <div role="status" className="flex min-h-[390px] items-center justify-center rounded-[20px] bg-[#eef0e7] font-bold text-ink/50">Loading interactive world…</div>; }
