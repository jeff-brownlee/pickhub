import { pickSelectionService } from '../services/pickSelectionService';
import { GameData } from '../adapters/espnNflApi';
import { Persona } from '../types';
import { MinimalFactbook } from '../types/minimalFactbook';
import fs from 'fs';
import path from 'path';

// Test the pick selection logic
const week = process.argv[2] ? parseInt(process.argv[2]) : 1;

console.log(`🧠 Testing pick selection logic for Week ${week}...\n`);

async function testPickSelection() {
  try {
    // Load games data
    const gamesPath = path.join(process.cwd(), '..', 'data/nfl/season-2025', `week-${week.toString().padStart(2, '0')}`, 'games.json');
    const gamesData: GameData[] = JSON.parse(fs.readFileSync(gamesPath, 'utf8'));
    console.log(`📊 Loaded ${gamesData.length} games`);

    // Load factbooks (Node.js version)
    const factbooksDir = path.join(process.cwd(), '..', 'data/nfl/season-2025', `week-${week.toString().padStart(2, '0')}`, 'factbooks');
    const factbookFiles = fs.readdirSync(factbooksDir).filter(f => f.endsWith('.json'));
    const factbooks: MinimalFactbook[] = factbookFiles.map(file => {
      const filePath = path.join(factbooksDir, file);
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    });
    console.log(`📚 Loaded ${factbooks.length} factbooks`);

    // Load personas
    const personasPath = path.join(process.cwd(), 'public/data/personas.json');
    const personas: Persona[] = JSON.parse(fs.readFileSync(personasPath, 'utf8'));
    console.log(`👥 Loaded ${personas.length} personas\n`);

    // Test pick generation for each persona
    const results = [];
    for (const persona of personas.slice(0, 3)) { // Test first 3 personas
      console.log(`🎯 Generating picks for ${persona.name} (${persona.id})...`);
      
      const weeklyPicks = await pickSelectionService.generateWeeklyPicksHeuristics(
        gamesData,
        factbooks,
        persona,
        week
      );
      
      results.push(weeklyPicks);
      console.log(`   ✅ Generated ${weeklyPicks.picks.length} picks`);
      
      // Show sample pick
      if (weeklyPicks.picks.length > 0) {
        const samplePick = weeklyPicks.picks[0];
        console.log(`   📝 Sample: ${samplePick.pick} - ${samplePick.rationale.rationale}`);
      }
      console.log('');
    }

    console.log(`\n🎯 Total picks generated: ${results.reduce((sum, r) => sum + r.picks.length, 0)}`);
    console.log(`📊 Average picks per persona: ${(results.reduce((sum, r) => sum + r.picks.length, 0) / results.length).toFixed(1)}`);
    
  } catch (error) {
    console.error('❌ Error testing pick selection:', error);
    process.exit(1);
  }
}

testPickSelection();
