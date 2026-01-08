# Quick Reference Guide - Database & Sync Operations

## 📋 Commands Reference

### Build & Deploy

```bash
# Local development build
npm run build

# Output: 
# 🔍 Scanning /public folder...
# ✅ Found 156 files
# ✅ Loaded 78 records into collections
# ✅ Database setup completed

# Start development server
npm run dev
# Navigate to: http://localhost:3000

# Deploy to Vercel
git push origin main
# Automatic build + database setup
```

---

## 🔄 Sync Operations (Runtime)

### Scan for Changes (Detect Only)

```bash
curl -X POST http://localhost:3000/api/admin/sync \
  -H "Content-Type: application/json" \
  -d '{ "mode": "scan" }'

# Response shows:
# - files_scanned: 156
# - new_files: 3
# - modified_files: 2
# - deleted_files: 1
# - changes: [list of changes]
```

### Pull Changes to Database

```bash
curl -X POST http://localhost:3000/api/admin/sync \
  -H "Content-Type: application/json" \
  -d '{ "mode": "pull" }'

# Response shows:
# - Successfully synced changes
# - Cache cleared for affected keys
# - sync_manifest updated
```

### Check Sync Status

```bash
curl http://localhost:3000/api/admin/sync

# Response:
# {
#   "status": "success",
#   "message": "Sync endpoint is active",
#   "available_modes": ["scan", "pull", "push"]
# }
```

---

## 📊 Database Queries (Supabase Console)

### Check Synced Files

```sql
SELECT file_path, last_synced, table_name 
FROM sync_manifest 
ORDER BY last_synced DESC 
LIMIT 10;
```

### Count Records by Table

```sql
SELECT table_name, COUNT(*) as count
FROM sync_manifest
GROUP BY table_name
ORDER BY count DESC;
```

### Find Recently Modified

```sql
SELECT file_path, file_hash
FROM sync_manifest
WHERE last_synced > NOW() - INTERVAL '1 hour'
ORDER BY last_synced DESC;
```

### Get Single Collection

```sql
SELECT file_content FROM collections 
WHERE lang='en' AND type='data' AND filename='achievements'
LIMIT 1;
```

### View All Languages

```sql
SELECT DISTINCT lang FROM collections ORDER BY lang;
```

---

## 🗂️ File Structure Quick Map

### Collections (13 Languages)

```
/public/collections/[LANG]/config/
├── apiConfig.json
├── pageLayout.json
└── urlConfig.json

/public/collections/[LANG]/data/
├── achievements.json
├── projects.json
├── skills.json
├── experience.json
├── education.json
├── caseStudies.json
├── contentLabels.json
└── errorMessages.json

Languages: en, es, fr, de, hi, ar-AE, my, id, si, ta, th, zh, pt
```

### Top-Level Files

```
/public/
├── config/        → config_files table
├── data/          → data_files table
├── files/         → static_files table
├── image/         → images table
├── js/            → javascript_files table
└── resume/        → resumes table
```

---

## 🚀 API Endpoints

### Public Endpoints

```
GET /api/collections/:lang/:type/:filename
  Example: /api/collections/en/data/achievements
  Returns: JSON content with cache info

GET /api/config/:filename
  Example: /api/config/apiRouting
  Returns: Configuration JSON

GET /api/data/:filename
  Example: /api/data/achievements
  Returns: Data JSON

GET /api/static/:filename
  Example: /api/static/robots
  Returns: File content (text/xml/etc)
```

### Admin Endpoints

```
POST /api/admin/sync
  Body: { "mode": "scan" | "pull" | "push" }
  Returns: Sync status and changes

GET /api/admin/sync
  Returns: Endpoint status

GET /api/admin/manifest
  Returns: Complete sync_manifest data
```

---

## 🔐 Environment Variables

### Required for Build

