## 2026-07-11T18:53:36Z
Your working directory is: c:\Users\simon\Documents\GitHub\learnworld\.agents\explorer_1
Your identity: Archetype 'teamwork_preview_explorer'.
Your mission: Analyze the LearnWorld codebase and design the architecture to convert 30 guided-visual skills to full-interactive capability.
Specifically, please:
1. Examine `content/curriculum/catalog.json`, `lib/types.ts`, `lib/schemas/skill.ts`, `lib/engines.ts`, `lib/simulations/registry.ts`, and `components/SimulationShell.tsx`.
2. Propose a plan to support custom user inputs and a custom simulation engine for each of the 30 skills. Detail what controls are needed for each skill (or family of skills) to fulfill R2 (User-Customizable Inputs).
3. Recommend how the engines should be structured (e.g. inside `lib/engines.ts` or in separate engine files imported by `lib/engines.ts`).
4. Detail the changes needed in type schemas to allow new concepts and engine IDs.
5. Create a detailed technical proposal file `analysis.md` in your working directory and message the parent once done. Include exact file pathways, proposed code modifications, and UI design sketches/logic.
