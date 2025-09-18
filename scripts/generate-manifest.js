const fs = require('fs');
const { pwaConfig } = require('../src/config/index.ts');

const manifestPath = './public/manifest.json';

fs.writeFileSync(manifestPath, JSON.stringify(pwaConfig, null, 2));

console.log('✅ Manifest.json generated from config!');
