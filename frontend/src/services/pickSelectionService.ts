import { MinimalFactbook } from '../types/minimalFactbook';
import { Persona, Pick as UIPick } from '../types';
import { AnalystPick } from './analystService';
import { GameData } from '../adapters/espnNflApi';
import { computeSpreadScore, computeTotalScore, computeMoneylineScore } from '../heuristics/marketScoring';

export interface WeeklyPickSelection {
  analystId: string;
  week: number;
  picks: AnalystPick[];
  totalPicks: number;
  selectionMethod: 'heuristics' | 'chatgpt';
}

export class PickSelectionService {
  private readonly PICKS_PER_WEEK = 5; // Fixed number of picks per analyst per week
  private readonly MIN_ADJUSTED_SCORE_PRIMARY = 55; // prefer stronger edges first
  private readonly MIN_ADJUSTED_SCORE_FALLBACK = 45; // allow fill if not enough

  // Decorrelation thresholds (initial defaults)
  private readonly MAX_EXACT_PICK_OVERLAP = 2; // allow up to 2 personas on same exact pick
  private readonly SAME_GAME_3RD_PICK_PENALTY = 3; // light penalty for 3rd+ pick from same game (any market)
  private readonly TEAM_SOFT_CAP = 4; // soft cap per team exposure
  private readonly TEAM_SOFT_CAP_PENALTY = 5;
  private readonly ML_CHALK_CAP = 3; // ML favorites <= -200 cap across portfolio
  private readonly ML_CHALK_CAP_PENALTY = 6;
  private readonly PUBLIC_ALIGN_CAP = 6; // public ≥ 65% cap across portfolio
  private readonly PUBLIC_ALIGN_CAP_PENALTY = 6;

  /**
   * Generate weekly picks for an analyst using heuristics
   */
  async generateWeeklyPicksHeuristics(
    games: GameData[],
    factbooks: MinimalFactbook[], 
    analyst: Persona, 
    week: number
  ): Promise<WeeklyPickSelection> {
    // Build candidates for all games (spread, total, moneyline)
    const allCandidates = factbooks.flatMap((fb) => this.buildCandidatesForGame(fb));

    // Apply lightweight bias overlay using persona.bias text only (no personas.ts)
    const enhanced = allCandidates.map(c => ({
      ...c,
      adjustedScore: c.baseScore + this.applyBiasOverlay(c, analyst, factbooks.find(f => f.gameId === c.gameId)!)
    }));

    // Greedy selection with constraints: max 2 per game, allowed combos: (ATS|ML) + Total
    const selected: typeof enhanced = [];
    const perGameCount: Record<string, number> = {};

    const sorted = enhanced.sort((a,b) => b.adjustedScore - a.adjustedScore);

    const trySelect = (minScore: number) => {
      for (const cand of sorted) {
        if (selected.length >= this.PICKS_PER_WEEK) break;
        if (cand.adjustedScore < minScore) continue;

        const count = perGameCount[cand.gameId] || 0;
        if (count >= 2) continue;

        // enforce combo rule
        const existing = selected.filter(s => s.gameId === cand.gameId);
        if (existing.length === 1) {
          const first = existing[0];
          const isFirstTotal = first.market === 'total';
          const isCandTotal = cand.market === 'total';
          if (!((isFirstTotal && (cand.market === 'spread' || cand.market === 'moneyline')) ||
                 (isCandTotal && (first.market === 'spread' || first.market === 'moneyline')))) {
            continue;
          }
        }

        selected.push(cand);
        perGameCount[cand.gameId] = count + 1;
      }
    };

    // First pass: require stronger adjusted scores
    trySelect(this.MIN_ADJUSTED_SCORE_PRIMARY);
    // Fallback pass: allow slightly weaker to fill remaining slots
    if (selected.length < this.PICKS_PER_WEEK) {
      trySelect(this.MIN_ADJUSTED_SCORE_FALLBACK);
    }

    // Materialize AnalystPick objects
    const picks = selected.map(c => this.candidateToPick(c, games, analyst));

    return {
      analystId: analyst.id,
      week,
      picks,
      totalPicks: picks.length,
      selectionMethod: 'heuristics'
    };
  }

