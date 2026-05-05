const fs = require('fs');
const path = require('path');

// Read en.ts and extract all keys
const enFile = fs.readFileSync('src/i18n/en.ts', 'utf8');

// We can just import it but it's typescript. 
// A simpler way: use regex to find all keys in the frontend codebase.
const { execSync } = require('child_process');

try {
  const result = execSync("grep -roE \"t\\(['\\\"][^'\\\"]+['\\\"]\\)\" src/ | grep -oE \"['\\\"][^'\\\"]+['\\\"]\" | tr -d \"'\\\"\" | sort -u").toString();
  const usedKeys = result.split('\n').filter(k => k.trim() !== '');
  console.log("Used keys found in source code:");
  console.log(usedKeys.join('\n'));
} catch (e) {
  console.error("Error finding used keys", e);
}
