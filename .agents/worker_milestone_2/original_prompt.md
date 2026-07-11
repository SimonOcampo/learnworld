## 2026-07-11T18:55:16Z
Your working directory is: c:\Users\simon\Documents\GitHub\learnworld\.agents\worker_milestone_2
Your identity: Archetype 'teamwork_preview_worker'.
Your mission: Implement Milestone 2 (Catalog & Type Integration) for the LearnWorld CS1/CS2 catalog upgrade.

Specifically, you must:
1. Update `lib/types.ts`:
   - Extend `conceptIds` array to include the 30 new snake_case concepts corresponding to the 30 guided-visual skills.
   - Extend `TemplateId` to include all the new template IDs: "memory", "sequence", "call-stack", "linked", "linear-adt", "complexity", "tree", "trie", "bitwise", "recurrence", "decision-tree", "probabilistic", "greedy", "dp-grid".
   - Define custom Scenario types (e.g., MemoryScenario, SequenceScenario, CallStackScenario, LinkedScenario, LinearAdtScenario, ComplexityScenario, TreeScenario, TrieScenario, BitwiseScenario, RecurrenceScenario, BacktrackingScenario, BloomScenario, GreedyScenario, DPScenario) in `lib/types.ts` as described in `.agents/explorer_1/analysis.md`.
2. Update `lib/schemas/skill.ts`:
   - Update `simulationDefinitionSchema` Zod enums for `templateId` and `engineId` to allow the new templates and engines.
3. Update `content/curriculum/catalog.json`:
   - Convert all 30 skills currently marked "guided-visual" to "full-interactive" capability.
   - Update their `simulation` object's `templateId` and `engineId` fields to their new values (e.g., pointers templateId to "memory-v1" and engineId to "pointers").
4. Update `lib/catalog.ts`:
   - Extend `conceptMeta` to support all 30 new concepts with their labels, descriptions, template IDs, and color mappings.
   - Extend `fallbackLesson` and `detectConcept` to handle the new concept IDs.
5. Verify changes:
   - Run `npm run curriculum:validate` to ensure catalog validation passes successfully.
   - Run `npm run lint` or check that there are no TypeScript compile errors.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

When completed, write a handoff report in your working directory and message the parent.
