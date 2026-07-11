# Project: LearnWorld 30 Simulations Upgrade

## Architecture
We need to convert 30 `guided-visual` skills in the catalog to `full-interactive` capability.
We will extend:
- `lib/types.ts` for new concept IDs and state shapes.
- `lib/schemas/skill.ts` to allow new concept IDs, template IDs, and engine IDs.
- `lib/engines.ts` with 30 new simulation engines or dynamic engines that process the custom inputs.
- `lib/simulations/registry.ts` to register the new engines and define default inputs.
- `components/SimulationShell.tsx` to handle visual rendering and customizable inputs.
- `content/curriculum/catalog.json` to update capability, templateId, and engineId.

We will introduce custom visualizers for each family or skill to keep UI codebase clean and modular.

## Code Layout
- `lib/types.ts` - types and interfaces
- `lib/schemas/skill.ts` - zod schemas for validation
- `lib/engines.ts` - execution engines
- `lib/simulations/registry.ts` - concept registry mapping
- `components/SimulationShell.tsx` - core shell component and layouts
- `content/curriculum/catalog.json` - skills catalog definitions

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Architecture & Exploration | Research codebase, design customizable inputs, engines, and visualizers | None | DONE |
| 2 | Catalog & Type Integration | Update `lib/types.ts`, `lib/schemas/skill.ts`, `lib/catalog.ts`, and `content/curriculum/catalog.json` | M1 | DONE |
| 3 | Core Simulation Engines | Implement 30 engines in `lib/engines.ts` or as modular engines | M2 | DONE |
| 4 | UI Visualizers & Input Controls | Implement UI components for customizable inputs and visual representation | M3 | DONE |
| 5 | E2E Testing & Verification | Write tests, verify Next.js build, linting, and vitest runs | M4 | DONE |

## Interface Contracts
- Each engine must satisfy `SimulationEngine<I, S>` from `lib/types.ts`.
- Input parameters must support custom initial values which re-initialize the engine.
