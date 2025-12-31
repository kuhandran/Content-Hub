#!/usr/bin/env node

/**
 * Seed script using native Redis client with just REDIS_URL
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('redis');
require('dotenv').config();

async function seed() {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.error('\n❌ Missing REDIS_URL in .env\n');
    process.exit(1);
  }

  console.log('\n🌱 Starting Seed via REDIS_URL...\n');
  
  // Create and connect Redis client
  const redis = createClient({ url: redisUrl });
  
  redis.on('error', (err) => {
    console.error('❌ Redis Error:', err.message);
    process.exit(1);
  });

  try {
    await redis.connect();
    console.log('✅ Connected to Redis\n');
    
    const collectionsPath = path.join(__dirname, '../public/collections');
    
    if (!fs.existsSync(collectionsPath)) {
      console.error('❌ Collections folder not found:', collectionsPath);
      process.exit(1);
    }

    const files = [];

    // Collect all JSON files
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
        }
      }
    }

    walkDir(collectionsPath);
    console.log(`📝 Found ${files.length} JSON files\n`);

    let successCount = 0;
    let errorCount = 0;

    // Upload each file sequentially
    for (let i = 0; i < files.length; i++) {
      const fileData = files[i];
      
      try {
        const content = fs.readFileSync(fileData.fullPath, 'utf8');
        const key = `cms:file:${fileData.relativePath}`;
        
        // Store in Redis with 90-day TTL (in seconds)
        await redis.setEx(key, 7776000, content);
        
        successCount++;
        const percent = Math.round((successCount / files.length) * 100);
        process.stdout.write(`\r✅ [${successCount}/${files.length}] ${percent}% - ${fileData.relativePath.substring(0, 40)}`);
      } catch (err) {
        errorCount++;
        console.error(`\n❌ ${fileData.relativePath}: ${err.message}`);
      }
    }

    console.log(`\n\n📊 Seeding Complete:`);
    console.log(`   Total: ${files.length}`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}\n`);

    await redis.disconnect();

    if (successCount === files.length) {
      console.log('🎉 All files uploaded to Redis!\n');
      process.exit(0);
    } else {
      console.log(`⚠️  ${successCount}/${files.length} uploaded\n`);
      process.exit(errorCount > 0 ? 1 : 0);
    }

  } catch (error) {
    console.error('\n❌ Seed Error:', error.message);
    await redis.disconnect();
    process.exit(1);
  }
}

seed();
