import { MinimalFactbook } from '../types/minimalFactbook';
import { Persona } from '../types';
import { AnalystPick, PickRationale } from './analystService';
import { GameData } from '../adapters/espnNflApi';

export interface WeeklyPickSelection {
  analystId: string;
  week: number;
  picks: AnalystPick[];
  totalPicks: number;
  selectionMethod: 'heuristics' | 'chatgpt';
}

export class PickSelectionService {
  private readonly PICKS_PER_WEEK = 3; // Fixed number of picks per analyst per week

  /**
   * Generate weekly picks for an analyst using heuristics
   */
  async generateWeeklyPicksHeuristics(
    games: GameData[],
    factbooks: MinimalFactbook[], 
    analyst: Persona, 
    week: number
  ): Promise<WeeklyPickSelection> {
    
    // Score each game based on analyst bias
    const scoredGames = factbooks.map(factbook => ({
      factbook,
      score: this.calculateBiasAlignmentScore(factbook, analyst)
    }));

    // Sort by score and take top N
    const topGames = scoredGames
      .sort((a, b) => b.score - a.score)
      .slice(0, this.PICKS_PER_WEEK);

    // Generate picks for selected games
    const picks = await Promise.all(
      topGames.map(({ factbook }) => {
        const game = games.find(g => g.id === factbook.gameId);
        if (!game) throw new Error(`Game ${factbook.gameId} not found in games data`);
        return this.generatePickForGame(game, factbook, analyst);
      })
    );

    return {
      analystId: analyst.id,
      week,
      picks,
      totalPicks: picks.length,
      selectionMethod: 'heuristics'
    };
  }

  /**
   * Generate weekly picks for an analyst using ChatGPT
   */
  async generateWeeklyPicksChatGPT(
    games: GameData[],
    factbooks: MinimalFactbook[], 
    analyst: Persona, 
    week: number
  ): Promise<WeeklyPickSelection> {
    
    // Prepare data for ChatGPT
    const gameSummaries = factbooks.map(fb => this.createGameSummary(fb));
    
    const prompt = this.buildSelectionPrompt(analyst, gameSummaries, week);
    
    try {
      const selectedGames = await this.callChatGPT(prompt);
      const picks = await Promise.all(
        selectedGames.map((gameId: string) => {
          const factbook = factbooks.find(fb => fb.gameId === gameId);
          const game = games.find(g => g.id === gameId);
          if (!factbook) throw new Error(`Game ${gameId} not found in factbooks`);
          if (!game) throw new Error(`Game ${gameId} not found in games data`);
          return this.generatePickForGame(game, factbook, analyst);
        })
      );

      return {
        analystId: analyst.id,
        week,
        picks,
        totalPicks: picks.length,
        selectionMethod: 'chatgpt'
      };
    } catch (error) {
      console.error('ChatGPT selection failed, falling back to heuristics:', error);
      return this.generateWeeklyPicksHeuristics(games, factbooks, analyst, week);
    }
  }

  /**
   * Calculate how well a game aligns with an analyst's bias
   */
  private calculateBiasAlignmentScore(factbook: MinimalFactbook, analyst: Persona): number {
    let score = 0;

    switch (analyst.id) {
      case 'coach':
        score = this.calculateCoachScore(factbook);
        break;
      case 'contrarian':
        score = this.calculateContrarianScore(factbook);
        break;
      case 'fratguy':
        score = this.calculateFratGuyScore(factbook);
        break;
      case 'hotgirl':
        score = this.calculateHotGirlScore(factbook);
        break;
      case 'joe':
        score = this.calculateAverageJoeScore(factbook);
        break;
      case 'mobster':
        score = this.calculateMobsterScore(factbook);
        break;
      case 'nerd':
        score = this.calculateNerdScore(factbook);
        break;
      case 'podcaster':
        score = this.calculatePodcasterScore(factbook);
        break;
      case 'pro':
        score = this.calculateProScore(factbook);
        break;
      default:
        score = 0;
    }

    return score;
  }

