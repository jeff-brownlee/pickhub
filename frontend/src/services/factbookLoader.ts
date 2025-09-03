import { GameFactbook } from '../types/factbook';

export class FactbookLoader {
  private cache = new Map<string, GameFactbook>();

  async loadGameFactbook(gameId: string, week: number): Promise<GameFactbook | null> {
    const cacheKey = `${gameId}-week-${week}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const weekStr = week.toString().padStart(2, '0');
      const response = await fetch(`/data/nfl/season-2025/week-${weekStr}/factbooks/${gameId}.json`);
      
      if (!response.ok) {
        console.warn(`Failed to load factbook for ${gameId}: ${response.status}`);
        return null;
      }

      const factbook = await response.json() as GameFactbook;
      this.cache.set(cacheKey, factbook);
      return factbook;
      
    } catch (error) {
      console.error(`Error loading factbook for ${gameId}:`, error);
      return null;
    }
  }

  async loadAllFactbooksForWeek(week: number): Promise<Map<string, GameFactbook>> {
    const factbooks = new Map<string, GameFactbook>();
    
    try {
      // Load games to get game IDs
      const weekStr = week.toString().padStart(2, '0');
      const gamesResponse = await fetch(`/data/nfl/season-2025/week-${weekStr}/games.json`);
      
      if (!gamesResponse.ok) {
        console.warn(`Failed to load games for week ${week}: ${gamesResponse.status}. Factbooks are now in data directory and not accessible via web.`);
        return factbooks;
      }

      const games = await gamesResponse.json();
      
      // Load factbooks for each game
      const factbookPromises = games.map(async (game: any) => {
        const factbook = await this.loadGameFactbook(game.id, week);
        if (factbook) {
          factbooks.set(game.id, factbook);
        }
      });

      await Promise.all(factbookPromises);
      
    } catch (error) {
      console.error(`Error loading factbooks for week ${week}:`, error);
    }

    return factbooks;
  }

  // Helper methods for analyst services
  getTeamRecord(factbook: GameFactbook, teamSide: 'home' | 'away'): { wins: number; losses: number; winPercentage: number } {
    const team = factbook.teams[teamSide];
    return {
      wins: team.record.wins,
      losses: team.record.losses,
      winPercentage: team.record.winPercentage
    };
  }

  getTeamStatistics(factbook: GameFactbook, teamSide: 'home' | 'away') {
    return factbook.teams[teamSide].statistics;
  }

  getKeyPlayers(factbook: GameFactbook, teamSide: 'home' | 'away') {
    return factbook.teams[teamSide].keyPlayers;
  }

  getInjuries(factbook: GameFactbook, teamSide: 'home' | 'away') {
    return factbook.injuries.filter(injury => 
      factbook.teams[teamSide].keyPlayers.some(player => 
        player.name.toLowerCase().includes(injury.player.toLowerCase())
      )
    );
  }

  getBettingContext(factbook: GameFactbook) {
    return factbook.bettingContext;
  }

  getVenueInfo(factbook: GameFactbook) {
    return factbook.venue;
  }

  getWeatherInfo(factbook: GameFactbook) {
    return factbook.weather;
  }

  // Get situational advantages
  getSituationalAdvantages(factbook: GameFactbook) {
    const homeTeam = factbook.teams.home;
    const awayTeam = factbook.teams.away;
    
    return {
      homeAdvantage: homeTeam.situational.homeAdvantage,
      restAdvantage: homeTeam.situational.restAdvantage,
      travel: awayTeam.situational.travel,
      motivation: {
        home: homeTeam.situational.motivation,
        away: awayTeam.situational.motivation
      }
    };
  }

  // Get key matchups and trends
  getKeyMatchups(factbook: GameFactbook) {
    return factbook.keyMatchups;
  }

  getGameTrends(factbook: GameFactbook) {
    return factbook.trends;
  }

  // Get team-specific trends
  getTeamTrends(factbook: GameFactbook, teamSide: 'home' | 'away') {
    return factbook.teams[teamSide].trends;
  }

  // Clear cache (useful for development)
  clearCache() {
    this.cache.clear();
  }
}

export const factbookLoader = new FactbookLoader();
