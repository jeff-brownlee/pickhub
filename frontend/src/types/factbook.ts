// Game Factbook Schema - Comprehensive data for analyst decision making

export interface GameFactbook {
  gameId: string;
  season: number;
  week: number;
  kickoffISO: string;
  venue: VenueInfo;
  weather?: WeatherInfo;
  teams: {
    away: TeamFactbook;
    home: TeamFactbook;
  };
  bettingContext: BettingContext;
  keyMatchups: KeyMatchup[];
  trends: GameTrend[];
  injuries: InjuryReport[];
  dataSources?: {
    teamData: string;
    bettingData: string;
    weatherData: string;
  };
  lastUpdated: string;
}

export interface VenueInfo {
  id: string;
  name: string;
  city: string;
  state: string;
  surface: 'grass' | 'turf' | 'hybrid';
  indoor: boolean;
  capacity?: number;
  altitude?: number; // For Denver, etc.
}

export interface WeatherInfo {
  temperature?: number;
  windSpeed?: number;
  windDirection?: string;
  humidity?: number;
  precipitation?: number;
  conditions: 'clear' | 'cloudy' | 'rain' | 'snow' | 'fog';
}

export interface TeamFactbook {
  id: string;
  name: string;
  abbreviation: string;
  record: TeamRecord;
  recentForm: RecentForm;
  oddsRecords: OddsRecords;
  statistics: TeamStatistics;
  keyPlayers: KeyPlayer[];
  coaching: CoachingInfo;
  situational: SituationalStats;
  trends: TeamTrend[];
}

export interface TeamRecord {
  wins: number;
  losses: number;
  ties: number;
  winPercentage: number;
  homeRecord?: { wins: number; losses: number; ties: number };
  awayRecord?: { wins: number; losses: number; ties: number };
  divisionRecord?: { wins: number; losses: number; ties: number };
  conferenceRecord?: { wins: number; losses: number; ties: number };
  lastFive: ('W' | 'L' | 'T')[];
  streak: {
    type: 'W' | 'L' | 'T';
    count: number;
  };
}

export interface RecentForm {
  lastFiveGames: GameResult[];
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
  averageMargin: number;
}

export interface GameResult {
  opponent: string;
  result: 'W' | 'L' | 'T';
  score: string; // "24-21"
  homeAway: 'home' | 'away';
  week: number;
}

export interface OddsRecords {
  againstSpread: { wins: number; losses: number; ties: number };
  overUnder: { overs: number; unders: number; pushes: number };
  homeAway: {
    home: { wins: number; losses: number; ties: number };
    away: { wins: number; losses: number; ties: number };
  };
}

export interface TeamStatistics {
  offense: {
    pointsPerGame: number;
    yardsPerGame: number;
    passingYards: number;
    rushingYards: number;
    thirdDownPercentage: number;
    redZonePercentage: number;
    turnovers: number;
  };
  defense: {
    pointsAllowed: number;
    yardsAllowed: number;
    passingYardsAllowed: number;
    rushingYardsAllowed: number;
    sacks: number;
    interceptions: number;
    forcedFumbles: number;
  };
  specialTeams: {
    fieldGoalPercentage: number;
    puntReturnAverage: number;
    kickoffReturnAverage: number;
  };
}

export interface KeyPlayer {
  id: string;
  name: string;
  position: string;
  status: 'active' | 'questionable' | 'doubtful' | 'out';
  stats: PlayerStats;
  injury?: InjuryInfo;
}

export interface PlayerStats {
  // QB specific
  passingYards?: number;
  passingTDs?: number;
  interceptions?: number;
  completionPercentage?: number;
  qbRating?: number;
  
  // RB specific
  rushingYards?: number;
  rushingTDs?: number;
  yardsPerCarry?: number;
  
  // WR/TE specific
  receivingYards?: number;
  receivingTDs?: number;
  receptions?: number;
  
  // Defense specific
  tackles?: number;
  sacks?: number;
  defensiveInterceptions?: number;
}

