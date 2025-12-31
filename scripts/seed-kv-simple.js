#!/usr/bin/env node

/**
 * Simple KV Seed Script
 * Uses the storage abstraction to upload collection files
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// We'll use a simpler approach with @vercel/kv directly
const { kv } = require('@vercel/kv');

async function seedKV() {
  console.log('🌱 Starting Vercel KV seed...');
  
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    console.error('❌ KV environment variables not set');
    console.error('   Set: KV_REST_API_URL and KV_REST_API_TOKEN');
    process.exit(1);
  }

  try {
    // Test connection
    console.log('🔗 Testing KV connection...');
    await kv.ping();
    console.log('✅ KV connection successful');

    // Scan filesystem collections
    const collectionsPath = path.join(__dirname, '../public/collections');
    console.log(`📁 Scanning collections at ${collectionsPath}`);
    
    if (!fs.existsSync(collectionsPath)) {
      console.error('❌ Collections folder not found');
      process.exit(1);
    }

    const files = [];
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
          files.push({ relativePath, fullPath });
        }
      });
    }

    scanDir(collectionsPath);
    console.log(`📊 Found ${files.length} JSON files to upload`);

    // Upload each file
    let uploaded = 0;
    let failed = 0;

    for (const file of files) {
      try {
        const content = fs.readFileSync(file.fullPath, 'utf-8');
        const parsed = JSON.parse(content);
        
        // Store in KV with prefix
        const key = `cms:file:${file.relativePath}`;
        await kv.set(key, JSON.stringify({
          content: parsed,
          updatedAt: new Date().toISOString(),
          size: content.length
        }), { ex: 86400 * 90 }); // 90 day expiry
        
        uploaded++;
        process.stdout.write(`\r✅ Uploaded ${uploaded}/${files.length} files`);
      } catch (error) {
        failed++;
        console.error(`\n❌ Error uploading ${file.relativePath}:`, error.message);
      }
    }

    console.log('\n✅ Seeding complete!');
    console.log(`📈 Results: ${uploaded} uploaded, ${failed} failed`);
    
    // Verify
    const keys = await kv.keys('cms:file:*');
    console.log(`🔍 Verification: ${keys.length} files in KV storage`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedKV();
