import { GameFactbook } from '../types/factbook';
import { factbookLoader } from './factbookLoader';

// Example of how to use factbook data for pick selection
export class PickSelectionExample {
  
  // Example: Coach Dan Miller's pick selection logic
  static async selectCoachPick(gameId: string, week: number): Promise<{
    betType: 'spread' | 'total' | 'moneyline';
    side: 'away' | 'home' | 'over' | 'under';
    line: number;
    odds: number;
    rationale: string;
  } | null> {
    
    const factbook = await factbookLoader.loadGameFactbook(gameId, week);
    if (!factbook) return null;

    const { teams, venue, bettingContext } = factbook;
    const awayTeam = teams.away;
    const homeTeam = teams.home;

    // Coach Dan's bias: Strong O-lines/D-lines and time-of-possession control
    const awayOffensiveLine = awayTeam.statistics.offense.yardsPerGame;
    const homeOffensiveLine = homeTeam.statistics.offense.yardsPerGame;
    const awayDefensiveLine = homeTeam.statistics.defense.yardsAllowed; // Defense vs Away
    const homeDefensiveLine = awayTeam.statistics.defense.yardsAllowed; // Defense vs Home

    // Calculate line of scrimmage advantage
    const awayLineAdvantage = awayOffensiveLine - homeDefensiveLine;
    const homeLineAdvantage = homeOffensiveLine - awayDefensiveLine;

    // Coach Dan's decision logic
    if (Math.abs(awayLineAdvantage) > Math.abs(homeLineAdvantage)) {
      // Away team has better line play
      if (awayLineAdvantage > 0) {
        return {
          betType: 'spread',
          side: 'away',
          line: bettingContext.currentLine.spread || 0,
          odds: -110,
          rationale: `The ${awayTeam.abbreviation} have a significant advantage in the trenches. Their offensive line is averaging ${awayOffensiveLine} yards per game while the ${homeTeam.abbreviation} defense is allowing ${homeDefensiveLine} yards. Games are won in the trenches, and this line play advantage should allow them to control the clock and cover the spread.`
        };
      }
    } else {
      // Home team has better line play
      if (homeLineAdvantage > 0) {
        return {
          betType: 'spread',
          side: 'home',
          line: bettingContext.currentLine.spread || 0,
          odds: -110,
          rationale: `The ${homeTeam.abbreviation} have the edge in the trenches. Their offensive line is averaging ${homeOffensiveLine} yards per game while the ${awayTeam.abbreviation} defense is allowing ${awayDefensiveLine} yards. Time of possession and line of scrimmage control will be the difference in this game.`
        };
      }
    }

    // Fallback to moneyline if line play is even
    const awayRecord = awayTeam.record.winPercentage;
    const homeRecord = homeTeam.record.winPercentage;
    
    if (awayRecord > homeRecord) {
      return {
        betType: 'moneyline',
        side: 'away',
        line: bettingContext.currentLine.moneyline?.away || 120,
        odds: bettingContext.currentLine.moneyline?.away || 120,
        rationale: `The ${awayTeam.abbreviation} have a better record (${Math.round(awayRecord * 100)}% vs ${Math.round(homeRecord * 100)}%) and should be able to execute the fundamentals better. In a close game, give me the team with the better record.`
      };
    }

    return null;
  }

  // Example: Podcaster Trent Walker's pick selection logic
  static async selectPodcasterPick(gameId: string, week: number): Promise<{
    betType: 'spread' | 'total' | 'moneyline';
    side: 'away' | 'home' | 'over' | 'under';
    line: number;
    odds: number;
    rationale: string;
  } | null> {
    
    const factbook = await factbookLoader.loadGameFactbook(gameId, week);
    if (!factbook) return null;

    const { teams, venue, bettingContext } = factbook;
    const awayTeam = teams.away;
    const homeTeam = teams.home;

    // Trent's bias: High-energy, emotional analysis, loves shootouts
    const awayOffense = awayTeam.statistics.offense.pointsPerGame;
    const homeOffense = homeTeam.statistics.offense.pointsPerGame;
    const awayDefense = awayTeam.statistics.defense.pointsAllowed;
    const homeDefense = homeTeam.statistics.defense.pointsAllowed;

    // Calculate offensive firepower
    const totalOffense = awayOffense + homeOffense;
    const totalDefense = awayDefense + homeDefense;
    const offensiveAdvantage = totalOffense - totalDefense;

    // Trent loves the over when both teams can score
    if (totalOffense > 50 && offensiveAdvantage > 0) {
      return {
        betType: 'total',
        side: 'over',
        line: bettingContext.currentLine.total || 48.5,
        odds: -110,
        rationale: `LISTEN, this is going to be a SHOOTOUT! The ${awayTeam.abbreviation} are putting up ${awayOffense} points per game and the ${homeTeam.abbreviation} are scoring ${homeOffense} points per game. Both defenses are giving up points - this total is way too low for what we're about to see. OVER ${bettingContext.currentLine.total || 48.5} all day!`
      };
    }

    // If not a shootout, look for the underdog with value
    const spread = bettingContext.currentLine.spread || 0;
    if (Math.abs(spread) > 3) {
      const underdog = spread > 0 ? 'away' : 'home';
      const underdogTeam = underdog === 'away' ? awayTeam : homeTeam;
      
      return {
        betType: 'spread',
        side: underdog,
        line: Math.abs(spread),
        odds: -110,
        rationale: `The ${underdogTeam.abbreviation} are getting ${Math.abs(spread)} points and that's just too many! This is a classic case where the underdog can keep it close. The public is all over the favorite, but I'm calling out the BS - take the points!`
      };
    }

    return null;
  }

