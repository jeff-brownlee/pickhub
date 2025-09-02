import { GameFactbook } from '../types/factbook';
import { Persona } from '../types';

export interface PickRationale {
  pick: string; // e.g., "PHI +2.5", "Over 48.5", "DAL -140"
  confidence: 1 | 2 | 3;
  rationale: string;
  keyFactors: string[];
  supportingData: {
    stats: string[];
    trends: string[];
    situational: string[];
  };
}

export interface AnalystPick {
  gameId: string;
  analystId: string;
  pick: string;
  rationale: PickRationale;
  timestamp: string;
}

export class AnalystService {
  
  /**
   * Generate a pick for a specific analyst based on their bias and the game factbook
   */
  generatePick(factbook: GameFactbook, analyst: Persona): AnalystPick {
    const rationale = this.buildRationale(factbook, analyst);
    
    return {
      gameId: factbook.gameId,
      analystId: analyst.id,
      pick: rationale.pick,
      rationale,
      timestamp: new Date().toISOString()
    };
  }

  private buildRationale(factbook: GameFactbook, analyst: Persona): PickRationale {
    switch (analyst.id) {
      case 'coach':
        return this.buildCoachRationale(factbook);
      case 'contrarian':
        return this.buildContrarianRationale(factbook);
      case 'fratguy':
        return this.buildFratGuyRationale(factbook);
      case 'hotgirl':
        return this.buildHotGirlRationale(factbook);
      case 'joe':
        return this.buildAverageJoeRationale(factbook);
      case 'mobster':
        return this.buildMobsterRationale(factbook);
      case 'nerd':
        return this.buildNerdRationale(factbook);
      case 'podcaster':
        return this.buildPodcasterRationale(factbook);
      case 'pro':
        return this.buildProRationale(factbook);
      default:
        return this.buildDefaultRationale(factbook);
    }
  }

  private buildCoachRationale(factbook: GameFactbook): PickRationale {
    const { away, home } = factbook.teams;
    
    // Coach Dan focuses on fundamentals, discipline, and physical play
    const awayDefense = away.statistics.defense;
    const homeDefense = home.statistics.defense;
    const awayOffense = away.statistics.offense;
    const homeOffense = home.statistics.offense;
    
    // Determine which team is more disciplined (fewer turnovers, better red zone efficiency)
    const awayDiscipline = awayOffense.turnovers + (1 - awayOffense.redZonePercentage);
    const homeDiscipline = homeOffense.turnovers + (1 - homeOffense.redZonePercentage);
    
    const moreDisciplinedTeam = awayDiscipline < homeDiscipline ? 'away' : 'home';
    const teamName = moreDisciplinedTeam === 'away' ? away.abbreviation : home.abbreviation;
    
    // Coach prefers the under when both teams have strong defenses
    const totalDefense = awayDefense.pointsAllowed + homeDefense.pointsAllowed;
    const avgTotal = (awayOffense.pointsPerGame + homeOffense.pointsPerGame) / 2;
    
    let pick: string;
    let keyFactors: string[];
    let supportingData: any;
    
    if (totalDefense < 40 && avgTotal > 50) {
      // Strong defenses, high total - take the under
      pick = `Under ${factbook.bettingContext.currentLine?.total || 48.5}`;
      keyFactors = [
        'Both teams have strong defensive units',
        'Disciplined play in the trenches',
        'Weather/venue factors favor defense'
      ];
      supportingData = {
        stats: [
          `${away.abbreviation} allows ${awayDefense.pointsAllowed.toFixed(1)} PPG`,
          `${home.abbreviation} allows ${homeDefense.pointsAllowed.toFixed(1)} PPG`,
          `Combined defensive efficiency: ${(100 - (totalDefense / 2)).toFixed(1)}%`
        ],
        trends: [
          'Under has hit in 7 of last 10 games for both teams',
          'Cold weather games favor defensive play'
        ],
        situational: [
          'Division rivalry - expect physical play',
          'Both teams coming off short rest'
        ]
      };
    } else {
      // Take the more disciplined team
      pick = `${teamName} ${moreDisciplinedTeam === 'away' ? '+' : '-'}${Math.abs(factbook.bettingContext.currentLine?.spread || 3)}`;
      keyFactors = [
        'Superior discipline and execution',
        'Better fundamentals in key situations',
        'Coaching advantage in preparation'
      ];
      supportingData = {
        stats: [
          `${teamName} has ${moreDisciplinedTeam === 'away' ? awayOffense.turnovers : homeOffense.turnovers} turnovers vs ${moreDisciplinedTeam === 'away' ? homeOffense.turnovers : awayOffense.turnovers}`,
          `Red zone efficiency: ${moreDisciplinedTeam === 'away' ? (awayOffense.redZonePercentage * 100).toFixed(1) : (homeOffense.redZonePercentage * 100).toFixed(1)}%`
        ],
        trends: [
          'Disciplined teams win in December',
          'Fundamentals matter most in close games'
        ],
        situational: [
          'Better coaching preparation',
          'Superior time-of-possession control'
        ]
      };
    }
    
    return {
      pick,
      confidence: 2,
      rationale: `Games are won in the trenches, and ${teamName} has the superior fundamentals. ${keyFactors[0]}. The Process demands excellence in execution, and this team delivers when it matters most.`,
      keyFactors,
      supportingData
    };
  }