```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

### Optional for Cache

```bash
REDIS_URL=redis://default:password@host:port
# Or use Vercel KV: automatically available in Vercel
```

### Vercel Configuration

Set in Vercel dashboard → Settings → Environment Variables:
```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
REDIS_URL (optional)
NODE_ENV=production
```

---

## 📁 Documentation Files Location

```
/Content-Hub/
├── DBStructure.md              ← Database schema details
├── SYNC_STRATEGY.md            ← Sync process documentation
├── ARCHITECTURE.md             ← System architecture diagram
├── IMPLEMENTATION_STATUS.md    ← Progress tracking
├── DATABASE_SYNC_COMPLETE.md   ← Complete summary
├── QUICK_REFERENCE.md          ← This file
├── scripts/
│   └── setup-database.ts       ← Build-time sync script
└── app/api/admin/
    └── sync/route.ts           ← Runtime sync endpoint
```

---

## 🎯 Common Tasks

### Task 1: Add New File to Collection

```bash
# 1. Add file to /public
echo '{"data":"new"}' > public/collections/en/data/newfile.json

# 2. Sync to database
curl -X POST http://localhost:3000/api/admin/sync \
  -H "Content-Type: application/json" \
  -d '{ "mode": "pull" }'

# 3. Access via API
curl http://localhost:3000/api/collections/en/data/newfile

# 4. Verify in database (optional)
# SELECT * FROM collections WHERE filename='newfile' AND lang='en';
```

### Task 2: Update Existing File

```bash
# 1. Edit file in /public
nano public/config/apiRouting.json

# 2. Check what changed
curl -X POST http://localhost:3000/api/admin/sync \
  -H "Content-Type: application/json" \
  -d '{ "mode": "scan" }'

# 3. Apply changes
curl -X POST http://localhost:3000/api/admin/sync \
  -H "Content-Type: application/json" \
  -d '{ "mode": "pull" }'

# 4. Verify update (cache clears automatically)
curl http://localhost:3000/api/config/apiRouting
```

### Task 3: Delete File from Collection

```bash
# 1. Remove file from /public
rm public/collections/en/data/oldfile.json

# 2. Sync deletion to database
curl -X POST http://localhost:3000/api/admin/sync \
  -H "Content-Type: application/json" \
  -d '{ "mode": "pull" }'

# 3. Verify deletion
# SELECT * FROM collections WHERE filename='oldfile' AND lang='en';
# Should return no rows
```

### Task 4: Deploy to Production

```bash
# 1. Make changes locally
# Edit files in /public or code

# 2. Commit and push
git add .
git commit -m "Update collections"
git push origin main

# 3. Vercel automatically:
# - Runs npm run build
# - Triggers setup-database.ts
# - Drops and recreates all tables
# - Loads fresh data from /public
# - Deploys to production

# 4. Verify production
curl https://static.kuhandranchatbot.info/api/collections/en/data/achievements
```

### Task 5: Emergency Reset

```bash
# Reset database completely
curl -X POST http://localhost:3000/api/admin/sync \
  -H "Content-Type: application/json" \
  -d '{ "mode": "pull" }'

# Or rebuild from scratch
npm run build

# Or redeploy from Vercel dashboard
# (Vercel > Projects > Content-Hub > Redeploy)
```

---

## 📈 Performance Tips

### 1. Warm Cache After Deploy

```bash
# Run these commands after deployment to warm Redis cache
curl http://example.com/api/collections/en/data/achievements
curl http://example.com/api/config/apiRouting
curl http://example.com/api/data/skills
# ... repeat for frequently accessed files
```

### 2. Monitor Cache Hit Rate

```bash
# Check Redis stats (if using Vercel KV)
# Via Vercel dashboard: Storage > KV > Databases
```

### 3. Clear Cache if Stuck

```bash
# Manual cache clear (if needed)
# Via Vercel KV dashboard or:
# REST API call to clear (if implemented)
```

---

## 🐛 Troubleshooting

### Issue: Build Fails

```bash
# Check environment variables
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Test Supabase connection
curl https://[YOUR-PROJECT].supabase.co/rest/v1/collections \
  -H "apikey: $SUPABASE_ANON_KEY"

# Check local setup
npm run build --verbose
```

### Issue: Sync Not Working

```bash
# Check endpoint
curl http://localhost:3000/api/admin/sync

