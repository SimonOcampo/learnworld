# LearnWorld

LearnWorld turns lecture notes into deterministic, explorable algorithm simulations. The MVP includes Dijkstra, BFS, DFS, binary search, and insertion sort across two reusable visual labs.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Create a new Gemini API key and place it in `.env.local`. Do not reuse any key that has been shared in chat or committed elsewhere. Without a key, compilation and tutoring gracefully use curated local lessons.

## Verify

```bash
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

The app accepts pasted notes or a PDF up to 20 MB / 100 pages. Sessions are intentionally ephemeral; there is no authentication or database.