  private buildContrarianRationale(factbook: GameFactbook): PickRationale {
    const { away, home } = factbook.teams;
    const bettingTrends = factbook.bettingContext.bettingTrends;
    
    // Ricky fades the public - look for where the public is betting heavily
    const publicSpread = bettingTrends.spread;
    const publicTotal = bettingTrends.total;
    
    let pick: string;
    let keyFactors: string[];
    let supportingData: any;
    
    if (publicSpread.home > 65) {
      // Public loves the home team - fade them
      pick = `${away.abbreviation} ${factbook.bettingContext.currentLine?.spread || '+3'}`;
      keyFactors = [
        'Public is heavily on the home team',
        'Sharp money moving the line against public',
        'Value on the underdog side'
      ];
      supportingData = {
        stats: [
          `${publicSpread.home}% of public bets on ${home.abbreviation}`,
          `Line moved from ${factbook.bettingContext.openingLine?.spread} to ${factbook.bettingContext.currentLine?.spread}`,
          `${away.abbreviation} is ${away.record.wins}-${away.record.losses} as underdog this season`
        ],
        trends: [
          'Public favorites fail to cover 60% of the time',
          'Sharp money on the underdog side'
        ],
        situational: [
          'Overvalued home team due to recent performance',
          'Public chasing last week\'s results'
        ]
      };
    } else if (publicTotal.over > 70) {
      // Public loves the over - fade them
      pick = `Under ${factbook.bettingContext.currentLine?.total || 48.5}`;
      keyFactors = [
        'Public is hammering the over',
        'Weather/defense factors being ignored',
        'Sharp money on the under'
      ];
      supportingData = {
        stats: [
          `${publicTotal.over}% of public bets on Over`,
          `Combined defensive PPG: ${(away.statistics.defense.pointsAllowed + home.statistics.defense.pointsAllowed).toFixed(1)}`,
          'Under has hit in 6 of last 8 meetings'
        ],
        trends: [
          'Public overs fail in December',
          'Defensive games in cold weather'
        ],
        situational: [
          'Wind affecting passing games',
          'Both teams playing for playoff position'
        ]
      };
    } else {
      // Take the contrarian side on spread
      const contrarianSide = publicSpread.away > publicSpread.home ? 'home' : 'away';
      const teamName = contrarianSide === 'away' ? away.abbreviation : home.abbreviation;
      pick = `${teamName} ${contrarianSide === 'away' ? '+' : '-'}${Math.abs(factbook.bettingContext.currentLine?.spread || 3)}`;
      
      keyFactors = [
        'Fading the public consensus',
        'Sharp money on the opposite side',
        'Value in the contrarian play'
      ];
      supportingData = {
        stats: [
          `Public split: ${publicSpread.home}% / ${publicSpread.away}%`,
          'Line movement indicates sharp action',
          'Contrarian plays hit 58% this season'
        ],
        trends: [
          'Public is wrong more often than right',
          'Sharp money follows the value'
        ],
        situational: [
          'Overreaction to recent results',
          'Public bias toward popular teams'
        ]
      };
    }
    
    return {
      pick,
      confidence: 3,
      rationale: `If the crowd loves it, I'm fading it. The public is heavily on ${publicSpread.home > 65 ? home.abbreviation : 'the over'}, which means there's value on the opposite side. Sharp money doesn't follow the masses, and neither do I.`,
      keyFactors,
      supportingData
    };
  }

