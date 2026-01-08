# Sync Strategy & Build Process

## Overview

Content Hub uses a **dual-layer sync strategy**:

1. **Build-Time Sync** (Automatic during `npm run build`)
   - Drops all existing tables
   - Scans `/public` folder completely
   - Creates fresh database tables
   - Loads all data into Supabase
   - Generates file hashes for change tracking

2. **Runtime Sync** (On-demand via API endpoint)
   - Detects changes in `/public` folder
   - Compares against `sync_manifest` table
   - Identifies new, modified, and deleted files
   - Applies changes to database
   - Maintains bidirectional sync

---

## Build-Time Sync Process

### When It Runs
```bash
npm run build
```

### Execution Flow

```
1. npm run build
   ├─ Call next build command
   └─ During build, execute scripts/setup-database.ts
      ├─ Connect to Supabase
      ├─ Drop all existing tables
      ├─ Create fresh database schema
      ├─ Scan /public folder recursively
      ├─ Parse files and detect types
      ├─ Calculate SHA256 hashes for all files
      ├─ Insert data into appropriate tables
      ├─ Populate sync_manifest with file tracking
      └─ Exit with success/failure status
```

### What Gets Dropped and Recreated

**Tables Dropped:**
- `collections` - Language-specific collection data
- `config_files` - Configuration files
- `data_files` - Content data files
- `static_files` - Static assets (manifests, robots.txt, etc.)
- `images` - Image metadata
- `resumes` - Resume/document metadata
- `javascript_files` - JavaScript files
- `sync_manifest` - File hash tracking

### Data Sources Scanned

```
/public/
├── collections/[lang]/config/*      → collections table (lang, type=config)
├── collections/[lang]/data/*        → collections table (lang, type=data)
├── config/*                         → config_files table
├── data/*                           → data_files table
├── files/*                          → static_files table
├── image/*                          → images table
├── js/*                             → javascript_files table
└── resume/*                         → resumes table
```

### Build Output Example

```
╔════════════════════════════════════════════╗
║     Content Hub - Database Setup Script    ║
║         Running during npm build           ║
╚════════════════════════════════════════════╝

🔍 Scanning /public folder...
✅ Found 156 files

🗑️  Dropping existing tables...
✅ Cleared collections
✅ Cleared static_files
✅ Cleared config_files
✅ Cleared data_files
✅ Cleared images
✅ Cleared resumes
✅ Cleared javascript_files
✅ Cleared sync_manifest

📊 Creating database tables...
✅ Database tables created successfully

📥 Loading data into tables...
✅ Loaded 78 records into collections
✅ Loaded 15 records into config_files
✅ Loaded 23 records into data_files
✅ Loaded 20 records into static_files
✅ Loaded 8 records into images
✅ Loaded 3 records into resumes
✅ Loaded 5 records into javascript_files
✅ Loaded 156 records into sync_manifest

╔════════════════════════════════════════════╗
║   ✅ Database setup completed successfully ║
╚════════════════════════════════════════════╝
```

---

## Runtime Sync (API Endpoint)

### Endpoint

```
POST /api/admin/sync
Content-Type: application/json

Body:
{
  "mode": "scan" | "pull" | "push"
}
```

### Mode 1: Scan (Detection Only)

**Purpose:** Detect changes without applying them

**Request:**
```bash
curl -X POST http://localhost:3000/api/admin/sync \
  -H "Content-Type: application/json" \
  -d '{ "mode": "scan" }'
```

**Response:**
```json
{
  "status": "success",
  "mode": "scan",
  "files_scanned": 156,
  "new_files": 3,
  "modified_files": 2,
  "deleted_files": 1,
  "timestamp": "2026-01-08T10:30:00Z",
  "changes": [
    {
      "path": "public/collections/en/data/newfile.json",
      "relativePath": "collections/en/data/newfile.json",
      "status": "new",
      "table": "collections",
      "hash": "abc123...",
      "fileType": "json"
    },
    {
      "path": "public/config/updated.json",
      "relativePath": "config/updated.json",
      "status": "modified",
      "table": "config_files",
      "hash": "def456...",
      "fileType": "json"
    },
    {
      "path": "public/files/old.json",
      "relativePath": "files/old.json",
      "status": "deleted",
      "table": "static_files",
      "hash": "ghi789...",
      "fileType": "json"
    }
  ]
}
```

### Mode 2: Pull (Apply Changes from /public to DB)

**Purpose:** Sync changes from `/public` folder into database

**Request:**
```bash
curl -X POST http://localhost:3000/api/admin/sync \
  -H "Content-Type: application/json" \
  -d '{ "mode": "pull" }'
```

