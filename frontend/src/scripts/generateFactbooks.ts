import { MinimalFactbook } from '../types/minimalFactbook';
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
  espnId: string;
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

async function generateRealFactbook(game: GameData): Promise<MinimalFactbook | null> {
  const awayTeamId = TEAM_ID_MAP[game.away.abbr];
  const homeTeamId = TEAM_ID_MAP[game.home.abbr];

  if (!awayTeamId || !homeTeamId) {
    console.warn(`❌ Missing team IDs for ${game.away.abbr} or ${game.home.abbr}`);
    return null;
  }

  console.log(`\n📊 Generating minimal factbook for ${game.away.abbr} @ ${game.home.abbr}...`);

  try {
    // Fetch real team data from ESPN
    const awayTeamUrl = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/teams/${awayTeamId}?lang=en&region=us`;
    const homeTeamUrl = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/teams/${homeTeamId}?lang=en&region=us`;

    const [awayTeamData, homeTeamData] = await Promise.all([
      realEspnApiCall(awayTeamUrl, `Away team data for ${game.away.abbr}`),
      realEspnApiCall(homeTeamUrl, `Home team data for ${game.home.abbr}`)
    ]);

    // Fetch head coach data (experience) for both teams
    let awayCoachExperience: number | undefined;
    let homeCoachExperience: number | undefined;

    try {
      const awayCoachesUrl: string | undefined = awayTeamData?.coaches?.$ref;
      const homeCoachesUrl: string | undefined = homeTeamData?.coaches?.$ref;

      const [awayCoaches, homeCoaches] = await Promise.all([
        awayCoachesUrl ? realEspnApiCall(awayCoachesUrl, `Away team coaches for ${game.away.abbr}`) : Promise.resolve(null),
        homeCoachesUrl ? realEspnApiCall(homeCoachesUrl, `Home team coaches for ${game.home.abbr}`) : Promise.resolve(null)
      ]);

      if (awayCoaches?.items?.[0]?.$ref) {
        const awayCoach = await realEspnApiCall(awayCoaches.items[0].$ref, `Away head coach details for ${game.away.abbr}`);
        awayCoachExperience = typeof awayCoach?.experience === 'number' ? awayCoach.experience : undefined;
        awayTeamData.__coachName = [awayCoach?.firstName, awayCoach?.lastName].filter(Boolean).join(' ').trim();
      }

      if (homeCoaches?.items?.[0]?.$ref) {
        const homeCoach = await realEspnApiCall(homeCoaches.items[0].$ref, `Home head coach details for ${game.home.abbr}`);
        homeCoachExperience = typeof homeCoach?.experience === 'number' ? homeCoach.experience : undefined;
        homeTeamData.__coachName = [homeCoach?.firstName, homeCoach?.lastName].filter(Boolean).join(' ').trim();
      }
    } catch (e) {
      console.log(`   ⚠️  Could not fetch coaching data: ${e}`);
    }

    // Fetch team records using the $ref links
    console.log(`\n📊 Fetching team records...`);
    const [awayRecordData, homeRecordData] = await Promise.all([
      realEspnApiCall(awayTeamData.record.$ref, `Away team record for ${game.away.abbr}`),
      realEspnApiCall(homeTeamData.record.$ref, `Home team record for ${game.home.abbr}`)
    ]);

    // Log successful record fetch
    console.log(`   ✅ Successfully fetched records for both teams`);

    // Fetch team statistics using constructed URLs
    console.log(`\n📊 Fetching team statistics...`);
    
    // Construct statistics URLs using team IDs
    const awayStatsUrl = `http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/types/1/teams/${awayTeamData.id}/statistics?lang=en&region=us`;
    const homeStatsUrl = `http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/types/1/teams/${homeTeamData.id}/statistics?lang=en&region=us`;
    
    console.log(`   🔗 Away team statistics URL: ${awayStatsUrl}`);
    console.log(`   🔗 Home team statistics URL: ${homeStatsUrl}`);
    
    const [awayStatsData, homeStatsData] = await Promise.all([
      realEspnApiCall(awayStatsUrl, `Away team statistics for ${game.away.abbr}`),
      realEspnApiCall(homeStatsUrl, `Home team statistics for ${game.home.abbr}`)
    ]);

    // Log successful statistics fetch
    console.log(`   ✅ Successfully fetched statistics for both teams`);

    // Helper function to extract specific statistics from categories
    const extractStat = (statsData: any, statName: string, categoryName?: string): number => {
      const categories = statsData.splits?.categories || [];
      
      if (categoryName) {
        // Look in specific category
        const category = categories.find((cat: any) => cat.name === categoryName);
        if (category) {
          const stat = category.stats?.find((s: any) => s.name === statName);
          return stat?.perGameValue || stat?.value || 0;
        }
      } else {
        // Search all categories
        for (const category of categories) {
          const stat = category.stats?.find((s: any) => s.name === statName);
          if (stat) {
            return stat.perGameValue || stat.value || 0;
          }
        }
      }
      return 0;
    };

    // Extract statistics for both teams
    console.log(`\n📈 Extracting specific statistics...`);
    
    // Log successful statistics extraction
    console.log(`   ✅ Successfully extracted real statistics from ESPN API`);
    
    // Away team stats
    const awayPointsPerGame = awayRecordData.items[0]?.stats.find((s: any) => s.name === 'avgPointsFor')?.value || 0;
    const awayPointsAllowed = awayRecordData.items[0]?.stats.find((s: any) => s.name === 'avgPointsAgainst')?.value || 0;
    const awayTurnovers = extractStat(awayStatsData, 'totalGiveaways', 'miscellaneous'); // Total giveaways
    const awayRushingYards = extractStat(awayStatsData, 'rushingYards', 'rushing');
    const awaySacks = extractStat(awayStatsData, 'sacks', 'defensive');
    const awayPassingYards = extractStat(awayStatsData, 'passingYards', 'passing');
    const awayInterceptions = extractStat(awayStatsData, 'interceptions', 'defensiveInterceptions');
    const awayForcedFumbles = extractStat(awayStatsData, 'forcedFumbles', 'defensive');
    const awayTotalTackles = extractStat(awayStatsData, 'totalTackles', 'defensive');

    // Home team stats
    const homePointsPerGame = homeRecordData.items[0]?.stats.find((s: any) => s.name === 'avgPointsFor')?.value || 0;
    const homePointsAllowed = homeRecordData.items[0]?.stats.find((s: any) => s.name === 'avgPointsAgainst')?.value || 0;
    const homeTurnovers = extractStat(homeStatsData, 'totalGiveaways', 'miscellaneous'); // Total giveaways
    const homeRushingYards = extractStat(homeStatsData, 'rushingYards', 'rushing');
    const homeSacks = extractStat(homeStatsData, 'sacks', 'defensive');
    const homePassingYards = extractStat(homeStatsData, 'passingYards', 'passing');
    const homeInterceptions = extractStat(homeStatsData, 'interceptions', 'defensiveInterceptions');
    const homeForcedFumbles = extractStat(homeStatsData, 'forcedFumbles', 'defensive');
    const homeTotalTackles = extractStat(homeStatsData, 'totalTackles', 'defensive');

    console.log(`   📊 Away (${game.away.abbr}): PPG=${awayPointsPerGame}, PA=${awayPointsAllowed}, TO=${awayTurnovers}, RY=${awayRushingYards}, Sacks=${awaySacks}, PY=${awayPassingYards}, INT=${awayInterceptions}, FF=${awayForcedFumbles}, TT=${awayTotalTackles}`);
    console.log(`   📊 Home (${game.home.abbr}): PPG=${homePointsPerGame}, PA=${homePointsAllowed}, TO=${homeTurnovers}, RY=${homeRushingYards}, Sacks=${homeSacks}, PY=${homePassingYards}, INT=${homeInterceptions}, FF=${homeForcedFumbles}, TT=${homeTotalTackles}`);

    // Fetch team leaders for key players
    console.log(`\n👥 Fetching team leaders for key players...`);
    
    // Construct leaders URLs using team IDs
    const awayLeadersUrl = `http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/types/1/teams/${awayTeamData.id}/leaders?lang=en&region=us`;
    const homeLeadersUrl = `http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/types/1/teams/${homeTeamData.id}/leaders?lang=en&region=us`;
    
    console.log(`   🔗 Away team leaders URL: ${awayLeadersUrl}`);
    console.log(`   🔗 Home team leaders URL: ${homeLeadersUrl}`);
    
    const [awayLeadersData, homeLeadersData] = await Promise.all([
      realEspnApiCall(awayLeadersUrl, `Away team leaders for ${game.away.abbr}`),
      realEspnApiCall(homeLeadersUrl, `Home team leaders for ${game.home.abbr}`)
    ]);

    // Helper function to extract key players from leaders data
    const extractKeyPlayers = (leadersData: any) => {
      const keyPlayers: any[] = [];
      const categories = leadersData.categories || [];

      // Find passing leader (QB)
      const passingCategory = categories.find((cat: any) => cat.name === 'passingLeader');
      if (passingCategory?.leaders?.[0]) {
        const qb = passingCategory.leaders[0];
        keyPlayers.push({
          position: 'QB',
          name: 'QB Leader', // We'll get the actual name from athlete data
          athleteRef: qb.athlete.$ref,
          stats: qb.displayValue,
          value: qb.value
        });
      }

      // Find rushing leader (RB)
      const rushingCategory = categories.find((cat: any) => cat.name === 'rushingLeader');
      if (rushingCategory?.leaders?.[0]) {
        const rb = rushingCategory.leaders[0];
        keyPlayers.push({
          position: 'RB',
          name: 'RB Leader',
          athleteRef: rb.athlete.$ref,
          stats: rb.displayValue,
          value: rb.value
        });
      }

      // Find receiving leader (WR)
      const receivingCategory = categories.find((cat: any) => cat.name === 'receivingLeader');
      if (receivingCategory?.leaders?.[0]) {
        const wr = receivingCategory.leaders[0];
        keyPlayers.push({
          position: 'WR',
          name: 'WR Leader',
          athleteRef: wr.athlete.$ref,
          stats: wr.displayValue,
          value: wr.value
        });
      }

      // Find tackles leader (LB/S)
      const tacklesCategory = categories.find((cat: any) => cat.name === 'totalTackles');
      if (tacklesCategory?.leaders?.[0]) {
        const lb = tacklesCategory.leaders[0];
        keyPlayers.push({
          position: 'LB',
          name: 'Tackles Leader',
          athleteRef: lb.athlete.$ref,
          stats: lb.displayValue,
          value: lb.value
        });
      }

      // Find sacks leader (DE/LB)
      const sacksCategory = categories.find((cat: any) => cat.name === 'sacks');
      if (sacksCategory?.leaders?.[0]) {
        const de = sacksCategory.leaders[0];
        keyPlayers.push({
          position: 'DE',
          name: 'Sacks Leader',
          athleteRef: de.athlete.$ref,
          stats: de.displayValue,
          value: de.value
        });
      }

      // Find interceptions leader (CB/S)
      const intsCategory = categories.find((cat: any) => cat.name === 'interceptions');
      if (intsCategory?.leaders?.[0]) {
        const cb = intsCategory.leaders[0];
        keyPlayers.push({
          position: 'CB',
          name: 'INTs Leader',
          athleteRef: cb.athlete.$ref,
          stats: cb.displayValue,
          value: cb.value
        });
      }

      return keyPlayers;
    };

    const awayKeyPlayers = extractKeyPlayers(awayLeadersData);
    const homeKeyPlayers = extractKeyPlayers(homeLeadersData);

    console.log(`   ✅ Extracted ${awayKeyPlayers.length} key players for ${game.away.abbr}: ${awayKeyPlayers.map(p => p.position).join(', ')}`);
    console.log(`   ✅ Extracted ${homeKeyPlayers.length} key players for ${game.home.abbr}: ${homeKeyPlayers.map(p => p.position).join(', ')}`);

    // Fetch athlete details to get real names
    console.log(`\n👤 Fetching athlete details for player names...`);
    
    const fetchAthleteName = async (athleteRef: string): Promise<string> => {
      try {
        console.log(`   🔗 Fetching athlete data from: ${athleteRef}`);
        const athleteData = await realEspnApiCall(athleteRef, `Athlete data`);
        return athleteData.displayName || athleteData.fullName || 'Unknown Player';
      } catch (error) {
        console.log(`   ⚠️  Could not fetch athlete data: ${error}`);
        return 'Unknown Player';
      }
    };

    // Fetch names for away team players
    const awayPlayerNames = await Promise.all(
      awayKeyPlayers.map(player => fetchAthleteName(player.athleteRef))
    );

    // Fetch names for home team players  
    const homePlayerNames = await Promise.all(
      homeKeyPlayers.map(player => fetchAthleteName(player.athleteRef))
    );

    // Update player objects with real names
    awayKeyPlayers.forEach((player, index) => {
      player.name = awayPlayerNames[index];
    });

    homeKeyPlayers.forEach((player, index) => {
      player.name = homePlayerNames[index];
    });

    console.log(`   ✅ Updated player names for ${game.away.abbr}: ${awayKeyPlayers.map(p => `${p.position}: ${p.name}`).join(', ')}`);
    console.log(`   ✅ Updated player names for ${game.home.abbr}: ${homeKeyPlayers.map(p => `${p.position}: ${p.name}`).join(', ')}`);

    console.log(`\n📋 Building factbook object step by step...`);
    
    // Fetch odds data for line movement using real ESPN event ID
    console.log(`\n📈 Fetching odds data for line movement...`);
    const espnEventId = game.espnId;
    const oddsUrl = `http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/${espnEventId}/competitions/${espnEventId}/odds?lang=en&region=us`;
    console.log(`   🔗 Odds URL: ${oddsUrl}`);
    
    let oddsData;
    try {
      const oddsResponse = await realEspnApiCall(oddsUrl, `Odds data for ${espnEventId}`);
      console.log(`   ✅ Successfully fetched odds data`);
      
      if (oddsResponse?.items?.[0]) {
        oddsData = oddsResponse.items[0];
        console.log(`   🔍 Using odds data from ESPN BET provider`);
      } else {
        console.log(`   ⚠️  No odds items found in response`);
        oddsData = null;
      }
    } catch (error) {
      console.log(`   ⚠️  Could not fetch odds data: ${error}`);
      oddsData = null;
    }
    
    // Fetch betting trends from Action Network API
    console.log(`\n📊 Fetching betting trends from Action Network...`);
    const week = 1; // TODO: Make this dynamic
    const actionNetworkUrl = `https://api.actionnetwork.com/web/v2/scoreboard/publicbetting/nfl?bookIds=15,30,79,2988,75,123,71,69,68&periods=event&seasonType=reg&week=${week}`;
    console.log(`   🔗 Action Network URL: ${actionNetworkUrl}`);
    
    let bettingTrends = {
      spread: { home: 50, away: 50 },
      total: { over: 50, under: 50 },
      moneyline: { home: 50, away: 50 }
    };
    
    try {
      const trendsResponse = await realEspnApiCall(actionNetworkUrl, `Betting trends for Week ${week}`);
      console.log(`   ✅ Successfully fetched betting trends`);
      
      if (trendsResponse?.games) {
        console.log(`   🔍 Available games in Action Network: ${trendsResponse.games.length}`);
        console.log(`   🔍 Looking for: ${game.away.abbr} @ ${game.home.abbr}`);
        
        // Find the matching game by team abbreviations
        const matchingGame = trendsResponse.games.find((g: any) => {
          const awayTeam = g.teams?.find((t: any) => t.abbr === game.away.abbr);
          const homeTeam = g.teams?.find((t: any) => t.abbr === game.home.abbr);
          return awayTeam && homeTeam;
        });
        
        if (matchingGame) {
          console.log(`   🎯 Found matching game: ${game.away.abbr} @ ${game.home.abbr}`);
          
          // Extract betting data from market object
          let spreadHomePercent = 50, spreadAwayPercent = 50;
          let totalOverPercent = 50, totalUnderPercent = 50;
          let moneylineHomePercent = 50, moneylineAwayPercent = 50;
          
          if (matchingGame.markets) {
            // Find the first market that has betting data (book_id 15 has the real data)
            const marketsRecord = matchingGame.markets as Record<string, any>;
            const marketWithData = (Object.values(marketsRecord) as any[]).find((market: any) =>
              market?.event?.spread?.[0]?.bet_info?.money?.percent > 0
            );
            
            if (marketWithData?.event) {
              // Spread betting trends
              if (marketWithData.event.spread) {
                const homeSpread = marketWithData.event.spread.find((s: any) => s.side === 'home');
                const awaySpread = marketWithData.event.spread.find((s: any) => s.side === 'away');
                
                if (homeSpread?.bet_info?.money?.percent && awaySpread?.bet_info?.money?.percent) {
                  spreadHomePercent = homeSpread.bet_info.money.percent;
                  spreadAwayPercent = awaySpread.bet_info.money.percent;
                }
              }
              
              // Total betting trends
              if (marketWithData.event.total) {
                const overTotal = marketWithData.event.total.find((t: any) => t.side === 'over');
                const underTotal = marketWithData.event.total.find((t: any) => t.side === 'under');
                
                if (overTotal?.bet_info?.money?.percent && underTotal?.bet_info?.money?.percent) {
                  totalOverPercent = overTotal.bet_info.money.percent;
                  totalUnderPercent = underTotal.bet_info.money.percent;
                }
              }
              
              // Moneyline betting trends
              if (marketWithData.event.moneyline) {
                const homeML = marketWithData.event.moneyline.find((m: any) => m.side === 'home');
                const awayML = marketWithData.event.moneyline.find((m: any) => m.side === 'away');
                
                if (homeML?.bet_info?.money?.percent && awayML?.bet_info?.money?.percent) {
                  moneylineHomePercent = homeML.bet_info.money.percent;
                  moneylineAwayPercent = awayML.bet_info.money.percent;
                }
              }
            }
          }
          
          // Use extracted percentages
          bettingTrends = {
            spread: {
              home: spreadHomePercent,
              away: spreadAwayPercent
            },
            total: {
              over: totalOverPercent,
              under: totalUnderPercent
            },
            moneyline: {
              home: moneylineHomePercent,
              away: moneylineAwayPercent
            }
          };
          
          console.log(`   📊 Spread: ${bettingTrends.spread.home}% home, ${bettingTrends.spread.away}% away`);
          console.log(`   📊 Total: ${bettingTrends.total.over}% over, ${bettingTrends.total.under}% under`);
          console.log(`   📊 Moneyline: ${bettingTrends.moneyline.home}% home, ${bettingTrends.moneyline.away}% away`);
        } else {
          console.log(`   ⚠️  No matching game found for ${game.away.abbr} @ ${game.home.abbr}`);
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Could not fetch betting trends: ${error}`);
    }
    
    // Extract betting data from games.json
    console.log(`\n💰 BETTING CONTEXT:`);
    const spread = game.odds?.spread?.away?.line || 0;
    const total = game.odds?.total?.over?.line || 48.5;
    console.log(`   📊 Spread: ${spread} (from games.json)`);
    console.log(`   📊 Total: ${total} (from games.json)`);
    
    // Extract line movement data
    console.log(`\n📈 LINE MOVEMENT ANALYSIS:`);
    let lineMovementData: MinimalFactbook['bettingContext']['lineMovement'] = {
      spread: { current: spread, opening: spread, movement: 0, direction: 'stable' },
      total: { current: total, opening: total, movement: 0, direction: 'stable' },
      moneyline: {
        home: { current: 0, opening: 0, movement: 0 },
        away: { current: 0, opening: 0, movement: 0 }
      },
      sharpMoney: 'none'
    };
    
    if (oddsData) {
      const awayOdds = oddsData.awayTeamOdds;
      const homeOdds = oddsData.homeTeamOdds;
      
      if (awayOdds?.open && awayOdds?.current) {
        // Spread movement - use the actual spread values from ESPN
        const openingSpread = awayOdds.open.pointSpread?.american ? 
          parseFloat(awayOdds.open.pointSpread.american.replace('+', '')) : spread;
        const currentSpread = awayOdds.current.pointSpread?.american ? 
          parseFloat(awayOdds.current.pointSpread.american.replace('+', '')) : spread;
        
        lineMovementData.spread = {
          current: currentSpread,
          opening: openingSpread,
          movement: Math.abs(currentSpread - openingSpread),
          direction: currentSpread > openingSpread ? 'toward_home' :
                    currentSpread < openingSpread ? 'toward_away' : 'stable'
        };
        
        // Moneyline movement
        const openingAwayML = awayOdds.open.moneyLine?.american ? 
          parseInt(awayOdds.open.moneyLine.american.replace('+', '')) : 0;
        const currentAwayML = awayOdds.current.moneyLine?.american ? 
          parseInt(awayOdds.current.moneyLine.american.replace('+', '')) : 0;

        const openingHomeML = homeOdds?.open?.moneyLine?.american ? 
          parseInt(homeOdds.open.moneyLine.american.replace('+', '')) : 0;
        const currentHomeML = homeOdds?.current?.moneyLine?.american ? 
          parseInt(homeOdds.current.moneyLine.american.replace('+', '')) : 0;

        lineMovementData.moneyline = {
          away: {
            current: currentAwayML,
            opening: openingAwayML,
            movement: Math.abs(currentAwayML - openingAwayML)
          },
          home: {
            current: currentHomeML,
            opening: openingHomeML,
            movement: Math.abs(currentHomeML - openingHomeML)
          }
        };
        
        // Total movement (if available in odds data)
        if (oddsData.open?.total && oddsData.current?.total) {
          const openingTotal = parseFloat(oddsData.open.total.american || oddsData.open.total.alternateDisplayValue || total.toString());
          const currentTotal = parseFloat(oddsData.current.total.american || oddsData.current.total.alternateDisplayValue || total.toString());
          
          lineMovementData.total = {
            current: currentTotal,
            opening: openingTotal,
            movement: Math.abs(currentTotal - openingTotal),
            direction: currentTotal > openingTotal ? 'over' : 
                      currentTotal < openingTotal ? 'under' : 'stable'
          };
          
          console.log(`   📊 Total: ${openingTotal} → ${currentTotal} (${lineMovementData.total.direction})`);
        }
        
        console.log(`   📊 Spread: ${openingSpread} → ${currentSpread} (${lineMovementData.spread.direction})`);
        console.log(`   📊 Away ML: ${openingAwayML} → ${currentAwayML}`);
        console.log(`   📊 Home ML: ${openingHomeML} → ${currentHomeML}`);
      } else {
        console.log(`   ⚠️  No open/current odds data available`);
      }
    } else {
      console.log(`   ⚠️  No odds data available for line movement analysis`);
    }

    // Build minimal factbook with real data
    console.log(`\n🏗️  Building factbook structure...`);
    
    // Build team sections first so we can conditionally include coaching
    const awayTeamSection: MinimalFactbook['teams']['away'] = {
      abbreviation: awayTeamData.abbreviation,
      record: { winPercentage: awayRecordData.items[0]?.stats.find((stat: any) => stat.name === 'winPercent')?.value || 0.5 },
      statistics: {
        offense: {
          pointsPerGame: awayPointsPerGame,
          turnovers: awayTurnovers,
          rushingYards: awayRushingYards,
          passingYards: awayPassingYards
        },
        defense: {
          pointsAllowed: awayPointsAllowed,
          sacks: awaySacks,
          interceptions: awayInterceptions,
          forcedFumbles: awayForcedFumbles,
          totalTackles: awayTotalTackles
        }
      },
      keyPlayers: awayKeyPlayers.map(player => ({
        position: player.position,
        name: player.name,
        stats: player.stats,
        value: player.value
      }))
    };
    if (typeof awayCoachExperience === 'number') {
      awayTeamSection.coaching = {
        experience: awayCoachExperience,
        name: (awayTeamData as any).__coachName
      };
    }

    const homeTeamSection: MinimalFactbook['teams']['home'] = {
      abbreviation: homeTeamData.abbreviation,
      record: { winPercentage: homeRecordData.items[0]?.stats.find((stat: any) => stat.name === 'winPercent')?.value || 0.5 },
      statistics: {
        offense: {
          pointsPerGame: homePointsPerGame,
          turnovers: homeTurnovers,
          rushingYards: homeRushingYards,
          passingYards: homePassingYards
        },
        defense: {
          pointsAllowed: homePointsAllowed,
          sacks: homeSacks,
          interceptions: homeInterceptions,
          forcedFumbles: homeForcedFumbles,
          totalTackles: homeTotalTackles
        }
      },
      keyPlayers: homeKeyPlayers.map(player => ({
        position: player.position,
        name: player.name,
        stats: player.stats,
        value: player.value
      }))
    };
    if (typeof homeCoachExperience === 'number') {
      homeTeamSection.coaching = {
        experience: homeCoachExperience,
        name: (homeTeamData as any).__coachName
      };
    }

    const factbook: MinimalFactbook = {
      gameId: game.id,
      kickoffISO: game.kickoffEt,
      week: 1,
      teams: {
        away: awayTeamSection,
        home: homeTeamSection
      },
      bettingContext: {
        currentLine: {
          spread: spread,
          total: total
        },
        bettingTrends: {
          spread: {
            home: bettingTrends.spread.home,
            away: bettingTrends.spread.away
          },
          total: {
            over: bettingTrends.total.over,
            under: bettingTrends.total.under
          },
          moneyline: {
            home: bettingTrends.moneyline.home,
            away: bettingTrends.moneyline.away
          }
        },
        lineMovement: lineMovementData
      }
    };

    console.log(`\n📝 FACTBOOK PROPERTIES LOG:`);
    console.log(`   🆔 gameId: "${factbook.gameId}" (from games.json)`);
    console.log(`   🕐 kickoffISO: "${factbook.kickoffISO}" (from games.json)`);
    console.log(`   📅 week: ${factbook.week} (hardcoded)`);
    console.log(`   \n   🏈 TEAMS:`);
    console.log(`      🚌 Away Team (${factbook.teams.away.abbreviation}):`);
    console.log(`         📊 abbreviation: "${factbook.teams.away.abbreviation}" (from ESPN API)`);
    console.log(`         📈 record.winPercentage: ${factbook.teams.away.record.winPercentage} (from ESPN record API)`);
    console.log(`         🏃 offense.pointsPerGame: ${factbook.teams.away.statistics.offense.pointsPerGame} (from ESPN record API)`);
    console.log(`         🏃 offense.turnovers: ${factbook.teams.away.statistics.offense.turnovers} (from ESPN statistics API)`);
    console.log(`         🏃 offense.rushingYards: ${factbook.teams.away.statistics.offense.rushingYards} (from ESPN statistics API)`);
    console.log(`         🏃 offense.passingYards: ${factbook.teams.away.statistics.offense.passingYards} (from ESPN statistics API)`);
    console.log(`         🛡️  defense.pointsAllowed: ${factbook.teams.away.statistics.defense.pointsAllowed} (from ESPN record API)`);
    console.log(`         🛡️  defense.sacks: ${factbook.teams.away.statistics.defense.sacks} (from ESPN statistics API)`);
    console.log(`         🛡️  defense.interceptions: ${factbook.teams.away.statistics.defense.interceptions} (from ESPN statistics API)`);
    console.log(`         🛡️  defense.forcedFumbles: ${factbook.teams.away.statistics.defense.forcedFumbles} (from ESPN statistics API)`);
    console.log(`         🛡️  defense.totalTackles: ${factbook.teams.away.statistics.defense.totalTackles} (from ESPN statistics API)`);
    console.log(`         👥 keyPlayers: ${factbook.teams.away.keyPlayers.length} players (from ESPN leaders API)`);
    if (factbook.teams.away.coaching) {
      console.log(`         👨‍💼 coaching.experience: ${factbook.teams.away.coaching.experience} years (from ESPN)`);
    }
    console.log(`      \n      🏠 Home Team (${factbook.teams.home.abbreviation}):`);
    console.log(`         📊 abbreviation: "${factbook.teams.home.abbreviation}" (from ESPN API)`);
    console.log(`         📈 record.winPercentage: ${factbook.teams.home.record.winPercentage} (from ESPN record API)`);
    console.log(`         🏃 offense.pointsPerGame: ${factbook.teams.home.statistics.offense.pointsPerGame} (from ESPN record API)`);
    console.log(`         🏃 offense.turnovers: ${factbook.teams.home.statistics.offense.turnovers} (from ESPN statistics API)`);
    console.log(`         🏃 offense.rushingYards: ${factbook.teams.home.statistics.offense.rushingYards} (from ESPN statistics API)`);
    console.log(`         🏃 offense.passingYards: ${factbook.teams.home.statistics.offense.passingYards} (from ESPN statistics API)`);
    console.log(`         🛡️  defense.pointsAllowed: ${factbook.teams.home.statistics.defense.pointsAllowed} (from ESPN record API)`);
    console.log(`         🛡️  defense.sacks: ${factbook.teams.home.statistics.defense.sacks} (from ESPN statistics API)`);
    console.log(`         🛡️  defense.interceptions: ${factbook.teams.home.statistics.defense.interceptions} (from ESPN statistics API)`);
    console.log(`         🛡️  defense.forcedFumbles: ${factbook.teams.home.statistics.defense.forcedFumbles} (from ESPN statistics API)`);
    console.log(`         🛡️  defense.totalTackles: ${factbook.teams.home.statistics.defense.totalTackles} (from ESPN statistics API)`);
    console.log(`         👥 keyPlayers: ${factbook.teams.home.keyPlayers.length} players (from ESPN leaders API)`);
    if (factbook.teams.home.coaching) {
      console.log(`         👨‍💼 coaching.experience: ${factbook.teams.home.coaching.experience} years (from ESPN)`);
    }
    console.log(`   \n   💰 BETTING CONTEXT:`);
    console.log(`      📊 currentLine.spread: ${factbook.bettingContext.currentLine.spread} (from games.json)`);
    console.log(`      📊 currentLine.total: ${factbook.bettingContext.currentLine.total} (from games.json)`);
    console.log(`      📈 bettingTrends.spread: home ${factbook.bettingContext.bettingTrends.spread.home}%, away ${factbook.bettingContext.bettingTrends.spread.away}% (from Action Network)`);
    console.log(`      📈 bettingTrends.total: over ${factbook.bettingContext.bettingTrends.total.over}%, under ${factbook.bettingContext.bettingTrends.total.under}% (from Action Network)`);
    console.log(`      📈 bettingTrends.moneyline: home ${factbook.bettingContext.bettingTrends.moneyline.home}%, away ${factbook.bettingContext.bettingTrends.moneyline.away}% (from Action Network)`);
    console.log(`      📉 lineMovement.spread: ${factbook.bettingContext.lineMovement.spread.opening} → ${factbook.bettingContext.lineMovement.spread.current} (${factbook.bettingContext.lineMovement.spread.direction})`);
    console.log(`      📉 lineMovement.total: ${factbook.bettingContext.lineMovement.total.opening} → ${factbook.bettingContext.lineMovement.total.current} (${factbook.bettingContext.lineMovement.total.direction})`);
    console.log(`      📉 lineMovement.moneyline.away: ${factbook.bettingContext.lineMovement.moneyline.away.opening} → ${factbook.bettingContext.lineMovement.moneyline.away.current}`);
    console.log(`      📉 lineMovement.moneyline.home: ${factbook.bettingContext.lineMovement.moneyline.home.opening} → ${factbook.bettingContext.lineMovement.moneyline.home.current}`);
    console.log(`      📉 lineMovement.sharpMoney: "${factbook.bettingContext.lineMovement.sharpMoney}"`);
    // keyMatchups removed

    return factbook;

  } catch (error) {
    console.error(`❌ Error generating real factbook for ${game.id}:`, error);
    return null;
  }
}

async function generateFactbooks(week: number) {
  console.log(`📚 Generating factbooks for ALL games in Week ${week}...\n`);

  try {
    // Load games data
    const gamesPath = path.join(process.cwd(), '..', 'data/nfl/season-2025', `week-${week.toString().padStart(2, '0')}`, 'games.json');
    const games: GameData[] = JSON.parse(fs.readFileSync(gamesPath, 'utf8'));
    console.log(`📊 Loaded ${games.length} games`);

    // Create factbooks directory
    const factbooksDir = path.join(process.cwd(), '..', 'data/nfl/season-2025', `week-${week.toString().padStart(2, '0')}`, 'factbooks');
    if (!fs.existsSync(factbooksDir)) {
      fs.mkdirSync(factbooksDir, { recursive: true });
    }

    let successCount = 0;
    for (const game of games) {
      console.log(`🎯 Generating factbook for: ${game.away.abbr} @ ${game.home.abbr} (${game.id})`);
      const factbook = await generateRealFactbook(game);
      if (factbook) {
        const factbookPath = path.join(factbooksDir, `${game.id}.json`);
        fs.writeFileSync(factbookPath, JSON.stringify(factbook, null, 2));
        console.log(`✅ Saved: ${factbookPath}`);
        successCount += 1;
      } else {
        console.log(`⚠️  Skipped: ${game.id} (no factbook)`);
      }
    }

    console.log(`\n✅ Generated ${successCount} factbook(s)`);

  } catch (error) {
    console.error('❌ Error generating factbook:', error);
    process.exit(1);
  }
}

// CLI usage
const week = process.argv[2] ? parseInt(process.argv[2]) : 1;
generateFactbooks(week);