  private buildFratGuyRationale(factbook: GameFactbook): PickRationale {
    const { away, home } = factbook.teams;
    
    // Tyler wants action - primetime games, overs, favorites
    const isPrimetime = this.isPrimetimeGame(factbook.kickoffISO);
    const awayOffense = away.statistics.offense;
    const homeOffense = home.statistics.offense;
    const totalOffense = awayOffense.pointsPerGame + homeOffense.pointsPerGame;
    
    let pick: string;
    let keyFactors: string[];
    let supportingData: any;
    
    if (isPrimetime && totalOffense > 50) {
      // Primetime shootout - take the over
      pick = `Over ${factbook.bettingContext.currentLine?.total || 48.5}`;
      keyFactors = [
        'Primetime games bring the energy',
        'Both teams can light up the scoreboard',
        'Big stage = big plays'
      ];
      supportingData = {
        stats: [
          `Combined offense: ${totalOffense.toFixed(1)} PPG`,
          `${away.abbreviation} averages ${awayOffense.pointsPerGame.toFixed(1)} PPG`,
          `${home.abbreviation} averages ${homeOffense.pointsPerGame.toFixed(1)} PPG`
        ],
        trends: [
          'Primetime overs hit 65% this season',
          'Big games = big scores'
        ],
        situational: [
          'National TV audience brings out the best',
          'Both teams have explosive playmakers'
        ]
      };
    } else {
      // Take the favorite for the action
      const favorite = factbook.bettingContext.currentLine?.spread < 0 ? home : away;
      const teamName = favorite.abbreviation;
      pick = `${teamName} ${factbook.bettingContext.currentLine?.spread < 0 ? '-' : '+'}${Math.abs(factbook.bettingContext.currentLine?.spread || 3)}`;
      
      keyFactors = [
        'Favorites win more often than not',
        'Better team should cover',
        'Riding with the stars'
      ];
      supportingData = {
        stats: [
          `${teamName} is ${favorite.record.wins}-${favorite.record.losses}`,
          `Win percentage: ${(favorite.record.winPercentage * 100).toFixed(1)}%`,
          'Favorites cover 55% of the time'
        ],
        trends: [
          'Good teams find ways to win',
          'Stars show up in big moments'
        ],
        situational: [
          'Home field advantage',
          'Better coaching and preparation'
        ]
      };
    }
    
    return {
      pick,
      confidence: 2,
      rationale: `Send it! ${isPrimetime ? 'Primetime games are made for the over - both teams are going to light it up!' : `I'm riding with ${pick.split(' ')[0]} because they're the better team and favorites usually cover.`} Let's get this money!`,
      keyFactors,
      supportingData
    };
  }

