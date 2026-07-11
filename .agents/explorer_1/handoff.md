# Handoff Report - explorer_1

## 1. Observation
We have inspected the following key files in the repository:
1. `content/curriculum/catalog.json` containing 32 curriculum skills. Only 2 are currently marked as `"capability": "full-interactive"` (line 15: sorting, and line 36: graph-algorithms). The remaining 30 skills are marked as `"capability": "guided-visual"`.
2. `lib/types.ts` defining `conceptIds` on line 3:
   `export const conceptIds = ["dijkstra", "bfs", "dfs", "binary_search", "insertion_sort"] as const;`
3. `lib/schemas/skill.ts` defining Zod schema enums for templates and engines on lines 15–16:
   `templateId: z.enum(["graph-v1", "sort-search-v1", "guided-lesson-v1"]),`
   `engineId: z.enum(["dijkstra", "bfs", "dfs", "binary-search", "insertion-sort", "guided"]),`
4. `lib/engines.ts` containing the core execution engines on line 204:
   `export const engines = { dijkstra: dijkstraEngine, bfs: bfsEngine, dfs: dfsEngine, binary_search: binarySearchEngine, insertion_sort: insertionSortEngine };`
5. `lib/simulations/registry.ts` mapping concept IDs to their templates and initializers on lines 9–15:
   `export const engineRegistry: Record<ConceptId, EngineRegistration> = { ... };`
6. `components/SimulationShell.tsx` rendering labs dynamically based on snapshot presence on line 80:
   `{graphSnapshot ? <GraphLab scenario={graph} snapshot={graphSnapshot} weighted={concept === "dijkstra"} /> : arraySnapshot ? <ArrayLab snapshot={arraySnapshot} concept={concept as "binary_search" | "insertion_sort"} /> : null}`
7. `components/Home.tsx` routing interactive concept selections on line 17:
   `const interactiveConcept: Record<string, ConceptId> = { sorting: "insertion_sort", "graph-algorithms": "dijkstra" };`

All these observations confirm the static versus interactive design limits currently present in LearnWorld.

---

## 2. Logic Chain
- **Step 1**: The user request asks to convert 30 `guided-visual` skills to `full-interactive`.
- **Step 2**: Based on the catalog parsing in `catalog.json` and the mapping in `components/Home.tsx` (`interactiveConcept`), only `sorting` and `graph-algorithms` currently launch `SimulationShell` with interactive visualizers. The remaining 30 skills bypass it and render the static `GuidedSkill` component (defined in `components/Home.tsx:51`) using a rule-based `GuidedSimulation` layout.
- **Step 3**: To support full interactivity, we must map all 30 skill IDs in `interactiveConcept` in `components/Home.tsx` to launch `SimulationShell`.
- **Step 4**: To enable customized inputs (R2), `SimulationShell.tsx` needs visual control forms for each family of inputs, and `registry.ts` needs custom scenario initializers.
- **Step 5**: To prevent `lib/engines.ts` from becoming a bloated monolith, new engines should be written inside family-grouped files under `lib/simulations/engines/` and then re-exported.
- **Step 6**: The enums in schemas (`lib/schemas/skill.ts`) and concept types (`lib/types.ts`) must be updated to validate the 30 new concepts, templates, and engine IDs.

This reasoning links our exact observations directly to the recommended architectural plan in `analysis.md`.

---

## 3. Caveats
- We did not implement the actual engines or visualizers as this is a read-only investigation, per the constraints of the Dispatch message.
- We assumed that all 30 engines should follow the deterministic step-by-step model currently implemented by `dijkstraEngine` and `insertionSortEngine`.
- No styling adjustments were directly made; it is assumed the implementer will co-locate component CSS and match LearnWorld's retro-modern palette.

---

## 4. Conclusion
We have completed the architectural design to upgrade LearnWorld's curriculum. The technical proposal is saved at `.agents/explorer_1/analysis.md` and details:
- A clean, modular engine directory layout grouping 30 algorithms into 14 family files.
- The schema modifications required for enums and types.
- The customizable UI controls and validations for all families of skills.
- The dynamic component routing inside `SimulationShell.tsx`, `registry.ts`, and `Home.tsx`.

---

## 5. Verification Method
To verify this proposed architecture:
1. Re-read the technical proposal `.agents/explorer_1/analysis.md` to ensure all 30 skills are listed and account for custom inputs.
2. Confirm that proposed schema updates compile by verifying typescript signatures for `ConceptId` and `TemplateId` enums match the files `lib/types.ts` and `lib/schemas/skill.ts`.
3. Check the project status checks by running:
   - `npm run curriculum:validate` (should validate successfully once schemas and catalog.json capability values are updated)
   - `npm run test` (Vitest run verifying all tests pass)
