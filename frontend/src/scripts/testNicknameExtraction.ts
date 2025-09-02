import { fetchEspnNflOdds } from '../sources/espnNflApi.js';
import { parseEspnNflApi } from '../adapters/espnNflApi.js';

async function testNicknameExtraction() {
  try {
    console.log('🧪 Testing nickname extraction from ESPN API...');
    
    // Pull data from ESPN API for Week 1
    const rawData = await fetchEspnNflOdds({
      week: 1,
      season: 2025,
      seasonType: 2 // Regular season
    });

    console.log('✅ Raw data fetched, parsing...');
    
    // Parse the data using our updated adapter
    const games = await parseEspnNflApi(rawData);
    
    console.log(`\n📊 Found ${games.length} games with nickname data:`);
    
    // Display first few games with nickname information
    games.slice(0, 3).forEach((game, index) => {
      console.log(`\n${index + 1}. ${game.away.nickname} @ ${game.home.nickname}`);
      console.log(`   Away: ${game.away.name} (${game.away.abbr}) - Nickname: "${game.away.nickname}"`);
      console.log(`   Home: ${game.home.name} (${game.home.abbr}) - Nickname: "${game.home.nickname}"`);
    });
    
    console.log('\n✅ Nickname extraction test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
testNicknameExtraction()
  .then(() => {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
