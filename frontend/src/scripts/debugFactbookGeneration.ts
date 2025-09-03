import fs from 'fs';
import path from 'path';

interface DebugLog {
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
}

interface FactbookDebugInfo {
  gameId: string;
  totalApiCalls: number;
  totalFacts: number;
  logs: DebugLog[];
  summary: {
    espnApiCalls: number;
    mockDataFacts: number;
    enhancedDataFacts: number;
    realDataFacts: number;
  };
}

// Mock ESPN API calls for debugging
async function mockEspnApiCall(url: string, description: string): Promise<any> {
  console.log(`🔍 API Call: ${description}`);
  console.log(`   URL: ${url}`);
  
  // Simulate API response based on URL pattern
  let mockResponse: any = {};
  
  if (url.includes('/teams/') && !url.includes('/record') && !url.includes('/venue') && !url.includes('/statistics') && !url.includes('/athletes')) {
    const teamId = url.split('/teams/')[1].split('/')[0];
    mockResponse = {
      id: teamId,
      displayName: getTeamName(teamId),
      abbreviation: getTeamAbbr(teamId),
      record: { $ref: `${url}/record` },
      venue: { $ref: `${url}/venue` },
      statistics: { $ref: `${url}/statistics` },
      athletes: { $ref: `${url}/athletes` }
    };
  } else if (url.includes('/record')) {
    mockResponse = {
      items: [{
        type: 'total',
        summary: '3-1-0',
        stats: [
          { name: 'wins', value: 3 },
          { name: 'losses', value: 1 },
          { name: 'ties', value: 0 }
        ]
      }]
    };
  } else if (url.includes('/venue')) {
    mockResponse = {
      id: '1234',
      fullName: 'Lincoln Financial Field',
      address: {
        city: 'Philadelphia',
        state: 'PA'
      },
      grass: true,
      indoor: false
    };
  } else if (url.includes('/statistics')) {
    mockResponse = {
      splits: {
        categories: [{
          name: 'offense',
          displayName: 'Offense',
          stats: [
            { name: 'pointsPerGame', value: 24.5 },
            { name: 'yardsPerGame', value: 350 },
            { name: 'passingYards', value: 250 },
            { name: 'rushingYards', value: 100 }
          ]
        }]
      }
    };
  } else if (url.includes('/athletes')) {
    mockResponse = {
      items: [
        {
          id: '12345',
          displayName: 'Dak Prescott',
          position: { abbreviation: 'QB' },
          status: { id: '1', name: 'Active' }
        }
      ]
    };
  }
  
  console.log(`   Response: ${JSON.stringify(mockResponse, null, 2)}`);
  return mockResponse;
}

function getTeamName(teamId: string): string {
  const teamMap: Record<string, string> = {
    '6': 'Dallas Cowboys',
    '21': 'Philadelphia Eagles',
    '20': 'New York Jets',
    '17': 'New England Patriots'
  };
  return teamMap[teamId] || 'Unknown Team';
}

function getTeamAbbr(teamId: string): string {
  const abbrMap: Record<string, string> = {
    '6': 'DAL',
    '21': 'PHI',
    '20': 'NYJ',
    '17': 'NE'
  };
  return abbrMap[teamId] || 'UNK';
}

