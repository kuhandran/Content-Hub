#!/usr/bin/env node

/**
 * Seed Vercel KV with collection files - Sequential version
 * Uploads files one by one with proper error handling
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function seedKV() {
  try {
    console.log('\n🌱 Starting Vercel KV Seed from Local Files...\n');

    const { kv } = require('@vercel/kv');

    const collectionsPath = path.join(__dirname, '../public/collections');
    
    if (!fs.existsSync(collectionsPath)) {
      console.error('❌ Collections folder not found:', collectionsPath);
      process.exit(1);
    }

    console.log(`📂 Reading from: ${collectionsPath}\n`);

    let totalFiles = 0;
    let successCount = 0;
    let errorCount = 0;
    const startTime = Date.now();
    const files = [];

    // Collect all file paths first
    function walkDir(dir, prefix = '') {
      const dirFiles = fs.readdirSync(dir);
      
      for (const file of dirFiles) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        const relativePath = prefix ? `${prefix}/${file}` : file;

        if (stat.isDirectory()) {
          walkDir(fullPath, relativePath);
        } else if (file.endsWith('.json')) {
          files.push({ fullPath, relativePath });
          totalFiles++;
        }
      }
    }

    walkDir(collectionsPath);

    console.log(`📝 Found ${totalFiles} JSON files. Starting upload...\n`);

    // Upload sequentially
    for (const fileData of files) {
      try {
        const content = fs.readFileSync(fileData.fullPath, 'utf8');
        const key = `cms:file:${fileData.relativePath}`;
        
        await kv.set(key, content, { ex: 7776000 }); // 90 days TTL
        successCount++;
        process.stdout.write(`\r✅ [${successCount}/${totalFiles}] Uploaded...`);
      } catch (err) {
        errorCount++;
        console.error(`\n❌ [${errorCount}] ${fileData.relativePath}: ${err.message}`);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`\n\n📊 Seeding Complete:`);
    console.log(`   Total Files: ${totalFiles}`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   ⏱️  Duration: ${duration}s\n`);

    if (successCount === totalFiles) {
      console.log('🎉 All files successfully uploaded to KV!\n');
      process.exit(0);
    } else {
      console.log('⚠️  Some files failed. Check errors above.\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Seeding Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

seedKV();
