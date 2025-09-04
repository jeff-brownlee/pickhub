// Minimal Factbook Schema - Only fields needed for scoring heuristics

export interface MinimalFactbook {
  gameId: string;
  kickoffISO: string;
  week: number;
  teams: {
    away: {
      abbreviation: string;
      record: { winPercentage: number };
      statistics: {
        offense: {
          pointsPerGame: number;
          turnovers: number;
          rushingYards: number;
          passingYards: number;
        };
        defense: {
          pointsAllowed: number;
          sacks: number;
          interceptions: number;
          forcedFumbles: number;
          totalTackles: number;
        };
      };
      keyPlayers: Array<{ position: string }>;
      coaching?: { experience: number; name?: string };
    };
    home: {
      abbreviation: string;
      record: { winPercentage: number };
      statistics: {
        offense: {
          pointsPerGame: number;
          turnovers: number;
          rushingYards: number;
          passingYards: number;
        };
        defense: {
          pointsAllowed: number;
          sacks: number;
          interceptions: number;
          forcedFumbles: number;
          totalTackles: number;
        };
      };
      keyPlayers: Array<{ position: string }>;
      coaching?: { experience: number; name?: string };
    };
  };
  bettingContext: {
    currentLine: {
      spread: number;
      total: number;
    };
    bettingTrends: {
      spread: { home: number; away: number };
      total: { over: number; under: number };
      moneyline: { home: number; away: number };
    };
    lineMovement: {
      spread: {
        current: number;
        opening: number;
        movement: number;
        direction: 'toward_home' | 'toward_away' | 'stable';
      };
      total: {
        current: number;
        opening: number;
        movement: number;
        direction: 'over' | 'under' | 'stable';
      };
      moneyline: {
        home: {
          current: number;
          opening: number;
          movement: number;
        };
        away: {
          current: number;
          opening: number;
          movement: number;
        };
      };
      sharpMoney: string;
    };
  };
}
