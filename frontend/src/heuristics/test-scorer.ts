/**
 * Test file for scorer
 * Run with: npx ts-node frontend/src/heuristics/test-scorer.ts
 */

import { scoreCandidate, generateBettingCandidates, getScoreBreakdown } from './scorer';
import { BettingCandidate } from './types';

// Test data based on DAL-PHI game
const testGameData = {
  gameId: '2025-09-05-dal-phi',
  awayTeam: { name: 'Dallas Cowboys', abbreviation: 'DAL' },
  homeTeam: { name: 'Philadelphia Eagles', abbreviation: 'PHI' },
  currentLine: {
    spread: -7.5,
    total: 51,
    moneyline: { home: -250, away: 200 }
  }
};

// Mock opening lines
const openingLines = {
  spread: -7,
  total: 50.5,
  moneyline_home: -240,
  moneyline_away: 200
};

const currentLines = {
  spread: -7.5,
  total: 51,
  moneyline_home: -250,
  moneyline_away: 200
};

function runScorerTests() {
  console.log('🧪 Testing Scorer\n');

  // Test 1: Generate betting candidates
  console.log('📊 Test 1: Generate Betting Candidates');
  const candidates = generateBettingCandidates(testGameData);
  console.log(`Generated ${candidates.length} candidates:`);
  candidates.forEach((candidate, index) => {
    console.log(`  ${index + 1}. ${candidate.marketType.toUpperCase()} - ${candidate.selection.toUpperCase()} (Line: ${candidate.line}, Odds: ${candidate.odds})`);
  });
  console.log('');

  // Test 2: Score candidates for different personas
  console.log('📊 Test 2: Score Candidates for Different Personas');
  const testPersonas = ['nerd', 'contrarian', 'coach', 'fratguy'];

  testPersonas.forEach(personaId => {
    console.log(`\n🎯 ${personaId.toUpperCase()} Persona:`);
    
    // Test a few key candidates
    const testCandidates = candidates.slice(0, 3); // Test first 3 candidates
    
    testCandidates.forEach((candidate, index) => {
      const openingLine = getLineForCandidate(candidate, openingLines);
      const currentLine = getLineForCandidate(candidate, currentLines);
      
      if (openingLine !== null && currentLine !== null) {
        const scored = scoreCandidate(candidate, openingLine, currentLine, personaId);
        
        if (scored) {
          console.log(`  ${index + 1}. ${candidate.marketType.toUpperCase()} - ${candidate.selection.toUpperCase()}`);
          console.log(`     Score: ${scored.score.toFixed(3)}`);
          console.log(`     Components: NE=${scored.components.numberEdge.normalized}, LM=${scored.components.lineMovement.normalized}, PF=${scored.components.priceFriendliness.normalized}`);
        }
      }
    });
  });

  // Test 3: Score breakdown for transparency
  console.log('\n📊 Test 3: Score Breakdown for Transparency');
  const testCandidate = candidates[0]; // First candidate
  const openingLine = getLineForCandidate(testCandidate, openingLines);
  const currentLine = getLineForCandidate(testCandidate, currentLines);
  
  if (openingLine !== null && currentLine !== null) {
    const scored = scoreCandidate(testCandidate, openingLine, currentLine, 'nerd');
    
    if (scored) {
      const breakdown = getScoreBreakdown(scored, { 
        id: 'nerd', 
        name: 'Nerd', 
        weights: { numberEdge: 0.4, lineMovement: 0.4, priceFriendliness: 0.2 },
        preferences: { dogs: false, unders: false }
      });
      
      console.log(`Candidate: ${testCandidate.marketType.toUpperCase()} - ${testCandidate.selection.toUpperCase()}`);
      console.log(`Weights: NE=${breakdown.weights.numberEdge}, LM=${breakdown.weights.lineMovement}, PF=${breakdown.weights.priceFriendliness}`);
      console.log(`Weighted Scores: NE=${breakdown.weightedScores.numberEdge.toFixed(3)}, LM=${breakdown.weightedScores.lineMovement.toFixed(3)}, PF=${breakdown.weightedScores.priceFriendliness.toFixed(3)}`);
      console.log(`Final Score: ${breakdown.finalScore.toFixed(3)}`);
    }
  }

  console.log('\n✅ Scorer tests completed!');
}

// Helper function to get line for candidate
function getLineForCandidate(candidate: BettingCandidate, lines: Record<string, number>): number | null {
  const { marketType, selection } = candidate;

  if (marketType === 'spread') {
    return lines.spread || null;
  }

  if (marketType === 'total') {
    return lines.total || null;
  }

  if (marketType === 'moneyline') {
    const key = selection === 'home' ? 'moneyline_home' : 'moneyline_away';
    return lines[key] || null;
  }

  return null;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runScorerTests();
}

export { runScorerTests };
