## NFL Factbook Enhancements Backlog

This backlog tracks additions to the MinimalFactbook to improve pick selection and rationale quality. Use the template below for new items.

### Prioritization Framework
- Use Priority levels: P0 (Critical), P1 (High), P2 (Medium), P3 (Low)
- Optional scoring to assist ordering:
  - Impact: 1–5 (how much it improves picks/rationales)
  - Effort: S=1, M=2, L=3 (rough size)
  - Score: Impact / Effort (higher = do sooner)

### Current Priority Queue (sorted by priority then score)
1) Add OddsRecord to Factbook — Priority: P1 — Score: 4/1 = 4.0
   - Rationale: Useful for heuristics; small effort; pairs with trends/line movement.
2) Add Injuries from Teams — Priority: P1 — Score: 5/2 ≈ 2.5
   - Rationale: High impact on picks/rationales; moderate effort.
3) Add Ranks data from Teams — Priority: P2 — Score: 3/2 = 1.5
   - Rationale: Helpful context; moderate effort; less immediate impact than injuries.
   - coach needs time of possesion and any o-line, d-line stats or ranking
   - contrarian should be able to use public betting data alone
   - fratguy likes favorites, overs, and primetime favorites
   - tracks public betting, likes the teams with star power
   - tracks public betting, likes home team favorites
   - focused on line movement against the public betting
   - podcaster overweights run game
   - pro - looks for line inefficiencies around key numbers
   - nerd - advanced stats



### Backlog Item Template
- **Title**: <short name>
- **Summary**: <what and why>
- **Source endpoints**: <links/refs>
- **Fields to extract**: <specific fields>
- **Schema changes**: <proposed MinimalFactbook additions>
- **Implementation**: <high-level steps>
- **Acceptance criteria**: <verifiable outcomes>
- **Dependencies**: <ordering / data availability>
- **Risks**: <API quirks / rate limits / data gaps>
- **Priority**: P0/P1/P2
- **Estimate**: S/M/L (or t-shirt + hours if known)
- **Owner**: <assignee>
- **Status**: proposed / in-progress / done

---

### 1) Add OddsRecord to Factbook
- **Summary**: Include team-level against-the-spread (ATS), totals, and moneyline records to inform heuristics and rationale (e.g., team ATS performance YTD).
- **Source endpoints**:
  - Team → `coaches`, `record`, etc. also exposes `oddsRecords` via `$ref`:
    - `http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/types/0/teams/{teamId}/odds-records?lang=en&region=us`
- **Fields to extract**:
  - Overall ATS: wins, losses, pushes
  - Home/away ATS splits (if available)
  - Totals (OVER/UNDER): over, under, push counts
  - Moneyline: wins, losses
- **Schema changes**:
  - `teams.{away,home}.oddsRecord?: { ats: { wins: number; losses: number; pushes: number }; totals: { over: number; under: number; pushes: number }; moneyline: { wins: number; losses: number } }`
- **Implementation**:
  - From team data, follow `oddsRecords.$ref`
  - Parse latest season/type node; map into normalized structure above
  - Add to both away/home under `teams.*.oddsRecord`
- **Acceptance criteria**:
  - Factbooks include `oddsRecord` for both teams when ESPN provides data
  - Numbers match the ESPN response for a sample of 3 teams
- **Dependencies**:
  - Team base fetch (already implemented)
- **Risks**:
  - Variations in odds-record shape by `types` (pre/reg/post). Need to select correct type for current context
- **Priority**: P1
- **Estimate**: S (2–4h)
- **Owner**: TBD
- **Status**: proposed

---

### 2) Add Ranks data from Teams
- **Summary**: Include team ranking context (offense/defense positional or unit ranks) for richer heuristics and rationale.
- **Source endpoints**:
  - Team `ranks` via `$ref`:
    - `http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/teams/{teamId}/ranks?lang=en&region=us`
- **Fields to extract**:
  - Overall team rank, offense rank, defense rank (and any available subcategory ranks like passing/rushing)
- **Schema changes**:
  - `teams.{away,home}.ranks?: { overall?: number; offense?: number; defense?: number; passingOffense?: number; rushingOffense?: number; passingDefense?: number; rushingDefense?: number }`
- **Implementation**:
  - Follow `ranks.$ref`
  - Normalize ESPN categories to a stable set of keys above
  - Populate missing categories only when present; keep optional
- **Acceptance criteria**:
  - Factbooks include `ranks` with non-zero values for at least 10/16 teams in Week 1 (subject to ESPN data availability)
- **Dependencies**:
  - Team base fetch (already implemented)
- **Risks**:
  - Category naming may vary; mapping table required
  - Early season ranks may be null/0
- **Priority**: P2
- **Estimate**: M (4–8h)
- **Owner**: TBD
- **Status**: proposed

---

### 3) Add Injuries from Teams
- **Summary**: Include current injury reports to influence pick heuristics and enrich rationales.
- **Source endpoints**:
  - Team `injuries` via `$ref`:
    - `http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/{teamId}/injuries?lang=en&region=us`
- **Fields to extract**:
  - Player name, position, status (Out/Questionable/Doubtful/IR), description, date (if available)
- **Schema changes**:
  - `teams.{away,home}.injuries?: Array<{ name: string; position?: string; status?: string; description?: string; date?: string }>`
- **Implementation**:
  - Follow `injuries.$ref`, resolve items array
  - For each item, extract minimal, stable fields above
  - Limit list (e.g., max 10 most impactful by position/role)
- **Acceptance criteria**:
  - Factbooks include `injuries` arrays when ESPN provides data
  - Sample games reflect expected statuses for marquee players
- **Dependencies**:
  - Team base fetch (already implemented)
- **Risks**:
  - Injury endpoints can be sparse or updated late; ensure graceful fallbacks
  - Names sometimes require additional person lookup for consistency
- **Priority**: P1
- **Estimate**: M (4–8h)
- **Owner**: TBD
- **Status**: proposed

---

### Suggested Future Items (Parking Lot)
- **Drive/RedZone efficiency**: Offense/defense EPA, success rate, red-zone TD rate
- **Special teams ranks**: Kicking, punting, return efficiency
- **Weather**: Game-time forecast (wind, precip, temp)
- **Rest/Travel**: Short week, time zone travel flags


