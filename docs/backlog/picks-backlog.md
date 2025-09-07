### Picks Backlog

#### Item: Persona-weighted market scoring (bias-first)

- Summary: Integrate persona biases into the scoring math itself (not just re-ranking) and expand per-game candidates to allow side/direction flexibility, so picks align tightly to each persona’s style.

- Details:
  - Parameterize per-persona weights for each scoring component by market:
    - Spread: statMargin, movement, publicSkew, coaching, disruption, discipline
    - Total: expectedEdge, movementConfirm, publicSkew, disruption, pace
    - Moneyline: statMargin+form, steam, publicSkew
  - Compute personaAdjustedScore = Σ(weight_i × component_i) + regularizers (e.g., ML chalk penalty).
  - Expand candidates per game to 6 (Spread: home/away; Total: over/under; ML: home/away) to enable bias-driven side/direction.
  - Add small “flip friction” so flips against base edge require sufficient persona signal.
  - Maintain existing constraints (5 picks, max 2/game, (ATS|ML)+Total) and cross-persona decorrelation.
  - Audit: log personaAdjustedScore and component contributions per persona, alongside existing market trace.

- Outputs:
  - Persona-adjusted scoring log (optional) under `data/nfl/season-YYYY/week-WW/scoring/persona-adjusted.json`.
  - Picks continue in legacy envelope; rationale can reference key persona-weighted factors.

- Acceptance Criteria:
  - Selection uses personaAdjustedScore for ranking.
  - Expanded candidate space is active and respects constraints/decorr.
  - Logs demonstrate component weights applied per persona; values are traceable.
  - No UI schema changes required; generation scripts remain one-command per step.

- Impact: High (picks visibly align to persona stereotypes)
- Effort: Medium
- Score: 8


