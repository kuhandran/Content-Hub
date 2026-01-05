/**
 * Seed files to Redis during Vercel build
 * This runs at build time when files are accessible
 */

const fs = require('fs');
const path = require('path');
const Redis = require('ioredis');

async function seedRedis() {
  const redisUrl = process.env.KV_REST_API_URL || process.env.REDIS_URL;
  const redisToken = process.env.KV_REST_API_TOKEN;

  if (!redisUrl) {
    console.log('[SEED] ⚠️  No Redis URL found, skipping seed');
    return;
  }

  console.log('[SEED] 🔄 Connecting to Redis...');
  
  let redis;
  try {
    if (redisToken) {
      // Vercel KV
      redis = new Redis(redisUrl, {
        token: redisToken,
        tls: { rejectUnauthorized: false }
      });
    } else {
      // Standard Redis
      redis = new Redis(redisUrl);
    }
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
