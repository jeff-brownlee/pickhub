import { HouseDump, HouseEvent } from "../house/schema.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import fetch from "node-fetch";

dayjs.extend(utc);
dayjs.extend(timezone);

// Helper function to fetch team data from ESPN API $ref URLs
async function fetchTeamData(teamRef: string): Promise<{ displayName: string; abbreviation: string } | null> {
  try {
    const response = await fetch(teamRef);
    if (!response.ok) {
      console.warn(`Failed to fetch team data from ${teamRef}: ${response.status}`);
      return null;
    }
    const teamData = await response.json() as any;
    return {
      displayName: teamData.displayName || "Unknown Team",
      abbreviation: teamData.abbreviation || "UNK"
    };
  } catch (error) {
    console.warn(`Error fetching team data from ${teamRef}:`, error);
    return null;
  }
}

// Note: Team data is now fetched directly from ESPN API $ref URLs
// No hardcoded team ID mapping needed!

// Note: Team abbreviations are now fetched directly from ESPN API
// No manual abbreviation mapping needed!

// ESPN NFL API types (based on actual ESPN API structure)
export interface EspnNflEvent {
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
        $ref: string;
        id: string;
        abbreviation?: string;
        displayName?: string;
        name?: string;
      };
      homeAway: "home" | "away";
    }>;
  }>;
  odds?: any; // Will contain the odds data from the separate API call
}

export interface EspnNflApiResponse {
  items: EspnNflEvent[];
  count: number;
  pageIndex: number;
  pageSize: number;
  pageCount: number;
}

export async function parseEspnNflApi(response: EspnNflApiResponse): Promise<HouseDump> {
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
    
    if (!awayTeam || !homeTeam) {
      console.log("Missing team data for event:", event.id);
      console.log("Available competitors:", competition.competitors?.map(c => ({ homeAway: c.homeAway, team: c.team })));
      continue;
    }

    // Fetch team data from ESPN API $ref URLs
    const awayTeamRef = awayTeam.team?.$ref;
    const homeTeamRef = homeTeam.team?.$ref;
    
    if (!awayTeamRef || !homeTeamRef) {
      console.log("Missing team $ref for event:", event.id);
      continue;
    }
    
    const awayTeamData = await fetchTeamData(awayTeamRef);
    const homeTeamData = await fetchTeamData(homeTeamRef);
    
    if (!awayTeamData || !homeTeamData) {
      console.log("Failed to fetch team data for event:", event.id);
      continue;
    }
    
    const awayTeamName = awayTeamData.displayName;
    const homeTeamName = homeTeamData.displayName;
    const awayTeamAbbr = awayTeamData.abbreviation;
    const homeTeamAbbr = homeTeamData.abbreviation;

    console.log(`Teams: ${awayTeamName} (${awayTeamAbbr}) @ ${homeTeamName} (${homeTeamAbbr})`);

    const eventId = `${awayTeamAbbr}-${homeTeamAbbr}-${dayjs(event.date).utc().format("YYYY-MM-DD")}`;
    
    const houseEvent: HouseEvent = {
      book: "ESPN NFL",
      sport: "NFL",
      eventId,
      kickoffISO: event.date,
      away: {
        rot: parseInt(awayTeam.team?.id) || 0,
        team: awayTeamName
      },
      home: {
        rot: parseInt(homeTeam.team?.id) || 0,
        team: homeTeamName
      },
      markets: {
        spread: [],
        total: [],
        moneyline: []
      },
      fetchedAt
    };

    // Parse odds data if available
    if (event.odds && event.odds.items && event.odds.items.length > 0) {
      console.log("Parsing odds for event:", event.id);
      const oddsData = event.odds.items[0]; // ESPN BET odds (provider 58)
      
      // Parse spread odds
      if (oddsData.awayTeamOdds?.spreadOdds !== undefined && oddsData.homeTeamOdds?.spreadOdds !== undefined) {
        const awaySpreadOdds = parseInt(oddsData.awayTeamOdds.spreadOdds);
        const homeSpreadOdds = parseInt(oddsData.homeTeamOdds.spreadOdds);
        const spreadLine = oddsData.spread || 0;
        
        // Determine which team is the favorite based on moneyline odds
        const awayMoneyline = oddsData.awayTeamOdds?.current?.moneyLine?.american;
        const homeMoneyline = oddsData.homeTeamOdds?.current?.moneyLine?.american;
        
        let awayHandicap: number;
        let homeHandicap: number;
        
        // The spreadLine already indicates which team is favored
        // Negative spreadLine means home team is favored, positive means away team is favored
        if (spreadLine < 0) {
          // Home team is favored (negative spreadLine)
          awayHandicap = Math.abs(spreadLine);  // Away team gets positive points (underdog)
          homeHandicap = spreadLine;            // Home team gives points (favorite)
        } else {
          // Away team is favored (positive spreadLine)
          awayHandicap = -spreadLine;           // Away team gives points (favorite)
          homeHandicap = Math.abs(spreadLine);  // Home team gets positive points (underdog)
        }
        
        houseEvent.markets.spread = [
          {
            side: "away",
            handicap: awayHandicap,
            price: awaySpreadOdds
          },
          {
            side: "home", 
            handicap: homeHandicap,
            price: homeSpreadOdds
          }
        ];
      }
      
      // Parse total (over/under) odds
      if (oddsData.overOdds && oddsData.underOdds && oddsData.overUnder) {
        const overOdds = parseInt(oddsData.overOdds);
        const underOdds = parseInt(oddsData.underOdds);
        const totalLine = oddsData.overUnder;
        
        houseEvent.markets.total = [
          {
            type: "over",
            points: totalLine,
            price: overOdds
          },
          {
            type: "under",
            points: totalLine,
            price: underOdds
          }
        ];
      }
      
      // Parse moneyline odds
      if (oddsData.awayTeamOdds?.current?.moneyLine?.american && oddsData.homeTeamOdds?.current?.moneyLine?.american) {
        const awayMoneyline = parseInt(oddsData.awayTeamOdds.current.moneyLine.american);
        const homeMoneyline = parseInt(oddsData.homeTeamOdds.current.moneyLine.american);
        
        houseEvent.markets.moneyline = [
          {
            side: "away",
            price: awayMoneyline
          },
          {
            side: "home",
            price: homeMoneyline
          }
        ];
      }
      
      console.log(`Parsed odds - Spread: ${houseEvent.markets.spread.length}, Total: ${houseEvent.markets.total.length}, Moneyline: ${houseEvent.markets.moneyline.length}`);
    } else {
      console.log("No odds data available for event:", event.id);
    }
    
    games.push(houseEvent);
  }

  return games;
}
