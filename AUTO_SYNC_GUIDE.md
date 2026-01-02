# Auto-Sync System Documentation

## Overview

The auto-sync system automatically detects and syncs files from specific folders in the `public` directory to Redis storage. This ensures that any file added to these folders is immediately available through the API without manual intervention.

## Monitored Folders

The system monitors these folders inside `/public`:

- 📁 **collections/** - Multi-language content files
- 📁 **config/** - Configuration files
- 📁 **data/** - Data JSON files
- 📁 **files/** - Static files (HTML, XML, etc.)
- 📁 **image/** - Image assets
- 📁 **resume/** - Resume files

## Features

### ✅ Auto-Detection
- Automatically scans monitored folders
- Detects new, modified, and deleted files
- Recursively scans subdirectories

### ⏰ Scheduled Syncing
- **Production (Vercel)**: Syncs every 30 minutes via Vercel Cron
- **Development**: Real-time syncing with file watcher

### 🔄 Dual Storage
- **Primary**: Redis (fast, in-memory)
- **Fallback**: Filesystem (when Redis is unavailable)

### 📊 Manifest Generation
- Automatically generates file manifest
- Tracks file metadata (size, modified date, etc.)
- Accessible via API

## Usage

### Production (Vercel)

#### Automatic Syncing
Once deployed to Vercel, the auto-sync runs automatically every 30 minutes.

**Vercel Cron Configuration** (in `vercel.json`):
```json
{
  "crons": [
    {
      "path": "/api/auto-sync",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

#### Manual Trigger
You can manually trigger a sync:

```bash
curl -X POST https://your-app.vercel.app/api/auto-sync
```

#### Check Sync Status
```bash
curl https://your-app.vercel.app/api/auto-sync/status
```

**Response:**
```json
{
  "redisConnected": true,
  "lastSync": "2026-01-02T10:30:00.000Z",
  "totalFiles": 156,
  "folders": ["collections", "config", "data", "files", "image", "resume"],
  "manifest": { ... }
}
```

### Development (Local)

#### Option 1: File Watcher (Recommended for Development)

Start the file watcher to automatically sync changes in real-time:

```bash
npm run sync
# or
npm run dev:watch
# or
node scripts/watch-and-sync.js
```

**What it does:**
- Watches all monitored folders
- Detects file changes instantly
- Batches changes and syncs to Redis
- Shows real-time logs

**Example output:**
```
📂 File Watcher for Auto-Sync
================================

✅ Redis connected

👀 Watching folders:
   - /path/to/project/public/collections
   - /path/to/project/public/config
   - /path/to/project/public/data
   ...

✅ Watcher ready - monitoring for changes...

📄 File added: public/data/newFile.json
🔄 Syncing 1 file(s)...
✅ Synced to Redis: data/newFile.json
✅ Batch sync completed
```

#### Option 2: Manual Trigger

Trigger a one-time sync:

```bash
npm run auto-sync
# or
curl -X POST http://localhost:3000/api/auto-sync
```

## API Endpoints

### POST /api/auto-sync

Triggers a full scan and sync of all monitored folders.

**Request:**
```bash
curl -X POST http://localhost:3000/api/auto-sync
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2026-01-02T10:30:00.000Z",
  "filesScanned": 156,
  "filesSeeded": 156,
  "filesFailed": 0,
  "folders": ["collections", "config", "data", "files", "image", "resume"],
  "manifest": {
    "generated": "2026-01-02T10:30:00.000Z",
    "totalFiles": 156,
    "files": { ... }
  }
}
```

### GET /api/auto-sync/status

Returns the current sync status and manifest.

**Request:**
```bash
curl http://localhost:3000/api/auto-sync/status
```

**Response:**
```json
{
  "redisConnected": true,
  "lastSync": "2026-01-02T10:30:00.000Z",
  "totalFiles": 156,
  "folders": ["collections", "config", "data", "files", "image", "resume"],
  "manifest": {
    "generated": "2026-01-02T10:30:00.000Z",
    "folders": [...],
    "totalFiles": 156,
    "files": {
      "collections": [...],
      "config": [...],
      ...
    }
  }
}
```

## How It Works

### 1. File Detection

The system recursively scans each monitored folder:

```javascript
public/
├── collections/
│   ├── en/
│   │   ├── config/
│   │   │   └── apiConfig.json  ✅ Detected
│   │   └── data/
│   │       └── contentLabels.json  ✅ Detected
│   └── es/
│       └── data/
│           └── contentLabels.json  ✅ Detected
├── config/
│   └── languages.json  ✅ Detected
└── data/
    └── projects.json  ✅ Detected
```

### 2. Redis Storage

Each file is stored in Redis with a key pattern:

```
cms:file:{relative-path}
```

**Examples:**
- `cms:file:collections/en/data/contentLabels.json`
- `cms:file:config/languages.json`
- `cms:file:data/projects.json`

### 3. Manifest Generation

A manifest file tracks all detected files:

```json
{
  "generated": "2026-01-02T10:30:00.000Z",
  "folders": ["collections", "config", "data", "files", "image", "resume"],
  "totalFiles": 156,
  "files": {
    "collections": [
      {
        "name": "contentLabels.json",
        "path": "collections/en/data/contentLabels.json",
        "size": 9956,
        "ext": ".json",
        "modified": "2026-01-02T09:15:00.000Z"
      }
    ]
  }
}
```

### 4. API Access

Files are accessible via the collections API:

```bash
# Access via API
GET /api/collections/en/data/contentLabels.json

# Falls back to filesystem if not in Redis
GET /collections/en/data/contentLabels.json
```

## Workflow

### Adding a New File

1. **Add file to a monitored folder:**
   ```bash
   echo '{"key": "value"}' > public/data/newFile.json
   ```

2. **Auto-detection:**
   - **Development**: Watcher detects instantly (if running)
   - **Production**: Next scheduled sync (every 30 min)

3. **Sync to Redis:**
   - File content is stored in Redis
   - Manifest is updated
   - File becomes available via API

4. **Access the file:**
   ```bash
   curl http://localhost:3000/api/collections/en/data/newFile.json
   ```

### Updating a File

1. **Modify the file:**
   ```bash
   echo '{"key": "new value"}' > public/data/existingFile.json
   ```

2. **Auto-sync updates Redis**
3. **Changes are immediately available** (after sync)

### Deleting a File

1. **Delete the file:**
   ```bash
   rm public/data/oldFile.json
   ```

2. **Auto-sync removes from Redis**
3. **File becomes unavailable via API**

## Environment Variables

### Required

- `REDIS_URL` - Redis connection URL

**Example:**
```bash
REDIS_URL=redis://localhost:6379
```

### Optional

- `CRON_SECRET` - Secret for authenticating cron requests (production)

**Example:**
```bash
CRON_SECRET=your-secret-key
```

## Vercel Configuration

The auto-sync system is configured in `vercel.json`:

```json
{
  "includeFiles": [
    "public/**",
    "views/**",
    "src/**"
  ],
  "crons": [
    {
      "path": "/api/auto-sync",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

**Key configurations:**

- **includeFiles**: Ensures all public files are included in deployment
- **crons**: Triggers auto-sync every 30 minutes

### Cron Schedule Format

The schedule uses standard cron syntax:

```
*/30 * * * *
│   │ │ │ │
│   │ │ │ └─── Day of week (0-7)
│   │ │ └───── Month (1-12)
│   │ └─────── Day of month (1-31)
│   └───────── Hour (0-23)
└─────────────  Minute (0-59)
```

**Examples:**
- `*/30 * * * *` - Every 30 minutes
- `*/15 * * * *` - Every 15 minutes
- `0 * * * *` - Every hour
- `0 0 * * *` - Every day at midnight

## Troubleshooting

### Files Not Syncing

**Check Redis connection:**
```bash
curl http://localhost:3000/api/auto-sync/status
```

Look for `"redisConnected": true`

**Manually trigger sync:**
```bash
curl -X POST http://localhost:3000/api/auto-sync
```

**Check logs:**
```bash
# Vercel
vercel logs

