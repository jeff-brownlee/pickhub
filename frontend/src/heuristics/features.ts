/**
 * Feature calculators for the heuristic pick selection system
 * Implements Number Edge (NE), Line Movement (LM), and Price Friendliness (PF)
 */

import { BettingCandidate, FeatureScores } from './types';

/**
 * Calculate Number Edge (NE) for a betting candidate
 * Detects half-point advantages around key numbers
 */
export function calculateNumberEdge(candidate: BettingCandidate): { raw: number; normalized: number } {
  const { marketType, line } = candidate;
  
  if (marketType === 'moneyline') {
    // Moneyline has no number edge
    return { raw: 0, normalized: 0 };
  }
  
  if (marketType === 'spread') {
    return calculateSpreadNumberEdge(line);
  }
  
  if (marketType === 'total') {
    return calculateTotalNumberEdge(line);
  }
  
  return { raw: 0, normalized: 0 };
}

/**
 * Calculate Number Edge for spreads
 * Key numbers: 3, 7, 10, 14
 * Half-point advantages around these numbers get +1.0
 */
function calculateSpreadNumberEdge(line: number): { raw: number; normalized: number } {
  const keyNumbers = [3, 7, 10, 14];
  const absLine = Math.abs(line);
  
  // Check for half-point advantages around key numbers
  for (const key of keyNumbers) {
    const distance = Math.abs(absLine - key);
    
    // Half-point advantage (0.5 away from key number)
    if (distance === 0.5) {
      // For spreads, half-point advantages are always good (avoiding the key number)
      return { raw: 1, normalized: 1 };
    }
    
    // On the key number (bad edge)
    if (distance === 0) {
      return { raw: -1, normalized: -1 };
    }
  }
  
  // No edge
  return { raw: 0, normalized: 0 };
}

/**
 * Calculate Number Edge for totals
 * Key numbers: 37, 41, 44, 47, 51, 54
 * Half-point advantages around these numbers get +1.0
 */
function calculateTotalNumberEdge(line: number): { raw: number; normalized: number } {
  const keyNumbers = [37, 41, 44, 47, 51, 54];
  
  // Check for half-point advantages around key numbers
  for (const key of keyNumbers) {
    const distance = Math.abs(line - key);
    
    // Half-point advantage
    if (distance === 0.5) {
      return { raw: 1, normalized: 1 };
    }
    
    // On the key number (bad edge)
    if (distance === 0) {
      return { raw: -1, normalized: -1 };
    }
  }
  
  // No edge
  return { raw: 0, normalized: 0 };
}

/**
 * Calculate Line Movement (LM) for a betting candidate
 * Tracks open → current movement, normalized to -1..+1
 */
export function calculateLineMovement(
  candidate: BettingCandidate,
  openingLine: number,
  currentLine: number
): { raw: number; normalized: number } {
  const { marketType, selection } = candidate;
  
  if (marketType === 'moneyline') {
    return calculateMoneylineMovement(openingLine, currentLine, selection);
  }
  
  if (marketType === 'spread') {
    return calculateSpreadMovement(openingLine, currentLine, selection);
  }
  
  if (marketType === 'total') {
    return calculateTotalMovement(openingLine, currentLine, selection);
  }
  
  return { raw: 0, normalized: 0 };
}

/**
 * Calculate Line Movement for spreads
 * Movement toward your side is positive
 */
function calculateSpreadMovement(
  openingLine: number,
  currentLine: number,
  selection: string
): { raw: number; normalized: number } {
  const movement = currentLine - openingLine;
  
  // Determine if movement is favorable
  let favorableMovement = 0;
  
  if (selection === 'away') {
    // For away team, line moving down (less points to cover) is favorable
    favorableMovement = -movement;
  } else if (selection === 'home') {
    // For home team, line moving up (more points to cover) is favorable
    favorableMovement = movement;
  }
  
  // Normalize to -1..+1 (cap at 3 points of movement)
  const normalized = Math.max(-1, Math.min(1, favorableMovement / 3));
  
  return { raw: favorableMovement, normalized };
}

/**
 * Calculate Line Movement for totals
 * Movement toward your side is positive
 */
