import fs from 'fs';
import path from 'path';

interface ValidationResult {
  field: string;
  status: 'valid' | 'missing' | 'incorrect' | 'generic';
  expected?: any;
  actual?: any;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
}

interface FactbookValidation {
  gameId: string;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  results: ValidationResult[];
}

function validateFactbook(factbook: any): FactbookValidation {
  const results: ValidationResult[] = [];
  
  // Critical validations
  results.push(...validateCriticalFields(factbook));
  
  // High priority validations
  results.push(...validateHighPriorityFields(factbook));
  
  // Medium priority validations
  results.push(...validateMediumPriorityFields(factbook));
  
  // Low priority validations
  results.push(...validateLowPriorityFields(factbook));
  
  const criticalIssues = results.filter(r => r.severity === 'critical').length;
  const highIssues = results.filter(r => r.severity === 'high').length;
  const mediumIssues = results.filter(r => r.severity === 'medium').length;
  const lowIssues = results.filter(r => r.severity === 'low').length;
  
  return {
    gameId: factbook.gameId,
    totalIssues: results.length,
    criticalIssues,
    highIssues,
    mediumIssues,
    lowIssues,
    results
  };
}

function validateCriticalFields(factbook: any): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  // Check for empty key players
  if (!factbook.teams.away.keyPlayers || factbook.teams.away.keyPlayers.length === 0) {
    results.push({
      field: 'teams.away.keyPlayers',
      status: 'missing',
      severity: 'critical',
      description: 'Away team key players are missing - should include star players like QB, RB, WR'
    });
  }
  
  if (!factbook.teams.home.keyPlayers || factbook.teams.home.keyPlayers.length === 0) {
    results.push({
      field: 'teams.home.keyPlayers',
      status: 'missing',
      severity: 'critical',
      description: 'Home team key players are missing - should include star players like QB, RB, WR'
    });
  }
  
  // Check for missing betting spread
  if (!factbook.bettingContext.currentLine.spread) {
    results.push({
      field: 'bettingContext.currentLine.spread',
      status: 'missing',
      severity: 'critical',
      description: 'Betting spread is missing - critical for analysis'
    });
  }
  
  // Check for missing betting total
  if (!factbook.bettingContext.currentLine.total) {
    results.push({
      field: 'bettingContext.currentLine.total',
      status: 'missing',
      severity: 'critical',
      description: 'Betting total is missing - critical for analysis'
    });
  }
  
  return results;
}

function validateHighPriorityFields(factbook: any): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  // Check for zero points per game
  if (factbook.teams.away.statistics.offense.pointsPerGame === 0) {
    results.push({
      field: 'teams.away.statistics.offense.pointsPerGame',
      status: 'incorrect',
      actual: 0,
      severity: 'high',
      description: 'Points per game should not be zero - indicates data not populated'
    });
  }
  
  if (factbook.teams.home.statistics.offense.pointsPerGame === 0) {
    results.push({
      field: 'teams.home.statistics.offense.pointsPerGame',
      status: 'incorrect',
      actual: 0,
      severity: 'high',
      description: 'Points per game should not be zero - indicates data not populated'
    });
  }
  
  // Check for unknown coaches
  if (factbook.teams.away.coaching.headCoach === 'Unknown') {
    results.push({
      field: 'teams.away.coaching.headCoach',
      status: 'generic',
      actual: 'Unknown',
      severity: 'high',
      description: 'Coach name should be actual coach name, not "Unknown"'
    });
  }
  
  if (factbook.teams.home.coaching.headCoach === 'Unknown') {
    results.push({
      field: 'teams.home.coaching.headCoach',
      status: 'generic',
      actual: 'Unknown',
      severity: 'high',
      description: 'Coach name should be actual coach name, not "Unknown"'
    });
  }
  
  // Check for empty trends
  if (!factbook.trends || factbook.trends.length === 0) {
    results.push({
      field: 'trends',
      status: 'missing',
      severity: 'high',
      description: 'Game trends are missing - should include historical and recent trends'
    });
  }
  
  return results;
}