**Response:**
```json
{
  "status": "success",
  "mode": "pull",
  "files_scanned": 156,
  "new_files": 3,
  "modified_files": 2,
  "deleted_files": 1,
  "timestamp": "2026-01-08T10:30:00Z",
  "changes": [
    {
      "path": "public/collections/en/data/newfile.json",
      "relativePath": "collections/en/data/newfile.json",
      "status": "new",
      "table": "collections",
      "hash": "abc123...",
      "fileType": "json"
    }
  ]
}
```

**What Happens:**
1. Detects all changes in `/public` folder
2. For new/modified files:
   - Reads file content
   - Parses JSON if applicable
   - Inserts/updates in appropriate database table
   - Updates `sync_manifest` with new hash
3. For deleted files:
   - Removes from database table
   - Removes from `sync_manifest`
4. Clears Redis cache for affected keys

### Mode 3: Push (Apply Changes from DB to /public)

**Status:** Not yet implemented

**Future Usage:**
```bash
curl -X POST http://localhost:3000/api/admin/sync \
  -H "Content-Type: application/json" \
  -d '{ "mode": "push" }'
```

**Future Purpose:**
- Write database changes back to `/public` folder
- Version control integration
- Ensures `/public` stays in sync with database changes
- Requires authentication

---

## Change Detection Mechanism

### File Hash Tracking

Every synced file has a **SHA256 hash** stored in `sync_manifest`:

```sql
SELECT file_path, file_hash, last_synced FROM sync_manifest;
```

**Example:**
```
file_path                                    | file_hash | last_synced
public/collections/en/data/achievements.json | abc123... | 2026-01-08 10:30:00
public/config/apiRouting.json                | def456... | 2026-01-08 09:15:00
```

### Change Detection Logic

```typescript
// On each scan:
currentFileHash = calculateHash(fileContent)
storedFileHash = syncManifest.get(filePath).file_hash

if (!storedFileHash) {
  // File is NEW
  status = 'new'
} else if (storedFileHash !== currentFileHash) {
  // File was MODIFIED
  status = 'modified'
} else {
  // File is UNCHANGED
  status = 'unchanged'
}

// After scan, check manifest for deleted files
for (storedFile in syncManifest) {
  if (!fileSystem.exists(storedFile)) {
    status = 'deleted'
  }
}
```

---

## Bidirectional Sync Flow

### Forward Sync: /public → Database

```
User adds/modifies/deletes file in /public
        ↓
POST /api/admin/sync { mode: 'pull' }
        ↓
Endpoint scans /public folder
        ↓
Compares with sync_manifest
        ↓
Detects changes
        ↓
Updates database tables
        ↓
Updates sync_manifest with new hashes
        ↓
Clears Redis cache
        ↓
Response with summary
```

### Reverse Sync: Database → /public (Future)

```
User updates record in database
        ↓
Application triggers sync
        ↓
Queries database for changes
        ↓
Compares with /public folder
        ↓
Writes updated JSON to /public
        ↓
Updates file hashes in sync_manifest
        ↓
Git commit changes (optional)
```

---

## Development Workflow

### Scenario 1: Add New Collection File

```bash
# 1. Add new file to /public
echo '{ "data": "new content" }' > public/collections/en/data/newfile.json

# 2. Sync to database
curl -X POST http://localhost:3000/api/admin/sync \
  -H "Content-Type: application/json" \
  -d '{ "mode": "pull" }'

# 3. Verify in database
SELECT * FROM collections WHERE filename = 'newfile' AND lang = 'en';

# 4. Query via API
curl http://localhost:3000/api/collections/en/data/newfile
```

### Scenario 2: Modify Existing Config

```bash
# 1. Edit file in /public
nano public/config/apiRouting.json

# 2. Check changes
curl -X POST http://localhost:3000/api/admin/sync \
  -H "Content-Type: application/json" \
  -d '{ "mode": "scan" }'

# 3. Apply changes
curl -X POST http://localhost:3000/api/admin/sync \
  -H "Content-Type: application/json" \
  -d '{ "mode": "pull" }'

# 4. Verify update
curl http://localhost:3000/api/config/apiRouting
```

### Scenario 3: Deployment Pipeline

```bash
# 1. Make changes in /public locally
# 2. Commit to Git
git add public/
git commit -m "Update collection files"

# 3. Push to repository
git push origin main

# 4. Vercel webhook triggers
# 5. Vercel runs: npm run build
# 6. During build, setup-database.ts executes
# 7. All tables dropped and recreated
# 8. Fresh data loaded from /public
# 9. Application deployed with latest data
# 10. Redis cache warmed on first requests
```

---

## Cache Invalidation

### When Cache is Cleared

1. **File modification detected**
   - Clear: `collections:{lang}:{type}:{filename}`
   - Clear: `config:{filename}`
   - Clear: `data:{filename}`
   - etc.