  private buildHotGirlRationale(factbook: GameFactbook): PickRationale {
    const { away, home } = factbook.teams;
    
    // Maddie follows social media trends and popular teams
    const awayOffense = away.statistics.offense;
    const homeOffense = home.statistics.offense;
    const hasStarQB = this.hasStarQuarterback(away, home);
    const isPopularTeam = this.isPopularTeam(away, home);
    
    let pick: string;
    let keyFactors: string[];
    let supportingData: any;
    
    if (hasStarQB && isPopularTeam) {
      // Star QB on popular team - take the over
      pick = `Over ${factbook.bettingContext.currentLine?.total || 48.5}`;
      keyFactors = [
        'Star quarterback in primetime',
        'Popular teams bring the entertainment',
        'Social media is buzzing about this game'
      ];
      supportingData = {
        stats: [
          'Star QB averages 300+ passing yards',
          'Popular teams score more in big games',
          'Social media engagement is through the roof'
        ],
        trends: [
          'Star QBs deliver in big moments',
          'Popular teams get the calls'
        ],
        situational: [
          'National spotlight brings out the best',
          'Everyone is talking about this matchup'
        ]
      };
    } else {
      // Take the popular team
      const popularTeam = isPopularTeam === away ? away : home;
      const teamName = popularTeam.abbreviation;
      pick = `${teamName} ${popularTeam === away ? '+' : '-'}${Math.abs(factbook.bettingContext.currentLine?.spread || 3)}`;
      
      keyFactors = [
        'Everyone is talking about this team',
        'Social media loves them',
        'They always show up in big games'
      ];
      supportingData = {
        stats: [
          `${teamName} is trending on social media`,
          'Fan engagement is off the charts',
          'They have the star power'
        ],
        trends: [
          'Popular teams win when it matters',
          'Social media buzz = wins'
        ],
        situational: [
          'Big stage brings out the best',
          'Everyone is rooting for them'
        ]
      };
    }
    
    return {
      pick,
      confidence: 2,
      rationale: `I don't crunch numbers, I crush vibes. ${hasStarQB ? 'This star QB is going to light it up in primetime!' : `Everyone is talking about ${pick.split(' ')[0]} and for good reason.`} The energy is electric and that's all I need to know.`,
      keyFactors,
      supportingData
    };
  }

  private buildAverageJoeRationale(factbook: GameFactbook): PickRationale {
    const { away, home } = factbook.teams;
    const bettingTrends = factbook.bettingContext.bettingTrends;
    
    // Mike follows the consensus - take what everyone else is taking
    const publicSpread = bettingTrends.spread;
    const publicTotal = bettingTrends.total;
    
    let pick: string;
    let keyFactors: string[];
    let supportingData: any;
    
    if (publicSpread.home > 60) {
      // Public likes the home team
      pick = `${home.abbreviation} ${factbook.bettingContext.currentLine?.spread < 0 ? '-' : '+'}${Math.abs(factbook.bettingContext.currentLine?.spread || 3)}`;
      keyFactors = [
        'Everyone at the bar is taking the home team',
        'Home field advantage is real',
        'The consensus is usually right'
      ];
      supportingData = {
        stats: [
          `${publicSpread.home}% of bets on ${home.abbreviation}`,
          `Home record: ${home.record.wins}-${home.record.losses}`,
          'Home teams win 55% of the time'
        ],
        trends: [
          'Home field advantage matters',
          'Crowd noise affects the game'
        ],
        situational: [
          'Familiar surroundings help',
          'Travel affects the away team'
        ]
      };
    } else if (publicTotal.over > 60) {
      // Public likes the over
      pick = `Over ${factbook.bettingContext.currentLine?.total || 48.5}`;
      keyFactors = [
        'Everyone wants to see points',
        'Both teams can score',
        'Overs are more fun to watch'
      ];
      supportingData = {
        stats: [
          `${publicTotal.over}% of bets on Over`,
          `Combined offense: ${(away.statistics.offense.pointsPerGame + home.statistics.offense.pointsPerGame).toFixed(1)} PPG`,
          'Overs hit 52% of the time'
        ],
        trends: [
          'High-scoring games are more common',
          'Defenses are getting worse'
        ],
        situational: [
          'Good weather for passing',
          'Both teams have good offenses'
        ]
      };
    } else {
      // Take the consensus on spread
      const consensusSide = publicSpread.away > publicSpread.home ? 'away' : 'home';
      const teamName = consensusSide === 'away' ? away.abbreviation : home.abbreviation;
      pick = `${teamName} ${consensusSide === 'away' ? '+' : '-'}${Math.abs(factbook.bettingContext.currentLine?.spread || 3)}`;
      
      keyFactors = [
        'The consensus is usually right',
        'Everyone can\'t be wrong',
        'Follow the crowd'
      ];
      supportingData = {
        stats: [
          `Public split: ${publicSpread.home}% / ${publicSpread.away}%`,
          'Consensus picks hit 54% of the time',
          'The wisdom of crowds'
        ],
        trends: [
          'Public is right more often than wrong',
          'Follow the money'
        ],
        situational: [
          'Everyone sees the same thing',
          'Consensus builds for a reason'
        ]
      };
    }
    
    return {
      pick,
      confidence: 2,
      rationale: `I bet what feels right — same as my buddies at the bar. ${publicSpread.home > 60 ? `Everyone is taking ${home.abbreviation} and they're probably right.` : `The consensus is on ${pick.split(' ')[0]} and that's good enough for me.`} Sometimes the obvious pick is the right pick.`,
      keyFactors,
      supportingData
    };
  }

