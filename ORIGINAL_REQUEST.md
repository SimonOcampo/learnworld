# Original User Request

## Initial Request — 2026-07-11T18:52:38Z

Convert all 30 guided-visual skills in LearnWorld's CS1/CS2 catalog to fully interactive, user-customizable simulations, similar to Dijkstra and Insertion Sort. Each skill should have its own custom visualizer interface and simulation engine.

Working directory: c:\Users\simon\Documents\GitHub\learnworld
Integrity mode: development

## Requirements

### R1. Fully Interactive Simulations for All 30 Guided Skills
Convert all 30 skills in `content/curriculum/catalog.json` that are currently marked as `guided-visual` (e.g., pointers, strings, AVL trees, bitwise operators, bloom filters, recursion, etc.) to `full-interactive` capability. Build a custom simulation engine and specific interactive visualizer for each skill's core concepts.

### R2. User-Customizable Inputs for Each Simulation
Provide UI controls (such as text/number inputs, dropdowns, toggle buttons, or sliders) for each of the 32 simulations. Users must be able to customize the parameters (e.g., custom arrays/values, target search items, recursion input numbers/depth, memory addresses, pointer dereferences, structures, or tree node insertion sequences) and step through the simulation.

### R3. Style & Architecture Integration
- Integrate all 32 simulations into the existing workspace, extending `components/SimulationShell.tsx` and updating `lib/catalog.ts`, `lib/types.ts`, `lib/simulations/registry.ts`, and `lib/engines.ts`.
- Ensure all new components strictly match the existing retro-modern LearnWorld style (curated color palettes, bold borders, clear panel designs, and responsive layouts).

## Acceptance Criteria

### Automated Quality Checks
- [ ] `npm run curriculum:validate` runs successfully and passes validation.
- [ ] `npm run build` compiles with zero Next.js / TypeScript errors.
- [ ] `npm run lint` passes with no ESLint errors or warnings.
- [ ] `npm run test` passes all unit tests, including new unit tests for the 30 new engines.

### UI & UX Verification
- [ ] When launching any skill, the user is presented with a fully interactive simulator instead of the generic static step-by-step text blocks.
- [ ] Every simulation contains clear input fields or controls allowing customization, which immediately update/reset the simulation state.
- [ ] The simulation allows stepping forward/backward or autoplay, displaying pseudocode line-highlighting and live variables dynamically.
