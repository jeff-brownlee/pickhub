/**
 * Scorer for the heuristic pick selection system
 * Combines features with persona weights to generate scores
 */

import { BettingCandidate, FeatureScores, ScoredCandidate, PersonaConfig } from './types';
import { calculateAllFeatures } from './features';
import { getPersonaConfig } from './personas';

/**
 * Score a betting candidate using persona weights
 * Formula: score = w_NE*NE + w_LM*LM + w_PF*PF
 * Contrarian flips LM (multiplies by -1)
 */
export function scoreCandidate(
  candidate: BettingCandidate,
  openingLine: number,
  currentLine: number,
  personaId: string
): ScoredCandidate | null {
  const personaConfig = getPersonaConfig(personaId);
  if (!personaConfig) {
    console.warn(`Persona config not found for ID: ${personaId}`);
    return null;
  }

  // Calculate all features
  const components = calculateAllFeatures(candidate, openingLine, currentLine);

  // Apply persona weights
  let score = calculateWeightedScore(components, personaConfig);

  // Apply contrarian logic (flip LM for contrarian)
  if (personaId === 'contrarian') {
    score = calculateContrarianScore(components, personaConfig);
  }

  return {
    ...candidate,
    score,
    components,
    timestamp: new Date().toISOString()
  };
}

/**
 * Calculate weighted score using persona weights
 * score = w_NE*NE + w_LM*LM + w_PF*PF
 */
function calculateWeightedScore(components: FeatureScores, personaConfig: PersonaConfig): number {
  const { numberEdge, lineMovement, priceFriendliness } = components;
  const { weights } = personaConfig;

  return (
    weights.numberEdge * numberEdge.normalized +
    weights.lineMovement * lineMovement.normalized +
    weights.priceFriendliness * priceFriendliness.normalized
  );
}

/**
 * Calculate contrarian score (flips LM)
 * score = w_NE*NE + w_LM*(-LM) + w_PF*PF
 */
function calculateContrarianScore(components: FeatureScores, personaConfig: PersonaConfig): number {
  const { numberEdge, lineMovement, priceFriendliness } = components;
  const { weights } = personaConfig;

  return (
    weights.numberEdge * numberEdge.normalized +
    weights.lineMovement * (-lineMovement.normalized) + // Flip LM
    weights.priceFriendliness * priceFriendliness.normalized
  );
}

/**
 * Score multiple candidates for a persona
 */
export function scoreCandidates(
  candidates: BettingCandidate[],
  openingLines: Record<string, number>,
  currentLines: Record<string, number>,
  personaId: string
): ScoredCandidate[] {
  const scoredCandidates: ScoredCandidate[] = [];

  candidates.forEach(candidate => {
    // Determine opening and current lines based on market type
    const openingLine = getLineForCandidate(candidate, openingLines);
    const currentLine = getLineForCandidate(candidate, currentLines);

    if (openingLine !== null && currentLine !== null) {
      const scored = scoreCandidate(candidate, openingLine, currentLine, personaId);
      if (scored) {
        scoredCandidates.push(scored);
      }
    }
  });

  return scoredCandidates;
}

/**
 * Get the appropriate line for a candidate based on market type
 */
function getLineForCandidate(candidate: BettingCandidate, lines: Record<string, number>): number | null {
  const { marketType, selection } = candidate;

  if (marketType === 'spread') {
    return lines.spread || null;
  }

  if (marketType === 'total') {
    return lines.total || null;
  }

  if (marketType === 'moneyline') {
    const key = selection === 'home' ? 'moneyline_home' : 'moneyline_away';
    return lines[key] || null;
  }

  return null;
}

/**
 * Generate all possible betting candidates from game data
 * Creates candidates for spread (both sides), total (over/under), moneyline (both teams)
 */
export function generateBettingCandidates(gameData: {
  gameId: string;
  awayTeam: { name: string; abbreviation: string };
  homeTeam: { name: string; abbreviation: string };
  currentLine: {
    spread?: number;
    total?: number;
    moneyline?: { home: number; away: number };
  };
}): BettingCandidate[] {
  const candidates: BettingCandidate[] = [];
  const { gameId, awayTeam, homeTeam, currentLine } = gameData;

  // Spread candidates
  if (currentLine.spread !== undefined) {
    candidates.push({
      gameId,
      marketType: 'spread',
      selection: 'away',
      line: Math.abs(currentLine.spread),
      odds: -110, // Default odds
      teamName: awayTeam.name
    });

    candidates.push({
      gameId,
      marketType: 'spread',
      selection: 'home',
      line: -Math.abs(currentLine.spread),
      odds: -110, // Default odds
      teamName: homeTeam.name
    });
  }

  // Total candidates
  if (currentLine.total !== undefined) {
    candidates.push({
      gameId,
      marketType: 'total',
      selection: 'over',
      line: currentLine.total,
      odds: -110 // Default odds
    });

    candidates.push({
      gameId,
      marketType: 'total',
      selection: 'under',
      line: currentLine.total,
      odds: -110 // Default odds
    });
  }

  // Moneyline candidates
  if (currentLine.moneyline) {
    candidates.push({
      gameId,
      marketType: 'moneyline',
      selection: 'away',
      line: 0,
      odds: currentLine.moneyline.away,
      teamName: awayTeam.name
    });

    candidates.push({
      gameId,
      marketType: 'moneyline',
      selection: 'home',
      line: 0,
      odds: currentLine.moneyline.home,
      teamName: homeTeam.name
    });
  }

  return candidates;
}

/**
 * Apply persona preferences as tie-breakers
 * This will be used in the selection logic
 */
export function applyPersonaPreferences(
  candidates: ScoredCandidate[],
  personaConfig: PersonaConfig
): ScoredCandidate[] {
  return candidates.map(candidate => {
    let preferenceBonus = 0;

    // Apply dog preference
    if (personaConfig.preferences.dogs) {
      if (candidate.marketType === 'spread' && candidate.selection === 'away') {
        preferenceBonus += 0.1; // Small bonus for underdog
      }
      if (candidate.marketType === 'moneyline' && candidate.selection === 'away') {
        preferenceBonus += 0.1; // Small bonus for underdog
      }
    }

    // Apply under preference
    if (personaConfig.preferences.unders) {
      if (candidate.marketType === 'total' && candidate.selection === 'under') {
        preferenceBonus += 0.1; // Small bonus for under
      }
    }

    return {
      ...candidate,
      score: candidate.score + preferenceBonus
    };
  });
}

/**
 * Get score breakdown for transparency
 */
export function getScoreBreakdown(scoredCandidate: ScoredCandidate, personaConfig: PersonaConfig): {
  components: FeatureScores;
  weights: { numberEdge: number; lineMovement: number; priceFriendliness: number };
  weightedScores: { numberEdge: number; lineMovement: number; priceFriendliness: number };
  finalScore: number;
} {
  const { components } = scoredCandidate;
  const { weights } = personaConfig;

  const weightedScores = {
    numberEdge: weights.numberEdge * components.numberEdge.normalized,
    lineMovement: weights.lineMovement * components.lineMovement.normalized,
    priceFriendliness: weights.priceFriendliness * components.priceFriendliness.normalized
  };

  return {
    components,
    weights,
    weightedScores,
    finalScore: scoredCandidate.score
  };
}
