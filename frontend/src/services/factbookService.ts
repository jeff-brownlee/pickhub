import { GameFactbook, EspnTeamData, EspnRecordData, EspnStatisticsData, EspnAthletesData } from '../types/factbook';

// ESPN API Base URLs
const ESPN_BASE = 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl';
const SEASON = 2025;

export class FactbookService {
  private cache = new Map<string, any>();

  async buildGameFactbook(eventId: string, awayTeamId: string, homeTeamId: string): Promise<GameFactbook> {
    try {
      // Fetch team data in parallel
      const [awayTeamData, homeTeamData] = await Promise.all([
        this.fetchTeamData(awayTeamId),
        this.fetchTeamData(homeTeamId)
      ]);

      if (!awayTeamData || !homeTeamData) {
        throw new Error('Failed to fetch team data');
      }

      // Fetch detailed data for both teams
      const [awayTeamFactbook, homeTeamFactbook] = await Promise.all([
        this.buildTeamFactbook(awayTeamData, 'away'),
        this.buildTeamFactbook(homeTeamData, 'home')
      ]);

      // Build the complete game factbook
      const factbook: GameFactbook = {
        gameId: eventId,
        season: SEASON,
        week: this.extractWeekFromEventId(eventId),
        kickoffISO: '', // Will be filled from event data
        venue: this.extractVenueInfo(homeTeamData.venue),
        teams: {
          away: awayTeamFactbook,
          home: homeTeamFactbook
        },
        bettingContext: await this.buildBettingContext(eventId),
        keyMatchups: await this.identifyKeyMatchups(awayTeamFactbook, homeTeamFactbook),
        trends: await this.identifyGameTrends(awayTeamFactbook, homeTeamFactbook),
        injuries: await this.buildInjuryReport(awayTeamData, homeTeamData),
        lastUpdated: new Date().toISOString()
      };

      return factbook;
    } catch (error) {
      console.error('Error building game factbook:', error);
      throw error;
    }
  }

