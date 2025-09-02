import { GameFactbook } from '../types/factbook';
import { Persona } from '../types';
import { PickRationale } from './analystService';

export interface ChatGPTConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export class ChatGPTRationaleService {
  private config: ChatGPTConfig;

  constructor(config: ChatGPTConfig) {
    this.config = config;
  }

  /**
   * Generate a rationale for a pick using ChatGPT
   */
  async generateRationale(
    factbook: GameFactbook,
    analyst: Persona,
    pick: string,
    confidence: 1 | 2 | 3
  ): Promise<PickRationale> {
    
    const prompt = this.buildRationalePrompt(factbook, analyst, pick, confidence);
    
    try {
      const response = await this.callChatGPT(prompt);
      return this.parseRationaleResponse(response, pick, confidence);
    } catch (error) {
      console.error('ChatGPT rationale generation failed:', error);
      return this.getFallbackRationale(pick, confidence);
    }
  }

  private buildRationalePrompt(
    factbook: GameFactbook,
    analyst: Persona,
    pick: string,
    confidence: 1 | 2 | 3
  ): string {
    
    const gameContext = this.buildGameContext(factbook);
    const analystContext = this.buildAnalystContext(analyst);
    
    return `
You are ${analyst.name}, a ${analyst.persona} sports betting analyst. Generate a rationale for your pick: "${pick}"

${analystContext}

${gameContext}

Your task:
1. Write a rationale that matches your personality and voice style
2. Include 3-4 key factors that support your pick
3. Provide supporting data (stats, trends, situational factors)
4. Make it sound authentic to your character
5. Keep it engaging and personality-driven

Format your response as JSON:
{
  "rationale": "Your personality-driven explanation of why you're making this pick",
  "keyFactors": ["Factor 1", "Factor 2", "Factor 3", "Factor 4"],
  "supportingData": {
    "stats": ["Stat 1", "Stat 2", "Stat 3"],
    "trends": ["Trend 1", "Trend 2"],
    "situational": ["Situation 1", "Situation 2"]
  }
}

Remember: Be authentic to your character. ${analyst.tagline}
`;
  }

  private buildAnalystContext(analyst: Persona): string {
    return `
ANALYST PROFILE:
- Name: ${analyst.name}
- Persona: ${analyst.persona}
- Tagline: ${analyst.tagline}
- Bias: ${analyst.bias}
- Voice Style: ${analyst.voiceStyle}
- Bio: ${analyst.bio}

Your approach to betting:
${this.getAnalystApproach(analyst.id)}
`;
  }

  private buildGameContext(factbook: GameFactbook): string {
    const { away, home } = factbook.teams;
    
    return `
GAME CONTEXT:
${away.abbreviation} @ ${home.abbreviation} - Week ${factbook.week}

TEAM RECORDS:
- ${away.abbreviation}: ${away.record.wins}-${away.record.losses} (${Math.round(away.record.winPercentage * 100)}%)
- ${home.abbreviation}: ${home.record.wins}-${home.record.losses} (${Math.round(home.record.winPercentage * 100)}%)

KEY STATISTICS:
- ${away.abbreviation} Offense: ${away.statistics.offense.pointsPerGame.toFixed(1)} PPG, ${away.statistics.offense.yardsPerGame.toFixed(0)} YPG
- ${away.abbreviation} Defense: ${away.statistics.defense.pointsAllowed.toFixed(1)} PPG allowed, ${away.statistics.defense.yardsAllowed.toFixed(0)} YPG allowed
- ${home.abbreviation} Offense: ${home.statistics.offense.pointsPerGame.toFixed(1)} PPG, ${home.statistics.offense.yardsPerGame.toFixed(0)} YPG
- ${home.abbreviation} Defense: ${home.statistics.defense.pointsAllowed.toFixed(1)} PPG allowed, ${home.statistics.defense.yardsAllowed.toFixed(0)} YPG allowed

BETTING CONTEXT:
- Current Spread: ${factbook.bettingContext.currentLine?.spread || 'N/A'}
- Current Total: ${factbook.bettingContext.currentLine?.total || 'N/A'}
- Public Betting: ${factbook.bettingContext.bettingTrends.spread.home}% / ${factbook.bettingContext.bettingTrends.spread.away}%
- Line Movement: ${factbook.bettingContext.lineMovement.spreadMovement || 'None'}

VENUE: ${factbook.venue.name} (${factbook.venue.city}, ${factbook.venue.state})
- Indoor: ${factbook.venue.indoor ? 'Yes' : 'No'}
- Surface: ${factbook.venue.surface}

KEY MATCHUPS:
${factbook.keyMatchups.map(m => `- ${m.description} (${m.advantage} advantage)`).join('\n')}

INJURIES:
${factbook.injuries.map(i => `- ${i.player} (${i.position}): ${i.injury} - ${i.status}`).join('\n')}

TRENDS:
${factbook.trends.map(t => `- ${t.description}: ${t.record} (${t.significance} significance)`).join('\n')}
`;
  }