function calculateTotalMovement(
  openingLine: number,
  currentLine: number,
  selection: string
): { raw: number; normalized: number } {
  const movement = currentLine - openingLine;
  
  // Determine if movement is favorable
  let favorableMovement = 0;
  
  if (selection === 'over') {
    // For over, line moving up is favorable
    favorableMovement = movement;
  } else if (selection === 'under') {
    // For under, line moving down is favorable
    favorableMovement = -movement;
  }
  
  // Normalize to -1..+1 (cap at 3 points of movement)
  const normalized = Math.max(-1, Math.min(1, favorableMovement / 3));
  
  return { raw: favorableMovement, normalized };
}

/**
 * Calculate Line Movement for moneylines
 * Change in implied win probability since open (cap ~7%)
 */
function calculateMoneylineMovement(
  openingLine: number,
  currentLine: number,
  selection: string
): { raw: number; normalized: number } {
  // Convert odds to implied probability
  const openingProb = oddsToImpliedProbability(openingLine);
  const currentProb = oddsToImpliedProbability(currentLine);
  
  const probChange = currentProb - openingProb;
  
  // Normalize to -1..+1 (cap at 7% change)
  const normalized = Math.max(-1, Math.min(1, probChange / 0.07));
  
  return { raw: probChange, normalized };
}

/**
 * Calculate Price Friendliness (PF) for a betting candidate
 * Scores juice bands: -105 = +1.0, -110 = +0.5, -115 = 0.0, -120 = -0.5, worse = -1.0
 */
export function calculatePriceFriendliness(candidate: BettingCandidate): { raw: number; normalized: number } {
  const { marketType, odds } = candidate;
  
  if (marketType === 'moneyline') {
    return calculateMoneylinePriceFriendliness(odds);
  }
  
  // For spreads and totals, use standard juice bands
  return calculateStandardPriceFriendliness(odds);
}

/**
 * Calculate Price Friendliness for spreads and totals
 * Standard juice band scoring
 */
function calculateStandardPriceFriendliness(odds: number): { raw: number; normalized: number } {
  // Convert to positive odds for easier calculation
  const absOdds = Math.abs(odds);
  
  if (absOdds <= 105) return { raw: 1, normalized: 1.0 };
  if (absOdds <= 110) return { raw: 0.5, normalized: 0.5 };
  if (absOdds <= 115) return { raw: 0, normalized: 0.0 };
  if (absOdds <= 120) return { raw: -0.5, normalized: -0.5 };
  
  return { raw: -1, normalized: -1.0 };
}

/**
 * Calculate Price Friendliness for moneylines
 * Coarse bands (less negative is better for favs, more positive is better for dogs)
 */
function calculateMoneylinePriceFriendliness(odds: number): { raw: number; normalized: number } {
  if (odds > 0) {
    // Underdog - higher odds are better
    if (odds >= 200) return { raw: 1, normalized: 1.0 };
    if (odds >= 150) return { raw: 0.5, normalized: 0.5 };
    if (odds >= 120) return { raw: 0, normalized: 0.0 };
    return { raw: -0.5, normalized: -0.5 };
  } else {
    // Favorite - less negative odds are better
    if (odds >= -110) return { raw: 1, normalized: 1.0 };
    if (odds >= -130) return { raw: 0.5, normalized: 0.5 };
    if (odds >= -150) return { raw: 0, normalized: 0.0 };
    if (odds >= -200) return { raw: -0.5, normalized: -0.5 };
    return { raw: -1, normalized: -1.0 };
  }
}

/**
 * Calculate all features for a betting candidate
 */
export function calculateAllFeatures(
  candidate: BettingCandidate,
  openingLine: number,
  currentLine: number
): FeatureScores {
  return {
    numberEdge: calculateNumberEdge(candidate),
    lineMovement: calculateLineMovement(candidate, openingLine, currentLine),
    priceFriendliness: calculatePriceFriendliness(candidate)
  };
}

/**
 * Helper function to convert odds to implied probability
 */
function oddsToImpliedProbability(odds: number): number {
  if (odds > 0) {
    return 100 / (odds + 100);
  } else {
    return Math.abs(odds) / (Math.abs(odds) + 100);
  }
}