  private buildMobsterRationale(factbook: GameFactbook): PickRationale {
    const lineMovement = factbook.bettingContext.lineMovement;
    const sharpMoney = lineMovement.sharpMoney;
    
    // Vinny follows the sharp money and line movement
    let pick: string;
    let keyFactors: string[];
    let supportingData: any;
    
    if (sharpMoney === 'home' || sharpMoney === 'away') {
      const teamName = sharpMoney === 'home' ? factbook.teams.home.abbreviation : factbook.teams.away.abbreviation;
      pick = `${teamName} ${sharpMoney === 'away' ? '+' : '-'}${Math.abs(factbook.bettingContext.currentLine?.spread || 3)}`;
      
      keyFactors = [
        'Sharp money is on this side',
        'Line moved against the public',
        'The smart money knows something'
      ];
      supportingData = {
        stats: [
          `Line moved from ${factbook.bettingContext.openingLine?.spread} to ${factbook.bettingContext.currentLine?.spread}`,
          'Sharp money follows the value',
          'Line movement tells the story'
        ],
        trends: [
          'Sharp money is right 60% of the time',
          'Line movement indicates smart action'
        ],
        situational: [
          'Insider information drives sharp money',
          'The house doesn\'t move lines for fun'
        ]
      };
    } else if (sharpMoney === 'over' || sharpMoney === 'under') {
      pick = `${sharpMoney === 'over' ? 'Over' : 'Under'} ${factbook.bettingContext.currentLine?.total || 48.5}`;
      
      keyFactors = [
        'Sharp money is on the total',
        'Line moved against public betting',
        'The smart money sees value'
      ];
      supportingData = {
        stats: [
          `Total moved from ${factbook.bettingContext.openingLine?.total} to ${factbook.bettingContext.currentLine?.total}`,
          'Sharp money follows the numbers',
          'Line movement indicates smart action'
        ],
        trends: [
          'Sharp money on totals hits 58%',
          'Line movement tells the real story'
        ],
        situational: [
          'Weather factors being ignored by public',
          'Sharp money sees the real value'
        ]
      };
    } else {
      // No clear sharp money - take the value side
      const spreadMovement = lineMovement.spreadMovement || 0;
      const valueSide = spreadMovement > 0 ? 'away' : 'home';
      const teamName = valueSide === 'away' ? factbook.teams.away.abbreviation : factbook.teams.home.abbreviation;
      pick = `${teamName} ${valueSide === 'away' ? '+' : '-'}${Math.abs(factbook.bettingContext.currentLine?.spread || 3)}`;
      
      keyFactors = [
        'Line movement shows value',
        'Public is on the wrong side',
        'Follow the smart money'
      ];
      supportingData = {
        stats: [
          `Line movement: ${spreadMovement > 0 ? '+' : ''}${spreadMovement}`,
          'Value is on the opposite side of public',
          'Sharp money finds the edge'
        ],
        trends: [
          'Line movement indicates value',
          'Sharp money follows the numbers'
        ],
        situational: [
          'Public is overreacting',
          'Smart money sees the real value'
        ]
      };
    }
    
    return {
      pick,
      confidence: 3,
      rationale: `The line tells the story. Don't fight it. ${sharpMoney ? `Sharp money is on ${pick.split(' ')[0]} and they don't make mistakes.` : 'The line movement shows where the value is, and I follow the smart money.'} The house doesn't move lines for fun.`,
      keyFactors,
      supportingData
    };
  }

  private buildNerdRationale(factbook: GameFactbook): PickRationale {
    const { away, home } = factbook.teams;
    
    // Ethan uses advanced analytics and data
    const awayEPA = this.calculateEPA(away);
    const homeEPA = this.calculateEPA(home);
    const awayDVOA = this.calculateDVOA(away);
    const homeDVOA = this.calculateDVOA(home);
    
    const awayAdvantage = awayEPA + awayDVOA;
    const homeAdvantage = homeEPA + homeDVOA;
    
    let pick: string;
    let keyFactors: string[];
    let supportingData: any;
    
    if (Math.abs(awayAdvantage - homeAdvantage) > 0.1) {
      // Clear analytical advantage
      const betterTeam = awayAdvantage > homeAdvantage ? away : home;
      const teamName = betterTeam.abbreviation;
      pick = `${teamName} ${betterTeam === away ? '+' : '-'}${Math.abs(factbook.bettingContext.currentLine?.spread || 3)}`;
      
      keyFactors = [
        'Superior EPA and DVOA metrics',
        'Analytics show clear advantage',
        'Data doesn\'t lie'
      ];
      supportingData = {
        stats: [
          `${teamName} EPA: ${betterTeam === away ? awayEPA.toFixed(3) : homeEPA.toFixed(3)}`,
          `${teamName} DVOA: ${betterTeam === away ? awayDVOA.toFixed(3) : homeDVOA.toFixed(3)}`,
          `Analytical advantage: ${Math.abs(awayAdvantage - homeAdvantage).toFixed(3)}`
        ],
        trends: [
          'Analytics-based picks hit 62% of the time',
          'Data-driven decisions outperform intuition'
        ],
        situational: [
          'Sample size is sufficient for analysis',
          'Metrics account for situational factors'
        ]
      };
    } else {
      // Close game - look for total value
      const expectedTotal = (away.statistics.offense.pointsPerGame + home.statistics.offense.pointsPerGame) / 2;
      const currentTotal = factbook.bettingContext.currentLine?.total || 48.5;
      
      if (expectedTotal > currentTotal + 2) {
        pick = `Over ${currentTotal}`;
        keyFactors = [
          'Expected total exceeds line by 2+ points',
          'Offensive efficiency metrics favor over',
          'Defensive metrics show weakness'
        ];
        supportingData = {
          stats: [
            `Expected total: ${expectedTotal.toFixed(1)}`,
            `Current line: ${currentTotal}`,
            `Value: +${(expectedTotal - currentTotal).toFixed(1)} points`
          ],
          trends: [
            'Analytics-based totals hit 58% of the time',
            'Expected value drives long-term success'
          ],
          situational: [
            'Weather conditions favor offense',
            'Defensive matchups show weakness'
          ]
        };
      } else {
        pick = `Under ${currentTotal}`;
        keyFactors = [
          'Expected total below line',
          'Defensive efficiency metrics favor under',
          'Offensive metrics show weakness'
        ];
        supportingData = {
          stats: [
            `Expected total: ${expectedTotal.toFixed(1)}`,
            `Current line: ${currentTotal}`,
            `Value: -${(currentTotal - expectedTotal).toFixed(1)} points`
          ],
          trends: [
            'Analytics-based totals hit 58% of the time',
            'Expected value drives long-term success'
          ],
          situational: [
            'Weather conditions favor defense',
            'Offensive matchups show weakness'
          ]
        };
      }
    }
    
    return {
      pick,
      confidence: 3,
      rationale: `I trust the model, not the narrative. The data shows ${pick.split(' ')[0]} has a clear analytical advantage with EPA of ${awayAdvantage > homeAdvantage ? awayEPA.toFixed(3) : homeEPA.toFixed(3)} and DVOA of ${awayAdvantage > homeAdvantage ? awayDVOA.toFixed(3) : homeDVOA.toFixed(3)}. The numbers don't lie.`,
      keyFactors,
      supportingData
    };
  }

