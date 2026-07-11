import { z } from "zod";

export const conceptIds = ["dijkstra", "bfs", "dfs", "binary_search", "insertion_sort"] as const;
export type ConceptId = (typeof conceptIds)[number];
export type TemplateId = "graph" | "array";

export type GraphNode = { id: string; label: string };
export type GraphEdge = { id: string; source: string; target: string; weight: number };
export type GraphScenario = { nodes: GraphNode[]; edges: GraphEdge[]; source: string };
export type ArrayScenario = { values: number[]; target?: number };
export type Scenario = GraphScenario | ArrayScenario;

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

export function isGraphScenario(value: Scenario): value is GraphScenario {
  return "nodes" in value;
}