# Local
# Check terminal output
```

### Redis Not Connected

**Local Development:**
```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# Start Redis (macOS)
brew services start redis

# Start Redis (Linux)
sudo systemctl start redis

# Check REDIS_URL environment variable
echo $REDIS_URL
```

**Production (Vercel):**
- Verify `REDIS_URL` is set in Vercel environment variables
- Check Vercel KV is provisioned and connected

### Cron Not Running

**Verify cron configuration:**
```bash
# Check vercel.json has crons section
cat vercel.json | grep -A 5 "crons"
```

**Check Vercel dashboard:**
1. Go to your project in Vercel dashboard
2. Navigate to "Cron Jobs" tab
3. Verify the cron job is listed and enabled

**View cron execution logs:**
```bash
vercel logs --filter "/api/auto-sync"
```

### Files Not Detected

**Check folder structure:**
```bash
# Verify files exist
ls -R public/collections
ls -R public/data
```

**Check file permissions:**
```bash
# Ensure files are readable
chmod -R 644 public/**/*
```

**Verify includeFiles in vercel.json:**
```json
{
  "includeFiles": [
    "public/**",
    "views/**",
    "src/**"
  ]
}
```

## Performance Considerations

### Redis Memory
- Each file is stored in Redis
- Monitor Redis memory usage for large deployments
- Consider Redis memory limits on hosting platforms

### Sync Frequency
- Default: Every 30 minutes
- Adjust based on your update frequency
- More frequent syncs increase API calls and costs

### File Size
- Large files consume more Redis memory
- Consider external storage for large assets
- Optimize JSON files (remove unnecessary whitespace)

## Best Practices

1. **Keep files small** - Optimize JSON, compress images
2. **Use meaningful filenames** - Easy to identify and debug
3. **Organize by locale** - Keep language-specific files separate
4. **Test locally first** - Use file watcher before deploying
5. **Monitor sync status** - Regularly check `/api/auto-sync/status`
6. **Version control** - Commit all files to git
7. **Backup regularly** - Redis is in-memory, data can be lost

## Examples

### Adding a New Language

```bash
# Create new language folder
mkdir -p public/collections/fr/data

# Add content file
cat > public/collections/fr/data/contentLabels.json << 'EOF'
{
  "welcome": "Bienvenue"
}
EOF

# File is auto-detected and synced (30 min or immediately in dev)

# Access the file
curl http://localhost:3000/api/collections/fr/data/contentLabels.json
```

### Updating Configuration

```bash
# Edit config file
vim public/config/languages.json

# Save and wait for sync (or trigger manually)
curl -X POST http://localhost:3000/api/auto-sync

# Verify update
curl http://localhost:3000/api/collections/en/config/languages.json
```

### Monitoring in Production

```bash
# Check last sync time
curl https://your-app.vercel.app/api/auto-sync/status | jq '.lastSync'

# Trigger manual sync
curl -X POST https://your-app.vercel.app/api/auto-sync

# View logs
vercel logs --filter "AUTO-SYNC"
```

## Related Files

- `src/routes/auto-sync.js` - Auto-sync endpoint implementation
- `scripts/watch-and-sync.js` - File watcher for development
- `vercel.json` - Vercel configuration with cron jobs
- `public/manifest.json` - Generated file manifest

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Vercel logs: `vercel logs`
3. Check Redis connection: `curl /api/auto-sync/status`
4. Enable debug logging in `auto-sync.js`
