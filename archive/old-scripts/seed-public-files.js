#!/usr/bin/env node

/**
 * Seed all public files (config, images, resume, files) to Redis
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('redis');
require('dotenv').config();

async function seedPublicFiles() {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.error('\n❌ Missing REDIS_URL in .env\n');
    process.exit(1);
  }

  console.log('\n🌱 Starting Public Files Seed to Redis...\n');
  
  const redis = createClient({ url: redisUrl });
  
  redis.on('error', (err) => {
    console.error('❌ Redis Error:', err.message);
    process.exit(1);
  });

  try {
    await redis.connect();
    console.log('✅ Connected to Redis\n');

    const publicPath = path.join(__dirname, '../public');
    
    // Directories to seed (skip collections, they're already done)
    const dirs = [
      { source: 'config', prefix: 'cms:config:' },
      { source: 'image', prefix: 'cms:image:' },
      { source: 'resume', prefix: 'cms:resume:' },
      { source: 'files', prefix: 'cms:files:' }
    ];

    let totalFiles = 0;
    let successCount = 0;
    let errorCount = 0;

    for (const dir of dirs) {
      const dirPath = path.join(publicPath, dir.source);
      
      if (!fs.existsSync(dirPath)) {
        console.log(`⚠️  Directory not found: ${dir.source}`);
        continue;
      }

      const files = [];
      
      // Collect files in this directory
      function walkDir(dirToWalk, prefix = '') {
        const items = fs.readdirSync(dirToWalk);
        
        for (const item of items) {
          if (item.startsWith('.')) continue;
          
          const fullPath = path.join(dirToWalk, item);
          const stat = fs.statSync(fullPath);
          const relativePath = prefix ? `${prefix}/${item}` : item;

          if (stat.isDirectory()) {
            walkDir(fullPath, relativePath);
          } else {
            files.push({ fullPath, relativePath });
          }
        }
      }

      walkDir(dirPath);
      
      console.log(`📁 ${dir.source}: Found ${files.length} files`);

      // Upload each file
      for (const file of files) {
        try {
          const content = fs.readFileSync(file.fullPath);
          const key = `${dir.prefix}${file.relativePath}`;
          
          // Store as base64 for binary files
          const contentStr = content.toString('base64');
          await redis.setEx(key, 7776000, contentStr);
          
          successCount++;
          totalFiles++;
        } catch (err) {
          errorCount++;
          console.error(`  ❌ ${file.relativePath}: ${err.message}`);
        }
      }
    }

    console.log(`\n📊 Seeding Complete:`);
    console.log(`   Total Files: ${totalFiles}`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}\n`);

    await redis.disconnect();

    if (successCount === totalFiles && totalFiles > 0) {
      console.log('🎉 All public files uploaded to Redis!\n');
      process.exit(0);
    } else if (totalFiles === 0) {
      console.log('⚠️  No files found to upload.\n');
      process.exit(0);
    } else {
      console.log('⚠️  Some files failed to upload.\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Seed Error:', error.message);
    await redis.disconnect();
    process.exit(1);
  }
}

seedPublicFiles();
