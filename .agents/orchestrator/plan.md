# Orchestrator Plan

## Goal
Convert 30 guided-visual skills in catalog.json to full-interactive capability with custom engines and customizable inputs.

## Strategy
1. **Milestone 1: Exploration** - Spawn `teamwork_preview_explorer` to analyze how the engines and UI components should be designed. We want to design customizable inputs and interactive visualizer strategies for all 30 skills.
2. **Milestone 2: Schema & Type Integration** - Spawn a worker to update `lib/types.ts`, `lib/schemas/skill.ts`, `lib/catalog.ts`, and `content/curriculum/catalog.json`.
3. **Milestone 3: Engine Implementations** - Spawn worker(s) to implement the 30 new simulation engines in a modular way (e.g. under `lib/simulations/engines/` or directly in `lib/engines.ts`).
4. **Milestone 4: UI Implementations** - Spawn worker(s) to implement visualizers and customize controls in `components/SimulationShell.tsx` and custom lab components.
5. **Milestone 5: Verification & Quality Gate** - Verify that `npm run lint`, `npm run build`, and `npm run test` pass, and run a forensic audit.
