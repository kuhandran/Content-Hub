#!/usr/bin/env node

/**
 * Seed Vercel KV with collection files from filesystem
 * Run this once to migrate from filesystem to KV storage
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const VercelKVStorage = require('../lib/vercel-kv-storage');

async function seedKV() {
  if (!process.env.KV_URL) {
    console.error('❌ KV_URL not set in environment variables');
    process.exit(1);
  }

  console.log('🌱 Starting Vercel KV seed...');
  console.log('📍 KV_URL:', process.env.KV_URL.substring(0, 50) + '...');

  try {
    const storage = new VercelKVStorage();

    // Scan filesystem collections
    const collectionsPath = path.join(__dirname, '../public/collections');
    
    if (!fs.existsSync(collectionsPath)) {
      console.error('❌ Collections folder not found at:', collectionsPath);
      process.exit(1);
    }

    const files = [];
    let totalSize = 0;

    function scanDir(dir, baseDir = '') {
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        if (item.startsWith('.')) return;
        const fullPath = path.join(dir, item);
        const relativePath = path.join(baseDir, item).replace(/\\/g, '/');
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scanDir(fullPath, relativePath);
        } else if (item.endsWith('.json')) {
          files.push({
            relativePath,
            fullPath,
            size: stat.size
          });
          totalSize += stat.size;
        }
      });
    }

    scanDir(collectionsPath);

    console.log(`📁 Found ${files.length} JSON files (${(totalSize / 1024).toFixed(2)} KB)`);

    // Upload each file
    let uploaded = 0;
    for (const file of files) {
      try {
        const content = fs.readFileSync(file.fullPath, 'utf-8');
        await storage.setFile(file.relativePath, JSON.parse(content));
        uploaded++;
        process.stdout.write(`\r✅ Uploaded ${uploaded}/${files.length} files`);
      } catch (error) {
        console.error(`\n❌ Error uploading ${file.relativePath}:`, error.message);
      }
    }

    console.log('\n✅ Seeding complete!');
    const stats = await storage.getStats();
    console.log(`📊 KV Statistics: ${stats.totalFiles} files, ${(stats.totalSize / 1024).toFixed(2)} KB`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedKV();
