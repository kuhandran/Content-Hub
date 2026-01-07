#!/usr/bin/env node
/**
 * Build Collections Script
 * Runs during build to embed /public/collections into a JSON file
 * This allows Vercel serverless functions to access the data
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const COLLECTIONS_DIR = path.join(PUBLIC_DIR, 'collections');
const OUTPUT_FILE = path.join(process.cwd(), '.collections-manifest.json');

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

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));
    console.log(`[BUILD] ✓ Created .collections-manifest.json with ${Object.keys(manifest).length} languages`);
    
    // Also copy to public folder so it's definitely available
    const publicManifestPath = path.join(PUBLIC_DIR, '.collections-manifest.json');
    fs.copyFileSync(OUTPUT_FILE, publicManifestPath);
    console.log(`[BUILD] ✓ Copied manifest to /public/.collections-manifest.json`);
  } catch (error) {
    console.error('[BUILD] ✗ Error building manifest:', error.message);
    process.exit(1);
  }
}

buildCollectionsManifest();
