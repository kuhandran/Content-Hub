/**
 * Seed files to Redis during Vercel build
 * This runs at build time when files are accessible
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('redis');

async function seedRedis() {
  console.log('[SEED] 🚀 Build seed script started');
  console.log('[SEED] Environment check:', {
    hasRedisUrl: !!process.env.REDIS_URL,
    nodeEnv: process.env.NODE_ENV,
    vercel: process.env.VERCEL
  });

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.log('[SEED] ⚠️  No REDIS_URL found, skipping Redis seed');
    console.log('[SEED] ℹ️  To enable seeding, add REDIS_URL to Vercel environment variables');
    
    // Still check if files exist
    const publicDir = path.join(__dirname, '../public');
    console.log('[SEED] Checking public directory:', publicDir);
    console.log('[SEED] Public dir exists:', fs.existsSync(publicDir));
    
    if (fs.existsSync(publicDir)) {
      const contents = fs.readdirSync(publicDir);
      console.log('[SEED] Public folder contents:', contents);
    }
    
    return;
  }

  console.log('[SEED] 🔄 Connecting to Redis...');
  
  let redis;
  try {
    redis = createClient({
      url: redisUrl,
      socket: {
        tls: true,
        rejectUnauthorized: false
      }
    });

    redis.on('error', (err) => console.error('[SEED] Redis error:', err));
    await redis.connect();
    console.log('[SEED] ✅ Connected to Redis');
  } catch (error) {
    console.error('[SEED] ❌ Redis connection failed:', error.message);
    return;
  }

  const publicDir = path.join(__dirname, '../public');
  const foldersToScan = ['collections', 'config', 'data', 'files', 'image', 'resume'];
  
  let totalSeeded = 0;
  let totalFailed = 0;
  const manifest = {
    generated: new Date().toISOString(),
    folders: foldersToScan,
    totalFiles: 0,
    files: {}
  };

  console.log('[SEED] 📂 Scanning and seeding files...');

  for (const folder of foldersToScan) {
    const folderPath = path.join(publicDir, folder);
    manifest.files[folder] = [];

    if (!fs.existsSync(folderPath)) {
      console.log(`[SEED] ⚠️  Folder not found: ${folder}/`);
      continue;
    }

    const files = scanDirectory(folderPath, publicDir);
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file.fullPath, 'utf8');
        const key = `cms:file:${file.path}`;
        
        await redis.set(key, content);
        totalSeeded++;
        
        manifest.files[folder].push({
          name: file.name,
          path: file.path,
          size: file.size,
          ext: file.ext
        });
      } catch (error) {
        console.error(`[SEED] ❌ Failed to seed ${file.path}:`, error.message);
        totalFailed++;
      }
    }

    console.log(`[SEED] ✅ Seeded ${files.length} files from ${folder}/`);
  }

  // Save manifest to Redis
  manifest.totalFiles = totalSeeded;
  await redis.set('cms:manifest', JSON.stringify(manifest, null, 2));
  console.log('[SEED] ✅ Manifest saved to Redis');

  console.log(`[SEED] 🎉 Complete: ${totalSeeded} files seeded, ${totalFailed} failed`);
  
  await redis.quit();
}

function scanDirectory(dirPath, baseDir) {
  const files = [];
  
  try {
    if (!fs.existsSync(dirPath)) {
      return files;
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        files.push(...scanDirectory(fullPath, baseDir));
      } else if (entry.isFile()) {
        const relativePath = path.relative(baseDir, fullPath);
        files.push({
          name: entry.name,
          path: relativePath.replace(/\\/g, '/'),
          fullPath: fullPath,
          size: fs.statSync(fullPath).size,
          ext: path.extname(entry.name)
        });
      }
    }
  } catch (error) {
    console.error(`[SEED] Error scanning ${dirPath}:`, error.message);
  }

  return files;
}

// Run seed
seedRedis().catch(error => {
  console.error('[SEED] ❌ Seed failed:', error);
  process.exit(0); // Don't fail build, just warn
});
