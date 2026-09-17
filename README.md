# DraftPulse

> **Experimental.** APIs, scoring weights, and UX may change without notice. Not a production product.

Live draft scoring for X posts. Pause typing (~500ms) and get viral-dimension scores plus a category label.

Powered by [TypeSafe Jev](https://docs.typesafe.ai/) when `TYPESAFE_API_KEY` is set; otherwise a deterministic mock heuristic keeps the UI working.

## Setup

```bash
npm install
cp .env.example .env
# put your TypeSafe key in .env — never commit .env
npm run dev
```

- UI: http://localhost:5174
- API: http://localhost:8787

```bash
npm run test:compose
```

## How scoring works

Jev answers several narrow questions in one call (category + hook / specificity / reply / share / dwell + slop risk). Code combines them with weights in `server/weights.ts` ([composite scoring](https://docs.typesafe.ai/patterns/composite-scoring.md)).

Calibration plan: [`docs/data-loop.md`](docs/data-loop.md). Collect outcomes via the X API, your own posts, or licensed archives. **Do not scrape X.**

## Secrets

- Keep `TYPESAFE_API_KEY` in `.env` only (gitignored).
- `.env.example` is a blank template and is safe to commit.
- The API key must stay server-side; the browser never receives it.

## Disclaimer

Scores are heuristics, not a guarantee of reach. Negative ranking signals (mute, not-interested, report) matter as much as likes.
