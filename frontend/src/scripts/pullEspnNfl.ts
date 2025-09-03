import { fetchEspnNflOdds } from '../sources/espnNflApi.js';
import { parseEspnNflApi } from '../adapters/espnNflApi.js';
import fs from 'fs';
import path from 'path';

export async function pullEspnNflFromApi(config?: {
  apiKey?: string;
  baseUrl?: string;
  week?: number;
  season?: number;
}) {
  try {
    const rawData = await fetchEspnNflOdds(config);
    return await parseEspnNflApi(rawData);
  } catch (error) {
    console.error("Failed to pull ESPN NFL data:", error);
    throw error;
  }
}

async function generateGamesForWeek(week: number) {
  try {
    console.log(`Generating games for Week ${week}...`);
    
    // Pull data from ESPN API
    const games = await pullEspnNflFromApi({
      week: week,
      season: 2025,
      seasonType: 2 // Regular season
    });

    console.log(`✅ Generated ${games.length} games from ESPN API`);

    // Save games data
    const weekStr = week.toString().padStart(2, '0');
    const gamesPath = path.join(process.cwd(), '..', 'data/nfl/season-2025', `week-${weekStr}`, 'games.json');
    
    // Ensure directory exists
    const gamesDir = path.dirname(gamesPath);
    if (!fs.existsSync(gamesDir)) {
      fs.mkdirSync(gamesDir, { recursive: true });
    }

    // Save games data
    fs.writeFileSync(gamesPath, JSON.stringify(games, null, 2));
    console.log(`✅ Saved ${games.length} games to: ${gamesPath}`);

    return games;
  } catch (error) {
    console.error('Error generating games:', error);
    throw error;
  }
}

// CLI usage
const week = process.argv[2] ? parseInt(process.argv[2]) : 1;

generateGamesForWeek(week)
  .then((games) => {
    console.log(`\n🎉 Games generation complete for Week ${week}!`);
    console.log(`Generated ${games.length} games with odds data`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

export { generateGamesForWeek };
