// src/types.ts
export type Team = {
  name: string;
  abbr: string;
  primaryHex: string;
};

export type Game = {
  id: string;
  home: Team;
  away: Team;
  kickoffEt: string; // ISO string
  line?: string;     // e.g., PHI -2.5
  total?: number;
};

export type Persona = {
  id: string;
  name: string;
  avatarUrl: string;
  record: { wins: number; losses: number; pushes?: number };
  bio?: string;
};

export type Pick = {
  gameId: string;
  side: 'HOME' | 'AWAY' | 'OVER' | 'UNDER' | 'PASS';
  confidence?: 1 | 2 | 3;
  note?: string;
  facts?: PickFact[];
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
