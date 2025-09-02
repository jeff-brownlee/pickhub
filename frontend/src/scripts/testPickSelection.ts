import { generatePicksForWeek } from '../services/pickSelectionExample';

// Test the pick selection logic
const week = process.argv[2] ? parseInt(process.argv[2]) : 1;

console.log(`🧠 Testing pick selection logic for Week ${week}...\n`);

generatePicksForWeek(week)
  .then((picks) => {
    console.log(`\n✅ Generated ${picks.length} game analyses`);
    console.log('\n📊 Summary:');
    
    let totalPicks = 0;
    picks.forEach(({ gameId, coachPick, podcasterPick, nerdPick }) => {
      const gamePicks = [coachPick, podcasterPick, nerdPick].filter(Boolean);
      totalPicks += gamePicks.length;
      console.log(`${gameId}: ${gamePicks.length} picks`);
    });
    
    console.log(`\n🎯 Total picks generated: ${totalPicks}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error testing pick selection:', error);
    process.exit(1);
  });
