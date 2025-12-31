#!/usr/bin/env node

/**
 * Seed Vercel KV with collection files from /public/collections/
 * This reads all local JSON files and uploads them to Redis
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function seedKV() {
  try {
    console.log('\n🌱 Starting Vercel KV Seed from Local Files...\n');

    // Import Vercel KV
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

    // Recursively read all JSON files
    function walkDir(dir, prefix = '') {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        const relativePath = prefix ? `${prefix}/${file}` : file;

        if (stat.isDirectory()) {
          walkDir(fullPath, relativePath);
        } else if (file.endsWith('.json')) {
          totalFiles++;
          const content = fs.readFileSync(fullPath, 'utf8');
          const key = `cms:file:${relativePath}`;
          
          // Upload to KV
          kv.set(key, content, { ex: 7776000 })
            .then(() => {
              successCount++;
              console.log(`✅ [${successCount}/${totalFiles}] ${relativePath}`);
            })
            .catch(err => {
              errorCount++;
              console.error(`❌ [${errorCount}] ${relativePath}: ${err.message}`);
            });
        }
      }
    }

    // Start walking
    walkDir(collectionsPath);

    // Wait for all operations to complete (simple approach)
    await new Promise(resolve => setTimeout(resolve, 5000));

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`\n📊 Seeding Complete:`);
    console.log(`   Total Files: ${totalFiles}`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   ⏱️  Duration: ${duration}s\n`);

    if (successCount === totalFiles) {
      console.log('🎉 All files successfully uploaded to KV!\n');
      process.exit(0);
    } else {
      console.log('⚠️  Some files failed to upload. Check errors above.\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Seeding Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

seedKV();
