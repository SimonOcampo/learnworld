# LearnWorld

LearnWorld is a local-first, gamified computer-science learning platform. It bundles a validated 32-skill CS1/CS2 catalog, lets learners assemble multi-topic quests, runs supported algorithms through deterministic TypeScript engines, and grounds Gemini tutoring in the exact simulation state.

## Included

- Searchable CS1/CS2 curriculum with prerequisite and capability metadata.
- Multi-select, reorderable, vertically scrolling learning quests.
- Interactive Dijkstra and insertion-sort experiences backed by the existing graph/array engine registry.
- Explicit guided-visual fallback for topics whose deterministic template is not implemented yet.
- Browser-local XP, levels, mastery evidence, streaks, achievements, custom skills, and JSON import/export through IndexedDB.
- Custom text/PDF generation with built-in-topic matching, preview-before-save, schema validation, and no generated executable code.
- Structured, state-aware Gemini tutoring with server-only secrets and curated offline fallbacks.
- Development-time PDF curriculum ingestion into reviewable JSON; built-ins never require runtime Gemini calls.

## Run and verify

```bash
npm install
cp .env.example .env.local
npm run dev
npm run lint
npm test
npm run build
npm run test:e2e
npm run curriculum:validate
```

`GEMINI_API_KEY` is optional for the built-in curriculum and deterministic simulations. Without it, tutoring and text-based custom drafts use safe local fallbacks. Keep the key server-side and never prefix it with `NEXT_PUBLIC_`.

## Curriculum preprocessing

Place licensed PDFs in `content/sources/` (ignored by Git), then run:

```bash
npm run curriculum:ingest -- --course cs1 --source content/sources/cs1.pdf --dry-run
npm run curriculum:ingest -- --course cs1 --source content/sources/cs1.pdf
```

The script validates the PDF signature, hashes the source, asks Gemini for schema-constrained skill data, validates it, and writes only to the ignored `content/review/` staging area. Review and promote approved JSON into `content/curriculum/`, then run `npm run curriculum:validate`.

PDF uploads are capped at 20 MB in application code; confirm the request-body and duration limits of the chosen deployment platform before advertising that limit in production.
