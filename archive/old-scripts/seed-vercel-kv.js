/**
 * Seed Vercel KV with file manifest and content
 * Run: VERCEL_KV_REST_API_URL=... VERCEL_KV_REST_API_TOKEN=... node scripts/seed-vercel-kv.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const VERCEL_KV_URL = process.env.VERCEL_KV_REST_API_URL;
const VERCEL_KV_TOKEN = process.env.VERCEL_KV_REST_API_TOKEN;

if (!VERCEL_KV_URL || !VERCEL_KV_TOKEN) {
  console.error('❌ Missing VERCEL_KV_REST_API_URL or VERCEL_KV_REST_API_TOKEN');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/manifest.json'), 'utf8'));

/**
 * Make request to Vercel KV REST API
 */
function kvRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(VERCEL_KV_URL + path);
    
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${VERCEL_KV_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * Seed manifest
 */
async function seedManifest() {
  try {
    console.log('📝 Seeding manifest...');
    await kvRequest('POST', '/multi', {
      args: [
        'SET',
        'cms:manifest',
        JSON.stringify(manifest)
      ]
    });
    console.log('✅ Manifest seeded');
  } catch (err) {
    console.error('❌ Error seeding manifest:', err.message);
  }
}

/**
 * Seed file listings
 */
async function seedListings() {
  try {
    console.log('📝 Seeding file listings...');
    
    for (const [dir, files] of Object.entries(manifest.files)) {
      const listKey = `cms:list:${dir}`;
      const data = {
        path: dir,
        count: files.length,
        items: files,
        timestamp: new Date().toISOString()
      };
      
      await kvRequest('POST', '/multi', {
        args: [
          'SET',
          listKey,
          JSON.stringify(data)
        ]
      });
      console.log(`  ✅ ${dir}: ${files.length} files`);
    }
  } catch (err) {
    console.error('❌ Error seeding listings:', err.message);
  }
}

/**
 * Main
 */
async function main() {
  console.log('🚀 Starting Vercel KV seeding...');
  console.log(`📊 Total files to seed: ${Object.values(manifest.files).reduce((sum, arr) => sum + arr.length, 0)}`);
  
  await seedManifest();
  await seedListings();
  
  console.log('✅ Seeding complete!');
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
