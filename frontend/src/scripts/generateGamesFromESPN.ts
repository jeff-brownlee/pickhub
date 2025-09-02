import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

// ESPN API configuration
const ESPN_BASE = 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl';
const SEASON = 2025;

interface ESPNEvent {
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
    venue?: {
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
  }>;
}

interface ESPNResponse {
  items: Array<{ $ref: string }>;
  count: number;
  pageIndex: number;
  pageSize: number;
  pageCount: number;
}

interface GameData {
  id: string;
  away: {
    name: string;
    abbr: string;
    primaryHex: string;
  };
  home: {
    name: string;
    abbr: string;
    primaryHex: string;
  };
  kickoffEt: string;
  line?: string;
  total?: number;
}

// Team color mapping (you might want to expand this)
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

async function generateGamesForWeek(week: number): Promise<GameData[]> {
  try {
    console.log(`Fetching games for Week ${week}...`);
    
    // Fetch events for the week (season type 2 = regular season)
    const url = `${ESPN_BASE}/seasons/${SEASON}/types/2/weeks/${week}/events?lang=en&region=us`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.status}`);
    }

    const data = await response.json() as ESPNResponse;
    console.log(`Found ${data.items.length} events`);

    const games: GameData[] = [];

    for (const eventRef of data.items) {
      // Fetch full event data from the $ref
      const eventResponse = await fetch(eventRef.$ref);
      if (!eventResponse.ok) {
        console.warn(`Failed to fetch event data from ${eventRef.$ref}: ${eventResponse.status}`);
        continue;
      }
      
      const event = await eventResponse.json() as ESPNEvent;
      console.log(`Processing event: ${event.id} - ${event.name}`);
      
      const competition = event.competitions?.[0];
      if (!competition) {
        console.log("No competition found for event:", event.id);
        continue;
      }

      const awayTeam = competition.competitors.find(c => c.homeAway === "away");
      const homeTeam = competition.competitors.find(c => c.homeAway === "home");
      
      if (!awayTeam || !homeTeam) {
        console.log("Missing team data for event:", event.id);
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

      console.log(`Teams: ${awayTeamData.displayName} (${awayTeamData.abbreviation}) @ ${homeTeamData.displayName} (${homeTeamData.abbreviation})`);

      // Create game ID
      const gameId = `${awayTeamData.abbreviation.toLowerCase()}-${homeTeamData.abbreviation.toLowerCase()}`;
      
      // Format kickoff time
      const kickoffDate = new Date(event.date);
      const kickoffEt = kickoffDate.toISOString().replace('Z', '-04:00'); // Assume ET for now

      const game: GameData = {
        id: gameId,
        away: {
          name: awayTeamData.displayName,
          abbr: awayTeamData.abbreviation,
          primaryHex: TEAM_COLORS[awayTeamData.abbreviation] || '#000000'
        },
        home: {
          name: homeTeamData.displayName,
          abbr: homeTeamData.abbreviation,
          primaryHex: TEAM_COLORS[homeTeamData.abbreviation] || '#000000'
        },
        kickoffEt: kickoffEt
        // Note: We'll need to fetch odds separately for line and total
      };

      games.push(game);
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return games;
  } catch (error) {
    console.error('Error generating games:', error);
    throw error;
  }
}

async function saveGamesForWeek(week: number, games: GameData[]) {
  const weekStr = week.toString().padStart(2, '0');
  const gamesPath = path.join(process.cwd(), 'public/data/nfl/season-2025', `week-${weekStr}`, 'games.json');
  
  // Ensure directory exists
  const gamesDir = path.dirname(gamesPath);
  if (!fs.existsSync(gamesDir)) {
    fs.mkdirSync(gamesDir, { recursive: true });
  }

  // Save games data
  fs.writeFileSync(gamesPath, JSON.stringify(games, null, 2));
  console.log(`✅ Saved ${games.length} games to: ${gamesPath}`);
}

// CLI usage
const week = process.argv[2] ? parseInt(process.argv[2]) : 1;

generateGamesForWeek(week)
  .then(games => saveGamesForWeek(week, games))
  .then(() => {
    console.log(`\n🎉 Games generation complete for Week ${week}!`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

export { generateGamesForWeek };
