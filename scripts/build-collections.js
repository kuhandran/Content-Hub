#!/usr/bin/env node
/**
 * Build Collections Script
 * Runs during build to:
 * 1. Create .collections-manifest.json with all collection data
 * 2. Generate lib/collections-manifest.ts for Vercel deployment
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const COLLECTIONS_DIR = path.join(PUBLIC_DIR, 'collections');
const JSON_OUTPUT = path.join(process.cwd(), '.collections-manifest.json');
const TS_OUTPUT = path.join(process.cwd(), 'lib', 'collections-manifest.ts');

async function buildCollectionsManifest() {
  try {
    console.log('[BUILD] Creating collections manifest...');
    
    if (!fs.existsSync(COLLECTIONS_DIR)) {
      console.warn('[BUILD] ⚠ /public/collections not found, skipping');
      return;
    }

    const manifest = {};
    const languages = fs.readdirSync(COLLECTIONS_DIR);

    for (const lang of languages) {
      const langPath = path.join(COLLECTIONS_DIR, lang);
      const stat = fs.statSync(langPath);
      
      if (!stat.isDirectory()) continue;

      manifest[lang] = {};
      const folders = fs.readdirSync(langPath);

      for (const folder of folders) {
        const folderPath = path.join(langPath, folder);
        const folderStat = fs.statSync(folderPath);
        
        if (!folderStat.isDirectory()) continue;

        manifest[lang][folder] = {};
        const files = fs.readdirSync(folderPath);

        for (const file of files) {
          if (!file.endsWith('.json')) continue;

          const filePath = path.join(folderPath, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const filename = file.replace('.json', '');

          manifest[lang][folder][filename] = JSON.parse(content);
        }
      }
    }

    // Write JSON manifest
    fs.writeFileSync(JSON_OUTPUT, JSON.stringify(manifest, null, 2));
    console.log(`[BUILD] ✓ Created .collections-manifest.json with ${Object.keys(manifest).length} languages`);
    
    // Copy to public folder
    const publicManifestPath = path.join(PUBLIC_DIR, '.collections-manifest.json');
    fs.copyFileSync(JSON_OUTPUT, publicManifestPath);
    console.log(`[BUILD] ✓ Copied manifest to /public/.collections-manifest.json`);
    
    // Generate TypeScript manifest for Vercel deployment
    const tsCode = `// Auto-generated collections manifest
// This file is generated during build to embed collection data for Vercel deployment
// DO NOT EDIT - This file will be overwritten on next build

export const collectionsManifest = ${JSON.stringify(manifest, null, 2)};

export type CollectionsManifestType = typeof collectionsManifest;
`;
    
    fs.writeFileSync(TS_OUTPUT, tsCode);
    console.log(`[BUILD] ✓ Created lib/collections-manifest.ts`);
    
  } catch (error) {
    console.error('[BUILD] ✗ Error building manifest:', error.message);
    process.exit(1);
  }
}

buildCollectionsManifest();
