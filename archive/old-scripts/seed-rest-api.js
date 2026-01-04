#!/usr/bin/env node

/**
 * Simple REST API based seed script
 * Uses fetch to upload files to Vercel KV REST API
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function seedViaREST() {
  const kvUrl = process.env.KV_REST_API_URL?.replace(/\/$/, '');
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (!kvUrl || !kvToken) {
    console.error('\n❌ Missing KV_REST_API_URL or KV_REST_API_TOKEN\n');
    process.exit(1);
  }

  console.log('\n🌱 Starting Vercel KV Seed via REST API...\n');
  console.log(`📍 KV URL: ${kvUrl}\n`);

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
  const errors = [];

  // Upload each file
  for (let i = 0; i < files.length; i++) {
    const fileData = files[i];
    
    try {
      const content = fs.readFileSync(fileData.fullPath, 'utf8');
      const key = `cms:file:${fileData.relativePath}`;
      
      // Use Vercel KV SET command via REST API
      const response = await fetch(`${kvUrl}/set/${key}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${kvToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: content, ex: 7776000 }) // 90 days TTL
      });

      if (response.ok) {
        successCount++;
        const percent = Math.round((successCount / files.length) * 100);
        process.stdout.write(`\r✅ [${successCount}/${files.length}] ${percent}% - ${fileData.relativePath.substring(0, 40)}`);
      } else {
        errorCount++;
        const error = await response.text();
        errors.push(`${fileData.relativePath}: ${response.status} ${error.substring(0, 50)}`);
      }

    } catch (err) {
      errorCount++;
      errors.push(`${fileData.relativePath}: ${err.message}`);
    }
  }

  console.log(`\n\n📊 Seeding Summary:`);
  console.log(`   Total Files: ${files.length}`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}\n`);

  if (errors.length > 0 && errors.length <= 5) {
    console.log('Errors:');
    errors.forEach(e => console.log(`  - ${e}`));
    console.log();
  }

  if (successCount === files.length) {
    console.log('🎉 All files successfully uploaded to KV!\n');
    process.exit(0);
  } else if (successCount > 0) {
    console.log(`⚠️  ${successCount} files uploaded, ${errorCount} failed.\n`);
    process.exit(1);
  } else {
    console.log('❌ No files uploaded.\n');
    process.exit(1);
  }
}

seedViaREST().catch(err => {
  console.error('\n❌ Seed Error:', err.message);
  process.exit(1);
});
