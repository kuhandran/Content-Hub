/**
 * File Watcher for Development
 * Watches public folders and automatically syncs changes to Redis
 * Usage: node scripts/watch-and-sync.js
 */

const chokidar = require('chokidar');
const { createClient } = require('redis');
const fs = require('fs');
const path = require('path');

// Folders to watch
const WATCH_FOLDERS = [
  'public/collections',
  'public/config',
  'public/data',
  'public/files',
  'public/image',
  'public/resume'
];

let redis = null;
let syncQueue = new Set();
let syncTimer = null;

// Initialize Redis connection
async function initRedis() {
  try {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      console.error('❌ REDIS_URL not configured');
      console.log('ℹ️  Set REDIS_URL environment variable to enable Redis syncing');
      return false;
    }

    redis = createClient({ url: redisUrl });
    await redis.connect();
    console.log('✅ Redis connected');
    return true;
  } catch (err) {
    console.error('❌ Redis connection failed:', err.message);
    return false;
  }
}

// Sync a single file to Redis
async function syncFile(filePath) {
  if (!redis) {
    console.log(`⚠️  Skipping sync (no Redis): ${filePath}`);
    return;
  }

  try {
    const fullPath = path.resolve(filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`🗑️  File deleted: ${filePath}`);
      // Remove from Redis if file was deleted
      const relativePath = path.relative('public', filePath);
      const key = `cms:file:${relativePath.replace(/\\/g, '/')}`;
      await redis.del(key);
      console.log(`✅ Removed from Redis: ${key}`);
      return;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const relativePath = path.relative('public', filePath);
    const key = `cms:file:${relativePath.replace(/\\/g, '/')}`;
    
    await redis.set(key, content);
    console.log(`✅ Synced to Redis: ${key}`);
  } catch (error) {
    console.error(`❌ Failed to sync ${filePath}:`, error.message);
  }
}

// Batch sync queued files
async function batchSync() {
  if (syncQueue.size === 0) return;

  const files = Array.from(syncQueue);
  syncQueue.clear();

  console.log(`\n🔄 Syncing ${files.length} file(s)...`);
  
  for (const file of files) {
    await syncFile(file);
  }
  
  console.log(`✅ Batch sync completed\n`);
}

// Queue file for syncing
function queueSync(filePath) {
  syncQueue.add(filePath);
  
  // Debounce: sync after 2 seconds of no changes
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    batchSync();
  }, 2000);
}

// Initialize watcher
async function startWatcher() {
  console.log('📂 File Watcher for Auto-Sync');
  console.log('================================\n');

  // Initialize Redis
  await initRedis();

  // Resolve watch paths
  const watchPaths = WATCH_FOLDERS.map(f => path.resolve(f));
  
  console.log('👀 Watching folders:');
  watchPaths.forEach(p => console.log(`   - ${p}`));
  console.log('');

  // Initialize watcher
  const watcher = chokidar.watch(watchPaths, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true, // Don't trigger events for existing files on startup
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100
    }
  });

  // Watch events
  watcher
    .on('add', filePath => {
      console.log(`📄 File added: ${path.relative(process.cwd(), filePath)}`);
      queueSync(filePath);
    })
    .on('change', filePath => {
      console.log(`📝 File changed: ${path.relative(process.cwd(), filePath)}`);
      queueSync(filePath);
    })
    .on('unlink', filePath => {
      console.log(`🗑️  File removed: ${path.relative(process.cwd(), filePath)}`);
      queueSync(filePath);
    })
    .on('error', error => {
      console.error('❌ Watcher error:', error);
    })
    .on('ready', () => {
      console.log('✅ Watcher ready - monitoring for changes...\n');
      console.log('💡 Make changes to files in watched folders to see them sync');
      console.log('⌨️  Press Ctrl+C to stop\n');
    });

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Stopping watcher...');
    await watcher.close();
    if (redis) {
      await redis.quit();
      console.log('✅ Redis connection closed');
    }
    console.log('👋 Goodbye!\n');
    process.exit(0);
  });
}

// Start the watcher
startWatcher().catch(error => {
  console.error('❌ Failed to start watcher:', error);
  process.exit(1);
});