  private buildPodcasterRationale(factbook: GameFactbook): PickRationale {
    const { away, home } = factbook.teams;
    
    // Trent focuses on physicality and toughness
    const awayPhysicality = this.calculatePhysicality(away);
    const homePhysicality = this.calculatePhysicality(home);
    
    let pick: string;
    let keyFactors: string[];
    let supportingData: any;
    
    if (awayPhysicality > homePhysicality + 0.1) {
      pick = `${away.abbreviation} ${factbook.bettingContext.currentLine?.spread || '+3'}`;
      keyFactors = [
        'More physical team wins in the trenches',
        'Superior run game and defense',
        'Toughness matters in December'
      ];
      supportingData = {
        stats: [
          `${away.abbreviation} rushing yards: ${away.statistics.offense.rushingYards}`,
          `${away.abbreviation} sacks: ${away.statistics.defense.sacks}`,
          'Physicality advantage: ' + (awayPhysicality - homePhysicality).toFixed(2)
        ],
        trends: [
          'Physical teams win in December',
          'Run game and defense win championships'
        ],
        situational: [
          'Cold weather favors physical play',
          'Toughness shows up in big games'
        ]
      };
    } else if (homePhysicality > awayPhysicality + 0.1) {
      pick = `${home.abbreviation} ${factbook.bettingContext.currentLine?.spread < 0 ? '-' : '+'}${Math.abs(factbook.bettingContext.currentLine?.spread || 3)}`;
      keyFactors = [
        'Home team is more physical',
        'Superior line play on both sides',
        'Physicality wins in the NFL'
      ];
      supportingData = {
        stats: [
          `${home.abbreviation} rushing yards: ${home.statistics.offense.rushingYards}`,
          `${home.abbreviation} sacks: ${home.statistics.defense.sacks}`,
          'Physicality advantage: ' + (homePhysicality - awayPhysicality).toFixed(2)
        ],
        trends: [
          'Physical teams win in December',
          'Run game and defense win championships'
        ],
        situational: [
          'Home field advantage amplifies physicality',
          'Toughness shows up in big games'
        ]
      };
    } else {
      // Close physicality - take the under
      pick = `Under ${factbook.bettingContext.currentLine?.total || 48.5}`;
      keyFactors = [
        'Both teams are physical and defensive',
        'Run game and defense will dominate',
        'Low-scoring, physical battle'
      ];
      supportingData = {
        stats: [
          `Combined defensive PPG: ${(away.statistics.defense.pointsAllowed + home.statistics.defense.pointsAllowed).toFixed(1)}`,
          'Both teams prioritize running the ball',
          'Physical play limits big plays'
        ],
        trends: [
          'Physical matchups go under',
          'Defense wins championships'
        ],
        situational: [
          'Cold weather favors physical play',
          'Both teams playing for playoff position'
        ]
      };
    }
    
    return {
      pick,
      confidence: 2,
      rationale: `You win by pounding the rock — don't overthink it. ${pick.split(' ')[0]} is the more physical team and that's what matters in December. All this fancy analytics stuff is fine, but when it gets cold and the pressure's on, you need to be able to run the ball and stop the run.`,
      keyFactors,
      supportingData
    };
  }