function validateMediumPriorityFields(factbook: any): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  // Check for empty key matchups
  if (!factbook.keyMatchups || factbook.keyMatchups.length === 0) {
    results.push({
      field: 'keyMatchups',
      status: 'missing',
      severity: 'medium',
      description: 'Key matchups are missing - should identify important player/unit matchups'
    });
  }
  
  // Check for incorrect division game flag
  const isDivisionGame = factbook.teams.away.situational.motivation.divisionGame || 
                        factbook.teams.home.situational.motivation.divisionGame;
  
  // For DAL vs PHI, this should be true (NFC East)
  if (factbook.gameId.includes('dal-phi') && !isDivisionGame) {
    results.push({
      field: 'situational.motivation.divisionGame',
      status: 'incorrect',
      actual: false,
      expected: true,
      severity: 'medium',
      description: 'DAL vs PHI is a division game (NFC East) but marked as false'
    });
  }
  
  // Check for incorrect rivalry flag
  const isRivalry = factbook.teams.away.situational.motivation.rivalry || 
                   factbook.teams.home.situational.motivation.rivalry;
  
  // For DAL vs PHI, this should be true (major rivalry)
  if (factbook.gameId.includes('dal-phi') && !isRivalry) {
    results.push({
      field: 'situational.motivation.rivalry',
      status: 'incorrect',
      actual: false,
      expected: true,
      severity: 'medium',
      description: 'DAL vs PHI is a major rivalry but marked as false'
    });
  }
  
  return results;
}

function validateLowPriorityFields(factbook: any): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  // Check for generic betting trends (50/50)
  const spreadTrends = factbook.bettingContext.bettingTrends.spread;
  if (spreadTrends.home === 50 && spreadTrends.away === 50) {
    results.push({
      field: 'bettingContext.bettingTrends.spread',
      status: 'generic',
      actual: { home: 50, away: 50 },
      severity: 'low',
      description: 'Betting trends appear to be placeholder data (50/50)'
    });
  }
  
  // Check for empty injury reports
  if (!factbook.injuries || factbook.injuries.length === 0) {
    results.push({
      field: 'injuries',
      status: 'missing',
      severity: 'low',
      description: 'Injury reports are empty - should include key player injuries'
    });
  }
  
  return results;
}

function generateValidationReport(validation: FactbookValidation): string {
  let report = `# Factbook Validation Report\n\n`;
  report += `**Game:** ${validation.gameId}\n`;
  report += `**Total Issues:** ${validation.totalIssues}\n`;
  report += `**Critical:** ${validation.criticalIssues} | **High:** ${validation.highIssues} | **Medium:** ${validation.mediumIssues} | **Low:** ${validation.lowIssues}\n\n`;
  
  // Group by severity
  const critical = validation.results.filter(r => r.severity === 'critical');
  const high = validation.results.filter(r => r.severity === 'high');
  const medium = validation.results.filter(r => r.severity === 'medium');
  const low = validation.results.filter(r => r.severity === 'low');
  
  if (critical.length > 0) {
    report += `## 🚨 Critical Issues\n\n`;
    critical.forEach(issue => {
      report += `- **${issue.field}**: ${issue.description}\n`;
    });
    report += `\n`;
  }
  
  if (high.length > 0) {
    report += `## ⚠️ High Priority Issues\n\n`;
    high.forEach(issue => {
      report += `- **${issue.field}**: ${issue.description}\n`;
    });
    report += `\n`;
  }
  
  if (medium.length > 0) {
    report += `## 📋 Medium Priority Issues\n\n`;
    medium.forEach(issue => {
      report += `- **${issue.field}**: ${issue.description}\n`;
    });
    report += `\n`;
  }
  
  if (low.length > 0) {
    report += `## ℹ️ Low Priority Issues\n\n`;
    low.forEach(issue => {
      report += `- **${issue.field}**: ${issue.description}\n`;
    });
    report += `\n`;
  }
  
  return report;
}

// Main execution
async function validateFactbooks() {
  try {
    console.log('🔍 Starting factbook validation...\n');
    
    const factbooksDir = path.join(process.cwd(), '..', 'data/nfl/season-2025/week-01/factbooks');
    
    if (!fs.existsSync(factbooksDir)) {
      console.log('❌ Factbooks directory not found');
      return;
    }
    
    const files = fs.readdirSync(factbooksDir).filter(f => f.endsWith('.json'));
    
    if (files.length === 0) {
      console.log('❌ No factbook files found');
      return;
    }
    
    console.log(`Found ${files.length} factbook(s) to validate\n`);
    
    for (const file of files) {
      const filePath = path.join(factbooksDir, file);
      const factbook = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      console.log(`📊 Validating ${file}...`);
      
      const validation = validateFactbook(factbook);
      const report = generateValidationReport(validation);
      
      console.log(report);
      console.log('---\n');
    }
    
  } catch (error) {
    console.error('❌ Error during validation:', error);
  }
}

// Run validation
validateFactbooks();
