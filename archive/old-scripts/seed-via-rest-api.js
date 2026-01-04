#!/usr/bin/env node

/**
 * Seed KV using REST API directly
 * This bypasses the Redis connection issues by using Vercel KV REST API
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();

async function seedViaREST() {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (!kvUrl || !kvToken) {
    console.error('❌ Missing KV_REST_API_URL or KV_REST_API_TOKEN');
    process.exit(1);
  }

  console.log('\n🌱 Starting Vercel KV Seed via REST API...\n');

  const collectionsPath = path.join(__dirname, '../public/collections');
  
  if (!fs.existsSync(collectionsPath)) {
    console.error('❌ Collections folder not found:', collectionsPath);
    process.exit(1);
  }

  const files = [];
  let totalFiles = 0;

  // Collect all files
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
  console.log(`📝 Found ${totalFiles} JSON files\n`);

  let successCount = 0;
  let errorCount = 0;

  // Upload each file via REST API
  for (let i = 0; i < files.length; i++) {
    const fileData = files[i];
    
    try {
      const content = fs.readFileSync(fileData.fullPath, 'utf8');
      const key = `cms:file:${fileData.relativePath}`;
      
      // Send via REST API
      await new Promise((resolve, reject) => {
        const postData = JSON.stringify({
          "cms:file:" + fileData.relativePath: content
        });

        const options = {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${kvToken}`,
            'Content-Type': 'application/json'
          }
        };

        const req = https.request(kvUrl, options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              successCount++;
              process.stdout.write(`\r✅ [${successCount}/${totalFiles}] Uploaded...`);
              resolve();
            } else {
              errorCount++;
              reject(new Error(`HTTP ${res.statusCode}`));
            }
          });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
      });

    } catch (err) {
      errorCount++;
      console.error(`\n❌ [${errorCount}] ${fileData.relativePath}: ${err.message}`);
    }
  }

  console.log(`\n\n📊 Seeding Complete:`);
  console.log(`   Total Files: ${totalFiles}`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}\n`);

  if (successCount === totalFiles) {
    console.log('🎉 All files successfully uploaded!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some files failed to upload.\n');
    process.exit(1);
  }
}

seedViaREST();
