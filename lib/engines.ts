import type { ArrayScenario, GraphScenario, SimulationEngine, SimulationEvent, SimulationRun } from "./types";

export type GraphSnapshot = {
  current: string | null;
  visited: string[];
  discovered: string[];
  frontier: string[];
  distances: Record<string, number | null>;
  predecessors: Record<string, string | null>;
  traversal: string[];
  complete: boolean;
};

export type ArraySnapshot = {
  values: number[];
  low: number | null;
  high: number | null;
  mid: number | null;
  target: number | null;
  current: number | null;
  comparing: number[];
  sortedThrough: number;
  found: number | null;
  complete: boolean;
};

export function engine<I, S>(build: (input: I) => SimulationRun<S>): SimulationEngine<I, S> {
  return {
    initialize: build,
    availableActions: (run, step) => step < run.events.length ? ["step", "reset"] : ["reset"],
    transition: (run, step) => run.states[Math.min(step + 1, run.states.length - 1)],
    isComplete: (run, step) => step >= run.events.length,
    getSnapshot: (run, step) => run.states[Math.min(Math.max(step, 0), run.states.length - 1)],
  };
}

function adjacency(input: GraphScenario) {
  const map = new Map<string, { node: string; weight: number }[]>();
  input.nodes.forEach((node) => map.set(node.id, []));
  input.edges.forEach((edge) => {
    map.get(edge.source)?.push({ node: edge.target, weight: edge.weight });
    map.get(edge.target)?.push({ node: edge.source, weight: edge.weight });
  });
  map.forEach((neighbors) => neighbors.sort((a, b) => a.node.localeCompare(b.node)));
  return map;
}

function graphInitial(input: GraphScenario): GraphSnapshot {
  return {
    current: null,
    visited: [],
    discovered: [input.source],
    frontier: [input.source],
    distances: Object.fromEntries(input.nodes.map((node) => [node.id, node.id === input.source ? 0 : null])),
    predecessors: Object.fromEntries(input.nodes.map((node) => [node.id, null])),
    traversal: [],
    complete: false,
  };
}

function pushGraph(states: GraphSnapshot[], events: SimulationEvent[], state: GraphSnapshot, event: SimulationEvent) {
  events.push(event);
  states.push({ ...state, visited: [...state.visited], discovered: [...state.discovered], frontier: [...state.frontier], traversal: [...state.traversal], distances: { ...state.distances }, predecessors: { ...state.predecessors } });
}

export const dijkstraEngine = engine<GraphScenario, GraphSnapshot>((input) => {
  if (!input.nodes.some((node) => node.id === input.source) || input.edges.some((edge) => edge.weight < 0)) throw new Error("Dijkstra requires a valid source and nonnegative edge weights.");
  const state = graphInitial(input);
  const states = [{ ...state }];
  const events: SimulationEvent[] = [];
  const adj = adjacency(input);
  const unvisited = new Set(input.nodes.map((node) => node.id));

  while (unvisited.size) {
    const candidates = [...unvisited].filter((id) => state.distances[id] !== null).sort((a, b) => (state.distances[a]! - state.distances[b]!) || a.localeCompare(b));
    if (!candidates.length) break;
    const node = candidates[0];
    state.current = node;
    unvisited.delete(node);
    state.visited.push(node);
    state.traversal.push(node);
    state.frontier = [...unvisited].filter((id) => state.distances[id] !== null).sort();
    pushGraph(states, events, state, { kind: "visit", codeLine: 2, focus: [node], message: `Settle ${node}; distance ${state.distances[node]} is now final.` });

    for (const next of adj.get(node) ?? []) {
      if (!unvisited.has(next.node)) continue;
      const candidate = state.distances[node]! + next.weight;
      const old = state.distances[next.node];
      if (old === null || candidate < old) {
        state.distances[next.node] = candidate;
        state.predecessors[next.node] = node;
        if (!state.discovered.includes(next.node)) state.discovered.push(next.node);
        state.frontier = [...unvisited].filter((id) => state.distances[id] !== null).sort((a, b) => (state.distances[a]! - state.distances[b]!) || a.localeCompare(b));
        pushGraph(states, events, state, { kind: "relax", codeLine: 4, focus: [node, next.node], values: { old, next: candidate }, message: `Relax ${node} → ${next.node}: update distance to ${candidate}.` });
      }
    }
  }
  state.current = null;
  state.frontier = [];
  state.complete = true;
  pushGraph(states, events, state, { kind: "complete", codeLine: 5, message: "All reachable nodes have their shortest distance." });
  return { initial: states[0], states, events };
});