async function debugFactbookGeneration(gameId: string): Promise<FactbookDebugInfo> {
  const debugInfo: FactbookDebugInfo = {
    gameId,
    totalApiCalls: 0,
    totalFacts: 0,
    logs: [],
    summary: {
      espnApiCalls: 0,
      mockDataFacts: 0,
      enhancedDataFacts: 0,
      realDataFacts: 0
    }
  };

  console.log(`\n🔍 Starting debug factbook generation for ${gameId}\n`);

  // Parse game ID to get teams
  const gameKey = gameId.replace('2025-09-05-', '').replace('2025-09-07-', '');
  const [awayAbbr, homeAbbr] = gameKey.split('-').map(abbr => abbr.toUpperCase());
  
  const teamIdMap: Record<string, string> = {
    'DAL': '6',
    'PHI': '21',
    'NYJ': '20',
    'NE': '17'
  };

  const awayTeamId = teamIdMap[awayAbbr];
  const homeTeamId = teamIdMap[homeAbbr];

  if (!awayTeamId || !homeTeamId) {
    console.log(`❌ Missing team IDs for ${awayAbbr} or ${homeAbbr}`);
    return debugInfo;
  }

  // 1. Fetch team data
  console.log(`\n📊 Step 1: Fetching team data`);
  
  const awayTeamUrl = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/${awayTeamId}`;
  const homeTeamUrl = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/${homeTeamId}`;

  const awayTeamData = await mockEspnApiCall(awayTeamUrl, `Away team data for ${awayAbbr}`);
  const homeTeamData = await mockEspnApiCall(homeTeamUrl, `Home team data for ${homeAbbr}`);

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

  debugInfo.totalApiCalls += 2;
  debugInfo.summary.espnApiCalls += 2;

  // 2. Fetch team records
  console.log(`\n📊 Step 2: Fetching team records`);
  
  const awayRecordUrl = `${awayTeamUrl}/record`;
  const homeRecordUrl = `${homeTeamUrl}/record`;

  const awayRecordData = await mockEspnApiCall(awayRecordUrl, `Away team record for ${awayAbbr}`);
  const homeRecordData = await mockEspnApiCall(homeRecordUrl, `Home team record for ${homeAbbr}`);

  debugInfo.logs.push({
    timestamp: new Date().toISOString(),
    apiCall: 'ESPN Team Record',
    url: awayRecordUrl,
    responseData: awayRecordData,
    extractedFacts: [
      { field: 'teams.away.record.wins', value: 3, source: 'ESPN API' },
      { field: 'teams.away.record.losses', value: 1, source: 'ESPN API' },
      { field: 'teams.away.record.winPercentage', value: 0.75, source: 'ESPN API' }
    ]
  });

  debugInfo.logs.push({
    timestamp: new Date().toISOString(),
    apiCall: 'ESPN Team Record',
    url: homeRecordUrl,
    responseData: homeRecordData,
    extractedFacts: [
      { field: 'teams.home.record.wins', value: 3, source: 'ESPN API' },
      { field: 'teams.home.record.losses', value: 1, source: 'ESPN API' },
      { field: 'teams.home.record.winPercentage', value: 0.75, source: 'ESPN API' }
    ]
  });

  debugInfo.totalApiCalls += 2;
  debugInfo.summary.espnApiCalls += 2;

  // 3. Fetch venue data
  console.log(`\n📊 Step 3: Fetching venue data`);
  
  const venueUrl = `${homeTeamUrl}/venue`;
  const venueData = await mockEspnApiCall(venueUrl, `Venue data for ${homeAbbr}`);

  debugInfo.logs.push({
    timestamp: new Date().toISOString(),
    apiCall: 'ESPN Venue Data',
    url: venueUrl,
    responseData: venueData,
    extractedFacts: [
      { field: 'venue.name', value: venueData.fullName, source: 'ESPN API' },
      { field: 'venue.city', value: venueData.address.city, source: 'ESPN API' },
      { field: 'venue.state', value: venueData.address.state, source: 'ESPN API' },
      { field: 'venue.surface', value: venueData.grass ? 'grass' : 'turf', source: 'ESPN API' },
      { field: 'venue.indoor', value: venueData.indoor, source: 'ESPN API' }
    ]
  });

  debugInfo.totalApiCalls += 1;
  debugInfo.summary.espnApiCalls += 1;

  // 4. Fetch team statistics
  console.log(`\n📊 Step 4: Fetching team statistics`);
  
  const awayStatsUrl = `${awayTeamUrl}/statistics`;
  const homeStatsUrl = `${homeTeamUrl}/statistics`;

  const awayStatsData = await mockEspnApiCall(awayStatsUrl, `Away team stats for ${awayAbbr}`);
  const homeStatsData = await mockEspnApiCall(homeStatsUrl, `Home team stats for ${homeAbbr}`);

  debugInfo.logs.push({
    timestamp: new Date().toISOString(),
    apiCall: 'ESPN Team Statistics',
    url: awayStatsUrl,
    responseData: awayStatsData,
    extractedFacts: [
      { field: 'teams.away.statistics.offense.pointsPerGame', value: 24.5, source: 'ESPN API' },
      { field: 'teams.away.statistics.offense.yardsPerGame', value: 350, source: 'ESPN API' },
      { field: 'teams.away.statistics.offense.passingYards', value: 250, source: 'ESPN API' },
      { field: 'teams.away.statistics.offense.rushingYards', value: 100, source: 'ESPN API' }
    ]
  });

  debugInfo.logs.push({
    timestamp: new Date().toISOString(),
    apiCall: 'ESPN Team Statistics',
    url: homeStatsUrl,
    responseData: homeStatsData,
    extractedFacts: [
      { field: 'teams.home.statistics.offense.pointsPerGame', value: 24.5, source: 'ESPN API' },
      { field: 'teams.home.statistics.offense.yardsPerGame', value: 350, source: 'ESPN API' },
      { field: 'teams.home.statistics.offense.passingYards', value: 250, source: 'ESPN API' },
      { field: 'teams.home.statistics.offense.rushingYards', value: 100, source: 'ESPN API' }
    ]
  });

  debugInfo.totalApiCalls += 2;
  debugInfo.summary.espnApiCalls += 2;

  // 5. Fetch player data
  console.log(`\n📊 Step 5: Fetching player data`);
  
  const awayPlayersUrl = `${awayTeamUrl}/athletes`;
  const homePlayersUrl = `${homeTeamUrl}/athletes`;

  const awayPlayersData = await mockEspnApiCall(awayPlayersUrl, `Away team players for ${awayAbbr}`);
  const homePlayersData = await mockEspnApiCall(homePlayersUrl, `Home team players for ${homeAbbr}`);

  debugInfo.logs.push({
    timestamp: new Date().toISOString(),
    apiCall: 'ESPN Player Data',
    url: awayPlayersUrl,
    responseData: awayPlayersData,
    extractedFacts: [
      { field: 'teams.away.keyPlayers[0].name', value: 'Dak Prescott', source: 'ESPN API' },
      { field: 'teams.away.keyPlayers[0].position', value: 'QB', source: 'ESPN API' },
      { field: 'teams.away.keyPlayers[0].status', value: 'active', source: 'ESPN API' }
    ]
  });

  debugInfo.logs.push({
    timestamp: new Date().toISOString(),
    apiCall: 'ESPN Player Data',
    url: homePlayersUrl,
    responseData: homePlayersData,
    extractedFacts: [
      { field: 'teams.home.keyPlayers[0].name', value: 'Jalen Hurts', source: 'ESPN API' },
      { field: 'teams.home.keyPlayers[0].position', value: 'QB', source: 'ESPN API' },
      { field: 'teams.home.keyPlayers[0].status', value: 'active', source: 'ESPN API' }
    ]
  });

  debugInfo.totalApiCalls += 2;
  debugInfo.summary.espnApiCalls += 2;

  // 6. Load betting data from games.json
  console.log(`\n📊 Step 6: Loading betting data from games.json`);
  
  try {
    const gamesPath = path.join(process.cwd(), 'public/data/nfl/season-2025/week-01/games.json');
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

  // 7. Add enhanced/mock data
  console.log(`\n📊 Step 7: Adding enhanced data`);
  
  debugInfo.logs.push({
    timestamp: new Date().toISOString(),
    apiCall: 'Enhanced Data',
    url: 'N/A - Mock Data',
    responseData: 'Enhanced team data',
    extractedFacts: [
      { field: 'teams.away.coaching.headCoach', value: 'Mike McCarthy', source: 'Enhanced Data' },
      { field: 'teams.home.coaching.headCoach', value: 'Nick Sirianni', source: 'Enhanced Data' },
      { field: 'trends[0].description', value: 'Dallas has won 4 of the last 6 meetings', source: 'Enhanced Data' },
      { field: 'keyMatchups[0].description', value: 'Dallas passing offense vs Philadelphia secondary', source: 'Enhanced Data' }
    ]
  });

  debugInfo.summary.enhancedDataFacts += 4;

  // Calculate totals
  debugInfo.totalFacts = debugInfo.logs.reduce((sum, log) => sum + log.extractedFacts.length, 0);
  debugInfo.summary.mockDataFacts = debugInfo.totalFacts - debugInfo.summary.realDataFacts - debugInfo.summary.enhancedDataFacts;

  return debugInfo;
}

function generateDebugReport(debugInfo: FactbookDebugInfo): string {
  let report = `# Factbook Generation Debug Report\n\n`;
  report += `**Game:** ${debugInfo.gameId}\n`;
  report += `**Total API Calls:** ${debugInfo.totalApiCalls}\n`;
  report += `**Total Facts Generated:** ${debugInfo.totalFacts}\n\n`;
  
  report += `## 📊 Data Sources Summary\n\n`;
  report += `- **ESPN API Calls:** ${debugInfo.summary.espnApiCalls}\n`;
  report += `- **Real Data Facts:** ${debugInfo.summary.realDataFacts}\n`;
  report += `- **Enhanced Data Facts:** ${debugInfo.summary.enhancedDataFacts}\n`;
  report += `- **Mock Data Facts:** ${debugInfo.summary.mockDataFacts}\n\n`;
  
  report += `## 🔍 Detailed API Call Log\n\n`;
  
  debugInfo.logs.forEach((log, index) => {
    report += `### ${index + 1}. ${log.apiCall}\n\n`;
    report += `**Timestamp:** ${log.timestamp}\n`;
    report += `**URL:** ${log.url}\n\n`;
    
    if (log.responseData) {
      report += `**Response Data:**\n`;
      report += `\`\`\`json\n${JSON.stringify(log.responseData, null, 2)}\n\`\`\`\n\n`;
    }
    
    report += `**Extracted Facts:**\n`;
    log.extractedFacts.forEach(fact => {
      report += `- **${fact.field}**: ${JSON.stringify(fact.value)} (Source: ${fact.source})\n`;
    });
    
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
async function runDebugFactbookGeneration() {
  try {
    console.log('🔍 Starting debug factbook generation...\n');
    
    // Debug the DAL-PHI game
    const debugInfo = await debugFactbookGeneration('2025-09-05-dal-phi');
    
    const report = generateDebugReport(debugInfo);
    
    // Save debug report
    const reportPath = path.join(process.cwd(), 'public/data/nfl/season-2025/week-01/factbooks/debug-report.md');
    fs.writeFileSync(reportPath, report);
    
    console.log('\n📋 Debug Report Generated:');
    console.log(report);
    
    console.log(`\n✅ Debug report saved to: ${reportPath}`);
    
  } catch (error) {
    console.error('❌ Error during debug factbook generation:', error);
  }
}

// Run debug generation
runDebugFactbookGeneration();
