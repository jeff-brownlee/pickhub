import { GameFactbook } from '../types/factbook';
import { factbookService } from '../services/factbookService';
import fs from 'fs';
import path from 'path';

// Mock team ID mapping for our current games
// In a real implementation, we'd get these from ESPN API
const TEAM_ID_MAP: Record<string, string> = {
  'PHI': '21', // Eagles
  'DAL': '6',  // Cowboys
  'NYJ': '20', // Jets
  'NE': '17'   // Patriots
};

interface GameData {
  id: string;
  away: { name: string; abbr: string; primaryHex: string };
  home: { name: string; abbr: string; primaryHex: string };
  kickoffEt: string;
  line?: string;
  total?: number;
}

async function generateFactbooksForWeek(week: number) {
  const weekStr = week.toString().padStart(2, '0');
  const gamesPath = path.join(process.cwd(), '..', 'data/nfl/season-2025', `week-${weekStr}`, 'games.json');
  const factbooksDir = path.join(process.cwd(), '..', 'data/nfl/season-2025', `week-${weekStr}`, 'factbooks');
  
  // Create factbooks directory if it doesn't exist
  if (!fs.existsSync(factbooksDir)) {
    fs.mkdirSync(factbooksDir, { recursive: true });
  }

  try {
    // Read games data
    const gamesData: GameData[] = JSON.parse(fs.readFileSync(gamesPath, 'utf8'));
    console.log(`Found ${gamesData.length} games for Week ${week}`);

    // Generate factbook for each game
    for (const game of gamesData) {
      console.log(`\nGenerating factbook for ${game.away.abbr} @ ${game.home.abbr}...`);
      
      const awayTeamId = TEAM_ID_MAP[game.away.abbr];
      const homeTeamId = TEAM_ID_MAP[game.home.abbr];
      
      if (!awayTeamId || !homeTeamId) {
        console.warn(`Missing team ID for ${game.away.abbr} or ${game.home.abbr}, skipping...`);
        continue;
      }

      try {
        // Generate factbook using ESPN API
        const factbook = await factbookService.buildGameFactbook(
          game.id,
          awayTeamId,
          homeTeamId
        );

        // Enhance with our game data
        factbook.kickoffISO = game.kickoffEt;
        factbook.bettingContext = {
          ...factbook.bettingContext,
          currentLine: {
            spread: parseSpreadFromLine(game.line),
            total: game.total,
            moneyline: { home: -140, away: 120 } // Mock data
          }
        };

        // Save factbook
        const factbookPath = path.join(factbooksDir, `${game.id}.json`);
        fs.writeFileSync(factbookPath, JSON.stringify(factbook, null, 2));
        console.log(`✅ Saved factbook: ${factbookPath}`);
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error generating factbook for ${game.id}:`, error);
        
        // Create a minimal factbook as fallback
        const fallbackFactbook = createFallbackFactbook(game);
        const factbookPath = path.join(factbooksDir, `${game.id}.json`);
        fs.writeFileSync(factbookPath, JSON.stringify(fallbackFactbook, null, 2));
        console.log(`⚠️  Saved fallback factbook: ${factbookPath}`);
      }
    }

    console.log(`\n🎉 Factbook generation complete for Week ${week}!`);
    
  } catch (error) {
    console.error('Error reading games data:', error);
  }
}

function parseSpreadFromLine(line?: string): number | undefined {
  if (!line) return undefined;
  
  // Parse "PHI -2.5" format
  const match = line.match(/-?\d+\.?\d*/);
  return match ? parseFloat(match[0]) : undefined;
}

function createFallbackFactbook(game: GameData): GameFactbook {
  return {
    gameId: game.id,
    season: 2025,
    week: 1,
    kickoffISO: game.kickoffEt,
    venue: {
      id: 'unknown',
      name: 'Unknown Venue',
      city: 'Unknown',
      state: 'Unknown',
      surface: 'turf',
      indoor: false
    },
    teams: {
      away: createFallbackTeamData(game.away, 'away'),
      home: createFallbackTeamData(game.home, 'home')
    },
    bettingContext: {
      currentLine: {
        spread: parseSpreadFromLine(game.line),
        total: game.total,
        moneyline: { home: -140, away: 120 }
      },
      bettingTrends: {
        spread: { home: 50, away: 50 },
        total: { over: 50, under: 50 },
        moneyline: { home: 50, away: 50 }
      },
      keyNumbers: {
        spread: [3, 7, 10, 14],
        total: [40, 45, 50, 55]
      }
    },
    keyMatchups: [],
    trends: [],
    injuries: [],
    lastUpdated: new Date().toISOString()
  };
}

function createFallbackTeamData(team: { name: string; abbr: string }, homeAway: 'home' | 'away') {
  return {
    id: team.abbr,
    name: team.name,
    abbreviation: team.abbr,
    record: {
      wins: 0,
      losses: 0,
      ties: 0,
      winPercentage: 0,
      lastFive: [],
      streak: { type: 'L' as const, count: 0 }
    },
    recentForm: {
      lastFiveGames: [],
      pointsFor: 0,
      pointsAgainst: 0,
      pointDifferential: 0,
      averageMargin: 0
    },
    statistics: {
      offense: {
        pointsPerGame: 0,
        yardsPerGame: 0,
        passingYards: 0,
        rushingYards: 0,
        thirdDownPercentage: 0,
        redZonePercentage: 0,
        turnovers: 0
      },
      defense: {
        pointsAllowed: 0,
        yardsAllowed: 0,
        passingYardsAllowed: 0,
        rushingYardsAllowed: 0,
        sacks: 0,
        interceptions: 0,
        forcedFumbles: 0
      },
      specialTeams: {
        fieldGoalPercentage: 0,
        puntReturnAverage: 0,
        kickoffReturnAverage: 0
      }
    },
    keyPlayers: [],
    coaching: {
      headCoach: 'Unknown',
      experience: 0,
      record: { wins: 0, losses: 0, ties: 0 }
    },
    situational: {
      homeAdvantage: {
        homeRecord: { wins: 0, losses: 0, ties: 0 },
        homePointsFor: 0,
        homePointsAgainst: 0
      },
      restAdvantage: {
        daysRest: 7,
        opponentDaysRest: 7,
        restAdvantage: 'even' as const
      },
      travel: {
        milesTraveled: homeAway === 'away' ? 500 : 0,
        timeZoneChange: 0,
        shortWeek: false
      },
      motivation: {
        playoffRace: true,
        divisionGame: false,
        rivalry: false
      }
    },
    trends: []
  };
}

// CLI usage
const week = process.argv[2] ? parseInt(process.argv[2]) : 1;
generateFactbooksForWeek(week)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

export { generateFactbooksForWeek };
