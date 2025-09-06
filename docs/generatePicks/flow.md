### End-to-end pipeline (current)

- Generate games
  - Script: frontend/src/scripts/generateNflGames.ts
  - Output: data/nfl/season-2025/week-XX/games.json

- Generate factbooks
  - Script: frontend/src/scripts/generateFactbooks.ts
  - Output: data/nfl/season-2025/week-XX/factbooks/*.json

- Generate picks (and scoring log)
  - Command: npm --prefix frontend run generate-picks -- <week>
  - Inside this script:
    - Computes market scores once (debug variants) for every game
    - Writes audit log: data/nfl/season-2025/week-XX/scoring/market-score.json
    - Passes those exact scores to selection
    - Selection: market scoring (precomputed) → persona weighting → constraints (5 picks; max 2/game; (ATS|ML)+Total) → cross-persona decorrelation
    - Writes per‑persona picks: frontend/public/data/nfl/season-2025/week-XX/picks/{personaId}.json

- Frontend/UI
  - Reads only from frontend/public/data/... (games, picks, leaderboard)

- Later (grading + leaderboard)
  - Grade picks, update result.status/payout/netUnits, write leaderboard.json (script pending)

Quick runbook:
- npm --prefix frontend run generate-games -- <week>
- npm --prefix frontend run generate-factbooks -- <week>
- npm --prefix frontend run generate-picks -- <week> (creates picks + scoring log)


Here’s the generate-picks flow at a glance.

- Entry point
  - Script: `frontend/src/scripts/generatePicks.ts`
  - Run: `npm --prefix frontend run generate-picks -- <week>`

- Load inputs
  - Reads `games.json` from `data/nfl/season-2025/week-<WW>/games.json`
  - Reads all factbooks from `data/nfl/season-2025/week-<WW>/factbooks/*.json`
  - Reads personas from `frontend/public/data/personas.json`

- Compute market scoring (once) + write audit log
  - Uses debug scoring functions from `frontend/src/heuristics/marketScoring.ts`:
    - `computeSpreadScoreDebug(fb)`
    - `computeTotalScoreDebug(fb)`
    - `computeMoneylineScoreDebug(fb)`
  - Writes trace to `data/nfl/season-2025/week-<WW>/scoring/market-score.json`
  - Builds a precomputed scores map keyed by `gameId`

- Select picks for each persona
  - Calls `pickSelectionService.generateWeeklyPicksHeuristicsWithDecorrelation(...)` from `frontend/src/services/pickSelectionService.ts` with:
    - `games`, `factbooks`, current `persona`, `week`
    - Shared `exposures` object (for cross-persona decorrelation)
    - The precomputed scores map (so selection uses exactly what was logged)
  - Inside the service:
    - Builds per-game candidates via `buildCandidatesForGame` (uses precomputed scores)
    - Applies persona weighting (`applyBiasOverlay`)
    - Enforces constraints (5 picks; max 2/game; allowed combos (ATS|ML)+Total)
    - Applies cross-persona decorrelation penalties with the shared `exposures`
    - Converts to UI picks (`candidateToPick`), setting `selection.rationale` summary and locking `result.finalLine/finalOdds`

- Write outputs
  - One file per persona:
    - `frontend/public/data/nfl/season-2025/week-<WW>/picks/{personaId}.json`
    - Legacy envelope: `{ analystId, week, season, generatedAt, picks[], weekSummary }`
  - Audit log already written to:
    - `data/nfl/season-2025/week-<WW>/scoring/market-score.json`

No other scripts are invoked by generate-picks; it imports functions/services directly:
- Scoring (debug): `frontend/src/heuristics/marketScoring.ts`
- Selection: `frontend/src/services/pickSelectionService.ts`