function traversalEngine(mode: "bfs" | "dfs") {
  return engine<GraphScenario, GraphSnapshot>((input) => {
    const state = graphInitial(input);
    const states = [{ ...state }];
    const events: SimulationEvent[] = [];
    const adj = adjacency(input);
    const discovered = new Set([input.source]);

    while (state.frontier.length) {
      const node = mode === "bfs" ? state.frontier.shift()! : state.frontier.pop()!;
      state.current = node;
      state.visited.push(node);
      state.traversal.push(node);
      pushGraph(states, events, state, { kind: "visit", codeLine: 2, focus: [node], message: `${mode.toUpperCase()} visits ${node} from the ${mode === "bfs" ? "front of the queue" : "top of the stack"}.` });
      let neighbors = (adj.get(node) ?? []).map((item) => item.node).filter((id) => !discovered.has(id));
      if (mode === "dfs") neighbors = neighbors.reverse();
      neighbors.forEach((next) => {
        discovered.add(next);
        state.discovered.push(next);
        state.frontier.push(next);
        pushGraph(states, events, state, { kind: "enqueue", codeLine: 4, focus: [next], message: `Discover ${next} and add it to the ${mode === "bfs" ? "queue" : "stack"}.` });
      });
    }
    state.current = null;
    state.complete = true;
    pushGraph(states, events, state, { kind: "complete", codeLine: 5, message: `${mode.toUpperCase()} traversal complete: ${state.traversal.join(" → ")}.` });
    return { initial: states[0], states, events };
  });
}

export const bfsEngine = traversalEngine("bfs");
export const dfsEngine = traversalEngine("dfs");

function arrayInitial(input: ArrayScenario): ArraySnapshot {
  return { values: [...input.values], low: null, high: null, mid: null, target: input.target ?? null, current: null, comparing: [], sortedThrough: 0, found: null, complete: false };
}

function pushArray(states: ArraySnapshot[], events: SimulationEvent[], state: ArraySnapshot, event: SimulationEvent) {
  events.push(event);
  states.push({ ...state, values: [...state.values], comparing: [...state.comparing] });
}

export const binarySearchEngine = engine<ArrayScenario, ArraySnapshot>((input) => {
  const values = [...input.values];
  if (values.some((value, i) => i > 0 && value < values[i - 1])) throw new Error("Binary search requires a sorted array.");
  const state = arrayInitial({ values, target: input.target });
  state.low = 0;
  state.high = Math.max(0, values.length - 1);
  const states = [{ ...state, values: [...values] }];
  const events: SimulationEvent[] = [];
  while (values.length && state.low! <= state.high!) {
    state.mid = Math.floor((state.low! + state.high!) / 2);
    state.comparing = [state.mid];
    const current = values[state.mid];
    pushArray(states, events, state, { kind: "compare", codeLine: 2, focus: [String(state.mid)], values: { current, target: state.target }, message: `Compare target ${state.target} with midpoint value ${current}.` });
    if (current === state.target) {
      state.found = state.mid;
      break;
    }
    if (current < state.target!) state.low = state.mid + 1;
    else state.high = state.mid - 1;
    state.comparing = [];
    pushArray(states, events, state, { kind: "narrow-range", codeLine: 4, message: state.low <= state.high ? `Keep indices ${state.low}–${state.high}; discard the other half.` : "The remaining range is empty." });
  }
  state.complete = true;
  state.comparing = state.found === null ? [] : [state.found];
  pushArray(states, events, state, { kind: "complete", codeLine: 5, message: state.found === null ? `Target ${state.target} is not in the array.` : `Found ${state.target} at index ${state.found}.` });
  return { initial: states[0], states, events };
});