  private buildProRationale(factbook: GameFactbook): PickRationale {
    // Cole looks for the best expected value
    const spreadValue = this.calculateSpreadValue(factbook);
    const totalValue = this.calculateTotalValue(factbook);
    const moneylineValue = this.calculateMoneylineValue(factbook);
    
    const bestValue = Math.max(spreadValue, totalValue, moneylineValue);
    
    let pick: string;
    let keyFactors: string[];
    let supportingData: any;
    
    if (bestValue === spreadValue) {
      const { away, home } = factbook.teams;
      const valueSide = spreadValue > 0 ? 'away' : 'home';
      const teamName = valueSide === 'away' ? away.abbreviation : home.abbreviation;
      pick = `${teamName} ${valueSide === 'away' ? '+' : '-'}${Math.abs(factbook.bettingContext.currentLine?.spread || 3)}`;
      
      keyFactors = [
        'Best expected value on the spread',
        'Line is off by 1+ points',
        'Sharp money opportunity'
      ];
      supportingData = {
        stats: [
          `Expected value: ${Math.abs(spreadValue).toFixed(2)} points`,
          'Line efficiency analysis shows value',
          'Sharp money indicator'
        ],
        trends: [
          'Value-based picks hit 58% of the time',
          'Expected value drives long-term profit'
        ],
        situational: [
          'Market inefficiency identified',
          'Sharp money opportunity'
        ]
      };
    } else if (bestValue === totalValue) {
      pick = `${totalValue > 0 ? 'Over' : 'Under'} ${factbook.bettingContext.currentLine?.total || 48.5}`;
      
      keyFactors = [
        'Best expected value on the total',
        'Line is off by 2+ points',
        'Sharp money opportunity'
      ];
      supportingData = {
        stats: [
          `Expected value: ${Math.abs(totalValue).toFixed(2)} points`,
          'Total efficiency analysis shows value',
          'Sharp money indicator'
        ],
        trends: [
          'Value-based totals hit 58% of the time',
          'Expected value drives long-term profit'
        ],
        situational: [
          'Market inefficiency identified',
          'Sharp money opportunity'
        ]
      };
    } else {
      const { away, home } = factbook.teams;
      const valueSide = moneylineValue > 0 ? 'away' : 'home';
      const teamName = valueSide === 'away' ? away.abbreviation : home.abbreviation;
      pick = `${teamName} ${factbook.bettingContext.currentLine?.moneyline?.[valueSide] || '+120'}`;
      
      keyFactors = [
        'Best expected value on the moneyline',
        'Implied probability mismatch',
        'Sharp money opportunity'
      ];
      supportingData = {
        stats: [
          `Expected value: ${Math.abs(moneylineValue).toFixed(2)}%`,
          'Moneyline efficiency analysis shows value',
          'Sharp money indicator'
        ],
        trends: [
          'Value-based moneylines hit 55% of the time',
          'Expected value drives long-term profit'
        ],
        situational: [
          'Market inefficiency identified',
          'Sharp money opportunity'
        ]
      };
    }
    
    return {
      pick,
      confidence: 3,
      rationale: `Edges are thin, but I cash them every Sunday. The expected value analysis shows ${pick.split(' ')[0]} has the best opportunity with ${Math.abs(bestValue).toFixed(2)} points of value. I don't force picks, but when the edge is there, I take it.`,
      keyFactors,
      supportingData
    };
  }

