## UI/UX Backlog

This backlog tracks frontend UI/UX improvements. Mirrors the same prioritization used elsewhere.

### Prioritization Framework
- Use Priority levels: P0 (Critical), P1 (High), P2 (Medium), P3 (Low)
- Optional scoring to assist ordering:
  - Impact: 1–5 (user value/clarity)
  - Effort: S=1, M=2, L=3 (rough size)
  - Score: Impact / Effort (higher = do sooner)

### Backlog Item Template
- **Title**: <short name>
- **Summary**: <what and why>
- **Acceptance criteria**: <verifiable outcomes>
- **Implementation**: <high-level steps>
- **Dependencies**: <ordering / data availability>
- **Risks**: <edge cases>
- **Priority**: P0/P1/P2/P3
- **Estimate**: S/M/L
- **Status**: proposed / in-progress / done

---

### 1) Enable sorting on the Leaderboard
- **Summary**: Allow users to sort the leaderboard by key metrics to quickly compare analysts.
- **Acceptance criteria**:
  - Sorting is available for: Win %, Wins, Streak, Last 5
  - Active sort control is visually highlighted
  - Sort direction toggles (asc/desc) on repeated clicks or via a chevron
  - Default sort is Win % (desc). Preference persists via query param or localStorage
  - Works on mobile and desktop without layout shift
- **Implementation**:
  - Add `sortKey` and `sortDirection` state to `LeaderboardPage`
  - Wire chip buttons to update sort and re-compute the displayed list
  - Optional: reflect sort in URL (e.g., `?sort=winPct&dir=desc`)
- **Dependencies**:
  - Leaderboard data already loaded in `LeaderboardPage`
- **Risks**:
  - Handling ties consistently; ensuring stable sort across metrics
- **Priority**: P1
- **Estimate**: S
- **Status**: proposed


