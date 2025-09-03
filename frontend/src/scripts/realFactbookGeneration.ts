import fs from 'fs';
import path from 'path';

interface RealFactbookDebugInfo {
  gameId: string;
  totalApiCalls: number;
  totalFacts: number;
  logs: Array<{
    timestamp: string;
    apiCall: string;
    url: string;
    responseData?: any;
    extractedFacts: Array<{
      field: string;
      value: any;
      source: string;
    }>;
    errors?: string[];
  }>;
  summary: {
    espnApiCalls: number;
    realDataFacts: number;
    enhancedDataFacts: number;
    failedApiCalls: number;
  };
}

// Real ESPN API calls
async function realEspnApiCall(url: string, description: string): Promise<any> {
  console.log(`🔍 Real API Call: ${description}`);
  console.log(`   URL: ${url}`);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`   ✅ Success: ${JSON.stringify(data, null, 2)}`);
    return data;
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
    throw error;
  }
}

async function generateRealFactbook(gameId: string): Promise<RealFactbookDebugInfo> {
  const debugInfo: RealFactbookDebugInfo = {
    gameId,
    totalApiCalls: 0,
    totalFacts: 0,
    logs: [],
    summary: {
      espnApiCalls: 0,
      realDataFacts: 0,
      enhancedDataFacts: 0,
      failedApiCalls: 0
    }
  };

  console.log(`\n🔍 Starting REAL factbook generation for ${gameId}\n`);

  // Parse game ID to get teams
  const gameKey = gameId.replace('2025-09-05-', '').replace('2025-09-07-', '');
  const [awayAbbr, homeAbbr] = gameKey.split('-').map(abbr => abbr.toUpperCase());
  
  const teamIdMap: Record<string, string> = {
    'DAL': '6',
    'PHI': '21',
    'NYJ': '20',
    'NE': '17',
    'KC': '12',
    'LAC': '24',
    'TB': '27',
    'ATL': '1',
    'CIN': '4',
    'CLE': '5',
    'MIA': '15',
    'IND': '11',
    'LV': '13',
    'ARI': '22',
    'NO': '18',
    'PIT': '23',
    'NYG': '19',
    'WSH': '28',
    'CAR': '29',
    'JAX': '30',
    'TEN': '10',
    'DEN': '7',
    'SF': '25',
    'SEA': '26',
    'DET': '8',
    'GB': '9',
    'HOU': '34',
    'LAR': '14',
    'BAL': '33',
    'BUF': '2',
    'MIN': '16',
    'CHI': '3'
  };

  const awayTeamId = teamIdMap[awayAbbr];
  const homeTeamId = teamIdMap[homeAbbr];

  if (!awayTeamId || !homeTeamId) {
    console.log(`❌ Missing team IDs for ${awayAbbr} or ${homeAbbr}`);
    return debugInfo;
  }

  // 1. Fetch team data
  console.log(`\n📊 Step 1: Fetching real team data`);
  
  const awayTeamUrl = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/teams/${awayTeamId}?lang=en&region=us`;
  const homeTeamUrl = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/teams/${homeTeamId}?lang=en&region=us`;

  try {
    const awayTeamData = await realEspnApiCall(awayTeamUrl, `Away team data for ${awayAbbr}`);
    
    debugInfo.logs.push({
      timestamp: new Date().toISOString(),
      apiCall: 'ESPN Team Data',
      url: awayTeamUrl,
      responseData: awayTeamData,
      extractedFacts: [
        { field: 'teams.away.name', value: awayTeamData.displayName, source: 'ESPN API' },
        { field: 'teams.away.abbreviation', value: awayTeamData.abbreviation, source: 'ESPN API' },
        { field: 'teams.away.id', value: awayTeamData.id, source: 'ESPN API' }
      ]
    });
    
    debugInfo.totalApiCalls++;
    debugInfo.summary.espnApiCalls++;
    debugInfo.summary.realDataFacts += 3;
  } catch (error) {
    debugInfo.logs.push({
      timestamp: new Date().toISOString(),
      apiCall: 'ESPN Team Data',
      url: awayTeamUrl,
      errors: [error.toString()],
      extractedFacts: []
    });
    debugInfo.summary.failedApiCalls++;
  }

  try {
    const homeTeamData = await realEspnApiCall(homeTeamUrl, `Home team data for ${homeAbbr}`);
    
    debugInfo.logs.push({
      timestamp: new Date().toISOString(),
      apiCall: 'ESPN Team Data',
      url: homeTeamUrl,
      responseData: homeTeamData,
      extractedFacts: [
        { field: 'teams.home.name', value: homeTeamData.displayName, source: 'ESPN API' },
        { field: 'teams.home.abbreviation', value: homeTeamData.abbreviation, source: 'ESPN API' },
        { field: 'teams.home.id', value: homeTeamData.id, source: 'ESPN API' }
      ]
    });
    
    debugInfo.totalApiCalls++;
    debugInfo.summary.espnApiCalls++;
    debugInfo.summary.realDataFacts += 3;
  } catch (error) {
    debugInfo.logs.push({
      timestamp: new Date().toISOString(),
      apiCall: 'ESPN Team Data',
      url: homeTeamUrl,
      errors: [error.toString()],
      extractedFacts: []
    });
    debugInfo.summary.failedApiCalls++;
  }

  // 2. Fetch team records
  console.log(`\n📊 Step 2: Fetching real team records`);
  
  const awayRecordUrl = `${awayTeamUrl}/record`;
  const homeRecordUrl = `${homeTeamUrl}/record`;

  try {
    const awayRecordData = await realEspnApiCall(awayRecordUrl, `Away team record for ${awayAbbr}`);
    
    // Extract record data from ESPN response
    const recordItem = awayRecordData.items?.find((item: any) => item.type === 'total');
    const wins = recordItem?.stats?.find((stat: any) => stat.name === 'wins')?.value || 0;
    const losses = recordItem?.stats?.find((stat: any) => stat.name === 'losses')?.value || 0;
    const ties = recordItem?.stats?.find((stat: any) => stat.name === 'ties')?.value || 0;
    const winPercentage = wins + losses + ties > 0 ? wins / (wins + losses + ties) : 0;
    
    debugInfo.logs.push({
      timestamp: new Date().toISOString(),
      apiCall: 'ESPN Team Record',
      url: awayRecordUrl,
      responseData: awayRecordData,
      extractedFacts: [
        { field: 'teams.away.record.wins', value: wins, source: 'ESPN API' },
        { field: 'teams.away.record.losses', value: losses, source: 'ESPN API' },
        { field: 'teams.away.record.ties', value: ties, source: 'ESPN API' },
        { field: 'teams.away.record.winPercentage', value: winPercentage, source: 'ESPN API' }
      ]
    });
    
    debugInfo.totalApiCalls++;
    debugInfo.summary.espnApiCalls++;
    debugInfo.summary.realDataFacts += 4;
  } catch (error) {
    debugInfo.logs.push({
      timestamp: new Date().toISOString(),
      apiCall: 'ESPN Team Record',
      url: awayRecordUrl,
      errors: [error.toString()],
      extractedFacts: []
    });
    debugInfo.summary.failedApiCalls++;
  }

  try {
    const homeRecordData = await realEspnApiCall(homeRecordUrl, `Home team record for ${homeAbbr}`);
    
    // Extract record data from ESPN response
    const recordItem = homeRecordData.items?.find((item: any) => item.type === 'total');
    const wins = recordItem?.stats?.find((stat: any) => stat.name === 'wins')?.value || 0;
    const losses = recordItem?.stats?.find((stat: any) => stat.name === 'losses')?.value || 0;
    const ties = recordItem?.stats?.find((stat: any) => stat.name === 'ties')?.value || 0;
    const winPercentage = wins + losses + ties > 0 ? wins / (wins + losses + ties) : 0;
    
    debugInfo.logs.push({
      timestamp: new Date().toISOString(),
      apiCall: 'ESPN Team Record',
      url: homeRecordUrl,
      responseData: homeRecordData,
      extractedFacts: [
        { field: 'teams.home.record.wins', value: wins, source: 'ESPN API' },
        { field: 'teams.home.record.losses', value: losses, source: 'ESPN API' },
        { field: 'teams.home.record.ties', value: ties, source: 'ESPN API' },
        { field: 'teams.home.record.winPercentage', value: winPercentage, source: 'ESPN API' }
      ]
    });
    
    debugInfo.totalApiCalls++;
    debugInfo.summary.espnApiCalls++;
    debugInfo.summary.realDataFacts += 4;
  } catch (error) {
    debugInfo.logs.push({
      timestamp: new Date().toISOString(),
      apiCall: 'ESPN Team Record',
      url: homeRecordUrl,
      errors: [error.toString()],
      extractedFacts: []
    });
    debugInfo.summary.failedApiCalls++;
  }

  // 3. Fetch venue data
  console.log(`\n📊 Step 3: Fetching real venue data`);
  
  const venueUrl = `${homeTeamUrl}/venue`;

  try {
    const venueData = await realEspnApiCall(venueUrl, `Venue data for ${homeAbbr}`);
    
    debugInfo.logs.push({
      timestamp: new Date().toISOString(),
      apiCall: 'ESPN Venue Data',
      url: venueUrl,
      responseData: venueData,
      extractedFacts: [
        { field: 'venue.id', value: venueData.id, source: 'ESPN API' },
        { field: 'venue.name', value: venueData.fullName, source: 'ESPN API' },
        { field: 'venue.city', value: venueData.address?.city, source: 'ESPN API' },
        { field: 'venue.state', value: venueData.address?.state, source: 'ESPN API' },
        { field: 'venue.surface', value: venueData.grass ? 'grass' : 'turf', source: 'ESPN API' },
        { field: 'venue.indoor', value: venueData.indoor, source: 'ESPN API' }
      ]
    });
    
    debugInfo.totalApiCalls++;
    debugInfo.summary.espnApiCalls++;
    debugInfo.summary.realDataFacts += 6;
  } catch (error) {
    debugInfo.logs.push({
      timestamp: new Date().toISOString(),
      apiCall: 'ESPN Venue Data',
      url: venueUrl,
      errors: [error.toString()],
      extractedFacts: []
    });
    debugInfo.summary.failedApiCalls++;
  }

  // 4. Fetch team statistics
  console.log(`\n📊 Step 4: Fetching real team statistics`);
  
  const awayStatsUrl = `${awayTeamUrl}/statistics`;
  const homeStatsUrl = `${homeTeamUrl}/statistics`;

  try {
    const awayStatsData = await realEspnApiCall(awayStatsUrl, `Away team stats for ${awayAbbr}`);
    
    // Extract offensive stats
    const offenseCategory = awayStatsData.splits?.categories?.find((cat: any) => cat.name === 'offense');
    const pointsPerGame = offenseCategory?.stats?.find((stat: any) => stat.name === 'pointsPerGame')?.value || 0;
    const yardsPerGame = offenseCategory?.stats?.find((stat: any) => stat.name === 'yardsPerGame')?.value || 0;
    const passingYards = offenseCategory?.stats?.find((stat: any) => stat.name === 'passingYards')?.value || 0;
    const rushingYards = offenseCategory?.stats?.find((stat: any) => stat.name === 'rushingYards')?.value || 0;
    
    debugInfo.logs.push({
      timestamp: new Date().toISOString(),
      apiCall: 'ESPN Team Statistics',
      url: awayStatsUrl,
      responseData: awayStatsData,
      extractedFacts: [
        { field: 'teams.away.statistics.offense.pointsPerGame', value: pointsPerGame, source: 'ESPN API' },
        { field: 'teams.away.statistics.offense.yardsPerGame', value: yardsPerGame, source: 'ESPN API' },
        { field: 'teams.away.statistics.offense.passingYards', value: passingYards, source: 'ESPN API' },
        { field: 'teams.away.statistics.offense.rushingYards', value: rushingYards, source: 'ESPN API' }
      ]
    });
    
    debugInfo.totalApiCalls++;
    debugInfo.summary.espnApiCalls++;
    debugInfo.summary.realDataFacts += 4;
  } catch (error) {
    debugInfo.logs.push({
      timestamp: new Date().toISOString(),
      apiCall: 'ESPN Team Statistics',
      url: awayStatsUrl,
      errors: [error.toString()],
      extractedFacts: []
    });
    debugInfo.summary.failedApiCalls++;
  }

  try {
    const homeStatsData = await realEspnApiCall(homeStatsUrl, `Home team stats for ${homeAbbr}`);
    
    // Extract offensive stats
    const offenseCategory = homeStatsData.splits?.categories?.find((cat: any) => cat.name === 'offense');
    const pointsPerGame = offenseCategory?.stats?.find((stat: any) => stat.name === 'pointsPerGame')?.value || 0;
    const yardsPerGame = offenseCategory?.stats?.find((stat: any) => stat.name === 'yardsPerGame')?.value || 0;
    const passingYards = offenseCategory?.stats?.find((stat: any) => stat.name === 'passingYards')?.value || 0;
    const rushingYards = offenseCategory?.stats?.find((stat: any) => stat.name === 'rushingYards')?.value || 0;
    
    debugInfo.logs.push({
      timestamp: new Date().toISOString(),
      apiCall: 'ESPN Team Statistics',
      url: homeStatsUrl,
      responseData: homeStatsData,
      extractedFacts: [
        { field: 'teams.home.statistics.offense.pointsPerGame', value: pointsPerGame, source: 'ESPN API' },
        { field: 'teams.home.statistics.offense.yardsPerGame', value: yardsPerGame, source: 'ESPN API' },
        { field: 'teams.home.statistics.offense.passingYards', value: passingYards, source: 'ESPN API' },
        { field: 'teams.home.statistics.offense.rushingYards', value: rushingYards, source: 'ESPN API' }
      ]
    });
    
    debugInfo.totalApiCalls++;
    debugInfo.summary.espnApiCalls++;
    debugInfo.summary.realDataFacts += 4;
  } catch (error) {
    debugInfo.logs.push({
      timestamp: new Date().toISOString(),
      apiCall: 'ESPN Team Statistics',
      url: homeStatsUrl,
      errors: [error.toString()],
      extractedFacts: []
    });
    debugInfo.summary.failedApiCalls++;
  }

  // 5. Fetch player data
  console.log(`\n📊 Step 5: Fetching real player data`);
  
  const awayPlayersUrl = `${awayTeamUrl}/athletes`;
  const homePlayersUrl = `${homeTeamUrl}/athletes`;

  try {
    const awayPlayersData = await realEspnApiCall(awayPlayersUrl, `Away team players for ${awayAbbr}`);
    
    // Extract key players (first 5)
    const keyPlayers = awayPlayersData.items?.slice(0, 5).map((player: any, index: number) => ({
      field: `teams.away.keyPlayers[${index}].name`,
      value: player.displayName,
      source: 'ESPN API'
    })) || [];
    
    debugInfo.logs.push({
      timestamp: new Date().toISOString(),
      apiCall: 'ESPN Player Data',
      url: awayPlayersUrl,
      responseData: awayPlayersData,
      extractedFacts: keyPlayers
    });
    
    debugInfo.totalApiCalls++;
    debugInfo.summary.espnApiCalls++;
    debugInfo.summary.realDataFacts += keyPlayers.length;
  } catch (error) {
    debugInfo.logs.push({
      timestamp: new Date().toISOString(),
      apiCall: 'ESPN Player Data',
      url: awayPlayersUrl,
      errors: [error.toString()],
      extractedFacts: []
    });
    debugInfo.summary.failedApiCalls++;
  }

  try {
    const homePlayersData = await realEspnApiCall(homePlayersUrl, `Home team players for ${homeAbbr}`);
    
    // Extract key players (first 5)
    const keyPlayers = homePlayersData.items?.slice(0, 5).map((player: any, index: number) => ({
      field: `teams.home.keyPlayers[${index}].name`,
      value: player.displayName,
      source: 'ESPN API'
    })) || [];
    
    debugInfo.logs.push({
      timestamp: new Date().toISOString(),
      apiCall: 'ESPN Player Data',
      url: homePlayersUrl,
      responseData: homePlayersData,
      extractedFacts: keyPlayers
    });
    
    debugInfo.totalApiCalls++;
    debugInfo.summary.espnApiCalls++;
    debugInfo.summary.realDataFacts += keyPlayers.length;
  } catch (error) {
    debugInfo.logs.push({
      timestamp: new Date().toISOString(),
      apiCall: 'ESPN Player Data',
      url: homePlayersUrl,
      errors: [error.toString()],
      extractedFacts: []
    });
    debugInfo.summary.failedApiCalls++;
  }

  // 6. Load betting data from games.json
  console.log(`\n📊 Step 6: Loading real betting data from games.json`);
  
  try {
    const gamesPath = path.join(process.cwd(), '..', 'data/nfl/season-2025/week-01/games.json');
    const gamesData = JSON.parse(fs.readFileSync(gamesPath, 'utf8'));
    const gameData = gamesData.find((g: any) => g.id === gameId);
    
    if (gameData && gameData.odds) {
      debugInfo.logs.push({
        timestamp: new Date().toISOString(),
        apiCall: 'Local Games Data',
        url: gamesPath,
        responseData: gameData.odds,
        extractedFacts: [
          { field: 'bettingContext.currentLine.spread', value: gameData.odds.spread?.away?.line ? -gameData.odds.spread.away.line : undefined, source: 'Local games.json' },
          { field: 'bettingContext.currentLine.total', value: gameData.odds.total?.over?.line, source: 'Local games.json' },
          { field: 'bettingContext.currentLine.moneyline.home', value: gameData.odds.moneyline?.home?.odds, source: 'Local games.json' },
          { field: 'bettingContext.currentLine.moneyline.away', value: gameData.odds.moneyline?.away?.odds, source: 'Local games.json' }
        ]
      });
      
      debugInfo.summary.realDataFacts += 4;
    }
  } catch (error) {
    console.log(`❌ Error loading games data: ${error}`);
  }

  // Calculate totals
  debugInfo.totalFacts = debugInfo.logs.reduce((sum, log) => sum + log.extractedFacts.length, 0);

  return debugInfo;
}

