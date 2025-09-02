import fs from 'fs';
import path from 'path';

// Types for our pick data structure
interface Team {
  id: string;
  name: string;
  nickname: string;
  score?: number | null;
}

interface MarketData {
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
}

interface PickSelection {
  betType: 'spread' | 'total' | 'moneyline';
  side: 'away' | 'home' | 'over' | 'under';
  line: number;
  odds: number;
  units: number;
  rationale: string;
}

interface Pick {
  gameId: string;
  gameDate: string;
  awayTeam: Team;
  homeTeam: Team;
  marketData: MarketData;
  selection: PickSelection;
  result: {
    status: 'pending' | 'won' | 'loss' | 'push';
    finalLine: number;
    finalOdds: number;
    payout: number;
    netUnits: number;
  };
}

interface PickData {
  analystId: string;
  week: number;
  season: number;
  picks: Pick[];
  weekSummary: {
    totalPicks: number;
    totalUnits: number;
    weekPayout: number;
    weekNetUnits: number;
  };
}

interface GameData {
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

// Persona configurations with different betting styles
const PERSONAS = {
  coach: {
    name: 'Coach',
    rationaleTemplates: {
      spread: [
        "The {team} defense has been solid against the run and should be able to control the line of scrimmage. This spread is too high given the matchup.",
        "Home field advantage is real in this division rivalry. The {team} will cover this number with their strong defensive unit.",
        "The {team} have the better coaching staff and will make the necessary adjustments to cover this spread."
      ],
      total: [
        "Both teams have strong defenses and this total is inflated. The weather conditions also favor the under.",
        "Early season games tend to be lower scoring as teams are still finding their rhythm. Under the total here.",
        "The {team} defense is elite and will keep this game under the total."
      ],
      moneyline: [
        "The {team} have the better quarterback and more experience in big games. Taking the moneyline for value.",
        "Home field advantage and the {team} superior talent will lead to a victory.",
        "The {team} are the better team overall and should win this game outright."
      ]
    }
  },
  contrarian: {
    name: 'Contrarian',
    rationaleTemplates: {
      spread: [
        "Everyone's on the other side, which means the {team} are getting value. The public is wrong 70% of the time.",
        "The sharp money is moving this line for a reason. I'm fading the public and taking the {team}.",
        "When everyone loves one side, I love the other. The {team} are the contrarian play here."
      ],
      total: [
        "The public is hammering the over, so I'm taking the under. The {team} defense is better than people think.",
        "Everyone's expecting a shootout, but these division games tend to be lower scoring. Under the total.",
        "The public is on the over, which means there's value on the under. The {team} will control the pace."
      ],
      moneyline: [
        "The public is all over the favorite, which means the {team} moneyline has value. Fade the masses.",
        "Everyone's betting the chalk, so I'm taking the {team} as the contrarian play.",
        "The public is wrong about this game. The {team} are going to shock everyone and win outright."
      ]
    }
  },
  fratguy: {
    name: 'Frat Guy',
    rationaleTemplates: {
      spread: [
        "The {team} are going to DOMINATE this game! Let's ride with the favorites and cash this ticket!",
        "This is a PRIMETIME game and the {team} are going to show up big! Take the points and let's party!",
        "The {team} are the better team and they're going to COVER this spread easily! Send it!"
      ],
      total: [
        "This is going to be a SHOOTOUT! Both teams are going to put up points in bunches! OVER all day!",
        "The {team} offense is EXPLOSIVE and they're going to light up the scoreboard! OVER the total!",
        "Primetime game means primetime offense! The {team} are going to score and score often! OVER!"
      ],
      moneyline: [
        "The {team} are the BETTER team and they're going to WIN this game! Let's ride with the favorites!",
        "This is a BIG GAME and the {team} are going to show up! Moneyline all day!",
        "The {team} have the STAR POWER and they're going to get the W! Let's go!"
      ]
    }
  },
  hotgirl: {
    name: 'Hot Girl',
    rationaleTemplates: {
      spread: [
        "The {team} are so good and everyone's talking about them! They're going to cover this spread easily!",
        "I love the {team} this week! They have such good vibes and they're going to win big!",
        "The {team} are trending on social media for a reason! They're going to cover and look good doing it!"
      ],
      total: [
        "This game is going to be so exciting! Both teams are going to score a ton of points! OVER!",
        "The {team} offense is so fun to watch! They're going to put up big numbers! OVER the total!",
        "This is going to be a high-scoring game with lots of touchdowns! OVER all the way!"
      ],
      moneyline: [
        "The {team} are the better team and they're going to win! I love their energy!",
        "Everyone's picking the {team} and I agree! They have such good vibes!",
        "The {team} are going to win this game! They're so talented and fun to watch!"
      ]
    }
  },
  joe: {
    name: 'Average Joe',
    rationaleTemplates: {
      spread: [
        "The {team} are the better team and should cover this spread. Seems like the obvious pick to me.",
        "I like the {team} here. They've been playing well and this spread seems fair.",
        "The {team} are getting points and I think they can keep it close. Good value here."
      ],
      total: [
        "This total seems about right. I think both teams will score their fair share of points.",
        "The {team} have a good offense, so I'm expecting some points in this game.",
        "This looks like a typical NFL game. Should be a decent amount of scoring."
      ],
      moneyline: [
        "The {team} are the better team and should win this game. Pretty straightforward pick.",
        "I like the {team} to win here. They've got the better players and coaching.",
        "The {team} are favored for a reason. They should win this game."
      ]
    }
  },
  mobster: {
    name: 'Mobster',
    rationaleTemplates: {
      spread: [
        "The line's moving toward the {team} for a reason. The smart money knows something. I'm following it.",
        "The sharps are loading up on the {team}. When the line moves like this, you follow the money.",
        "The {team} are getting action from the right people. The line tells the story here."
      ],
      total: [
        "The total's been moving down, which means the sharp money's on the under. I'm with them.",
        "The {team} defense is better than the public thinks. The line movement confirms it.",
        "The smart money's on the under here. The {team} will control the pace of this game."
      ],
      moneyline: [
        "The {team} moneyline is getting sharp action. When the pros bet, I bet with them.",
        "The line movement shows the smart money's on the {team}. I'm following the money.",
        "The {team} are getting respect from the right people. The moneyline's the play here."
      ]
    }
  },
  nerd: {
    name: 'Nerd',
    rationaleTemplates: {
      spread: [
        "Statistical analysis shows that {team} performs 15% better than expected against teams with similar defensive rankings. The spread doesn't account for this historical edge.",
        "Advanced metrics indicate the {team} have a 67% probability of covering this spread based on EPA/play differential and situational factors.",
        "The {team} have covered in 8 of their last 10 games as underdogs, and the current line doesn't reflect this trend."
      ],
      total: [
        "Historical data from the last 5 seasons shows that Week 1 totals in this division average 38.2 points. The current total is 4.3 points above the mean.",
        "Both teams rank in the bottom 25% for pace of play, and the weather forecast suggests potential wind factors that could impact passing efficiency.",
        "The {team} defense has improved significantly in the offseason, and statistical models predict this game to finish 2.1 points under the total."
      ],
      moneyline: [
        "Expected points added (EPA) analysis shows the {team} have a 58% win probability, making this moneyline bet profitable at current odds.",
        "The {team} have a 12% edge in turnover differential and red zone efficiency, key factors that correlate strongly with game outcomes.",
        "Monte Carlo simulations run 10,000 times show the {team} winning 61% of scenarios, providing positive expected value on the moneyline."
      ]
    }
  },
  podcaster: {
    name: 'Podcaster',
    rationaleTemplates: {
      spread: [
        "Listen, the {team} are going to COVER this spread! They've been disrespected all week and I'm not buying the hype on the other side!",
        "This is a MASSIVE value play! The {team} are getting way too many points here. They're going to keep this close and cover easily!",
        "I've been watching the {team} all offseason and they're going to SHOCK everyone! Take the points and thank me later!"
      ],
      total: [
        "This is going to be a SHOOTOUT! Both teams have explosive offenses and questionable defenses. OVER all day!",
        "Listen, this total is WAY too low! These teams are going to put up points in bunches. OVER 48.5 is the play!",
        "The {team} offense is going to EXPLODE in this game! OVER the total, no question about it!"
      ],
      moneyline: [
        "The {team} are going to WIN this game outright! I don't care what the odds say, they're the better team!",
        "This is a MASSIVE upset waiting to happen! The {team} are going to shock the world and win this game!",
        "I'm ALL IN on the {team} moneyline! They're going to prove everyone wrong and get the W!"
      ]
    }
  },
  pro: {
    name: 'Pro',
    rationaleTemplates: {
      spread: [
        "The {team} are getting value at this number. The market hasn't adjusted for their recent improvements.",
        "This spread represents a key number edge. The {team} have a 12% better chance of covering than the line suggests.",
        "The {team} are in a profitable spot here. The situational factors favor them significantly."
      ],
      total: [
        "The total is mispriced based on recent pace trends. The {team} will control the tempo and keep this under.",
        "Weather and situational factors create value on the under. The {team} defense is underrated.",
        "The {team} have shown a consistent pattern of lower-scoring games in similar spots. Under the total."
      ],
      moneyline: [
        "The {team} moneyline offers positive expected value at current odds. The market is undervaluing them.",
        "The {team} have a 58% implied win probability but are priced at 52%. This is a profitable spot.",
        "The {team} are in a favorable matchup situation. The moneyline provides the best value here."
      ]
    }
  }
};

// Mock market data generator
function generateMockMarketData(): MarketData {
  const spreadLine = Math.round((Math.random() * 14 + 1) * 2) / 2; // 1-14.5 in 0.5 increments
  const totalLine = Math.round((Math.random() * 20 + 35) * 2) / 2; // 35-55 in 0.5 increments
  
  return {
    spread: {
      away: { line: spreadLine, odds: -110 },
      home: { line: -spreadLine, odds: -110 }
    },
    total: {
      over: { line: totalLine, odds: -110 },
      under: { line: totalLine, odds: -110 }
    },
    moneyline: {
      away: { odds: Math.random() > 0.5 ? Math.round(Math.random() * 200 + 100) : -Math.round(Math.random() * 200 + 100) },
      home: { odds: Math.random() > 0.5 ? Math.round(Math.random() * 200 + 100) : -Math.round(Math.random() * 200 + 100) }
    }
  };
}

// Generate random rationale based on persona and bet type
function generateRationale(persona: keyof typeof PERSONAS, betType: 'spread' | 'total' | 'moneyline', teamName: string): string {
  const templates = PERSONAS[persona].rationaleTemplates[betType];
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template.replace('{team}', teamName);
}

// Generate a random pick for a game
function generateRandomPick(game: GameData, persona: keyof typeof PERSONAS): Pick {
  // Use the market data from the game, or generate mock data if not available
  const gameOdds = game.odds;
  const marketData: MarketData = gameOdds && gameOdds.spread && gameOdds.total && gameOdds.moneyline ? {
    spread: gameOdds.spread,
    total: gameOdds.total,
    moneyline: gameOdds.moneyline
  } : generateMockMarketData();
  
  const betTypes: ('spread' | 'total' | 'moneyline')[] = ['spread', 'total', 'moneyline'];
  const betType = betTypes[Math.floor(Math.random() * betTypes.length)];
  
  let selection: PickSelection;
  
  switch (betType) {
    case 'spread':
      const spreadSide = Math.random() > 0.5 ? 'away' : 'home';
      const spreadTeamName = spreadSide === 'away' ? game.away.nickname : game.home.nickname;
      selection = {
        betType: 'spread',
        side: spreadSide,
        line: marketData.spread[spreadSide].line,
        odds: marketData.spread[spreadSide].odds,
        units: 1.0,
        rationale: generateRationale(persona, 'spread', spreadTeamName)
      };
      break;
      
    case 'total':
      const totalSide = Math.random() > 0.5 ? 'over' : 'under';
      selection = {
        betType: 'total',
        side: totalSide,
        line: marketData.total[totalSide].line,
        odds: marketData.total[totalSide].odds,
        units: 1.0,
        rationale: generateRationale(persona, 'total', game.away.nickname)
      };
      break;
      
    case 'moneyline':
      const moneylineSide = Math.random() > 0.5 ? 'away' : 'home';
      const moneylineTeamName = moneylineSide === 'away' ? game.away.nickname : game.home.nickname;
      selection = {
        betType: 'moneyline',
        side: moneylineSide,
        line: 0,
        odds: marketData.moneyline[moneylineSide].odds,
        units: 1.0,
        rationale: generateRationale(persona, 'moneyline', moneylineTeamName)
      };
      break;
  }
  
  return {
    gameId: game.id,
    gameDate: game.kickoffEt,
    awayTeam: {
      id: game.away.abbr,
      name: game.away.nickname,
      nickname: game.away.nickname,
      score: null
    },
    homeTeam: {
      id: game.home.abbr,
      name: game.home.nickname,
      nickname: game.home.nickname,
      score: null
    },
    marketData,
    selection,
    result: {
      status: 'pending',
      finalLine: selection.line,
      finalOdds: selection.odds,
      payout: 0,
      netUnits: 0
    }
  };
}

// Generate picks for a persona
function generatePicksForPersona(persona: keyof typeof PERSONAS, games: GameData[], numPicks: number = 5): PickData {
  // Randomly select games
  const shuffledGames = [...games].sort(() => Math.random() - 0.5);
  const selectedGames = shuffledGames.slice(0, numPicks);
  
  const picks = selectedGames.map(game => generateRandomPick(game, persona));
  
  const totalUnits = picks.reduce((sum, pick) => sum + pick.selection.units, 0);
  
  return {
    analystId: persona,
    week: 1,
    season: 2025,
    picks,
    weekSummary: {
      totalPicks: picks.length,
      totalUnits,
      weekPayout: 0,
      weekNetUnits: 0
    }
  };
}

// Load games data
function loadGamesData(): GameData[] {
  const gamesPath = path.join(process.cwd(), 'public/data/nfl/season-2025/week-01/games.json');
  
  if (!fs.existsSync(gamesPath)) {
    throw new Error(`Games file not found at ${gamesPath}`);
  }
  
  const gamesData = fs.readFileSync(gamesPath, 'utf-8');
  return JSON.parse(gamesData);
}

// Save picks data for a persona
function savePicksForPersona(persona: keyof typeof PERSONAS, picksData: PickData) {
  const picksDir = path.join(process.cwd(), 'public/data/nfl/season-2025/week-01/picks');
  
  // Ensure directory exists
  if (!fs.existsSync(picksDir)) {
    fs.mkdirSync(picksDir, { recursive: true });
  }
  
  const picksPath = path.join(picksDir, `${persona}.json`);
  fs.writeFileSync(picksPath, JSON.stringify(picksData, null, 2));
  console.log(`✅ Saved ${picksData.picks.length} picks for ${persona} to: ${picksPath}`);
}

// Main function
async function generatePickSelections() {
  try {
    console.log('🎯 Generating random pick selections...');
    
    // Load games data
    const games = loadGamesData();
    console.log(`📊 Loaded ${games.length} games`);
    
    // Generate picks for each persona
    const personas: (keyof typeof PERSONAS)[] = ['coach', 'contrarian', 'fratguy', 'hotgirl', 'joe', 'mobster', 'nerd', 'podcaster', 'pro'];
    
    for (const persona of personas) {
      console.log(`\n🎲 Generating picks for ${persona}...`);
      const picksData = generatePicksForPersona(persona, games, 5);
      
      // Log the picks
      picksData.picks.forEach((pick, index) => {
        const { betType, side, line, odds, rationale } = pick.selection;
        console.log(`  ${index + 1}. ${pick.gameId}: ${betType} ${side} ${line} (${odds}) - ${rationale.substring(0, 60)}...`);
      });
      
      savePicksForPersona(persona, picksData);
    }
    
    console.log('\n🎉 Pick selection generation complete!');
    
  } catch (error) {
    console.error('❌ Error generating pick selections:', error);
    throw error;
  }
}

// Run the script
generatePickSelections()
  .then(() => {
    console.log('\n✅ All pick selections generated successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });

export { generatePickSelections };