  /**
   * Same as heuristics, but applies decorrelation penalties based on current portfolio exposures
   */
  async generateWeeklyPicksHeuristicsWithDecorrelation(
    games: GameData[],
    factbooks: MinimalFactbook[],
    analyst: Persona,
    week: number,
    exposures: any
  ): Promise<WeeklyPickSelection> {
    // Build candidates for all games (spread, total, moneyline)
    const allCandidates = factbooks.flatMap((fb) => this.buildCandidatesForGame(fb));

    const enhanced = allCandidates.map(c => ({
      ...c,
      adjustedScore: c.baseScore + this.applyBiasOverlay(c, analyst, factbooks.find(f => f.gameId === c.gameId)!)
    }));

    const selected: typeof enhanced = [];
    const perGameCount: Record<string, number> = {};
    const sorted = enhanced.sort((a,b) => b.adjustedScore - a.adjustedScore);

    const trySelect = (minScore: number) => {
      for (const cand of sorted) {
        if (selected.length >= this.PICKS_PER_WEEK) break;
        const fb = factbooks.find(f => f.gameId === cand.gameId)!;
        const penalty = this.computeDecorrelationPenalty(cand, fb, games, exposures);
        const penalizedScore = cand.adjustedScore - penalty;
        if (penalizedScore < minScore) continue;

        const count = perGameCount[cand.gameId] || 0;
        if (count >= 2) continue;

        const existing = selected.filter(s => s.gameId === cand.gameId);
        if (existing.length === 1) {
          const first = existing[0];
          const isFirstTotal = first.market === 'total';
          const isCandTotal = cand.market === 'total';
          if (!((isFirstTotal && (cand.market === 'spread' || cand.market === 'moneyline')) ||
                 (isCandTotal && (first.market === 'spread' || first.market === 'moneyline')))) {
            continue;
          }
        }

        selected.push(cand);
        perGameCount[cand.gameId] = count + 1;
        this.updateExposuresAfterSelection(cand, fb, games, exposures);
      }
    };

    trySelect(this.MIN_ADJUSTED_SCORE_PRIMARY);
    if (selected.length < this.PICKS_PER_WEEK) {
      trySelect(this.MIN_ADJUSTED_SCORE_FALLBACK);
    }

    const picks = selected.map(c => this.candidateToPick(c, games, analyst));

    return {
      analystId: analyst.id,
      week,
      picks,
      totalPicks: picks.length,
      selectionMethod: 'heuristics'
    };
  }

  private computeDecorrelationPenalty(
    cand: { gameId: string; market: 'spread'|'total'|'moneyline'; selection: any; baseScore: number; reasons: string[] },
    fb: MinimalFactbook,
    games: GameData[],
    exposures: any
  ): number {
    let penalty = 0;
    exposures.exactPickCount ||= Object.create(null);
    exposures.gamePickCount ||= Object.create(null);
    exposures.teamCount ||= Object.create(null);
    exposures.mlChalkCount ||= 0;
    exposures.publicAlignedCount ||= 0;
    exposures.totalPicks ||= 0;

    const key = `${cand.gameId}|${cand.market}|${cand.selection}`;
    const exactCount = exposures.exactPickCount[key] || 0;
    if (exactCount >= this.MAX_EXACT_PICK_OVERLAP) {
      penalty += 12; // heavy
    }

    const gameCount = exposures.gamePickCount[cand.gameId] || 0;
    if (gameCount >= 2) {
      penalty += this.SAME_GAME_3RD_PICK_PENALTY;
    }

    // Team exposure
    const game = games.find(g => g.id === cand.gameId);
    if (game) {
      const away = game.away.abbr;
      const home = game.home.abbr;
      const awayCount = exposures.teamCount[away] || 0;
      const homeCount = exposures.teamCount[home] || 0;
      if (awayCount >= this.TEAM_SOFT_CAP || homeCount >= this.TEAM_SOFT_CAP) {
        penalty += this.TEAM_SOFT_CAP_PENALTY;
      }
    }

    // ML chalk crowding (<= -200)
    if (cand.market === 'moneyline') {
      const ml = fb.bettingContext?.lineMovement?.moneyline;
      const chosen = cand.selection === 'home' ? ml?.home : ml?.away;
      const currentPrice = chosen?.current;
      if (typeof currentPrice === 'number' && currentPrice < -200) {
        if ((exposures.mlChalkCount || 0) >= this.ML_CHALK_CAP) {
          penalty += this.ML_CHALK_CAP_PENALTY;
        }
      }
    }

    // Public alignment crowding (≥ 65%)
    const bt = fb.bettingContext?.bettingTrends;
    let publicPct: number | undefined;
    if (cand.market === 'spread' && bt?.spread) {
      publicPct = cand.selection === 'home' ? bt.spread.home : bt.spread.away;
    } else if (cand.market === 'total' && bt?.total) {
      publicPct = cand.selection === 'over' ? bt.total.over : bt.total.under;
    } else if (cand.market === 'moneyline' && bt?.moneyline) {
      publicPct = cand.selection === 'home' ? bt.moneyline.home : bt.moneyline.away;
    }
    if (typeof publicPct === 'number' && publicPct >= 65) {
      if ((exposures.publicAlignedCount || 0) >= this.PUBLIC_ALIGN_CAP) {
        penalty += this.PUBLIC_ALIGN_CAP_PENALTY;
      }
    }

    return penalty;
  }

