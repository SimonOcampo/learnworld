import { z } from "zod";

export const courseIdSchema = z.enum(["cs1", "cs2", "custom"]);
export const difficultySchema = z.enum(["intro", "intermediate", "advanced"]);
export const capabilitySchema = z.enum(["full-interactive", "partial-interactive", "guided-visual", "tutor-challenge", "unsupported"]);

export const skillRefSchema = z.object({
  source: z.enum(["built-in", "custom"]),
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  version: z.number().int().positive(),
});

export const simulationDefinitionSchema = z.object({
  schemaVersion: z.literal(1),
  templateId: z.enum([
    "graph-v1",
    "sort-search-v1",
    "guided-lesson-v1",
    "memory-v1",
    "sequence-v1",
    "call-stack-v1",
    "linked-v1",
    "linear-adt-v1",
    "complexity-v1",
    "tree-v1",
    "trie-v1",
    "bitwise-v1",
    "recurrence-v1",
    "decision-tree-v1",
    "probabilistic-v1",
    "greedy-v1",
    "dp-grid-v1"
  ]),
  engineId: z.enum([
    "dijkstra",
    "bfs",
    "dfs",
    "binary-search",
    "insertion-sort",
    "guided",
    "pointers",
    "strings",
    "arrays",
    "structures",
    "dynamic-memory-allocation",
    "recursion",
    "linked-lists",
    "skip-lists",
    "stacks",
    "queues",
    "algorithm-analysis",
    "binary-trees",
    "binary-search-trees",
    "heaps",
    "tries",
    "bitwise-operators",
    "avl-trees",
    "b-trees",
    "red-black-trees",
    "treaps",
    "growth-of-functions",
    "big-o",
    "big-omega",
    "big-theta",
    "master-theorem",
    "divide-and-conquer",
    "backtracking",
    "bloom-filters",
    "greedy-algorithms",
    "dynamic-programming"
  ]),
  config: z.record(z.unknown()).default({}),
});

export const challengeSchema = z.object({
  id: z.string().min(1),
  objectiveId: z.string().min(1),
  difficulty: difficultySchema,
  kind: z.enum(["predict-next", "manipulate", "multiple-choice", "construct", "explain"]),
  prompt: z.string().min(1).max(500),
  evaluatorId: z.string().min(1),
  evaluatorParams: z.record(z.unknown()).default({}),
  hintSequence: z.array(z.string().max(240)).max(3).default([]),
  baseXp: z.number().int().min(0).max(100),
});

export const skillDefinitionSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  title: z.string().min(1).max(100),
  course: courseIdSchema,
  moduleId: z.string().min(1),
  description: z.string().min(1).max(400),
  aliases: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  prerequisites: z.array(z.string()).default([]),
  difficulty: difficultySchema,
  objectives: z.array(z.object({ id: z.string(), text: z.string(), tier: z.number().int().min(1).max(3) })).min(1),
  misconceptions: z.array(z.object({ id: z.string(), text: z.string() })).default([]),
  simulation: simulationDefinitionSchema,
  challenges: z.array(challengeSchema).default([]),
  capability: capabilitySchema,
  contentVersion: z.number().int().positive(),
});

export const catalogSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.string(),
  skills: z.array(skillDefinitionSchema),
}).superRefine((catalog, ctx) => {
  const ids = new Set<string>();
  for (const skill of catalog.skills) {
    if (ids.has(skill.id)) ctx.addIssue({ code: "custom", message: `Duplicate skill id: ${skill.id}` });
    ids.add(skill.id);
  }
  for (const skill of catalog.skills) for (const prerequisite of skill.prerequisites) {
    if (!ids.has(prerequisite)) ctx.addIssue({ code: "custom", message: `${skill.id} references missing prerequisite ${prerequisite}` });
  }
});

export type SkillDefinition = z.infer<typeof skillDefinitionSchema>;
export type SkillRef = z.infer<typeof skillRefSchema>;
export type SimulationDefinition = z.infer<typeof simulationDefinitionSchema>;
export type Capability = z.infer<typeof capabilitySchema>;
