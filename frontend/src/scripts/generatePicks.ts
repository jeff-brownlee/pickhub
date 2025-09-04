import fs from 'fs';
import path from 'path';
import { pickSelectionService } from '../services/pickSelectionService';
import { MinimalFactbook } from '../types/minimalFactbook';
import { GameData } from '../adapters/espnNflApi';
import { Persona } from '../types';

function readJson<T = any>(p: string): T {
  return JSON.parse(fs.readFileSync(p, 'utf8')) as T;
}

async function main() {
  const week = process.argv[2] ? parseInt(process.argv[2], 10) : 1;
  const weekStr = `week-${week.toString().padStart(2, '0')}`;

  // Inputs
  const gamesPath = path.join(process.cwd(), '..', 'data/nfl/season-2025', weekStr, 'games.json');
  const factbooksDir = path.join(process.cwd(), '..', 'data/nfl/season-2025', weekStr, 'factbooks');
  const personasPath = path.join(process.cwd(), 'public', 'data', 'personas.json');

  if (!fs.existsSync(gamesPath)) {
    console.error(`Games not found: ${gamesPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(factbooksDir)) {
    console.error(`Factbooks dir not found: ${factbooksDir}`);
    process.exit(1);
  }

  const games = readJson<GameData[]>(gamesPath);
  const factbookFiles = fs.readdirSync(factbooksDir).filter(f => f.endsWith('.json'));
  const factbooks: MinimalFactbook[] = factbookFiles.map(f => readJson<MinimalFactbook>(path.join(factbooksDir, f)));
  const personas: Persona[] = readJson<Persona[]>(personasPath);

  // Output dir (public) for Vercel consumption
  const picksOutDir = path.join(process.cwd(), 'public', 'data', 'nfl', 'season-2025', weekStr, 'picks');
  fs.mkdirSync(picksOutDir, { recursive: true });

  for (const persona of personas) {
    try {
      const generatedAt = new Date().toISOString();
      const res = await pickSelectionService.generateWeeklyPicksHeuristics(games, factbooks, persona, week);
      // Adapt to legacy UI JSON envelope
      const legacyEnvelope = {
        analystId: persona.id,
        week,
        season: 2025,
        generatedAt,
        picks: res.picks,
        weekSummary: {
          totalPicks: res.picks.length,
          totalUnits: res.picks.length,
          weekPayout: 0,
          weekNetUnits: 0
        }
      };
      const outPath = path.join(picksOutDir, `${persona.id}.json`);
      fs.writeFileSync(outPath, JSON.stringify(legacyEnvelope, null, 2));
      console.log(`✅ Wrote picks for ${persona.name} → ${outPath}`);
    } catch (e) {
      console.error(`❌ Failed to generate picks for ${persona.name}:`, e);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});