  private calculateCoachScore(factbook: MinimalFactbook): number {
    const { away, home } = factbook.teams;
    let score = 0;

    // Prefer games with strong defenses
    const totalDefense = away.statistics.defense.pointsAllowed + home.statistics.defense.pointsAllowed;
    if (totalDefense < 40) score += 30; // Strong defenses
    if (totalDefense < 35) score += 20; // Elite defenses

    // Prefer disciplined teams (fewer turnovers)
    const awayDiscipline = away.statistics.offense.turnovers;
    const homeDiscipline = home.statistics.offense.turnovers;
    if (awayDiscipline < 15 || homeDiscipline < 15) score += 20;

    // Prefer games with clear coaching advantages
    if (away.coaching?.experience > 10 || home.coaching?.experience > 10) score += 15;

    // Prefer division games (more physical)
    if (factbook.keyMatchups.some(m => m.type === 'coaching')) score += 10;

    return score;
  }

  private calculateContrarianScore(factbook: MinimalFactbook): number {
    const bettingTrends = factbook.bettingContext.bettingTrends;
    let score = 0;

    // Prefer games with heavy public betting (70%+ on one side)
    const spreadSplit = Math.abs(bettingTrends.spread.home - bettingTrends.spread.away);
    if (spreadSplit > 40) score += 40; // Heavy public bias
    if (spreadSplit > 50) score += 20; // Very heavy bias

    const totalSplit = Math.abs(bettingTrends.total.over - bettingTrends.total.under);
    if (totalSplit > 30) score += 30; // Heavy public bias on total

    // Prefer games with line movement against public
    const lineMovement = factbook.bettingContext.lineMovement;
    if (lineMovement.sharpMoney && lineMovement.sharpMoney !== 'none') score += 25;

    // Prefer popular teams (more public bias)
    const popularTeams = ['DAL', 'GB', 'PIT', 'NE', 'KC', 'BUF', 'SF', 'PHI'];
    if (popularTeams.includes(factbook.teams.away.abbreviation) || 
        popularTeams.includes(factbook.teams.home.abbreviation)) {
      score += 15;
    }

    return score;
  }

  private calculateFratGuyScore(factbook: MinimalFactbook): number {
    let score = 0;

    // Prefer primetime games
    if (this.isPrimetimeGame(factbook.kickoffISO)) score += 40;

    // Prefer high-scoring games
    const totalOffense = factbook.teams.away.statistics.offense.pointsPerGame + 
                        factbook.teams.home.statistics.offense.pointsPerGame;
    if (totalOffense > 50) score += 30;
    if (totalOffense > 60) score += 20;

    // Prefer popular teams
    const popularTeams = ['DAL', 'GB', 'PIT', 'NE', 'KC', 'BUF', 'SF', 'PHI'];
    if (popularTeams.includes(factbook.teams.away.abbreviation) || 
        popularTeams.includes(factbook.teams.home.abbreviation)) {
      score += 20;
    }

    // Prefer games with clear favorites
    const spread = Math.abs(factbook.bettingContext.currentLine?.spread || 0);
    if (spread > 7) score += 15; // Clear favorite

    return score;
  }

  private calculateHotGirlScore(factbook: MinimalFactbook): number {
    let score = 0;

    // Prefer primetime games
    if (this.isPrimetimeGame(factbook.kickoffISO)) score += 35;

    // Prefer popular teams
    const popularTeams = ['DAL', 'GB', 'PIT', 'NE', 'KC', 'BUF', 'SF', 'PHI'];
    if (popularTeams.includes(factbook.teams.away.abbreviation) || 
        popularTeams.includes(factbook.teams.home.abbreviation)) {
      score += 30;
    }

    // Prefer games with star QBs
    if (this.hasStarQuarterback(factbook.teams.away) || 
        this.hasStarQuarterback(factbook.teams.home)) {
      score += 25;
    }

    // Prefer high-scoring games
    const totalOffense = factbook.teams.away.statistics.offense.pointsPerGame + 
                        factbook.teams.home.statistics.offense.pointsPerGame;
    if (totalOffense > 50) score += 20;

    return score;
  }

