import { MinimalFactbook } from '../types/minimalFactbook';
import { Persona, Pick as UIPick } from '../types';
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
    factbook: MinimalFactbook,
    analyst: Persona,
    pick: UIPick,
    confidence: 1 | 2 | 3
  ): Promise<PickRationale> {
    
    const prompt = this.buildRationalePrompt(factbook, analyst, pick, confidence);
    console.log('--- ChatGPT Prompt (rationale) ---\n', prompt, '\n--- end prompt ---');
    
    try {
      const response = await this.callChatGPT(prompt);
      console.log('--- ChatGPT Response (rationale) ---\n', response, '\n--- end response ---');
      return this.parseRationaleResponse(response, pick, confidence);
    } catch (error) {
      console.error('ChatGPT rationale generation failed:', error);
      return this.getFallbackRationale(pick, confidence);
    }
  }

  private buildRationalePrompt(
    factbook: MinimalFactbook,
    analyst: Persona,
    pick: UIPick,
    confidence: 1 | 2 | 3
  ): string {
    
    const gameContext = this.buildGameContext(factbook);
    const analystContext = this.buildAnalystContext(analyst);
    const pickContext = this.buildPickContext(pick);
    
    return `
You are ${analyst.name}, a ${analyst.persona} sports betting analyst. Generate a rationale for this pick.

${analystContext}

${gameContext}

PICK DETAILS:
${pickContext}

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

  private buildGameContext(factbook: MinimalFactbook): string {
    const { away, home } = factbook.teams;
    const awayWinPct = Math.round((away.record.winPercentage || 0) * 100);
    const homeWinPct = Math.round((home.record.winPercentage || 0) * 100);
    const statsSourceNote = factbook.statsSourceSeason ? ` (stats from ${factbook.statsSourceSeason})` : '';

    const bt = factbook.bettingContext?.bettingTrends;
    const lm = factbook.bettingContext?.lineMovement;
    const spreadMove = lm?.spread ? `${lm.spread.opening} → ${lm.spread.current} (${lm.spread.direction})` : 'N/A';
    const totalMove = lm?.total ? `${lm.total.opening} → ${lm.total.current} (${lm.total.direction})` : 'N/A';

    return `
GAME CONTEXT:
${away.abbreviation} @ ${home.abbreviation} — Week ${factbook.week}${statsSourceNote}

TEAM RECORDS:
- ${away.abbreviation}: ${awayWinPct}% win pct
- ${home.abbreviation}: ${homeWinPct}% win pct

KEY STATS (per game):
- ${away.abbreviation} Off: ${away.statistics.offense.pointsPerGame.toFixed(1)} PPG | Def: ${away.statistics.defense.pointsAllowed.toFixed(1)} PPA
- ${home.abbreviation} Off: ${home.statistics.offense.pointsPerGame.toFixed(1)} PPG | Def: ${home.statistics.defense.pointsAllowed.toFixed(1)} PPA

BETTING CONTEXT:
- Current Spread: ${factbook.bettingContext.currentLine?.spread ?? 'N/A'}
- Current Total: ${factbook.bettingContext.currentLine?.total ?? 'N/A'}
- Public (Spread): Home ${bt?.spread.home ?? 'N/A'}% / Away ${bt?.spread.away ?? 'N/A'}%
- Public (Total): Over ${bt?.total.over ?? 'N/A'}% / Under ${bt?.total.under ?? 'N/A'}%
- Line Movement: Spread ${spreadMove} | Total ${totalMove}
`;
  }

  private buildPickContext(pick: UIPick): string {
    const market = pick.selection.betType;
    const side = pick.selection.side;
    const line = pick.selection.line;
    const odds = pick.selection.odds;
    const cues = pick.selection.rationaleCues || [];
    const game = `${pick.awayTeam.id} @ ${pick.homeTeam.id}`;
    return `
Pick: ${game} — ${market.toUpperCase()} ${side.toString().toUpperCase()} ${line} (${odds > 0 ? '+' : ''}${odds})
Heuristic Cues: ${cues.length ? cues.map(c => `- ${c}`).join('\n') : '- n/a'}
`;
  }

  private formatPickLabel(pick: UIPick): string {
    const market = pick.selection.betType;
    if (market === 'total') {
      return `${(pick.selection.side as string).toUpperCase()} ${pick.selection.line}`;
    }
    const team = pick.selection.side === 'away' ? pick.awayTeam.id : pick.homeTeam.id;
    if (market === 'moneyline') {
      return `${team} ${pick.selection.odds > 0 ? '+' : ''}${pick.selection.odds}`;
    }
    // spread
    return `${team} ${pick.selection.line > 0 ? '+' : ''}${pick.selection.line}`;
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
    const apiKey = process.env.OPENAI_API_KEY || process.env.REACT_APP_CHATGPT_API_KEY || '';
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not set');
    }

    const body = {
      model: this.config.model || 'gpt-4o-mini',
      temperature: this.config.temperature ?? 0.3,
      max_tokens: this.config.maxTokens ?? 500,
      messages: [
        { role: 'system', content: 'You are an expert NFL betting analyst. Output STRICT JSON only that matches the schema described. No markdown, no prose.' },
        { role: 'user', content: prompt }
      ]
    } as any;

    const endpoint = 'https://api.openai.com/v1/chat/completions';
    let attempt = 0;
    let delayMs = 400;
    while (true) {
      attempt += 1;
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(body)
      });

      if (resp.ok) {
        const data = await resp.json();
        const content = data?.choices?.[0]?.message?.content;
        if (typeof content !== 'string' || !content.trim()) {
          throw new Error('Empty response from OpenAI');
        }
        return content;
      }

      // Handle rate limits and transient errors with backoff
      if ((resp.status === 429 || resp.status >= 500) && attempt < 5) {
        await new Promise(r => setTimeout(r, delayMs));
        delayMs *= 2;
        continue;
      }

      const text = await resp.text();
      throw new Error(`OpenAI API error ${resp.status}: ${text}`);
    }
  }

  private extractJson(content: string): string {
    // Remove markdown fences if present
    const fenced = content.match(/```(?:json)?[\s\S]*?```/i);
    if (fenced) {
      const inner = fenced[0].replace(/```(?:json)?/i, '').replace(/```$/, '');
      return inner.trim();
    }
    // Try to find the first {...} JSON object
    const first = content.indexOf('{');
    const last = content.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
      return content.slice(first, last + 1).trim();
    }
    return content.trim();
  }

  private parseRationaleResponse(response: string, pick: UIPick, confidence: 1 | 2 | 3): PickRationale {
    try {
      const json = this.extractJson(response);
      const parsed = JSON.parse(json);
      return {
        pick: this.formatPickLabel(pick),
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

  private getFallbackRationale(pick: UIPick, confidence: 1 | 2 | 3): PickRationale {
    return {
      pick: this.formatPickLabel(pick),
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
