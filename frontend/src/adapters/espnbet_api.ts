import { HouseDump, HouseEvent } from "../house/schema.js";
import dayjs from "dayjs";

// ESPN API types (based on actual ESPN API structure)
export interface EspnApiEvent {
  id: string;
  date: string;
  name: string;
  shortName: string;
  competitions: Array<{
    id: string;
    date: string;
    competitors: Array<{
      id: string;
      team: {
        id: string;
        abbreviation: string;
        displayName: string;
        name: string;
      };
      homeAway: "home" | "away";
    }>;
  }>;
  odds?: any; // Will contain the odds data from the separate API call
}

export interface EspnApiResponse {
  items: EspnApiEvent[];
  count: number;
  pageIndex: number;
  pageSize: number;
  pageCount: number;
}

export function parseEspnBetApi(response: EspnApiResponse): HouseDump {
  const fetchedAt = new Date().toISOString();
  const games: HouseEvent[] = [];

  console.log("Parsing ESPN API response:", JSON.stringify(response, null, 2));

  for (const event of response.items) {
    console.log("Processing event:", event.id, event.name);
    const competition = event.competitions?.[0];
    if (!competition) {
      console.log("No competition found for event:", event.id);
      continue;
    }

    const awayTeam = competition.competitors.find(c => c.homeAway === "away");
    const homeTeam = competition.competitors.find(c => c.homeAway === "home");
    
    if (!awayTeam || !homeTeam) continue;

    const eventId = `${awayTeam.team.abbreviation}-${homeTeam.team.abbreviation}-${dayjs(event.date).format("YYYY-MM-DD")}`;
    
    const houseEvent: HouseEvent = {
      book: "ESPN",
      sport: "NFL",
      eventId,
      kickoffISO: event.date,
      away: {
        rot: parseInt(awayTeam.team.id) || 0,
        team: awayTeam.team.displayName
      },
      home: {
        rot: parseInt(homeTeam.team.id) || 0,
        team: homeTeam.team.displayName
      },
      markets: {
        spread: [],
        total: [],
        moneyline: []
      },
      fetchedAt
    };

    // Parse odds data if available
    if (event.odds) {
      console.log("Parsing odds for event:", event.id);
      // TODO: Parse the actual odds structure once we see the format
      // For now, we'll log the odds structure to understand it
      console.log("Odds structure:", JSON.stringify(event.odds, null, 2));
    } else {
      console.log("No odds data available for event:", event.id);
    }
    
    games.push(houseEvent);
  }

  return games;
}
