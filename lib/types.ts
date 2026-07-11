import { z } from "zod";

export const conceptIds = [
  "dijkstra",
  "bfs",
  "dfs",
  "binary_search",
  "insertion_sort",
  "pointers",
  "strings",
  "arrays",
  "structures",
  "dynamic_memory_allocation",
  "recursion",
  "linked_lists",
  "skip_lists",
  "stacks",
  "queues",
  "algorithm_analysis",
  "growth_of_functions",
  "big_o",
  "big_omega",
  "big_theta",
  "binary_trees",
  "binary_search_trees",
  "heaps",
  "tries",
  "bitwise_operators",
  "avl_trees",
  "b_trees",
  "red_black_trees",
  "treaps",
  "master_theorem",
  "divide_and_conquer",
  "backtracking",
  "bloom_filters",
  "greedy_algorithms",
  "dynamic_programming"
] as const;
export type ConceptId = (typeof conceptIds)[number];
export type TemplateId =
  | "graph"
  | "array"
  | "memory"
  | "sequence"
  | "call-stack"
  | "linked"
  | "linear-adt"
  | "complexity"
  | "tree"
  | "trie"
  | "bitwise"
  | "recurrence"
  | "decision-tree"
  | "probabilistic"
  | "greedy"
  | "dp-grid";

export type GraphNode = { id: string; label: string };
export type GraphEdge = { id: string; source: string; target: string; weight: number };
export type GraphScenario = { nodes: GraphNode[]; edges: GraphEdge[]; source: string };
export type ArrayScenario = { values: number[]; target?: number };

export type MemoryScenario = {
  variables: { name: string; type: string; value: string; address: string }[];
  heapAllocations: { address: string; size: number; value: string; label?: string }[];
  statements: string[];
};

export type SequenceScenario = {
  elements: (string | number)[];
  activeIndex?: number;
  operationType: "read" | "write" | "traverse";
  targetIndex?: number;
  targetValue?: string | number;
};

export type CallStackScenario = {
  functionName: string;
  initialArg: number;
};

export type LinkedScenario = {
  values: string[];
  operation: "insert" | "delete" | "search" | "reverse";
  operand?: string;
  position?: number;
  levels?: number; // Skip lists
};

export type LinearAdtScenario = {
  values: string[];
  operations: { type: "push" | "pop" | "enqueue" | "dequeue"; value?: string }[];
};

export type ComplexityScenario = {
  f_n: string;
  g_n: string;
  c?: number;
  n0?: number;
  codeSnippet?: string;
  n?: number;
};

export type TreeScenario = {
  nodes: (string | number | null)[];
  insertions?: (string | number)[];
  deletions?: (string | number)[];
  searchTarget?: string | number;
  traversalOrder?: "preorder" | "inorder" | "postorder";
  operation?: "insert" | "delete" | "search" | "traverse" | "extract-min";
  treeType?: "binary" | "bst" | "heap" | "avl" | "red-black" | "treap" | "btree";
  btreeOrder?: number;
};

export type TrieScenario = {
  values?: string[]; // compatibility
  words: string[];
  searchPrefix?: string;
  insertWord?: string;
};

export type BitwiseScenario = {
  operandA: number;
  operandB?: number;
  operator: "AND" | "OR" | "XOR" | "NOT" | "SHL" | "SHR";
  bits: 8 | 16 | 32;
};

export type RecurrenceScenario = {
  a: number;
  b: number;
  fn: string;
  n: number;
};

export type BacktrackingScenario = {
  problem: "n-queens" | "maze" | "subset-sum";
  size: number;
  mazeGrid?: number[][];
};

export type BloomScenario = {
  size: number;
  hashes: number;
  insertions: string[];
  queries: string[];
};

export type GreedyScenario = {
  problem: "knapsack" | "activity-selection" | "huffman";
  items: { id: string; weight: number; value: number; start?: number; end?: number }[];
  capacity?: number;
};

export type DPScenario = {
  problem: "knapsack" | "lcs" | "edit-distance";
  stringA?: string;
  stringB?: string;
  items?: { weight: number; value: number }[];
  capacity?: number;
};

export type Scenario =
  | GraphScenario
  | ArrayScenario
  | MemoryScenario
  | SequenceScenario
  | CallStackScenario
  | LinkedScenario
  | LinearAdtScenario
  | ComplexityScenario
  | TreeScenario
  | TrieScenario
  | BitwiseScenario
  | RecurrenceScenario
  | BacktrackingScenario
  | BloomScenario
  | GreedyScenario
  | DPScenario;

export const compiledLessonSchema = z.object({
  concept: z.enum(conceptIds),
  confidence: z.number().min(0).max(1),
  title: z.string().min(1).max(100),
  objective: z.string().min(1).max(300),
  keyPoints: z.array(z.string().min(1).max(240)).min(1).max(5),
  misconceptions: z.array(z.string().min(1).max(240)).max(4),
  sourceNote: z.string().max(240).optional(),
});
export type CompiledLesson = z.infer<typeof compiledLessonSchema>;

export type EventKind = "visit" | "enqueue" | "relax" | "compare" | "narrow-range" | "shift" | "place" | "complete";
export type SimulationEvent = { kind: EventKind; message: string; codeLine: number; focus?: string[]; values?: Record<string, unknown> };

export type SimulationRun<S> = {
  initial: S;
  states: S[];
  events: SimulationEvent[];
};

export type SimulationEngine<I, S> = {
  initialize(input: I): SimulationRun<S>;
  availableActions(run: SimulationRun<S>, step: number): string[];
  transition(run: SimulationRun<S>, step: number): S;
  isComplete(run: SimulationRun<S>, step: number): boolean;
  getSnapshot(run: SimulationRun<S>, step: number): S;
};

export const tutorResponseSchema = z.object({
  explanation: z.string().min(1).max(700),
  question: z.string().max(300).default(""),
  options: z.array(z.string().max(100)).max(4).default([]),
  expectedAnswer: z.string().max(160).default(""),
  hint: z.string().max(240).default(""),
  misconception: z.string().max(240).nullable().default(null),
  difficulty: z.enum(["easier", "same", "harder"]).default("same"),
});
export type TutorResponse = z.infer<typeof tutorResponseSchema>;

export const tutorRequestSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  lesson: compiledLessonSchema,
  snapshot: z.unknown(),
  event: z.object({ kind: z.string(), message: z.string().max(500), codeLine: z.number(), focus: z.array(z.string()).optional(), values: z.record(z.unknown()).optional() }).optional(),
  nextEvent: z.object({ kind: z.string(), message: z.string().max(500), codeLine: z.number(), focus: z.array(z.string()).optional(), values: z.record(z.unknown()).optional() }).optional(),
  mode: z.enum(["explain", "challenge", "hint", "mistake", "compare", "summarize"]),
  mastery: z.number().min(0).max(100).default(0),
  misconceptions: z.array(z.string().max(100)).max(20).default([]),
});

export function isGraphScenario(value: Scenario): value is GraphScenario {
  return "edges" in value;
}
