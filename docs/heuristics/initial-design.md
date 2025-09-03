# 🏈 PickHub Heuristic Picker (MVP)

This project generates **5 betting picks per persona** each week using a **minimal heuristic model**.  
The model starts simple (3 signals: Number Edge, Line Movement, Price Friendliness) and is designed to scale up with more data over time.

---

## 🎯 Goal
- Ingest weekly game data (from ESPN API snapshots or your Factbook).
- Generate candidate bets (spread sides, totals, moneylines).
- Score each candidate using simple, explainable features.
- Apply persona-specific weights & preferences.
- Select the top 5 picks per persona with tie-breakers and guardrails.
- Output structured picks with scores + rationales.

---

## 🛠️ Minimal Feature Set (v0)

### 1. Number Edge (NE)
- **Spreads**: half-points around key numbers (3, 7, 10).
- **Totals**: common totals (37, 41, 44, 47, 51, 54).
- **Moneyline**: no number edge (NE = 0).

### 2. Line Movement (LM)
- **Spread/Total**: open → current move toward your side (capped, normalized to -1..+1).
- **Moneyline**: change in implied win probability since open (cap ~7%).

### 3. Price Friendliness (PF)
- **Spread/Total**: juice bands (−105 = +1.0, −110 = +0.5, −115 = 0.0, −120 = −0.5, worse = −1.0).
- **Moneyline**: coarse bands (less negative is better for favs, more positive is better for dogs).

---

## 👤 Personas (examples)

Each persona is stored in its **own JSON config**, with weights + preferences.

- **Sports Analytics Nerd** → balanced; weights NE/LM equally, mild PF.  
- **Contrarian** → flips LM; prefers dogs/unders.  
- **Old Football Coach** → heavy on key-number discipline.  
- **Frat Guy** → leans toward favorites & overs.

---

## 📐 Data Flow

1. **Input**: Game JSON (home/away, open/current spreads, totals, moneylines).  
2. **Candidate generation**:  
   - Spread: favorite & dog sides.  
   - Totals: over & under.  
   - Moneyline: both teams.  
3. **Feature calculation**: NE, LM, PF.  
4. **Scoring**: weighted sum per persona (`score = w_NE*NE + w_LM*LM_p + w_PF*PF`).  
   - Contrarian flips LM.  
5. **Selection**:  
   - Filter out bad keys (NE = -1) unless needed to reach 5.  
   - Sort by score, then tie-breakers:  
     1. Higher NE  
     2. Larger |LM|  
     3. Persona preference (dogs/unders vs favs/overs)  
     4. Earlier market timestamp  
   - Enforce max 1 pick per game.  
   - Take top 5 picks.  
6. **Output**: `{ personaId, items: [ { gameId, marketType, selection, score, components } ] }`.

---

## 🗺️ Roadmap

- **MVP (now)**  
  - Build NE/LM/PF calculators.  
  - Persona JSON configs.  
  - Selector → console output of 5 picks/persona.  

- **Short-term extensions**  
  - Add totals key numbers parity.  
  - Improve moneyline friendliness bands.  
  - Output rationales alongside scores.

- **Future**  
  - Injuries (cluster flags).  
  - Public % & reverse line moves.  
  - Advanced stats (EPA, DVOA).  
  - Confidence tiers (unit sizing).  

---

## 🚀 Getting Started

1. Create project in Cursor (Node + TypeScript).
2. Add `src/` folder with:
   - `features.ts` (NE, LM, PF calculators)
   - `personas.ts` (persona configs)
   - `scorer.ts` (combine features + weights)
   - `selection.ts` (pick top 5 per persona)
   - `examples/run-sample.ts` (demo runner)
3. Run locally:

```bash
npm install typescript ts-node @types/node
npx ts-node src/examples/run-sample.ts
```

4. Check console output for each persona’s top 5 picks.

---

## 📝 Notes
- Keep personas **config-driven** (easy to tweak without touching logic).
- Extend features safely by adding fields to `components` and weights to persona configs.
- Always log `components` (NE, LM, PF) for transparency.
- Use tie-breakers for style (dogs vs favs), not score inflation.

---
