/**
 * Test file for persona configurations
 * Run with: npx ts-node frontend/src/heuristics/test-personas.ts
 */

import { getAllPersonaConfigs, getPersonaConfig, validatePersonaWeights } from './personas';

function runPersonaTests() {
  console.log('🧪 Testing Persona Configurations\n');
  
  const configs = getAllPersonaConfigs();
  
  console.log(`Found ${configs.length} persona configurations:\n`);
  
  configs.forEach(config => {
    console.log(`📊 ${config.name} (${config.id})`);
    console.log(`  Weights: NE=${config.weights.numberEdge}, LM=${config.weights.lineMovement}, PF=${config.weights.priceFriendliness}`);
    console.log(`  Preferences: dogs=${config.preferences.dogs}, unders=${config.preferences.unders}`);
    
    const isValid = validatePersonaWeights(config);
    const weightSum = config.weights.numberEdge + config.weights.lineMovement + config.weights.priceFriendliness;
    console.log(`  Weight Sum: ${weightSum.toFixed(3)} (Valid: ${isValid ? '✅' : '❌'})`);
    console.log('');
  });
  
  // Test individual persona retrieval
  console.log('🔍 Testing Individual Persona Retrieval\n');
  
  const testPersonas = ['nerd', 'contrarian', 'coach', 'nonexistent'];
  
  testPersonas.forEach(personaId => {
    const config = getPersonaConfig(personaId);
    if (config) {
      console.log(`✅ Found ${config.name} (${config.id})`);
    } else {
      console.log(`❌ Persona '${personaId}' not found`);
    }
  });
  
  // Test weight validation
  console.log('\n🔍 Testing Weight Validation\n');
  
  const validConfigs = configs.filter(validatePersonaWeights);
  console.log(`Valid configurations: ${validConfigs.length}/${configs.length}`);
  
  if (validConfigs.length === configs.length) {
    console.log('✅ All persona weights are valid!');
  } else {
    console.log('❌ Some persona weights are invalid!');
  }
  
  console.log('\n✅ Persona configuration tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runPersonaTests();
}

export { runPersonaTests };