2. **Bulk sync operation**
   - Clear all affected cache keys
   - Use Redis pattern matching: `UNLINK collections:*`

3. **Database table update**
   - Immediate cache invalidation
   - Next request rebuilds cache

### Cache Keys

```
collections:en:data:achievements    → JSON content
collections:en:config:urlConfig     → JSON content
config:apiRouting                   → JSON content
data:skills                         → JSON content
static_file:manifest                → File content
images:logo                         → Metadata
resumes:cv                          → Metadata
js:apiRouter                        → JavaScript code
```

---

## Monitoring & Debugging

### Check Sync Status

```bash
curl http://localhost:3000/api/admin/sync

# Response:
# {
#   "status": "success",
#   "message": "Sync endpoint is active",
#   "available_modes": ["scan", "pull", "push"],
#   "timestamp": "2026-01-08T10:30:00Z"
# }
```

### View Last Synced Files

```sql
SELECT file_path, last_synced, table_name
FROM sync_manifest
ORDER BY last_synced DESC
LIMIT 10;
```

### Find Changed Files

```sql
-- Find files that changed since last sync
SELECT file_path, file_hash
FROM sync_manifest
WHERE last_synced > NOW() - INTERVAL '1 hour'
ORDER BY last_synced DESC;
```

### File Count by Table

```sql
SELECT table_name, COUNT(*) as count
FROM sync_manifest
GROUP BY table_name
ORDER BY count DESC;
```

### View Sync History

```sql
-- Show all synced files by table
SELECT table_name, COUNT(*) as total_files
FROM sync_manifest
GROUP BY table_name;

-- Result:
-- table_name        | total_files
-- collections       | 78
-- config_files      | 15
-- data_files        | 23
-- static_files      | 20
-- images            | 8
-- resumes           | 3
-- javascript_files  | 5
```

---

## Environment Configuration

### Required Variables

```bash
# .env file
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Optional
REDIS_URL=redis://default:password@host:port
```

### Vercel Deployment

1. Set environment variables in Vercel dashboard
2. Enable build command: `npm run build`
3. During build, setup-database.ts automatically runs
4. Database synced with latest /public data
5. Deployment completes successfully

---

## Troubleshooting

### Issue: Build Hangs During Sync

**Solution:**
```bash
# Check Supabase connection
curl https://xxxx.supabase.co/rest/v1/collections \
  -H "apikey: your-anon-key"

# Verify environment variables
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

### Issue: Files Not Syncing

**Solution:**
```bash
# 1. Manually trigger scan
curl -X POST http://localhost:3000/api/admin/sync \
  -H "Content-Type: application/json" \
  -d '{ "mode": "scan" }'

# 2. Check for parse errors
# Look for ⚠️  warnings in response

# 3. Verify /public folder structure
ls -la public/collections/en/data/
```

### Issue: Hash Mismatch

**Solution:**
```bash
# Reset sync_manifest for a specific table
DELETE FROM sync_manifest WHERE table_name = 'collections';

# Then re-scan
POST /api/admin/sync { mode: 'pull' }
```

### Issue: Redis Cache Stale

**Solution:**
```bash
# Clear entire cache
FLUSHDB  # or use Vercel KV dashboard

# Or clear specific pattern
UNLINK collections:*
```

---

## Performance Considerations

### File Scan Time
- **Typical:** 100-200 files scan in < 1 second
- **Large deployments:** 1000+ files scan in < 5 seconds

### Database Insert Time
- **Typical:** 100 records insert in < 500ms
- **Large deployments:** 1000 records insert in < 3 seconds

### Sync Endpoint Response Time
- **Scan mode:** 500ms - 2s
- **Pull mode:** 1s - 5s (depends on file count and DB performance)

### Cache Hit Rate
- **First request:** Cache miss, loads from DB
- **Subsequent requests:** Cache hit, < 1ms response time
- **After update:** Cache cleared, next request rebuilds

---

## Security Notes

- ✅ Build script uses `SUPABASE_SERVICE_ROLE_KEY` (full permissions)
- ✅ API endpoints should use authentication in production
- ✅ File hash comparison prevents duplicate loads
- ✅ Sync manifest tracks all changes for audit trail
- ✅ RLS (Row Level Security) can enforce access control

---

## Next Steps

1. ✅ Create `package.json` with dependencies
2. ✅ Create Supabase client (`lib/supabase.ts`)
3. ✅ Create Redis client (`lib/redis.ts`)
4. ✅ Implement API endpoints for data retrieval
5. ✅ Set up build hooks
6. 🔄 Deploy to Vercel
7. 🔄 Test complete sync pipeline
8. 🔄 Monitor in production

