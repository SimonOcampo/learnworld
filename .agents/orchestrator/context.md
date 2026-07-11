# Project Context

## Overview
LearnWorld has 32 skills. Currently:
- 2 are fully interactive: `sorting` (Insertion Sort) and `graph-algorithms` (Dijkstra).
- 30 are `guided-visual` using the basic `guided-engine.ts` which has a simple 3-step walkthrough.

We need to make all 30 skills fully interactive, meaning:
1. They must have capability `full-interactive`.
2. They must have a custom simulation engine producing structured events (`SimulationEvent`) and states (`SimulationSnapshot`).
3. They must have UI controls in the simulator so users can customize the inputs and step through them.
4. They must integrate with `SimulationShell.tsx`.

## Code Locations
- Catalog: `content/curriculum/catalog.json`
- Types: `lib/types.ts`
- Validation Schema: `lib/schemas/skill.ts`
- Engines: `lib/engines.ts`
- Registry: `lib/simulations/registry.ts`
- Shell: `components/SimulationShell.tsx`