  private updateExposuresAfterSelection(
    cand: { gameId: string; market: 'spread'|'total'|'moneyline'; selection: any; baseScore: number; reasons: string[] },
    fb: MinimalFactbook,
    games: GameData[],
    exposures: any
  ) {
    exposures.exactPickCount ||= Object.create(null);
    exposures.gamePickCount ||= Object.create(null);
    exposures.teamCount ||= Object.create(null);
    exposures.mlChalkCount ||= 0;
    exposures.publicAlignedCount ||= 0;
    exposures.totalPicks ||= 0;

    const key = `${cand.gameId}|${cand.market}|${cand.selection}`;
    exposures.exactPickCount[key] = (exposures.exactPickCount[key] || 0) + 1;
    exposures.gamePickCount[cand.gameId] = (exposures.gamePickCount[cand.gameId] || 0) + 1;
    exposures.totalPicks += 1;

    const game = games.find(g => g.id === cand.gameId);
    if (game) {
      const away = game.away.abbr;
      const home = game.home.abbr;
      exposures.teamCount[away] = (exposures.teamCount[away] || 0) + 1;
      exposures.teamCount[home] = (exposures.teamCount[home] || 0) + 1;
    }

    if (cand.market === 'moneyline') {
      const ml = fb.bettingContext?.lineMovement?.moneyline;
      const chosen = cand.selection === 'home' ? ml?.home : ml?.away;
      const currentPrice = chosen?.current;
      if (typeof currentPrice === 'number' && currentPrice < -200) {
        exposures.mlChalkCount += 1;
      }
    }

    const bt = fb.bettingContext?.bettingTrends;
    let publicPct: number | undefined;
    if (cand.market === 'spread' && bt?.spread) {
      publicPct = cand.selection === 'home' ? bt.spread.home : bt.spread.away;
    } else if (cand.market === 'total' && bt?.total) {
      publicPct = cand.selection === 'over' ? bt.total.over : bt.total.under;
    } else if (cand.market === 'moneyline' && bt?.moneyline) {
      publicPct = cand.selection === 'home' ? bt.moneyline.home : bt.moneyline.away;
    }
    if (typeof publicPct === 'number' && publicPct >= 65) {
      exposures.publicAlignedCount += 1;
    }
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

  // Build ATS/Total/ML candidates for a given game
  private buildCandidatesForGame(fb: MinimalFactbook) {
    const spread = computeSpreadScore(fb);
    const total = computeTotalScore(fb);
    const moneyline = computeMoneylineScore(fb);

    return [
      {
        gameId: fb.gameId,
        market: 'spread' as const,
        selection: spread.side,
        baseScore: spread.score,
        reasons: spread.reasons
      },
      {
        gameId: fb.gameId,
        market: 'total' as const,
        selection: total.direction,
        baseScore: total.score,
        reasons: total.reasons
      },
      {
        gameId: fb.gameId,
        market: 'moneyline' as const,
        selection: moneyline.side,
        baseScore: moneyline.score,
        reasons: moneyline.reasons
      }
    ];
  }

  // Lightweight bias overlay from persona.bias/tagline only
  private applyBiasOverlay(
    cand: { gameId: string; market: 'spread'|'total'|'moneyline'; selection: any; baseScore: number; reasons: string[] },
    analyst: Persona,
    fb: MinimalFactbook
  ): number {
    const bias = (analyst.bias || '').toLowerCase();
    let bonus = 0;

    // Contrarian: prefer side with lower public percentage
    if (bias.includes('contrarian') || bias.includes('fade')) {
      if (cand.market === 'spread' && fb.bettingContext?.bettingTrends?.spread) {
        const trends = fb.bettingContext.bettingTrends.spread;
        const favPct = cand.selection === 'home' ? (trends.home || 50) : (trends.away || 50);
        const oppPct = cand.selection === 'home' ? (trends.away || 50) : (trends.home || 50);
        if (favPct < oppPct) bonus += Math.min((oppPct - favPct) * 0.1, 8);
      }
      if (cand.market === 'moneyline' && fb.bettingContext?.bettingTrends?.moneyline) {
        const trends = fb.bettingContext.bettingTrends.moneyline;
        const favPct = cand.selection === 'home' ? (trends.home || 50) : (trends.away || 50);
        const oppPct = cand.selection === 'home' ? (trends.away || 50) : (trends.home || 50);
        if (favPct < oppPct) bonus += Math.min((oppPct - favPct) * 0.1, 6);
      }
      if (cand.market === 'total' && fb.bettingContext?.bettingTrends?.total) {
        const t = fb.bettingContext.bettingTrends.total;
        const favPct = cand.selection === 'over' ? (t.over || 50) : (t.under || 50);
        const oppPct = cand.selection === 'over' ? (t.under || 50) : (t.over || 50);
        if (favPct < oppPct) bonus += Math.min((oppPct - favPct) * 0.1, 6);
      }
    }

    // Overs/Unders bias (stronger weighting and light counter-penalty)
    if (bias.includes('over') || bias.includes('high-scoring')) {
      if (cand.market === 'total') {
        bonus += cand.selection === 'over' ? 8 : -3;
      }
    }
    if (bias.includes('under') || bias.includes('defense')) {
      if (cand.market === 'total') {
        bonus += cand.selection === 'under' ? 8 : -3;
      }
    }

    // Line play / discipline bias → prefer spreads (ATS) over moneyline
    if (bias.includes('line') || bias.includes('trenches') || bias.includes('discipline')) {
      if (cand.market === 'spread') bonus += 6;
      if (cand.market === 'moneyline') bonus -= 2;
    }

    // Favorites/underdogs
    const awaySpread = fb.bettingContext?.currentLine?.spread || 0; // away line sign indicates favorite
    if (bias.includes('favorite') || bias.includes('favorites')) {
      if (cand.market === 'moneyline') {
        const favSide = awaySpread < 0 ? 'away' : 'home';
        if (cand.selection === favSide) bonus += 4;
      }
    }
    if (bias.includes('underdog') || bias.includes('dogs')) {
      if (cand.market === 'moneyline') {
        const dogSide = awaySpread < 0 ? 'home' : 'away';
        if (cand.selection === dogSide) bonus += 4;
      }
    }

    // Penalize heavy ML chalk to avoid low-EV picks unless persona explicitly prefers favorites
    if (cand.market === 'moneyline' && !bias.includes('favorite')) {
      const ml = fb.bettingContext?.lineMovement?.moneyline;
      const chosen = cand.selection === 'home' ? ml?.home : ml?.away;
      const currentPrice = chosen?.current;
      if (typeof currentPrice === 'number' && currentPrice < -200) {
        // Scale penalty with severity beyond -200, capped
        const excess = Math.abs(currentPrice) - 200;
        bonus -= Math.min(excess * 0.02, 8); // up to -8
      }
      // Baseline de-preference of ML vs ATS unless persona leans favorites/underdogs explicitly
      bonus -= 2;
    }

    return bonus;
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

  private candidateToPick(
    cand: { gameId: string; market: 'spread'|'total'|'moneyline'; selection: any; baseScore: number; adjustedScore: number; reasons: string[] },
    games: GameData[],
    analyst: Persona
  ): UIPick {
    const game = games.find(g => g.id === cand.gameId)!;
    const away = game.away.abbr;
    const home = game.home.abbr;

    // Build marketData in UI schema
    const marketData: UIPick['marketData'] = {
      spread: game.odds?.spread ? {
        away: { line: game.odds.spread.away.line, odds: game.odds.spread.away.odds },
        home: { line: game.odds.spread.home.line, odds: game.odds.spread.home.odds }
      } : undefined as any,
      total: game.odds?.total ? {
        over: { line: game.odds.total.over.line, odds: game.odds.total.over.odds },
        under: { line: game.odds.total.under.line, odds: game.odds.total.under.odds }
      } : undefined as any,
      moneyline: game.odds?.moneyline ? {
        away: { odds: game.odds.moneyline.away.odds },
        home: { odds: game.odds.moneyline.home.odds }
      } : undefined as any
    } as UIPick['marketData'];

    // Selection mapping
    let selLine = 0;
    let selOdds = 0;
    if (cand.market === 'spread' && marketData.spread) {
      if (cand.selection === 'away') { selLine = marketData.spread.away.line; selOdds = marketData.spread.away.odds; }
      else { selLine = marketData.spread.home.line; selOdds = marketData.spread.home.odds; }
    } else if (cand.market === 'total' && marketData.total) {
      if (cand.selection === 'over') { selLine = marketData.total.over.line; selOdds = marketData.total.over.odds; }
      else { selLine = marketData.total.under.line; selOdds = marketData.total.under.odds; }
    } else if (cand.market === 'moneyline' && marketData.moneyline) {
      selLine = 0; selOdds = cand.selection === 'away' ? marketData.moneyline.away.odds : marketData.moneyline.home.odds;
    }

    const cueStrings = cand.reasons;
    // Build a concise, human-readable rationale summary for UI (will later be replaced by ChatGPT narrative)
    const rationaleSummary = (() => {
      if (cand.market === 'spread') {
        const sideText = cand.selection === 'away' ? `${away}` : `${home}`;
        return `ATS lean: ${sideText} ${selLine > 0 ? '+' : ''}${selLine} at ${selOdds > 0 ? '+' : ''}${selOdds}. ${cueStrings[0]}`;
      }
      if (cand.market === 'total') {
        return `Total lean: ${cand.selection.toUpperCase()} ${selLine} at ${selOdds > 0 ? '+' : ''}${selOdds}. ${cueStrings[0]}`;
      }
      // moneyline
      const sideText = cand.selection === 'away' ? `${away}` : `${home}`;
      return `Moneyline lean: ${sideText} at ${selOdds > 0 ? '+' : ''}${selOdds}. ${cueStrings[0]}`;
    })();

    const uiPick: UIPick = {
      gameId: game.id,
      gameDate: game.kickoffEt,
      awayTeam: { id: game.away.abbr, name: game.away.name, nickname: game.away.nickname, score: null },
      homeTeam: { id: game.home.abbr, name: game.home.name, nickname: game.home.nickname, score: null },
      marketData: marketData as UIPick['marketData'],
      selection: {
        betType: cand.market,
        side: cand.selection,
        line: selLine,
        odds: selOdds,
        units: 1,
        rationale: rationaleSummary,
        rationaleCues: cueStrings
      },
      result: {
        status: 'pending',
        finalLine: selLine,
        finalOdds: selOdds,
        payout: 0,
        netUnits: 0
      },
      analystId: analyst.id
    };

    return uiPick;
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
