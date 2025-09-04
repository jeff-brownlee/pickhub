## Persona Pick Selection Workflow

### Objective
Produce diversified, persona-aligned weekly picks using real data. Scoring is persona-agnostic; lightweight bias overlays (from personas.json) and constraints are layered on top to minimize correlation across personas.

### Tuning vs Persona Overlay (at a glance)
- Base tuning lives in `frontend/src/heuristics/marketScoring.ts` and affects every persona equally (global weights for features like stat margin, movement, public splits).
- Persona overlay lives in `frontend/src/services/pickSelectionService.ts` and nudges only that persona’s candidates (e.g., contrarian fades public, trenches favor ATS, totals lean Over/Under).

### Inputs
- `games.json`: odds/lines, `espnId`, kickoff time
  - Files: `frontend/src/scripts/generateNflGames.ts`
- Factbooks (`data/nfl/season-YYYY/week-WW/factbooks/*.json`): real team stats, leaders, coaching, line movement, Action Network trends, plus `statsSourceSeason`
  - Files: `frontend/src/scripts/generateFactbooks.ts`
- Personas: `frontend/public/data/personas.json` (name, tagline, bias, voiceStyle)
  - Note: `frontend/src/heuristics/personas.ts` is not used for selection; personas are driven by `personas.json`.

### Step 1 — Market scoring (persona-agnostic)
File: `frontend/src/heuristics/marketScoring.ts`
- `computeSpreadScore(fb)` → `{ score: 0–100, side: 'home'|'away', edge: pts, reasons[] }`
- `computeTotalScore(fb)` → `{ score: 0–100, direction: 'over'|'under', edge: pts, reasons[] }`
- `computeMoneylineScore(fb)` → `{ score: 0–100, side: 'home'|'away', edge: proxy, reasons[] }`

Primary signals used
- Spread: statistical margin (PPG vs PA), turnovers (discipline), defensive disruption (sacks+INTs), coaching experience delta, spread movement magnitude, public split magnitude
- Total: expected total (offense+defense blend) vs market, total movement confirmation, public O/U split, disruption (leans Under), passing tilt (leans Over)
- Moneyline: stat margin + record delta, ML steam, public ML split

Notes
- Normalized to 0–100 with clamps; `reasons[]` provides human-readable context
- Early-season quality: `statsSourceSeason === 2024` indicates prior-season fallback for PPG/PA

### Service integration — pickSelectionService
File: `frontend/src/services/pickSelectionService.ts`

Entrypoint invocation (from the generator script):

```ts
// frontend/src/scripts/generatePicks.ts
const res = await pickSelectionService.generateWeeklyPicksHeuristicsWithDecorrelation(
  games,
  factbooks,
  persona,
  week,
  exposures // shared across personas
);
```

What happens inside:
- Build candidates per game: `spread`, `total`, `moneyline` using Step 1 scoring
  - `buildCandidatesForGame(fb)` calls `computeSpreadScore/computeTotalScore/computeMoneylineScore`
- Apply persona overlay: `applyBiasOverlay(cand, persona, factbook)` (uses `persona.bias` from `personas.json` only)
  - Examples: contrarian favors less popular sides; over/under leans; “trenches/discipline” favors ATS over ML; favorites/dogs; heavy ML chalk penalty
- Enforce constraints (see Step 3)
- Materialize UI picks: `candidateToPick(...)` converts to the legacy UI schema and composes a readable rationale from scoring `reasons`
- Return `WeeklyPickSelection` with `picks` (later wrapped into the legacy envelope in the script)

Tuning knobs:
- Base weights live in `frontend/src/heuristics/marketScoring.ts`
- Persona overlay weights live in `frontend/src/services/pickSelectionService.ts` (`applyBiasOverlay`)

### Step 2 — Persona weighting (bias overlay)
- Files: `frontend/src/services/pickSelectionService.ts` (`applyBiasOverlay`)
- Apply a lightweight overlay inferred from `persona.bias`/`tagline` (e.g., contrarian → favor less popular sides; over/under lean; favorite/underdog lean).
- Optional data-quality factor: lightly down-weight when prior-season stats are used.

Result: `personaScore = baseScore + biasBonus`