  private calculateAverageJoeScore(factbook: MinimalFactbook): number {
    let score = 0;

    // Prefer popular teams
    const popularTeams = ['DAL', 'GB', 'PIT', 'NE', 'KC', 'BUF', 'SF', 'PHI'];
    if (popularTeams.includes(factbook.teams.away.abbreviation) || 
        popularTeams.includes(factbook.teams.home.abbreviation)) {
      score += 30;
    }

    // Prefer games with clear favorites
    const spread = Math.abs(factbook.bettingContext.currentLine?.spread || 0);
    if (spread > 5) score += 25; // Clear favorite

    // Prefer primetime games
    if (this.isPrimetimeGame(factbook.kickoffISO)) score += 20;

    // Prefer games with good records
    const awayRecord = factbook.teams.away.record.winPercentage;
    const homeRecord = factbook.teams.home.record.winPercentage;
    if (awayRecord > 0.6 || homeRecord > 0.6) score += 15;

    return score;
  }

  private calculateMobsterScore(factbook: MinimalFactbook): number {
    let score = 0;

    // Prefer games with line movement
    const lineMovement = factbook.bettingContext.lineMovement;
    if (lineMovement.spreadMovement && Math.abs(lineMovement.spreadMovement) > 1) score += 35;
    if (lineMovement.totalMovement && Math.abs(lineMovement.totalMovement) > 1) score += 30;

    // Prefer games with sharp money indicators
    if (lineMovement.sharpMoney && lineMovement.sharpMoney !== 'none') score += 40;

    // Prefer games with public betting splits
    const bettingTrends = factbook.bettingContext.bettingTrends;
    const spreadSplit = Math.abs(bettingTrends.spread.home - bettingTrends.spread.away);
    if (spreadSplit > 20) score += 20;

    return score;
  }

  private calculateNerdScore(factbook: MinimalFactbook): number {
    let score = 0;

    // Prefer games with clear statistical advantages
    const awayStats = factbook.teams.away.statistics;
    const homeStats = factbook.teams.home.statistics;
    
    const awayAdvantage = awayStats.offense.pointsPerGame - awayStats.defense.pointsAllowed;
    const homeAdvantage = homeStats.offense.pointsPerGame - homeStats.defense.pointsAllowed;
    
    const statGap = Math.abs(awayAdvantage - homeAdvantage);
    if (statGap > 5) score += 40; // Clear statistical advantage
    if (statGap > 10) score += 20; // Very clear advantage

    // Prefer games with sufficient sample size (good records)
    const awayRecord = factbook.teams.away.record.winPercentage;
    const homeRecord = factbook.teams.home.record.winPercentage;
    if (awayRecord > 0.4 && homeRecord > 0.4) score += 20; // Both teams have decent records

    // Prefer games with clear total value
    const expectedTotal = (awayStats.offense.pointsPerGame + homeStats.offense.pointsPerGame) / 2;
    const currentTotal = factbook.bettingContext.currentLine?.total || 48.5;
    const totalGap = Math.abs(expectedTotal - currentTotal);
    if (totalGap > 3) score += 25; // Clear total value

    return score;
  }

  private calculatePodcasterScore(factbook: MinimalFactbook): number {
    let score = 0;

    // Prefer physical teams (good rushing, good defense)
    const awayPhysicality = factbook.teams.away.statistics.offense.rushingYards + 
                           factbook.teams.away.statistics.defense.sacks;
    const homePhysicality = factbook.teams.home.statistics.offense.rushingYards + 
                           factbook.teams.home.statistics.defense.sacks;
    
    if (awayPhysicality > 200 || homePhysicality > 200) score += 30;

    // Prefer division games (more physical)
    if (factbook.keyMatchups.some(m => m.type === 'coaching')) score += 25;

    // Prefer games with strong defenses
    const totalDefense = factbook.teams.away.statistics.defense.pointsAllowed + 
                        factbook.teams.home.statistics.defense.pointsAllowed;
    if (totalDefense < 40) score += 25;

    // Prefer primetime games
    if (this.isPrimetimeGame(factbook.kickoffISO)) score += 20;

    return score;
  }

