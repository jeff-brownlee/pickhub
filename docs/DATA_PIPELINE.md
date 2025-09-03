# PickHub Data Pipeline Documentation

## Overview
This document describes the data pipeline for generating NFL game data and factbooks for the PickHub heuristic pick selection system.

## Pipeline Steps

### 1. Pull ESPN NFL Data (`pullEspnNfl.ts`)
**Purpose**: Fetches game data and odds from ESPN API for a specific week.

**Command Line Usage**:
```bash
cd frontend
npx ts-node src/scripts/pullEspnNfl.ts [week]
```

**Parameters**:
- `week` (optional): Week number (default: 1)
  - Example: `npx ts-node src/scripts/pullEspnNfl.ts 1`

**Output**:
- Creates: `data/nfl/season-2025/week-XX/games.json`
- Contains: Game data with real odds (spread, total, moneyline)

**What it does**:
- Fetches game schedule and odds from ESPN API
- Parses and formats the data
- Saves to structured JSON files
- Creates directory structure if needed

---

### 2. Generate Factbooks (`generateFactbooks.ts`)
**Purpose**: Creates comprehensive factbooks for each game using real ESPN API data for all 32 NFL teams.

**Command Line Usage**:
```bash
cd frontend
# Compile TypeScript to JavaScript
npx tsc src/scripts/generateFactbooks.ts --outDir dist --target es2020 --module commonjs --esModuleInterop

# Run the compiled script
node dist/scripts/generateFactbooks.cjs [week] [limit]
```

**Parameters**:
- `week` (optional): Week number (default: 1)
- `limit` (optional): Number of games to process for debugging (default: all games)
  - Example: `node dist/scripts/generateFactbooks.cjs 1` (all games)
  - Example: `node dist/scripts/generateFactbooks.cjs 1 3` (first 3 games only)

**Output**:
- Creates: `data/nfl/season-2025/week-XX/factbooks/[game-id].json`
- Contains: Comprehensive game factbooks with team data, betting context, etc.

**What it does**:
- Reads games data from Step 1
- Fetches real team data from ESPN API for all 32 NFL teams
- Builds comprehensive factbooks with real data only
- Handles rate limiting with delays
- Supports debugging with optional game limit
- Complete team coverage (ARI, ATL, BAL, BUF, CAR, CHI, CIN, CLE, DAL, DEN, DET, GB, HOU, IND, JAX, KC, LAC, LAR, LV, MIA, MIN, NE, NO, NYG, NYJ, PHI, PIT, SF, SEA, TB, TEN, WSH)

---

## Complete Pipeline Example

### For Week 1:
```bash
# Step 1: Pull game data and odds
cd frontend
npx ts-node src/scripts/pullEspnNfl.ts 1

# Step 2: Compile and generate factbooks for all teams
npx tsc src/scripts/generateFactbooks.ts --outDir dist --target es2020 --module commonjs --esModuleInterop
node dist/scripts/generateFactbooks.cjs 1
```

### For Week 2:
```bash
# Step 1: Pull game data and odds
npx ts-node src/scripts/pullEspnNfl.ts 2

# Step 2: Generate factbooks for all teams (reuse compiled version)
node dist/scripts/generateFactbooks.cjs 2
```

### Debug Mode (Limited Games):
```bash
# Step 1: Pull game data and odds
npx ts-node src/scripts/pullEspnNfl.ts 1

# Step 2: Generate factbooks for first 3 games only (debugging)
node dist/scripts/generateFactbooks.cjs 1 3
```

---

## File Structure

After running the pipeline, you'll have:
```
data/nfl/season-2025/
├── week-01/
│   ├── games.json                    # Game data with odds
│   └── factbooks/
│       ├── 2025-09-05-dal-phi.json   # Individual game factbooks
│       ├── 2025-09-06-kc-lac.json
│       └── ...
├── week-02/
│   ├── games.json
│   └── factbooks/
│       └── ...
└── ...
```

---

## Data Sources

### Real Data Sources:
- **ESPN API**: Team information, logos, colors, basic data
- **Games.json**: Real betting odds (spread, total, moneyline)
- **Venue Data**: Stadium information (when available)

### Mock/Estimated Data:
- **Opening Lines**: Estimated based on current lines
- **Line Movement**: Estimated movement
- **Team Statistics**: Currently set to 0 (season hasn't started)
- **Weather**: Default clear conditions
- **Injuries**: Empty arrays (no current injury data)

---

## Troubleshooting

### Common Issues:

1. **TypeScript Compilation Errors**:
   - Compile first: `npx tsc src/scripts/[script].ts --outDir dist`
   - Or use ts-node: `npx ts-node src/scripts/[script].ts`

2. **API Rate Limiting**:
   - Scripts include 1-second delays between API calls
   - If you hit limits, wait and retry

3. **Missing Team Data**:
   - The script now supports all 32 NFL teams by default
   - If you see missing team warnings, check the TEAM_ID_MAP in the script

4. **File Not Found Errors**:
   - Ensure you're running from the `frontend` directory
   - Check that `data/nfl/season-2025/week-XX/games.json` exists

---

## Integration with Heuristic System

The generated factbooks are used by the heuristic pick selection system:

1. **Feature Calculators**: Use betting context for NE, LM, PF calculations
2. **Scorer**: Combines features with persona weights
3. **Selection Logic**: Picks top 5 candidates per persona

The factbooks provide the real betting data needed for the heuristic calculations while maintaining the persona-based selection logic.

---

## Future Improvements

1. **Real Opening Lines**: Integrate with historical odds APIs
2. **Real Line Movement**: Track actual line movement over time
3. **Team Statistics**: Fetch real season statistics when available
4. **Weather Data**: Integrate with weather APIs
5. **Injury Data**: Add real injury reports
6. **Venue Data**: Fetch complete stadium information

---

## Notes

- All scripts use real ESPN API data where possible
- No mock data is used in the current implementation
- Scripts are designed to be run from the `frontend` directory
- The pipeline is designed to be run weekly for each NFL week
- Generated data is stored in the `data/` directory for use by the frontend
