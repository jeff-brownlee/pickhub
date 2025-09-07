import fs from 'fs';
import path from 'path';
import { MinimalFactbook } from '../types/minimalFactbook';
import { computeSpreadScoreDebug, computeTotalScoreDebug, computeMoneylineScoreDebug } from '../heuristics/marketScoring';

function readJson<T = any>(p: string): T {
  return JSON.parse(fs.readFileSync(p, 'utf8')) as T;
}

async function main() {
  const week = process.argv[2] ? parseInt(process.argv[2], 10) : 1;
  const weekStr = `week-${week.toString().padStart(2, '0')}`;
  const seasonDir = path.join(process.cwd(), '..', 'data/nfl/season-2025', weekStr);
  const factbooksDir = path.join(seasonDir, 'factbooks');
  const scoringDir = path.join(seasonDir, 'scoring');

  if (!fs.existsSync(factbooksDir)) {
    console.error(`Factbooks dir not found: ${factbooksDir}`);
    process.exit(1);
  }

  fs.mkdirSync(scoringDir, { recursive: true });

  const factbookFiles = fs.readdirSync(factbooksDir).filter(f => f.endsWith('.json'));
  const out: Array<any> = [];

  for (const file of factbookFiles) {
    const fbPath = path.join(factbooksDir, file);
    const fb = readJson<MinimalFactbook>(fbPath);

    const spread = computeSpreadScoreDebug(fb);
    const total = computeTotalScoreDebug(fb);
    const moneyline = computeMoneylineScoreDebug(fb);

    out.push({
      gameId: fb.gameId,
      week: fb.week,
      kickoffISO: fb.kickoffISO,
      scoring: {
        spread,
        total,
        moneyline
      }
    });
  }

  const outPath = path.join(scoringDir, 'market-score.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`✅ Wrote market scoring log → ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
