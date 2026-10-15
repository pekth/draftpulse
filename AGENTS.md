# draftpulse

Project facts for coding agents and contributors.

Experimental live viral-dimension scorer for X post drafts. Vite + TypeScript web app with a `tsx` API server.

## Layout

- `src/`: web client. `server/`: API (`server/index.ts`). `scripts/verify-compose.ts`: compose check.
- `.env.example`: required environment variable names; never commit real values.

## Verify

Matches CI (`.github/workflows/`):

- `npm ci --no-audit --no-fund`
- `npm run lint`
- `npm run build`
- `npm run test:compose`
- Dev: `npm run dev` runs API and web together.

## Docs

- Facts and known gaps: [`docs/KB.md`](docs/KB.md). Update it in the same change when a documented fact changes.

## Issues and PRs

Issue forms in `.github/ISSUE_TEMPLATE/` apply the `bug`, `feature`, and `chore` labels.