  private calculateProScore(factbook: MinimalFactbook): number {
    let score = 0;

    // Prefer games with line movement (indicates value)
    const lineMovement = factbook.bettingContext.lineMovement;
    if (lineMovement.spreadMovement && Math.abs(lineMovement.spreadMovement) > 1) score += 30;
    if (lineMovement.totalMovement && Math.abs(lineMovement.totalMovement) > 1) score += 25;

    // Prefer games with sharp money indicators
    if (lineMovement.sharpMoney && lineMovement.sharpMoney !== 'none') score += 35;

    // Prefer games with clear statistical advantages
    const awayStats = factbook.teams.away.statistics;
    const homeStats = factbook.teams.home.statistics;
    
    const awayAdvantage = awayStats.offense.pointsPerGame - awayStats.defense.pointsAllowed;
    const homeAdvantage = homeStats.offense.pointsPerGame - homeStats.defense.pointsAllowed;
    
    const statGap = Math.abs(awayAdvantage - homeAdvantage);
    if (statGap > 5) score += 25; // Clear statistical advantage

    // Prefer games with key numbers
    const spread = Math.abs(factbook.bettingContext.currentLine?.spread || 0);
    const keyNumbers = [3, 7, 10, 14];
    if (keyNumbers.includes(Math.round(spread))) score += 20;

    return score;
  }

  private async generatePickForGame(game: GameData, factbook: MinimalFactbook, analyst: Persona): Promise<AnalystPick> {
    // Merge game data (odds, lines) with factbook data (analysis) for pick generation
    const mergedData = {
      game: game,           // Contains: odds, lines, basic game info
      analysis: factbook    // Contains: team stats, trends, key matchups
    };

    // This would call the analystService.generatePick method with merged data
    // For now, return a placeholder that uses actual game data
    const spread = game.odds?.spread?.away?.line || 0;
    const total = game.odds?.total?.over?.line || 48.5;
    const awayTeam = game.away.abbr;
    const homeTeam = game.home.abbr;
    
    return {
      gameId: game.id,
      analystId: analyst.id,
      pick: `${awayTeam} ${spread > 0 ? '+' : ''}${spread}`,
      rationale: {
        pick: `${awayTeam} ${spread > 0 ? '+' : ''}${spread}`,
        confidence: 2,
        rationale: `Based on ${analyst.persona} analysis: ${factbook.teams.away.abbreviation} has statistical advantages in key areas.`,
        keyFactors: [
          `Spread: ${spread > 0 ? awayTeam : homeTeam} ${Math.abs(spread)}`,
          `Total: ${total}`,
          `Analysis: ${factbook.keyMatchups.length} key factors identified`
        ],
        supportingData: {
          stats: [
            `${awayTeam} PPG: ${factbook.teams.away.statistics.offense.pointsPerGame}`,
            `${homeTeam} PPG: ${factbook.teams.home.statistics.offense.pointsPerGame}`
          ],
          trends: factbook.bettingContext.bettingTrends ? [
            `Spread: ${factbook.bettingContext.bettingTrends.spread.home}% home, ${factbook.bettingContext.bettingTrends.spread.away}% away`,
            `Total: ${factbook.bettingContext.bettingTrends.total.over}% over, ${factbook.bettingContext.bettingTrends.total.under}% under`
          ] : [],
          situational: factbook.keyMatchups.map(m => `${m.type}: ${m.description}`)
        }
      },
      timestamp: new Date().toISOString()
    };
  }

  private createGameSummary(factbook: MinimalFactbook): string {
    return `${factbook.teams.away.abbreviation} @ ${factbook.teams.home.abbreviation} - Week ${factbook.week}`;
  }

  private buildSelectionPrompt(analyst: Persona, gameSummaries: string[], week: number): string {
    return `
You are selecting the best ${this.PICKS_PER_WEEK} games for ${analyst.name} (${analyst.persona}) in Week ${week}.

Analyst Profile:
- Bias: ${analyst.bias}
- Voice Style: ${analyst.voiceStyle}
- Tagline: ${analyst.tagline}

Available Games:
${gameSummaries.map((game, index) => `${index + 1}. ${game}`).join('\n')}

Select the ${this.PICKS_PER_WEEK} games that best align with this analyst's bias and approach. Return only the game IDs in JSON format: ["game1", "game2", "game3"]
`;
  }

  private async callChatGPT(prompt: string): Promise<string[]> {
    // This would make an actual ChatGPT API call
    // For now, return placeholder
    return ['game1', 'game2', 'game3'];
  }

  private isPrimetimeGame(kickoffISO: string): boolean {
    const hour = new Date(kickoffISO).getHours();
    return hour >= 20 || hour <= 2;
  }

  private hasStarQuarterback(team: any): boolean {
    return team.keyPlayers.some((p: any) => p.position === 'QB');
  }
}

export const pickSelectionService = new PickSelectionService();
