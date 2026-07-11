import type { ArrayScenario, CompiledLesson, ConceptId, GraphScenario, TemplateId } from "./types";

export const conceptMeta: Record<ConceptId, { label: string; description: string; template: TemplateId; color: string }> = {
  dijkstra: { label: "Dijkstra’s algorithm", description: "Find shortest paths through a weighted graph.", template: "graph", color: "#c9f66f" },
  bfs: { label: "Breadth-first search", description: "Explore a graph one level at a time.", template: "graph", color: "#8ed8c0" },
  dfs: { label: "Depth-first search", description: "Follow a path deeply, then backtrack.", template: "graph", color: "#ffb18f" },
  binary_search: { label: "Binary search", description: "Repeatedly halve a sorted search range.", template: "array", color: "#aeb8ff" },
  insertion_sort: { label: "Insertion sort", description: "Grow a sorted prefix one item at a time.", template: "array", color: "#ffd66b" },
};

export const graphScenario: GraphScenario = {
  nodes: "ABCDEF".split("").map((id) => ({ id, label: id })),
  edges: [
    ["A", "B", 4], ["A", "C", 2], ["B", "C", 1], ["B", "D", 5],
    ["C", "D", 8], ["C", "E", 10], ["D", "E", 2], ["D", "F", 6], ["E", "F", 3],
  ].map(([source, target, weight], i) => ({ id: `e${i}`, source: String(source), target: String(target), weight: Number(weight) })),
  source: "A",
};

export const arrayScenarios: Record<"binary_search" | "insertion_sort", ArrayScenario> = {
  binary_search: { values: [3, 7, 11, 18, 24, 31, 42, 56, 63], target: 31 },
  insertion_sort: { values: [8, 3, 6, 2, 7, 4] },
};

export function fallbackLesson(concept: ConceptId): CompiledLesson {
  const meta = conceptMeta[concept];
  const objectives: Record<ConceptId, string> = {
    dijkstra: "Trace how tentative distances become final shortest paths through edge relaxation.",
    bfs: "Use a queue to explain why breadth-first search visits nodes level by level.",
    dfs: "Use a stack to trace deep exploration and backtracking through a graph.",
    binary_search: "Predict each midpoint and justify which half of the sorted range can be discarded.",
    insertion_sort: "Trace comparisons and shifts as a sorted prefix grows one value at a time.",
  };
  return {
    concept,
    confidence: 1,
    title: meta.label,
    objective: objectives[concept],
    keyPoints: [meta.description, "The simulation is deterministic: each step follows the algorithm’s rules.", "Pause before each step and predict what changes next."],
    misconceptions: concept === "dijkstra" ? ["A tentative distance is not final until its node is settled."] : ["The visualization changes only when the algorithm performs a defined operation."],
    sourceNote: "Curated LearnWorld lesson",
  };
}

export function detectConcept(text: string): ConceptId {
  const value = text.toLowerCase();
  if (/dijkstra|shortest path|relax(ation|ing)?/.test(value)) return "dijkstra";
  if (/breadth.?first|\bbfs\b|level.?order|queue/.test(value)) return "bfs";
  if (/depth.?first|\bdfs\b|backtrack|stack/.test(value)) return "dfs";
  if (/binary search|midpoint|sorted.+search/.test(value)) return "binary_search";
  if (/insertion sort|sorted prefix|shift.+key/.test(value)) return "insertion_sort";
  return "dijkstra";
}

export const previewTopics = ["Dynamic programming", "CPU pipelines", "Cache replacement", "Physics", "Economics", "Biology"];
