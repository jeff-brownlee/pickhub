// src/types.ts
export type Team = {
  name: string;
  abbr: string;
  nickname: string;
  primaryHex: string;
};

export type Game = {
  id: string;
  home: Team;
  away: Team;
  kickoffEt: string; // ISO string
  odds?: {
    spread?: {
      away: { line: number; odds: number };
      home: { line: number; odds: number };
    };
    total?: {
      over: { line: number; odds: number };
      under: { line: number; odds: number };
    };
    moneyline?: {
      away: { odds: number };
      home: { odds: number };
    };
  };
  // Legacy fields for backward compatibility
  line?: string;     // e.g., PHI -2.5
  total?: number;
};

export type Persona = {
  id: string;
  name: string;
  avatarUrl: string;
  profileImageUrl?: string;
  record: { wins: number; losses: number; pushes?: number };
  bio?: string;
  tagline?: string;
  persona?: string;
  bias?: string;
  voiceStyle?: string;
};

export type Pick = {
  id?: string;
  gameId: string;
  gameDate: string;
  awayTeam: {
    id: string;
    name: string;
    score?: number | null;
  };
  homeTeam: {
    id: string;
    name: string;
    score?: number | null;
  };
  marketData: {
    spread: {
      away: { line: number; odds: number };
      home: { line: number; odds: number };
    };
    total: {
      over: { line: number; odds: number };
      under: { line: number; odds: number };
    };
    moneyline: {
      away: { odds: number };
      home: { odds: number };
    };
  };
  selection: {
    betType: 'spread' | 'total' | 'moneyline';
    side: 'away' | 'home' | 'over' | 'under';
    line: number;
    odds: number;
    units: number;
    rationale: string;
    rationaleCues?: string[];
  };
  result: {
    status: 'pending' | 'won' | 'loss' | 'push';
    finalLine: number;
    finalOdds: number;
    payout: number;
    netUnits: number;
  };
  // Legacy fields for backward compatibility
  analystId?: string;
  side?: 'HOME' | 'AWAY' | 'OVER' | 'UNDER' | 'PASS';
  confidence?: 1 | 2 | 3;
  note?: string;
  facts?: PickFact[];
  rationale?: string;
};

export type PickFact = { type: 'trend'|'injury'|'epa'|'weather'|'lineMove'; text: string; source?: string };

export type PersonaMetrics = {
  winPct: number;
  wins: number;
  losses: number;
  pushes?: number;
  streak: number; // positive for W-streak, negative for L-streak
  last5: ('W'|'L'|'P')[];
};