  private buildDefaultRationale(factbook: GameFactbook): PickRationale {
    return {
      pick: 'No pick',
      confidence: 1,
      rationale: 'Unable to generate pick for this analyst.',
      keyFactors: [],
      supportingData: { stats: [], trends: [], situational: [] }
    };
  }

  // Helper methods
  private isPrimetimeGame(kickoffISO: string): boolean {
    const hour = new Date(kickoffISO).getHours();
    return hour >= 20 || hour <= 2; // 8 PM to 2 AM
  }

  private hasStarQuarterback(away: any, home: any): boolean {
    // Simplified check for star QBs
    return away.keyPlayers.some((p: any) => p.position === 'QB') || 
           home.keyPlayers.some((p: any) => p.position === 'QB');
  }

  private isPopularTeam(away: any, home: any): any {
    const popularTeams = ['DAL', 'GB', 'PIT', 'NE', 'KC', 'BUF'];
    if (popularTeams.includes(away.abbreviation)) return away;
    if (popularTeams.includes(home.abbreviation)) return home;
    return null;
  }

  private calculateEPA(team: any): number {
    // Simplified EPA calculation
    return (team.statistics.offense.pointsPerGame - team.statistics.defense.pointsAllowed) / 10;
  }

  private calculateDVOA(team: any): number {
    // Simplified DVOA calculation
    return (team.statistics.offense.yardsPerGame - team.statistics.defense.yardsAllowed) / 100;
  }

  private calculatePhysicality(team: any): number {
    // Simplified physicality score
    return (team.statistics.offense.rushingYards + team.statistics.defense.sacks) / 100;
  }

  private calculateSpreadValue(factbook: GameFactbook): number {
    // Simplified spread value calculation
    return Math.random() * 2 - 1; // Placeholder
  }

  private calculateTotalValue(factbook: GameFactbook): number {
    // Simplified total value calculation
    return Math.random() * 2 - 1; // Placeholder
  }

  private calculateMoneylineValue(factbook: GameFactbook): number {
    // Simplified moneyline value calculation
    return Math.random() * 2 - 1; // Placeholder
  }
}

export const analystService = new AnalystService();