  private async fetchTeamData(teamId: string): Promise<EspnTeamData | null> {
    const cacheKey = `team_${teamId}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const url = `${ESPN_BASE}/seasons/${SEASON}/teams/${teamId}?lang=en&region=us`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.warn(`Failed to fetch team data for ${teamId}: ${response.status}`);
        return null;
      }

      const data = await response.json() as EspnTeamData;
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Error fetching team data for ${teamId}:`, error);
      return null;
    }
  }

  private async buildTeamFactbook(teamData: EspnTeamData, homeAway: 'home' | 'away') {
    // Fetch additional data in parallel
    const [recordData, statisticsData, athletesData] = await Promise.all([
      this.fetchFromRef<EspnRecordData>(teamData.record.$ref),
      this.fetchFromRef<EspnStatisticsData>(teamData.statistics.$ref),
      this.fetchFromRef<EspnAthletesData>(teamData.athletes.$ref)
    ]);

    return {
      id: teamData.id,
      name: teamData.displayName,
      abbreviation: teamData.abbreviation,
      record: this.parseRecordData(recordData),
      recentForm: this.parseRecentForm(recordData),
      statistics: this.parseStatisticsData(statisticsData),
      keyPlayers: this.parseKeyPlayers(athletesData),
      coaching: this.parseCoachingInfo(teamData), // Would need additional API call
      situational: this.parseSituationalStats(teamData, homeAway),
      trends: this.parseTeamTrends(statisticsData)
    };
  }

  private async fetchFromRef<T>(ref: string): Promise<T | null> {
    const cacheKey = `ref_${ref}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(ref);
      if (!response.ok) {
        console.warn(`Failed to fetch from ref ${ref}: ${response.status}`);
        return null;
      }

      const data = await response.json() as T;
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Error fetching from ref ${ref}:`, error);
      return null;
    }
  }

  private parseRecordData(recordData: EspnRecordData | null) {
    if (!recordData?.items) {
      return {
        wins: 0,
        losses: 0,
        ties: 0,
        winPercentage: 0,
        lastFive: [],
        streak: { type: 'L' as const, count: 0 }
      };
    }

    // Parse record from ESPN data
    const overallRecord = recordData.items.find(item => item.type === 'total');
    if (!overallRecord) {
      return {
        wins: 0,
        losses: 0,
        ties: 0,
        winPercentage: 0,
        lastFive: [],
        streak: { type: 'L' as const, count: 0 }
      };
    }

    const wins = overallRecord.stats.find(s => s.name === 'wins')?.value || 0;
    const losses = overallRecord.stats.find(s => s.name === 'losses')?.value || 0;
    const ties = overallRecord.stats.find(s => s.name === 'ties')?.value || 0;

    return {
      wins,
      losses,
      ties,
      winPercentage: wins / (wins + losses + ties) || 0,
      lastFive: [], // Would need additional parsing
      streak: { type: 'W' as const, count: 0 } // Would need additional parsing
    };
  }

  private parseRecentForm(recordData: EspnRecordData | null) {
    // Parse recent form from record data
    return {
      lastFiveGames: [],
      pointsFor: 0,
      pointsAgainst: 0,
      pointDifferential: 0,
      averageMargin: 0
    };
  }

  private parseStatisticsData(statisticsData: EspnStatisticsData | null) {
    if (!statisticsData?.splits?.categories) {
      return {
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
      };
    }

    // Parse all categories and extract relevant stats
    const allStats = this.extractAllStats(statisticsData.splits.categories);

    return {
      offense: {
        pointsPerGame: allStats.pointsPerGame || 0,
        yardsPerGame: allStats.yardsPerGame || 0,
        passingYards: allStats.passingYards || 0,
        rushingYards: allStats.rushingYards || 0,
        thirdDownPercentage: allStats.thirdDownPercentage || 0,
        redZonePercentage: allStats.redZonePercentage || 0,
        turnovers: (allStats.fumbles || 0) + (allStats.interceptions || 0)
      },
      defense: {
        pointsAllowed: allStats.pointsAllowed || 0,
        yardsAllowed: allStats.yardsAllowed || 0,
        passingYardsAllowed: allStats.passingYardsAllowed || 0,
        rushingYardsAllowed: allStats.rushingYardsAllowed || 0,
        sacks: allStats.sacks || 0,
        interceptions: allStats.interceptions || 0,
        forcedFumbles: allStats.forcedFumbles || 0
      },
      specialTeams: {
        fieldGoalPercentage: allStats.fieldGoalPercentage || 0,
        puntReturnAverage: allStats.puntReturnAverage || 0,
        kickoffReturnAverage: allStats.kickoffReturnAverage || 0
      }
    };
  }

  private extractAllStats(categories: any[]) {
    const allStats: Record<string, number> = {};
    
    // Extract stats from all categories
    categories.forEach(category => {
      if (category.stats) {
        category.stats.forEach((stat: any) => {
          // Map ESPN stat names to our factbook names
          const mappedName = this.mapStatName(stat.name);
          if (mappedName) {
            allStats[mappedName] = stat.value || 0;
          }
        });
      }
    });

    return allStats;
  }

  private mapStatName(espnStatName: string): string | null {
    const statMap: Record<string, string> = {
      'pointsPerGame': 'pointsPerGame',
      'points': 'pointsPerGame',
      'yardsPerGame': 'yardsPerGame',
      'totalYards': 'yardsPerGame',
      'passingYards': 'passingYards',
      'passingYardsPerGame': 'passingYards',
      'rushingYards': 'rushingYards',
      'rushingYardsPerGame': 'rushingYards',
      'thirdDownPercentage': 'thirdDownPercentage',
      'thirdDownConversions': 'thirdDownPercentage',
      'redZonePercentage': 'redZonePercentage',
      'redZoneConversions': 'redZonePercentage',
      'fumbles': 'fumbles',
      'interceptions': 'interceptions',
      'sacks': 'sacks',
      'pointsAllowed': 'pointsAllowed',
      'yardsAllowed': 'yardsAllowed',
      'passingYardsAllowed': 'passingYardsAllowed',
      'rushingYardsAllowed': 'rushingYardsAllowed',
      'forcedFumbles': 'forcedFumbles',
      'fieldGoalPercentage': 'fieldGoalPercentage',
      'puntReturnAverage': 'puntReturnAverage',
      'kickoffReturnAverage': 'kickoffReturnAverage'
    };

    return statMap[espnStatName] || null;
  }

  private extractCategoryStats(categories: any[], categoryName: string) {
    const category = categories.find(cat => 
      cat.name.toLowerCase().includes(categoryName.toLowerCase())
    );
    
    if (!category?.stats) return {};

    const stats: Record<string, number> = {};
    category.stats.forEach((stat: any) => {
      stats[stat.name] = stat.value || 0;
    });

    return stats;
  }

  private parseKeyPlayers(athletesData: EspnAthletesData | null) {
    if (!athletesData?.items) return [];

    return athletesData.items
      .filter(player => ['QB', 'RB', 'WR', 'TE', 'K'].includes(player.position?.abbreviation))
      .slice(0, 10) // Top 10 key players
      .map(player => ({
        id: player.id,
        name: player.displayName,
        position: player.position?.abbreviation || 'UNK',
        status: this.mapPlayerStatus(player.status?.name),
        stats: {} // Would need additional API call for detailed stats
      }));
  }

  private mapPlayerStatus(status: string | undefined): 'active' | 'questionable' | 'doubtful' | 'out' {
    if (!status) return 'active';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('out')) return 'out';
    if (statusLower.includes('doubtful')) return 'doubtful';
    if (statusLower.includes('questionable')) return 'questionable';
    return 'active';
  }

  private parseCoachingInfo(teamData: EspnTeamData) {
    // Would need additional API call for coaching data
    return {
      headCoach: 'Unknown',
      experience: 0,
      record: { wins: 0, losses: 0, ties: 0 }
    };
  }

  private parseSituationalStats(teamData: EspnTeamData, homeAway: 'home' | 'away') {
    return {
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
    };
  }

  private parseTeamTrends(statisticsData: EspnStatisticsData | null) {
    // Parse trends from statistics data
    return [];
  }

  private extractVenueInfo(venue: any) {
    return {
      id: venue.id || '',
      name: venue.fullName || 'Unknown Venue',
      city: venue.address?.city || '',
      state: venue.address?.state || '',
      surface: venue.grass ? 'grass' as const : 'turf' as const,
      indoor: venue.indoor || false
    };
  }

  private async buildBettingContext(eventId: string) {
    // Would integrate with existing odds API
    return {
      openingLine: {},
      currentLine: {},
      lineMovement: {},
      bettingTrends: {
        spread: { home: 50, away: 50 },
        total: { over: 50, under: 50 },
        moneyline: { home: 50, away: 50 }
      },
      keyNumbers: {
        spread: [3, 7, 10, 14],
        total: [40, 45, 50, 55]
      }
    };
  }

  private async identifyKeyMatchups(awayTeam: any, homeTeam: any) {
    // Identify key matchups based on team strengths/weaknesses
    return [];
  }

  private async identifyGameTrends(awayTeam: any, homeTeam: any) {
    // Identify relevant trends for this matchup
    return [];
  }

  private async buildInjuryReport(awayTeamData: EspnTeamData, homeTeamData: EspnTeamData) {
    // Build injury report from team data
    return [];
  }

  private extractWeekFromEventId(eventId: string): number {
    // Extract week from event ID format
    return 1; // Placeholder
  }
}

export const factbookService = new FactbookService();