  // Example: Nerd's pick selection logic
  static async selectNerdPick(gameId: string, week: number): Promise<{
    betType: 'spread' | 'total' | 'moneyline';
    side: 'away' | 'home' | 'over' | 'under';
    line: number;
    odds: number;
    rationale: string;
  } | null> {
    
    const factbook = await factbookLoader.loadGameFactbook(gameId, week);
    if (!factbook) return null;

    const { teams, venue, bettingContext, trends } = factbook;
    const awayTeam = teams.away;
    const homeTeam = teams.home;

    // Nerd's bias: Statistical analysis, historical data, weather factors
    const awayRecord = awayTeam.record.winPercentage;
    const homeRecord = homeTeam.record.winPercentage;
    const awayOffense = awayTeam.statistics.offense.pointsPerGame;
    const homeOffense = homeTeam.statistics.offense.pointsPerGame;
    const awayDefense = awayTeam.statistics.defense.pointsAllowed;
    const homeDefense = homeTeam.statistics.defense.pointsAllowed;

    // Calculate expected total based on offensive and defensive averages
    const expectedTotal = (awayOffense + homeOffense + awayDefense + homeDefense) / 2;
    const currentTotal = bettingContext.currentLine.total || 48.5;

    // Statistical edge on total
    if (Math.abs(expectedTotal - currentTotal) > 3) {
      const side = expectedTotal > currentTotal ? 'over' : 'under';
      return {
        betType: 'total',
        side,
        line: currentTotal,
        odds: -110,
        rationale: `Statistical analysis shows an expected total of ${expectedTotal.toFixed(1)} points based on offensive and defensive averages. The current line of ${currentTotal} represents a ${Math.abs(expectedTotal - currentTotal).toFixed(1)} point edge. Historical data from similar matchups supports this ${side} play.`
      };
    }

    // Look for record-based value
    const recordDifference = Math.abs(awayRecord - homeRecord);
    if (recordDifference > 0.2) {
      const betterTeam = awayRecord > homeRecord ? 'away' : 'home';
      const betterTeamData = betterTeam === 'away' ? awayTeam : homeTeam;
      
      return {
        betType: 'moneyline',
        side: betterTeam,
        line: bettingContext.currentLine.moneyline?.[betterTeam] || 120,
        odds: bettingContext.currentLine.moneyline?.[betterTeam] || 120,
        rationale: `The ${betterTeamData.abbreviation} have a significantly better record (${Math.round(betterTeamData.record.winPercentage * 100)}% vs ${Math.round((betterTeam === 'away' ? homeTeam : awayTeam).record.winPercentage * 100)}%). Statistical analysis shows a ${Math.round(recordDifference * 100)}% win probability difference, providing value on the moneyline.`
      };
    }

    return null;
  }
}

// Example usage function
export async function generatePicksForWeek(week: number) {
  const factbooks = await factbookLoader.loadAllFactbooksForWeek(week);
  
  const picks = [];
  for (const [gameId, factbook] of factbooks) {
    console.log(`\nGenerating picks for ${factbook.teams.away.abbreviation} @ ${factbook.teams.home.abbreviation}...`);
    
    // Generate picks for each analyst
    const coachPick = await PickSelectionExample.selectCoachPick(gameId, week);
    const podcasterPick = await PickSelectionExample.selectPodcasterPick(gameId, week);
    const nerdPick = await PickSelectionExample.selectNerdPick(gameId, week);
    
    if (coachPick) {
      console.log(`Coach: ${coachPick.betType} ${coachPick.side} ${coachPick.line} (${coachPick.odds})`);
      console.log(`Rationale: ${coachPick.rationale}`);
    }
    
    if (podcasterPick) {
      console.log(`Podcaster: ${podcasterPick.betType} ${podcasterPick.side} ${podcasterPick.line} (${podcasterPick.odds})`);
      console.log(`Rationale: ${podcasterPick.rationale}`);
    }
    
    if (nerdPick) {
      console.log(`Nerd: ${nerdPick.betType} ${nerdPick.side} ${nerdPick.line} (${nerdPick.odds})`);
      console.log(`Rationale: ${nerdPick.rationale}`);
    }
    
    picks.push({ gameId, coachPick, podcasterPick, nerdPick });
  }
  
  return picks;
}
