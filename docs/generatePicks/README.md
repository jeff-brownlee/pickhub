## Persona Pick Selection Workflow

### Objective
Produce diversified, persona-aligned weekly picks using real data. Scoring is persona-agnostic; lightweight bias overlays (from personas.json) and constraints are layered on top to minimize correlation across personas.

### Tuning vs Persona Overlay (at a glance)
- Base tuning is global and affects every persona equally (e.g., stat margins, movement, public splits).
- Persona overlay nudges a persona’s candidates toward their style (e.g., contrarian, trenches, totals lean).

### Inputs
- Games (week): odds/lines, `espnId`, kickoff time
  - Files: `frontend/src/scripts/generateNflGames.ts` -> `data/nfl/season-YYYY/week-WW/games.json`
- Factbooks (per game): team stats, leaders, coaching, line movement, public betting trends, and `statsSourceSeason`
  - Files: `frontend/src/scripts/generateFactbooks.ts` -> `data/nfl/season-YYYY/week-WW/factbooks/*.json`
- Personas: `personas.json` (name, tagline, bias, voiceStyle). Note: biases come only from this file.
  - Note: `frontend/src/heuristics/personas.ts` is not used for selection; personas are driven by `personas.json`. -> `frontend/public/data/personas.json`

### Step 1 — Market scoring (persona-agnostic)
- Score ATS, Total, and Moneyline candidates per game using normalized signals (stat margins, disruption, coaching deltas, line movement, public splits).
- Provide concise reason strings for transparency.
- Early-season quality: `statsSourceSeason` indicates if prior-season data was used.
  - Files: `frontend/src/heuristics/marketScoring.ts`

### Orchestration overview
- Data generation runs locally: generate games → factbooks → persona picks.
- Selection pipeline: market scoring → persona weighting → constraints → cross-persona decorrelation.
- Output: one JSON per persona per week in the public data tree for the UI (legacy envelope preserved).

### Step 2 — Persona weighting (bias overlay)
- Apply a lightweight overlay inferred from `persona.bias`/`tagline` (e.g., contrarian → favor less popular sides; over/under lean; favorite/underdog lean).
- Optional data-quality factor: lightly down-weight when prior-season stats are used.

Result: `personaScore = baseScore + biasBonus`

### Step 3 — Constraints (per persona)
- Fixed picks per persona per week: N (configurable; default N = 5)
- Per-game cap: max 2 picks
  - Allowed combos: ATS + Total OR Moneyline + Total
  - Disallow: ATS + Moneyline from same game; no both sides (e.g., Over+Under)
- Minimum edge threshold; expand if needed to reach N

### Step 4 — Cross-persona decorrelation
- Personas are selected sequentially (deterministic order or rotated weekly) while maintaining a shared exposure map.
- Overlap penalties are applied to later personas so they naturally drift from already-selected picks.

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


