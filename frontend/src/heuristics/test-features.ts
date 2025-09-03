/**
 * Test file for feature calculators
 * Run with: npx ts-node frontend/src/heuristics/test-features.ts
 */

import { calculateAllFeatures } from './features';
import { BettingCandidate } from './types';

// Test data based on DAL-PHI game
const testCandidates: BettingCandidate[] = [
  {
    gameId: '2025-09-05-dal-phi',
    marketType: 'spread',
    selection: 'away',
    line: 7.5,
    odds: -110,
    teamName: 'Cowboys'
  },
  {
    gameId: '2025-09-05-dal-phi',
    marketType: 'spread',
    selection: 'home',
    line: -7.5,
    odds: -110,
    teamName: 'Eagles'
  },
  {
    gameId: '2025-09-05-dal-phi',
    marketType: 'total',
    selection: 'over',
    line: 51,
    odds: -110
  },
  {
    gameId: '2025-09-05-dal-phi',
    marketType: 'total',
    selection: 'under',
    line: 51,
    odds: -110
  },
  {
    gameId: '2025-09-05-dal-phi',
    marketType: 'moneyline',
    selection: 'away',
    line: 0,
    odds: 200,
    teamName: 'Cowboys'
  },
  {
    gameId: '2025-09-05-dal-phi',
    marketType: 'moneyline',
    selection: 'home',
    line: 0,
    odds: -250,
    teamName: 'Eagles'
  }
];

// Mock opening lines (since not in factbook)
const openingLines = {
  spread: -7,
  total: 50.5,
  moneyline: { home: -240, away: 200 }
};

function runTests() {
  console.log('🧪 Testing Feature Calculators\n');
  
  testCandidates.forEach((candidate, index) => {
    console.log(`Test ${index + 1}: ${candidate.marketType.toUpperCase()} - ${candidate.selection.toUpperCase()}`);
    console.log(`Line: ${candidate.line}, Odds: ${candidate.odds}`);
    
    // Determine opening line based on market type
    let openingLine: number;
    if (candidate.marketType === 'spread') {
      openingLine = openingLines.spread;
    } else if (candidate.marketType === 'total') {
      openingLine = openingLines.total;
    } else {
      openingLine = candidate.selection === 'home' ? openingLines.moneyline.home : openingLines.moneyline.away;
    }
    
    const features = calculateAllFeatures(candidate, openingLine, candidate.line);
    
    console.log('Features:');
    console.log(`  Number Edge: ${features.numberEdge.normalized} (raw: ${features.numberEdge.raw})`);
    console.log(`  Line Movement: ${features.lineMovement.normalized} (raw: ${features.lineMovement.raw})`);
    console.log(`  Price Friendliness: ${features.priceFriendliness.normalized} (raw: ${features.priceFriendliness.raw})`);
    console.log('');
  });
  
  // Test specific edge cases
  console.log('🔍 Testing Edge Cases\n');
  
  // Test key number edges
  const keyNumberTests = [
    { line: 3.5, expected: 1 }, // Half-point above key number 3
    { line: 3, expected: -1 },  // On key number 3
    { line: 2.5, expected: 1 }, // Half-point below key number 3
    { line: 7.5, expected: 1 }, // Half-point above key number 7
    { line: 7, expected: -1 },  // On key number 7
  ];
  
  keyNumberTests.forEach(test => {
    const candidate: BettingCandidate = {
      gameId: 'test',
      marketType: 'spread',
      selection: 'away',
      line: test.line,
      odds: -110
    };
    
    const ne = calculateAllFeatures(candidate, test.line, test.line).numberEdge;
    console.log(`Key Number Test - Line ${test.line}: Expected ${test.expected}, Got ${ne.normalized}`);
  });
  
  console.log('\n✅ Feature calculator tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

export { runTests };
