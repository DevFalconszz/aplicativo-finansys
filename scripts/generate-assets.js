#!/usr/bin/env node

/**
 * Script para gerar assets PNG a partir dos SVGs
 * 
 * Uso:
 * 1. Instale o sharp: npm install sharp
 * 2. Execute: node scripts/generate-assets.js
 */

const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');
const svgFiles = [
  { input: 'icon.svg', output: 'icon.png', size: 1024 },
  { input: 'splash.svg', output: 'splash.png', size: 1024 },
  { input: 'adaptive-icon.svg', output: 'adaptive-icon.png', size: 1024 },
];

console.log('🔍 Verificando SVGs...');

svgFiles.forEach(({ input, output, size }) => {
  const inputPath = path.join(assetsDir, input);
  const outputPath = path.join(assetsDir, output);
  
  if (fs.existsSync(inputPath)) {
    console.log(`✅ ${input} encontrado`);
  } else {
    console.log(`❌ ${input} não encontrado`);
  }
});

console.log('\n📝 Para converter SVG para PNG, você pode:');
console.log('1. Usar o sharp: npm install sharp');
console.log('2. Usar ferramentas online como svgtopng.com');
console.log('3. Usar o Inkscape: inkscape --export-png=output.png input.svg');
console.log('\nOu substitua manualmente pelos arquivos PNG do Finansys.');
