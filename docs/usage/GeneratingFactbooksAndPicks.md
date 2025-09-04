## Generating Games, Factbooks, and Picks

This guide walks through the end-to-end local flow for a given NFL week.

### Prerequisites
- From the repo root, install frontend deps once:
```bash
cd frontend && npm install
```

### 1) Generate games (ESPN odds + metadata)
- Script: `frontend/src/scripts/generateNflGames.ts`
- Usage (from `frontend/`):
```bash
npx tsx src/scripts/generateNflGames.ts 1
```
- Output: `data/nfl/season-2025/week-01/games.json`

Notes
- Uses ESPN API (season=2025, seasonType=2 Regular). Each game includes `espnId` for downstream odds/line movement.

### 2) Generate factbooks (real team data + odds context)
- Script: `frontend/src/scripts/generateFactbooks.ts`
- Usage (from `frontend/`):
```bash
npx tsx src/scripts/generateFactbooks.ts 1
```
- Output dir: `data/nfl/season-2025/week-01/factbooks/` (one JSON per game)

What’s inside
- Team records/statistics/leaders/coaching
- Betting context: current line, line movement (via ESPN odds), Action Network betting trends
- Week 1 fallback: if 2025 stats are zero, pulls PPG/PA from 2024 regular-season records and sets `statsSourceSeason: 2024`

### 3) Generate persona picks (legacy UI schema)
- Script: `frontend/src/scripts/generatePicks.ts`
- Usage (from `frontend/`):
```bash
npx tsx src/scripts/generatePicks.ts 1
```
- Output dir (served by Vercel):
```
frontend/public/data/nfl/season-2025/week-01/picks/
```
  - Files: `{personaId}.json` with legacy envelope:
```json
{
  "analystId": "coach",
  "week": 1,
  "season": 2025,
  "picks": [ /* 5 picks matching UI schema */ ],
  "weekSummary": { "totalPicks": 5, "totalUnits": 5, "weekPayout": 0, "weekNetUnits": 0 }
}
```

How it works
- Uses `marketScoring.ts` (persona-agnostic) + a lightweight overlay from `personas.json` bias/tagline
- Enforces constraints: 5 picks/persona, max 2 per game, only (ATS|ML)+Total combos

### 4) View in the UI
- Start dev server:
```bash
npm run dev
```
- Open `http://localhost:5173/picks` and select an analyst/week.

### Troubleshooting
- If the Picks page shows no data, verify outputs exist under `frontend/public/data/nfl/season-2025/week-01/picks/` and match the legacy schema (see example above).
- If factbooks show zeros in Week 1, confirm the fallback ran (check `statsSourceSeason` field inside factbook JSON).


