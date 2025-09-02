import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import fetch from "node-fetch";

dayjs.extend(utc);
dayjs.extend(timezone);

// Helper function to fetch team data from ESPN API $ref URLs
async function fetchTeamData(teamRef: string): Promise<{ displayName: string; abbreviation: string; nickname: string } | null> {
  try {
    const response = await fetch(teamRef);
    if (!response.ok) {
      console.warn(`Failed to fetch team data from ${teamRef}: ${response.status}`);
      return null;
    }
    const teamData = await response.json() as any;
    return {
      displayName: teamData.displayName || "Unknown Team",
      abbreviation: teamData.abbreviation || "UNK",
      nickname: teamData.nickname || teamData.name || "Unknown"
    };
  } catch (error) {
    console.warn(`Error fetching team data from ${teamRef}:`, error);
    return null;
  }
}

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

// Game data structure for our frontend
export interface GameData {
  id: string;
  away: {
    name: string;
    abbr: string;
    nickname: string;
    primaryHex: string;
  };
  home: {
    name: string;
    abbr: string;
    nickname: string;
    primaryHex: string;
  };
  kickoffEt: string;
  line?: string;
  total?: number;
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
}

// Team color mapping
const TEAM_COLORS: Record<string, string> = {
  'PHI': '#004C54', // Eagles
  'DAL': '#041E42', // Cowboys
  'NYJ': '#125740', // Jets
  'NE': '#0C2340',  // Patriots
  'BUF': '#00338D', // Bills
  'MIA': '#008E97', // Dolphins
  'NYG': '#0B2265', // Giants
  'WAS': '#5A1414', // Commanders
  'CHI': '#0B162A', // Bears
  'DET': '#0076B6', // Lions
  'GB': '#203731',  // Packers
  'MIN': '#4F2683', // Vikings
  'ATL': '#A71930', // Falcons
  'CAR': '#0085CA', // Panthers
  'NO': '#D3BC8D',  // Saints
  'TB': '#D50A0A',  // Buccaneers
  'ARI': '#97233F', // Cardinals
  'LAR': '#003594', // Rams
  'SF': '#AA0000',  // 49ers
  'SEA': '#002244', // Seahawks
  'BAL': '#241773', // Ravens
  'CIN': '#FB4F14', // Bengals
  'CLE': '#311D00', // Browns
  'PIT': '#FFB612', // Steelers
  'HOU': '#03202F', // Texans
  'IND': '#002C5F', // Colts
  'JAX': '#006778', // Jaguars
  'TEN': '#0C2340', // Titans
  'DEN': '#FB4F14', // Broncos
  'KC': '#E31837',  // Chiefs
  'LV': '#000000',  // Raiders
  'LAC': '#0080C6'  // Chargers
};

export async function parseEspnNflApi(response: EspnNflApiResponse): Promise<GameData[]> {
  const games: GameData[] = [];

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
    const awayTeamNickname = awayTeamData.nickname;
    const homeTeamNickname = homeTeamData.nickname;

    console.log(`Teams: ${awayTeamName} (${awayTeamAbbr}) @ ${homeTeamName} (${homeTeamAbbr})`);
    console.log(`Nicknames: ${awayTeamNickname} @ ${homeTeamNickname}`);

    // Generate unique ID using date and teams
    const gameDate = new Date(event.date);
    const dateStr = gameDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    const gameId = `${dateStr}-${awayTeamAbbr.toLowerCase()}-${homeTeamAbbr.toLowerCase()}`;
    
    // Format kickoff time
    const kickoffDate = new Date(event.date);
    const kickoffEt = kickoffDate.toISOString().replace('Z', '-04:00'); // Assume ET for now

    const game: GameData = {
      id: gameId,
      away: {
        name: awayTeamName,
        abbr: awayTeamAbbr,
        nickname: awayTeamNickname,
        primaryHex: TEAM_COLORS[awayTeamAbbr] || '#000000'
      },
      home: {
        name: homeTeamName,
        abbr: homeTeamAbbr,
        nickname: homeTeamNickname,
        primaryHex: TEAM_COLORS[homeTeamAbbr] || '#000000'
      },
      kickoffEt: kickoffEt
    };

    // Parse odds data if available
    if (event.odds && event.odds.items && event.odds.items.length > 0) {
      console.log("Parsing odds for event:", event.id);
      const oddsData = event.odds.items[0]; // ESPN BET odds (provider 58)
      
      const odds: GameData['odds'] = {};
      
      // Parse spread odds
      if (oddsData.awayTeamOdds?.spreadOdds !== undefined && oddsData.homeTeamOdds?.spreadOdds !== undefined) {
        const awaySpreadOdds = parseInt(oddsData.awayTeamOdds.spreadOdds);
        const homeSpreadOdds = parseInt(oddsData.homeTeamOdds.spreadOdds);
        const spreadLine = oddsData.spread || 0;
        
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
        
        odds.spread = {
          away: { line: awayHandicap, odds: awaySpreadOdds },
          home: { line: homeHandicap, odds: homeSpreadOdds }
        };
      }
      
      // Parse total (over/under) odds
      if (oddsData.overOdds && oddsData.underOdds && oddsData.overUnder) {
        const overOdds = parseInt(oddsData.overOdds);
        const underOdds = parseInt(oddsData.underOdds);
        const totalLine = oddsData.overUnder;
        
        odds.total = {
          over: { line: totalLine, odds: overOdds },
          under: { line: totalLine, odds: underOdds }
        };
      }
      
      // Parse moneyline odds
      if (oddsData.awayTeamOdds?.current?.moneyLine?.american && oddsData.homeTeamOdds?.current?.moneyLine?.american) {
        const awayMoneyline = parseInt(oddsData.awayTeamOdds.current.moneyLine.american);
        const homeMoneyline = parseInt(oddsData.homeTeamOdds.current.moneyLine.american);
        
        odds.moneyline = {
          away: { odds: awayMoneyline },
          home: { odds: homeMoneyline }
        };
      }
      
      game.odds = odds;
      console.log(`Parsed odds - Spread: ${odds.spread ? 'Yes' : 'No'}, Total: ${odds.total ? 'Yes' : 'No'}, Moneyline: ${odds.moneyline ? 'Yes' : 'No'}`);
    } else {
      console.log("No odds data available for event:", event.id);
    }
    
    games.push(game);
  }

  return games;
}
