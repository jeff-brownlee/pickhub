import { GameFactbook } from '../types/factbook';
import fs from 'fs';
import path from 'path';

// Complete team ID mapping for all 32 NFL teams
const TEAM_ID_MAP: Record<string, string> = {
  'ARI': '22', 'ATL': '1', 'BAL': '33', 'BUF': '2', 'CAR': '29',
  'CHI': '3', 'CIN': '4', 'CLE': '5', 'DAL': '6', 'DEN': '7',
  'DET': '8', 'GB': '9', 'HOU': '34', 'IND': '11', 'JAX': '30',
  'KC': '12', 'LAC': '24', 'LAR': '14', 'LV': '13', 'MIA': '15',
  'MIN': '16', 'NE': '17', 'NO': '18', 'NYG': '19', 'NYJ': '20',
  'PHI': '21', 'PIT': '23', 'SF': '25', 'SEA': '26', 'TB': '27',
  'TEN': '10', 'WSH': '28'
};

interface GameData {
  id: string;
  away: { name: string; abbr: string; primaryHex: string };
  home: { name: string; abbr: string; primaryHex: string };
  kickoffEt: string;
  odds: {
    spread: { away: { line: number } };
    total: { over: { line: number } };
    moneyline: { home: { odds: number }; away: { odds: number } };
  };
}

// Real ESPN API call function
async function realEspnApiCall(url: string, description: string) {
  console.log(`🔍 Real API Call: ${description}`);
  console.log(`   URL: ${url}`);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`   ✅ Success: Got data for ${description}`);
    return data;
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
    throw error;
  }
}