### Step 3 — Constraints (per persona)
- Files: `frontend/src/services/pickSelectionService.ts` (enforced in selection loop)
- Fixed picks per persona per week: N (configurable; default N = 5)
- Per-game cap: max 2 picks
  - Allowed combos: ATS + Total OR Moneyline + Total
  - Disallow: ATS + Moneyline from same game; no both sides (e.g., Over+Under)
- Minimum edge threshold; expand if needed to reach N

### Step 4 — Cross-persona decorrelation
- Personas are selected sequentially (deterministic order or rotated weekly) while maintaining a shared exposure map.
- Overlap penalties are applied to later personas so they naturally drift from already-selected picks.

- Files:
  - `frontend/src/services/pickSelectionService.ts` (`generateWeeklyPicksHeuristicsWithDecorrelation`, `computeDecorrelationPenalty`, `updateExposuresAfterSelection`)
  - `frontend/src/scripts/generatePicks.ts` (creates and passes shared `exposures` object)

Current thresholds (defaults):
- Exact pick overlap (same game + market + side): allow up to 2 personas. 3rd+ gets a heavy penalty.
- Same game, different market: light penalty starting with the 3rd pick from that game.
- Team exposure: soft cap of 4 total picks involving the same team; 5th+ incurs a medium penalty.
- Moneyline chalk crowding: ML favorites priced ≤ -200 capped at 3 across the week; additional picks incur a medium penalty.
- Public alignment crowding: if public ≥ 65% on that side, allow up to 6 such picks week-wide; additional picks incur a medium penalty (contrarian personas may still receive bias bonuses for fading).

Mechanics:
- For each candidate: `penalizedScore = adjustedScore - decorrelationPenalty(exposures)`.
- Greedy selection with constraints; if a persona cannot reach N picks, penalties are relaxed slightly (hard caps remain).

### Step 6 — Output
- Picks are written to `frontend/public/data/nfl/season-YYYY/week-WW/picks/{personaId}.json` by `frontend/src/scripts/generatePicks.ts`.
- Files: `frontend/src/scripts/generatePicks.ts`
- We adhere to the legacy UI envelope for compatibility:

```json
{
  "analystId": "coach",
  "week": 1,
  "season": 2025,
  "picks": [
    {
      "gameId": "2025-09-07-det-gb",
      "gameDate": "2025-09-07T20:25:00.000-04:00",
      "awayTeam": { "id": "DET", "name": "Lions", "nickname": "Lions", "score": null },
      "homeTeam": { "id": "GB", "name": "Packers", "nickname": "Packers", "score": null },
      "marketData": {
        "spread": { "away": { "line": 1.5, "odds": -110 }, "home": { "line": -1.5, "odds": -110 } },
        "total": { "over": { "line": 47.5, "odds": -110 }, "under": { "line": 47.5, "odds": -110 } },
        "moneyline": { "away": { "odds": 110 }, "home": { "odds": -130 } }
      },
      "selection": { "betType": "spread", "side": "away", "line": 1.5, "odds": -110, "units": 1, "rationale": "..." },
      "result": { "status": "pending", "finalLine": 0, "finalOdds": 0, "payout": 0, "netUnits": 0 }
    }
  ],
  "weekSummary": { "totalPicks": 5, "totalUnits": 5, "weekPayout": 0, "weekNetUnits": 0 }
}
```

### Step 7 — Rationale generation
- Current: rationale is composed from scoring cues into a concise summary.
- Planned: call the ChatGPT service with a compact payload (persona, selection, factbook slice, trends/line movement, and cues) to replace with a personality-driven narrative.
- Files: `frontend/src/services/chatgptRationaleService.ts` (planned), call site in `frontend/src/scripts/generatePicks.ts` (planned)

### Step 8 — Leaderboard
- Results script grades picks, updates units, and writes `leaderboard.json` for the week
- Files: results updater script (pending); see `docs/DATA_PIPELINE.md`

### Data provenance (PPG/PA fallback)
- Week 1 uses 2025 where available; if zero, fallback to 2024 regular-season record endpoint to populate PPG/PA
- Example endpoint: `.../seasons/2024/types/2/teams/{teamId}/record` (avgPointsFor, avgPointsAgainst)

### Future extensions
- Persona config file for weights and overlap penalties
- Strength-of-schedule and injury integration
- Key-number awareness for ATS sizing