  private getAnalystApproach(analystId: string): string {
    const approaches = {
      'coach': 'You focus on fundamentals, discipline, and physical play. You prefer teams that execute well, don\'t beat themselves, and can control the line of scrimmage. You value coaching, preparation, and situational football.',
      'contrarian': 'You fade the public consensus. When everyone is on one side, you take the other. You look for value in unpopular picks and follow sharp money movement against public sentiment.',
      'fratguy': 'You want action and entertainment. You prefer primetime games, overs, and favorites. You\'re all about the big plays, star players, and games that everyone is talking about.',
      'hotgirl': 'You follow social media trends and popular teams. You prefer star quarterbacks, flashy offenses, and teams that are trending. You focus on vibes and what everyone is talking about.',
      'joe': 'You follow the consensus and obvious picks. You bet what feels right and what everyone else is doing. You prefer popular teams and clear favorites.',
      'mobster': 'You follow the line movement and sharp money. You don\'t care about narratives - you care about where the smart money is going and what the line is telling you.',
      'nerd': 'You use advanced analytics and data. You trust EPA, DVOA, and efficiency metrics over narratives. You look for statistical advantages and expected value.',
      'podcaster': 'You focus on physicality and toughness. You prefer teams that can run the ball and stop the run. You value old-school football and physical play over finesse.',
      'pro': 'You calculate expected value and only bet when there\'s a clear edge. You\'re patient and professional, looking for the best opportunities with the highest expected value.'
    };
    
    return approaches[analystId as keyof typeof approaches] || 'You analyze games based on your unique perspective and approach.';
  }

  private async callChatGPT(prompt: string): Promise<string> {
    // This would make an actual ChatGPT API call
    // For now, return a placeholder response
    return JSON.stringify({
      rationale: "This is a placeholder rationale that would be generated by ChatGPT based on the analyst's personality and the game data.",
      keyFactors: [
        "Key factor 1 that supports the pick",
        "Key factor 2 that supports the pick", 
        "Key factor 3 that supports the pick",
        "Key factor 4 that supports the pick"
      ],
      supportingData: {
        stats: [
          "Supporting statistic 1",
          "Supporting statistic 2",
          "Supporting statistic 3"
        ],
        trends: [
          "Relevant trend 1",
          "Relevant trend 2"
        ],
        situational: [
          "Situational factor 1",
          "Situational factor 2"
        ]
      }
    });
  }

  private parseRationaleResponse(response: string, pick: string, confidence: 1 | 2 | 3): PickRationale {
    try {
      const parsed = JSON.parse(response);
      return {
        pick,
        confidence,
        rationale: parsed.rationale || 'No rationale provided',
        keyFactors: parsed.keyFactors || [],
        supportingData: {
          stats: parsed.supportingData?.stats || [],
          trends: parsed.supportingData?.trends || [],
          situational: parsed.supportingData?.situational || []
        }
      };
    } catch (error) {
      console.error('Failed to parse ChatGPT response:', error);
      return this.getFallbackRationale(pick, confidence);
    }
  }

  private getFallbackRationale(pick: string, confidence: 1 | 2 | 3): PickRationale {
    return {
      pick,
      confidence,
      rationale: 'Unable to generate rationale at this time. Please try again later.',
      keyFactors: ['Technical issue', 'Please retry'],
      supportingData: {
        stats: ['Data unavailable'],
        trends: ['Trends unavailable'],
        situational: ['Situational data unavailable']
      }
    };
  }
}

// Example usage:
export const chatgptRationaleService = new ChatGPTRationaleService({
  apiKey: process.env.REACT_APP_CHATGPT_API_KEY || '',
  model: 'gpt-4',
  maxTokens: 500,
  temperature: 0.8
});
