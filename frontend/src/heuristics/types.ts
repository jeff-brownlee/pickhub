/**
 * Types for the heuristic pick selection system
 */

export interface BettingCandidate {
  gameId: string;
  marketType: 'spread' | 'total' | 'moneyline';
  selection: 'away' | 'home' | 'over' | 'under';
  line: number;
  odds: number;
  teamName?: string; // For spreads/moneylines
}

export interface FeatureScores {
  numberEdge: {
    raw: number;
    normalized: number; // -1 to +1
  };
  lineMovement: {
    raw: number;
    normalized: number; // -1 to +1
  };
  priceFriendliness: {
    raw: number;
    normalized: number; // -1 to +1
  };
}

export interface ScoredCandidate extends BettingCandidate {
  score: number;
  components: FeatureScores;
  timestamp: string;
}

export interface PersonaConfig {
  id: string;
  name: string;
  weights: {
    numberEdge: number;
    lineMovement: number;
    priceFriendliness: number;
  };
  preferences: {
    dogs: boolean; // Prefer underdogs
    unders: boolean; // Prefer unders
  };
}

export interface WeeklyPickSelection {
  personaId: string;
  week: number;
  picks: ScoredCandidate[];
  totalPicks: number;
  selectionMethod: 'heuristics';
}
