export type American = number;

export type HouseLine = {
  side?: "home" | "away";
  handicap?: number | null;
  points?: number | null;
  type?: "over" | "under" | null;
  price: American;
};

export type HouseEvent = {
  book: string;
  sport: "NFL";
  eventId: string;
  kickoffISO?: string | null;
  bannerDate?: string | null;
  away: { rot: number; team: string };
  home: { rot: number; team: string };
  markets: {
    spread: HouseLine[];
    total: HouseLine[];
    moneyline: HouseLine[];
  };
  fetchedAt: string;
};

export type HouseDump = HouseEvent[];