export const insertionSortEngine = engine<ArrayScenario, ArraySnapshot>((input) => {
  const state = arrayInitial(input);
  const states = [{ ...state, values: [...state.values] }];
  const events: SimulationEvent[] = [];
  for (let i = 1; i < state.values.length; i++) {
    const key = state.values[i];
    state.current = i;
    let j = i - 1;
    while (j >= 0) {
      state.comparing = [j, j + 1];
      pushArray(states, events, state, { kind: "compare", codeLine: 3, focus: [String(j), String(j + 1)], message: `Compare ${state.values[j]} with key ${key}.` });
      if (state.values[j] <= key) break;
      state.values[j + 1] = state.values[j];
      pushArray(states, events, state, { kind: "shift", codeLine: 4, focus: [String(j + 1)], message: `Shift ${state.values[j]} one position right.` });
      j--;
    }
    state.values[j + 1] = key;
    state.sortedThrough = i;
    state.comparing = [j + 1];
    pushArray(states, events, state, { kind: "place", codeLine: 5, focus: [String(j + 1)], message: `Place key ${key} at index ${j + 1}.` });
  }
  state.current = null;
  state.comparing = [];
  state.complete = true;
  state.sortedThrough = Math.max(0, state.values.length - 1);
  pushArray(states, events, state, { kind: "complete", codeLine: 6, message: `Sorted array: ${state.values.join(", ")}.` });
  return { initial: states[0], states, events };
});

import { pointersEngine, structuresEngine, dynamicMemoryEngine } from "./simulations/engines/memoryEngine";
import { stringsEngine, arraysEngine } from "./simulations/engines/sequenceEngine";
import { recursionEngine } from "./simulations/engines/recursionEngine";
import { linkedListEngine, skipListEngine } from "./simulations/engines/linkedEngine";
import { stacksEngine, queuesEngine } from "./simulations/engines/linearAdtEngine";
import { algAnalysisEngine, growthOfFunctionsEngine, bigOEngine, bigOmegaEngine, bigThetaEngine } from "./simulations/engines/complexityEngine";
import { treeEngine, heapsEngine, avlEngine, btreeEngine, rbtEngine, treapsEngine } from "./simulations/engines/treeEngine";
import { triesEngine } from "./simulations/engines/trieEngine";
import { bitwiseEngine } from "./simulations/engines/bitwiseEngine";
import { masterTheoremEngine, divideAndConquerEngine } from "./simulations/engines/recurrenceEngine";
import { backtrackingEngine } from "./simulations/engines/backtrackingEngine";
import { bloomFilterEngine } from "./simulations/engines/bloomEngine";
import { greedyEngine } from "./simulations/engines/greedyEngine";
import { dpEngine } from "./simulations/engines/dpEngine";

export * from "./simulations/engines/memoryEngine";
export * from "./simulations/engines/sequenceEngine";
export * from "./simulations/engines/recursionEngine";
export * from "./simulations/engines/linkedEngine";
export * from "./simulations/engines/linearAdtEngine";
export * from "./simulations/engines/complexityEngine";
export * from "./simulations/engines/treeEngine";
export * from "./simulations/engines/trieEngine";
export * from "./simulations/engines/bitwiseEngine";
export * from "./simulations/engines/recurrenceEngine";
export * from "./simulations/engines/backtrackingEngine";
export * from "./simulations/engines/bloomEngine";
export * from "./simulations/engines/greedyEngine";
export * from "./simulations/engines/dpEngine";

export const engines = {
  dijkstra: dijkstraEngine,
  bfs: bfsEngine,
  dfs: dfsEngine,
  binary_search: binarySearchEngine,
  insertion_sort: insertionSortEngine,
  pointers: pointersEngine,
  strings: stringsEngine,
  arrays: arraysEngine,
  structures: structuresEngine,
  dynamic_memory_allocation: dynamicMemoryEngine,
  recursion: recursionEngine,
  linked_lists: linkedListEngine,
  skip_lists: skipListEngine,
  stacks: stacksEngine,
  queues: queuesEngine,
  algorithm_analysis: algAnalysisEngine,
  growth_of_functions: growthOfFunctionsEngine,
  big_o: bigOEngine,
  big_omega: bigOmegaEngine,
  big_theta: bigThetaEngine,
  binary_trees: treeEngine,
  binary_search_trees: treeEngine,
  heaps: heapsEngine,
  tries: triesEngine,
  bitwise_operators: bitwiseEngine,
  avl_trees: avlEngine,
  b_trees: btreeEngine,
  red_black_trees: rbtEngine,
  treaps: treapsEngine,
  master_theorem: masterTheoremEngine,
  divide_and_conquer: divideAndConquerEngine,
  backtracking: backtrackingEngine,
  bloom_filters: bloomFilterEngine,
  greedy_algorithms: greedyEngine,
  dynamic_programming: dpEngine,
};