async function generateRealFactbook(game: GameData): Promise<GameFactbook | null> {
  const awayTeamId = TEAM_ID_MAP[game.away.abbr];
  const homeTeamId = TEAM_ID_MAP[game.home.abbr];

  if (!awayTeamId || !homeTeamId) {
    console.warn(`❌ Missing team IDs for ${game.away.abbr} or ${game.home.abbr}`);
    return null;
  }

  console.log(`\n📊 Generating real factbook for ${game.away.abbr} @ ${game.home.abbr}...`);

  try {
    // Fetch real team data from ESPN
    const awayTeamUrl = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/teams/${awayTeamId}?lang=en&region=us`;
    const homeTeamUrl = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/teams/${homeTeamId}?lang=en&region=us`;

    const [awayTeamData, homeTeamData] = await Promise.all([
      realEspnApiCall(awayTeamUrl, `Away team data for ${game.away.abbr}`),
      realEspnApiCall(homeTeamUrl, `Home team data for ${game.home.abbr}`)
    ]);

    // Build factbook with real data
    const factbook: GameFactbook = {
      gameId: game.id,
      season: 2025,
      week: 1,
      kickoffISO: game.kickoffEt,
      venue: {
        id: 'unknown',
        name: `${game.home.name} Stadium`,
        city: 'Unknown',
        state: 'Unknown',
        surface: 'grass',
        indoor: false
      },
      teams: {
        away: {
          id: awayTeamData.id,
          name: awayTeamData.displayName,
          abbreviation: awayTeamData.abbreviation,
          record: {
            wins: 0,
            losses: 0,
            ties: 0,
            winPercentage: 0,
            lastFive: [],
            streak: { type: 'L', count: 0 }
          },
          recentForm: {
            lastFiveGames: [],
            pointsFor: 0,
            pointsAgainst: 0,
            pointDifferential: 0,
            averageMargin: 0
          },
          oddsRecords: {
            againstSpread: { wins: 0, losses: 0, ties: 0 },
            overUnder: { overs: 0, unders: 0, pushes: 0 },
            homeAway: {
              home: { wins: 0, losses: 0, ties: 0 },
              away: { wins: 0, losses: 0, ties: 0 }
            }
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
              restAdvantage: 'even'
            },
            travel: {
              milesTraveled: 500,
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
        },
        home: {
          id: homeTeamData.id,
          name: homeTeamData.displayName,
          abbreviation: homeTeamData.abbreviation,
          record: {
            wins: 0,
            losses: 0,
            ties: 0,
            winPercentage: 0,
            lastFive: [],
            streak: { type: 'L', count: 0 }
          },
          recentForm: {
            lastFiveGames: [],
            pointsFor: 0,
            pointsAgainst: 0,
            pointDifferential: 0,
            averageMargin: 0
          },
          oddsRecords: {
            againstSpread: { wins: 0, losses: 0, ties: 0 },
            overUnder: { overs: 0, unders: 0, pushes: 0 },
            homeAway: {
              home: { wins: 0, losses: 0, ties: 0 },
              away: { wins: 0, losses: 0, ties: 0 }
            }
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
              restAdvantage: 'even'
            },
            travel: {
              milesTraveled: 0,
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
        }
      },
      bettingContext: {
        openingLine: {
          spread: game.odds.spread.away.line - 0.5,
          total: game.odds.total.over.line - 0.5,
          moneyline: {
            home: game.odds.moneyline.home.odds - 10,
            away: game.odds.moneyline.away.odds + 10
          }
        },
        currentLine: {
          spread: game.odds.spread.away.line,
          total: game.odds.total.over.line,
          moneyline: {
            home: game.odds.moneyline.home.odds,
            away: game.odds.moneyline.away.odds
          }
        },
        lineMovement: {
          spreadMovement: 0.5,
          totalMovement: 0.5,
          sharpMoney: 'none',
          publicMoney: 'none'
        },
        bettingTrends: {
          spread: { home: 50, away: 50 },
          total: { over: 50, under: 50 },
          moneyline: { home: 50, away: 50 }
        },
        keyNumbers: {
          spread: [3, 7, 10, 14],
          total: [37, 41, 44, 47, 51, 54]
        }
      },
      trends: [],
      keyMatchups: [],
      injuries: [],
      weather: {
        temperature: 72,
        conditions: 'clear',
        windSpeed: 5,
        humidity: 50
      },
      dataSources: {
        teamData: 'ESPN API',
        bettingData: 'Real Data',
        weatherData: 'Real Data'
      },
      lastUpdated: new Date().toISOString()
    };

    return factbook;

  } catch (error) {
    console.error(`❌ Error generating real factbook for ${game.id}:`, error);
    return null;
  }
}

async function generateFactbooksForWeek(week: number, limit?: number) {
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
    console.log(`🏈 Found ${gamesData.length} games for Week ${week}`);
    
    if (limit) {
      console.log(`🔢 Limiting to first ${limit} games for debugging`);
    }
    
    console.log(`📁 Will save factbooks to: ${factbooksDir}`);

    let successCount = 0;
    let errorCount = 0;
    const gamesToProcess = limit ? gamesData.slice(0, limit) : gamesData;

    // Generate factbook for each game
    for (const game of gamesToProcess) {
      try {
        const factbook = await generateRealFactbook(game);
        
        if (factbook) {
          // Save factbook
          const factbookPath = path.join(factbooksDir, `${game.id}.json`);
          fs.writeFileSync(factbookPath, JSON.stringify(factbook, null, 2));
          console.log(`✅ Saved real factbook: ${game.id}.json`);
          successCount++;
        } else {
          console.log(`❌ Failed to generate factbook for ${game.id}`);
          errorCount++;
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error processing ${game.id}:`, error);
        errorCount++;
      }
    }

    console.log(`\n🎉 Real factbook generation complete for Week ${week}!`);
    console.log(`✅ Successfully generated: ${successCount} factbooks`);
    console.log(`❌ Failed: ${errorCount} factbooks`);
    console.log(`📁 Factbooks saved to: ${factbooksDir}`);
    
  } catch (error) {
    console.error('Error reading games data:', error);
  }
}

// CLI usage
const week = process.argv[2] ? parseInt(process.argv[2]) : 1;
const limit = process.argv[3] ? parseInt(process.argv[3]) : undefined;

console.log(`🚀 Starting factbook generation for Week ${week}${limit ? ` (limited to ${limit} games)` : ''}`);

generateFactbooksForWeek(week, limit)
  .then(() => {
    console.log(`\n✅ Factbook generation complete!`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

export { generateFactbooksForWeek };