function generateRealDebugReport(debugInfo: RealFactbookDebugInfo): string {
  let report = `# REAL Factbook Generation Debug Report\n\n`;
  report += `**Game:** ${debugInfo.gameId}\n`;
  report += `**Total API Calls:** ${debugInfo.totalApiCalls}\n`;
  report += `**Total Facts Generated:** ${debugInfo.totalFacts}\n`;
  report += `**Failed API Calls:** ${debugInfo.summary.failedApiCalls}\n\n`;
  
  report += `## 📊 Data Sources Summary\n\n`;
  report += `- **ESPN API Calls:** ${debugInfo.summary.espnApiCalls}\n`;
  report += `- **Real Data Facts:** ${debugInfo.summary.realDataFacts}\n`;
  report += `- **Enhanced Data Facts:** ${debugInfo.summary.enhancedDataFacts}\n`;
  report += `- **Failed API Calls:** ${debugInfo.summary.failedApiCalls}\n\n`;
  
  report += `## 🔍 Detailed API Call Log\n\n`;
  
  debugInfo.logs.forEach((log, index) => {
    report += `### ${index + 1}. ${log.apiCall}\n\n`;
    report += `**Timestamp:** ${log.timestamp}\n`;
    report += `**URL:** ${log.url}\n\n`;
    
    if (log.responseData) {
      report += `**Response Data:**\n`;
      report += `\`\`\`json\n${JSON.stringify(log.responseData, null, 2)}\n\`\`\`\n\n`;
    }
    
    if (log.extractedFacts.length > 0) {
      report += `**Extracted Facts:**\n`;
      log.extractedFacts.forEach(fact => {
        report += `- **${fact.field}**: ${JSON.stringify(fact.value)} (Source: ${fact.source})\n`;
      });
    }
    
    if (log.errors && log.errors.length > 0) {
      report += `\n**Errors:**\n`;
      log.errors.forEach(error => {
        report += `- ${error}\n`;
      });
    }
    
    report += `\n---\n\n`;
  });
  
  return report;
}

// Main execution
async function runRealFactbookGeneration() {
  try {
    console.log('🔍 Starting REAL factbook generation (NO MOCK DATA)...\n');
    
    // Generate real factbook for DAL-PHI game
    const debugInfo = await generateRealFactbook('2025-09-05-dal-phi');
    
    const report = generateRealDebugReport(debugInfo);
    
    // Save debug report
    const reportPath = path.join(process.cwd(), '..', 'data/nfl/season-2025/week-01/factbooks/real-debug-report.md');
    fs.writeFileSync(reportPath, report);
    
    console.log('\n📋 Real Debug Report Generated:');
    console.log(report);
    
    console.log(`\n✅ Real debug report saved to: ${reportPath}`);
    
  } catch (error) {
    console.error('❌ Error during real factbook generation:', error);
  }
}

// Run real factbook generation
runRealFactbookGeneration();
