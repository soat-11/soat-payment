#!/usr/bin/env node

/**
 * Generates sonar coverage exclusions from shared config
 * Usage: node scripts/generate-sonar-coverage.js
 */

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../config/coverage.config.json');
const sonarPath = path.join(__dirname, '../sonar-project.properties');

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Convert Jest patterns to SonarCloud patterns
function toSonarPattern(pattern) {
  return pattern
    .replace(/^src\//, '**/') // src/ -> **/
    .replace(/\*\*\/\*\*/, '**'); // avoid double **
}

const exclusions = config.exclude
  .filter(p => !p.startsWith('test/')) // test/ is handled by sonar.tests
  .map(toSonarPattern);

// Read current sonar-project.properties
let sonarContent = fs.readFileSync(sonarPath, 'utf8');

// Find and replace coverage exclusions section
const exclusionPattern = /# Coverage exclusions[\s\S]*?(?=\n\n# |\n# [A-Z]|$)/;
const newExclusions = `# Coverage exclusions (auto-generated from config/coverage.config.json)
sonar.coverage.exclusions=\\
  ${exclusions.join(',\\\n  ')}
`;

if (sonarContent.match(exclusionPattern)) {
  sonarContent = sonarContent.replace(exclusionPattern, newExclusions);
} else {
  // Add before encoding comment or at end
  const encodingMatch = sonarContent.match(/# Encoding/);
  if (encodingMatch) {
    sonarContent = sonarContent.replace(/# Encoding/, `${newExclusions}\n\n# Encoding`);
  } else {
    sonarContent += `\n${newExclusions}\n`;
  }
}

fs.writeFileSync(sonarPath, sonarContent);
console.log('✅ Updated sonar-project.properties with coverage exclusions');
console.log(`   ${exclusions.length} exclusion patterns applied`);