export interface InjuryInfo {
  type: string;
  severity: 'minor' | 'moderate' | 'major';
  expectedReturn?: string;
  impact: 'low' | 'medium' | 'high';
}

export interface CoachingInfo {
  headCoach: string;
  offensiveCoordinator?: string;
  defensiveCoordinator?: string;
  experience: number; // years as HC
  record: { wins: number; losses: number; ties: number };
  playoffRecord?: { wins: number; losses: number };
}

export interface SituationalStats {
  homeAdvantage: {
    homeRecord: { wins: number; losses: number; ties: number };
    homePointsFor: number;
    homePointsAgainst: number;
  };
  restAdvantage: {
    daysRest: number;
    opponentDaysRest: number;
    restAdvantage: 'home' | 'away' | 'even';
  };
  travel: {
    milesTraveled?: number;
    timeZoneChange?: number;
    shortWeek?: boolean;
  };
  motivation: {
    playoffRace: boolean;
    divisionGame: boolean;
    rivalry: boolean;
    revenge?: string; // "Lost to this team in Week X"
  };
}

export interface TeamTrend {
  type: 'offensive' | 'defensive' | 'special' | 'situational';
  description: string;
  games: number;
  trend: 'improving' | 'declining' | 'consistent';
  impact: 'positive' | 'negative' | 'neutral';
}

export interface BettingContext {
  openingLine: {
    spread?: number;
    total?: number;
    moneyline?: { home: number; away: number };
  };
  currentLine: {
    spread?: number;
    total?: number;
    moneyline?: { home: number; away: number };
  };
  lineMovement: {
    spreadMovement?: number;
    totalMovement?: number;
    sharpMoney?: 'home' | 'away' | 'over' | 'under' | 'none';
    publicMoney?: 'home' | 'away' | 'over' | 'under' | 'none';
  };
  bettingTrends: {
    spread: { home: number; away: number }; // percentage of bets
    total: { over: number; under: number };
    moneyline: { home: number; away: number };
  };
  keyNumbers: {
    spread: number[]; // [3, 7, 10, 14]
    total: number[]; // [40, 45, 50, 55]
  };
}

export interface KeyMatchup {
  type: 'offense_vs_defense' | 'player_vs_player' | 'coaching' | 'special_teams';
  description: string;
  advantage: 'home' | 'away' | 'even';
  impact: 'high' | 'medium' | 'low';
  details: string;
}

export interface GameTrend {
  type: 'historical' | 'recent' | 'situational' | 'weather';
  description: string;
  games: number;
  record: string; // "8-2" or "Over 7-3"
  significance: 'high' | 'medium' | 'low';
}

export interface InjuryReport {
  player: string;
  position: string;
  injury: string;
  status: 'out' | 'doubtful' | 'questionable' | 'probable';
  impact: 'high' | 'medium' | 'low';
  replacement?: string;
}

// ESPN API Response Types for Factbook Data
export interface EspnTeamData {
  id: string;
  displayName: string;
  abbreviation: string;
  record: {
    $ref: string;
  };
  oddsRecords: {
    $ref: string;
  };
  athletes: {
    $ref: string;
  };
  venue: {
    $ref: string;
    id: string;
    fullName: string;
    address: {
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    grass: boolean;
    indoor: boolean;
  };
  statistics: {
    $ref: string;
  };
  leaders: {
    $ref: string;
  };
}

export interface EspnRecordData {
  items: Array<{
    type: string;
    summary: string;
    stats: Array<{
      name: string;
      value: number;
    }>;
  }>;
}

export interface EspnStatisticsData {
  splits: {
    categories: Array<{
      name: string;
      displayName: string;
      stats: Array<{
        name: string;
        value: number;
      }>;
    }>;
  };
}

export interface EspnAthletesData {
  items: Array<{
    id: string;
    displayName: string;
    position: {
      abbreviation: string;
    };
    status: {
      id: string;
      name: string;
    };
    statistics: {
      $ref: string;
    };
  }>;
}
