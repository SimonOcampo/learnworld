## 2026-07-11T19:03:28Z
Your working directory is: c:\Users\simon\Documents\GitHub\learnworld\.agents\worker_milestone_4
Your identity: Archetype 'teamwork_preview_worker'.
Your mission: Implement Milestone 4 (UI Visualizers & Input Controls) for the LearnWorld CS1/CS2 catalog upgrade.

Specifically, you must:
1. Create the visualizer React components under `components/simulations/` in the retro-modern retro styling (curated color palettes, bold borders, clear panel designs, and responsive layouts). Create components for the 14 families:
   - `MemoryLab.tsx` (pointers, structures, dynamic-memory-allocation)
   - `SequenceLab.tsx` (strings, arrays)
   - `CallStackLab.tsx` (recursion)
   - `LinkedLab.tsx` (linked-lists, skip-lists)
   - `LinearAdtLab.tsx` (stacks, queues)
   - `ComplexityLab.tsx` (algorithm-analysis, growth-of-functions, big-o, big-omega, big-theta)
   - `TreeLab.tsx` (binary-trees, binary-search-trees, heaps, avl-trees, b-trees, red-black-trees, treaps)
   - `TrieLab.tsx` (tries)
   - `BitwiseLab.tsx` (bitwise-operators)
   - `RecurrenceLab.tsx` (master-theorem, divide-and-conquer)
   - `BacktrackingLab.tsx` (backtracking)
   - `BloomLab.tsx` (bloom-filters)
   - `GreedyLab.tsx` (greedy-algorithms)
   - `DpLab.tsx` (dynamic-programming)

2. Update `components/SimulationShell.tsx`:
   - Import all the new visualizers.
   - Wire them up in the JSX rendering block based on `meta.template` or the concept's template ID.
   - In the JSX controls bar, add custom form controls (text/number inputs, dropdowns, toggle buttons, or sliders) for each template type (or concept type) so that users can customize the parameters (e.g., custom array values, recursion bounds, pointer allocations, node sequences, constants, word lists, bitwise values, dp strings). The inputs should statefully update the local scenario states (which reset the simulation step to 0 and re-initialize the engine run).

3. Update `components/Home.tsx`:
   - Extend `interactiveConcept` record to map all 32 skill IDs (catalog kebab-case) to their corresponding 32 ConceptId values (types snake_case) so that all 32 concepts load via the interactive SimulationShell rather than GuidedSkill.

4. Verification:
   - Verify that `npm run build` compiles without Next.js/TypeScript errors.
   - Verify that `npm run lint` passes without ESLint warnings or errors.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

When completed, write a handoff report in your working directory and message the parent.
