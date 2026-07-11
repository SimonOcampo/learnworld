# BRIEFING — 2026-07-11T18:53:20Z

## Mission
Convert all 30 guided-visual skills in LearnWorld's CS1/CS2 catalog to fully interactive, user-customizable simulations.

## 🔒 My Identity
- Archetype: orchestrator
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: c:\Users\simon\Documents\GitHub\learnworld\.agents\orchestrator
- Original parent: top-level
- Original parent conversation ID: 5dee3c11-9ee9-48f3-b45c-14c15400e0d8

## 🔒 My Workflow
- **Pattern**: Project
- **Scope document**: c:\Users\simon\Documents\GitHub\learnworld\PROJECT.md
1. **Decompose**: Decompose the 30 skills into logical milestones/modules.
2. **Dispatch & Execute**:
   - **Direct (iteration loop)**: Explorer → Worker → Reviewer → test → gate
   - **Delegate (sub-orchestrator)**: When a milestone is large, spawn a sub-orchestrator.
3. **On failure**: Retry, Replace, Skip, Redistribute, Redesign, Escalate.
4. **Succession**: Self-succeed at 16 spawns, write handoff.md, spawn successor.
- **Work items**:
  1. Setup PROJECT.md [pending]
  2. Implement/upgrade 30 simulations [pending]
  3. Validate through automated checks [pending]
- **Current phase**: 1
- **Current focus**: Setup PROJECT.md

## 🔒 Key Constraints
- NEVER write, modify, or create source code files directly (delegate to workers).
- NEVER run build/test commands yourself (delegate to workers).
- Forensic Auditor audit is a binary veto.
- Update progress.md as a liveness heartbeat.

## Current Parent
- Conversation ID: 5dee3c11-9ee9-48f3-b45c-14c15400e0d8
- Updated: not yet

## Key Decisions Made
- None yet.

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|-------|------|-----------|--------|---------|
| explorer_1 | teamwork_preview_explorer | Codebase exploration & architecture design | completed | d6c9f09f-8057-477a-a5d4-2b767dacdfbf |
| worker_milestone_2 | teamwork_preview_worker | Schema, catalog, and type integration | completed | 6b566f34-acc4-4fd6-a94b-ad35bc849863 |
| worker_milestone_3 | teamwork_preview_worker | Core simulation engines implementation | completed | 363d4311-2fb4-438d-85a9-f8ba7375ec74 |
| worker_milestone_4 | teamwork_preview_worker | UI visualizers and custom inputs implementation | completed | 7b80fd24-4540-4130-aa4c-ccc4457ec2e5 |
| worker_milestone_5 | teamwork_preview_worker | QA tests, linting, build verification | completed | eec62b9f-46b8-4f58-b523-2f9785bfd024 |
| auditor_milestone_5 | teamwork_preview_auditor | Forensic integrity audit | completed | cdd493a3-61c6-4f21-a9f2-2a66a68c6113 |

## Succession Status
- Succession required: no
- Spawn count: 6 / 16
- Pending subagents: none
- Predecessor: none
- Successor: not yet spawned

## Active Timers
- Heartbeat cron: task-53
- Safety timer: none

## Artifact Index
- c:\Users\simon\Documents\GitHub\learnworld\.agents\orchestrator\original_prompt.md - Verbatim copy of original request