# Test with scan mode (safe)
curl -X POST http://localhost:3000/api/admin/sync \
  -H "Content-Type: application/json" \
  -d '{ "mode": "scan" }'

# Check /public folder exists
ls -la public/collections/
```

### Issue: Files Not Syncing

```bash
# Verify file format
cat public/collections/en/data/test.json | jq '.' # Should be valid JSON

# Check file permissions
ls -la public/collections/en/data/

# Force full rescan
npm run build
```

### Issue: Cache Returning Old Data

```bash
# Redis cache is 1 hour TTL
# To clear immediately, restart dev server
# Or wait 1 hour for automatic expiry

# In production, sync endpoint clears cache automatically
```

---

## 📊 Sync Status Indicators

### ✅ Everything Working

```
- npm run build completes without errors
- /api/admin/sync returns status: "success"
- Files are retrievable via /api/collections/*
- Cache hit rate > 80%
```

### ⚠️ Partial Issues

```
- Some files missing from database
  → Run: POST /api/admin/sync { "mode": "pull" }
  
- Old data being served
  → Cache TTL issue, wait or restart dev server
  
- New files not detected
  → Make sure files are in /public folder structure
  → Check file permissions
```

### ❌ Critical Issues

```
- Build fails
  → Check environment variables
  → Test Supabase connection
  
- /api/admin/sync endpoint down
  → Check Next.js server is running
  → Check route file exists
  
- Database completely empty
  → Re-run: npm run build
  → Or manually run setup-database.ts
```

---

## 🎓 Learning Resources

**Documentation Files:**
1. Start with: [DATABASE_SYNC_COMPLETE.md](DATABASE_SYNC_COMPLETE.md)
2. Then read: [ARCHITECTURE.md](ARCHITECTURE.md)
3. Details: [SYNC_STRATEGY.md](SYNC_STRATEGY.md)
4. Schema: [DBStructure.md](DBStructure.md)

**Code Files:**
1. Build script: [scripts/setup-database.ts](scripts/setup-database.ts)
2. API endpoint: [app/api/admin/sync/route.ts](app/api/admin/sync/route.ts)
3. Utilities: [lib/sync-service.ts](lib/sync-service.ts)

---

## 🔍 Useful Commands

```bash
# Check file count in /public
find public -type f | wc -l

# Check JSON validity
find public -name "*.json" -exec jq empty {} \;

# Count files by type
find public -type f | cut -d. -f2 | sort | uniq -c

# View /public structure
tree public -L 3 # (if tree command available)

# Check database size
# Via Supabase dashboard: Database > Statistics

# Monitor build time
time npm run build

# Test API response time
curl -w "\n\nTotal: %{time_total}s\n" \
  http://localhost:3000/api/collections/en/data/achievements
```

---

## 📋 Checklist Before Deployment

- [ ] All files added to `/public` in correct structure
- [ ] JSON files validated (no syntax errors)
- [ ] Environment variables set in Vercel
- [ ] Local build succeeds: `npm run build`
- [ ] Local API working: test `/api/admin/sync`
- [ ] Sync endpoint returns changes correctly
- [ ] Cache is working (verify with `mode: "scan"`)
- [ ] Database has all records: check counts
- [ ] Git changes committed and pushed
- [ ] Vercel build completes successfully
- [ ] Production API responding: test URLs
- [ ] Cache warming completed (optional)
- [ ] Monitoring configured (optional)

---

## 🎯 Summary

**You have:**
- ✅ Complete database schema
- ✅ Automated build-time sync
- ✅ On-demand runtime sync
- ✅ Change detection mechanism
- ✅ Redis caching strategy
- ✅ API endpoints structure
- ✅ Comprehensive documentation

**You can now:**
- ✅ Build the project with npm run build
- ✅ Deploy to Vercel with automatic sync
- ✅ Query data via API endpoints
- ✅ Monitor changes via sync endpoint
- ✅ Scale to production with confidence

**Status:** 🚀 **READY TO BUILD**

---

*For detailed information, see the full documentation files listed above.*
