# Content Hub - System Architecture

## Complete Data Flow Architecture

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                         CONTENT HUB ARCHITECTURE                              │
│                   Supabase + Redis + Next.js on Vercel                       │
└───────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
  1. DATA SOURCE LAYER
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│  /public/collections (Version Control - Single Source of Truth)             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  en/              es/              fr/              de/         ... 13 langs │
│  ├─ config/       ├─ config/       ├─ config/       ├─ config/             │
│  │ ├─ apiConfig   │ ├─ apiConfig   │ ├─ apiConfig   │ ├─ apiConfig         │
│  │ ├─ pageLayout  │ ├─ pageLayout  │ ├─ pageLayout  │ ├─ pageLayout        │
│  │ └─ urlConfig   │ └─ urlConfig   │ └─ urlConfig   │ └─ urlConfig         │
│  └─ data/         └─ data/         └─ data/         └─ data/               │
│    ├─ achievements  ├─ achievements  ├─ achievements  ├─ achievements       │
│    ├─ projects      ├─ projects      ├─ projects      ├─ projects           │
│    ├─ skills        ├─ skills        ├─ skills        ├─ skills             │
│    ├─ experience    ├─ experience    ├─ experience    ├─ experience         │
│    ├─ education     ├─ education     ├─ education     ├─ education          │
│    ├─ caseStudies   ├─ caseStudies   ├─ caseStudies   ├─ caseStudies        │
│    ├─ contentLabels ├─ contentLabels ├─ contentLabels ├─ contentLabels      │
│    └─ errorMessages └─ errorMessages └─ errorMessages └─ errorMessages      │
│                                                                              │
│  config/          data/            files/          image/      js/  resume/ │
│  ├─ apiRouting    ├─ achievements  ├─ manifest      ├─ logo      └─ JS    └─ Resume│
│  ├─ languages     ├─ projects      ├─ robots.txt    ├─ favicon               │
│  ├─ pageLayout    ├─ skills        ├─ sitemap.xml   ├─ banner                │
│  └─ urlConfig     └─ ...           └─ ...           └─ ...                  │
│                                                                              │
│  Total: 156+ JSON files ready to sync                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                         ↓
                    [FILE SCAN]
                         ↓
         Detect all files, calculate SHA256 hashes


═══════════════════════════════════════════════════════════════════════════════
  2. SYNC MECHANISMS
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│  BUILD-TIME SYNC (Automatic during npm run build)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  scripts/setup-database.ts                                                  │
│  ├─ Connect to Supabase with SERVICE_ROLE_KEY                              │
│  ├─ DROP all existing tables (fresh start)                                 │
│  ├─ CREATE new schema with 8 tables                                        │
│  ├─ SCAN /public folder recursively                                        │
│  ├─ PARSE JSON files                                                       │
│  ├─ CALCULATE SHA256 hash for each file                                    │
│  ├─ INSERT data into appropriate table                                     │
│  │   ├─ collections (78 language-specific files)                           │
│  │   ├─ config_files (15 config files)                                     │
│  │   ├─ data_files (23 top-level data files)                               │
│  │   ├─ static_files (20 manifest, robots, etc)                            │
│  │   ├─ images (8 image metadata entries)                                  │
│  │   ├─ resumes (3 resume entries)                                         │
│  │   ├─ javascript_files (5 JS files)                                      │
│  │   └─ sync_manifest (156 file tracking entries)                          │
│  └─ EXIT with success/failure status                                       │
│                                                                              │
│  Timeline: Runs once during build (100 files < 1 second)                   │
│  Trigger: npm run build, or Vercel deployment                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

                              ↓ Creates/updates

┌─────────────────────────────────────────────────────────────────────────────┐
│  RUNTIME SYNC (On-demand via API)                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  POST /api/admin/sync                                                       │
│  { "mode": "scan" | "pull" | "push" }                                       │
│                                                                              │
│  SCAN MODE:                                                                 │
│  ├─ Query sync_manifest for last-known file hashes                         │
│  ├─ Walk /public folder, calculate current hashes                          │
│  ├─ Compare: new files, modified files, deleted files                      │
│  ├─ Return change list (100+ changes can be displayed)                     │
│  └─ NO database updates                                                     │
│                                                                              │
│  PULL MODE:                                                                 │
│  ├─ Run SCAN logic first                                                    │
│  ├─ For each NEW/MODIFIED file:                                            │
│  │  ├─ Read file from /public                                              │
│  │  ├─ Parse JSON if applicable                                            │
│  │  ├─ UPSERT into appropriate database table                              │
│  │  └─ Update sync_manifest with new hash                                  │
│  ├─ For each DELETED file:                                                 │
│  │  ├─ DELETE from database table                                          │
│  │  └─ DELETE from sync_manifest                                           │
│  ├─ Clear Redis cache for affected keys                                    │
│  └─ Return summary (files applied, errors)                                 │
│                                                                              │
│  PUSH MODE:                                                                 │
│  ├─ Query database for changes since last sync                             │
│  ├─ Write updated JSON back to /public                                     │
│  ├─ Update file hashes in sync_manifest                                    │
│  ├─ (Optional) Git commit changes                                          │
│  └─ Return summary (files pushed)                                          │
│  [NOT YET IMPLEMENTED]                                                      │
│                                                                              │
│  Timeline: On-demand (can run anytime)                                      │
│  Trigger: Manual curl, admin UI, scheduled cron                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

                              ↓ Updates

═══════════════════════════════════════════════════════════════════════════════
  3. PERSISTENCE LAYER (Supabase PostgreSQL)
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│  SUPABASE DATABASE (Primary Data Store)                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────┐                                           │
│  │  collections (78 records)    │                                           │
│  ├──────────────────────────────┤                                           │
│  │ id      | lang | type   | ... │                                          │
│  │ uuid-1  | en   | config | {...} filecontent             │                                          │ uuid-2  | en   | data   | {...}                │
│  │ uuid-3  | es   | config | {...}                │
│  │ uuid-4  | es   | data   | {...}                │
│  │ ...     | ...  | ...    | ...                 │
│  │ [13 languages × 2 types × ~3 files = 78]      │
│  └──────────────────────────────┘                                           │
│                                                                              │
│  ┌──────────────────────────────┐                                           │
│  │  config_files (15 records)   │                                           │
│  ├──────────────────────────────┤                                           │
│  │ id      | filename  | ...    │                                           │
│  │ uuid-15 | apiRouting| {...}  │                                           │
│  │ uuid-16 | languages | {...}  │                                           │
│  │ uuid-17 | pageLayout| {...}  │                                           │
│  │ uuid-18 | urlConfig | {...}  │                                           │
│  │ ...     | ...       | ...    │                                           │
│  └──────────────────────────────┘                                           │
│                                                                              │
│  ┌──────────────────────────────┐                                           │
│  │  data_files (23 records)     │                                           │
│  ├──────────────────────────────┤                                           │
│  │ id      | filename     | ...  │                                          │
│  │ uuid-30 | achievements | {...}│                                          │
│  │ uuid-31 | projects     | {...}│                                          │
│  │ uuid-32 | skills       | {...}│                                          │
│  │ ...     | ...          | ...  │                                          │
│  └──────────────────────────────┘                                           │
│                                                                              │
│  ┌──────────────────────────────┐  ┌─────────────────┐                     │
│  │  static_files (20 records)   │  │ images (8)      │  resumes (3)        │
│  │  js_files (5 records)        │  │ sync_manifest(156)                     │
│  └──────────────────────────────┘  └─────────────────┘                     │
│                                                                              │
│  Total: 8 tables, 300+ records                                              │
│  Size: ~5-10 MB (mostly JSON blobs)                                         │
│  Indexing: By lang, type, filename, table_name                              │
│  Timestamps: created_at, updated_at, synced_at, last_synced                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

                         ↓ Queries via     ↓ Caches to

═══════════════════════════════════════════════════════════════════════════════
  4. CACHE LAYER (Redis/Vercel KV)
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│  REDIS CACHE (Fast Access Layer)                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Cache Keys and TTLs:                                                       │
│                                                                              │
│  collections:en:data:achievements    → JSON content (TTL: 1 hour)          │
│  collections:en:config:urlConfig     → JSON content (TTL: 1 hour)          │
│  collections:es:data:projects        → JSON content (TTL: 1 hour)          │
│  ... [one per collections table row]                                        │
│                                                                              │
│  config:apiRouting                   → JSON content (TTL: 24 hours)        │
│  config:languages                    → JSON content (TTL: 24 hours)        │
│  ... [one per config_files row]                                             │
│                                                                              │
│  data:achievements                   → JSON content (TTL: 24 hours)        │
│  data:projects                       → JSON content (TTL: 24 hours)        │
│  ... [one per data_files row]                                               │
│                                                                              │
│  file:manifest                       → Text content (TTL: 7 days)          │
│  file:robots                         → Text content (TTL: 7 days)          │
│                                                                              │
│  Cache Hit Rate:                                                            │
│  ├─ Cold start: 0%                                                          │
│  ├─ After 1st request: ~60-70%                                              │
│  ├─ During peak usage: ~85-90%                                              │
│  └─ Average response time hit: < 1ms (vs 50-200ms from DB)                 │
│                                                                              │
│  Invalidation:                                                              │
│  ├─ On file update: Immediate clear                                        │
│  ├─ After sync: Clear affected patterns                                    │
│  ├─ Manual: UNLINK collections:*                                           │
│  └─ Automatic: Expire after TTL                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

                         ↓ Serves to

═══════════════════════════════════════════════════════════════════════════════
  5. API LAYER (Next.js App Router)
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│  PUBLIC API ENDPOINTS                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  GET /api/collections/:lang/:type/:filename                                │
│  ├─ Check Redis cache (key: collections:lang:type:filename)                │
│  ├─ If HIT: Return cached content immediately (< 1ms)                      │
│  ├─ If MISS:                                                               │
│  │  ├─ Query: SELECT file_content FROM collections                         │
│  │  │          WHERE lang=? AND type=? AND filename=?                      │
│  │  ├─ Parse JSON if needed                                                │
│  │  ├─ Store in Redis (TTL: 1 hour)                                        │
│  │  └─ Return JSON (50-200ms)                                              │
│  └─ Response: { "data": {...}, "cached": boolean }                         │
│                                                                              │
│  GET /api/config/:filename                                                 │
│  ├─ Check Redis cache (key: config:filename)                               │
│  ├─ If MISS: Query config_files table                                      │
│  ├─ Store in Redis (TTL: 24 hours)                                         │
│  └─ Response: JSON content                                                 │
│                                                                              │
│  GET /api/data/:filename                                                   │
│  ├─ Check Redis cache (key: data:filename)                                 │
│  ├─ If MISS: Query data_files table                                        │
│  ├─ Store in Redis (TTL: 24 hours)                                         │
│  └─ Response: JSON content                                                 │
│                                                                              │
│  GET /api/static/:filename                                                 │
│  ├─ Check Redis cache (key: file:filename)                                 │
│  ├─ If MISS: Query static_files table                                      │
│  ├─ Store in Redis (TTL: 7 days)                                           │
│  └─ Response: Text/XML/JSON content                                        │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  ADMIN API ENDPOINTS                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  POST /api/admin/sync                                                       │
│  ├─ { "mode": "scan" }  - Detect changes                                   │
│  ├─ { "mode": "pull" }  - Apply changes to DB                              │
│  ├─ { "mode": "push" }  - Apply DB changes to /public                      │
│  └─ Response: { status, files_scanned, new_files, ... }                    │
│                                                                              │
│  GET /api/admin/manifest                                                    │
│  ├─ Query sync_manifest table                                              │
│  └─ Response: All tracked files and hashes                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

                         ↓ Returns to

═══════════════════════════════════════════════════════════════════════════════
  6. CLIENT LAYER (Browsers/Apps)
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│  CLIENT APPLICATIONS                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Web Browsers                                                               │
│  ├─ Fetch: GET /api/collections/en/data/achievements                       │
│  ├─ Response: { awards: [...], certifications: [...] }                     │
│  ├─ Display: Portfolio achievements section                                │
│  └─ Cache: Browser cache for offline access                                │
│                                                                              │
│  Crawler/Bot                                                               │
│  ├─ Fetch: GET /api/static/sitemap.xml                                    │
│  ├─ Response: XML sitemap for SEO                                          │
│  └─ Usage: Index website for search engines                                │
│                                                                              │
│  Admin Dashboard                                                            │
│  ├─ Scan: POST /api/admin/sync { "mode": "scan" }                          │
│  ├─ Pull: POST /api/admin/sync { "mode": "pull" }                          │
│  ├─ Upload: POST /api/admin/upload (future feature)                        │
│  └─ Delete: DELETE /api/admin/collections/:lang/:type/:filename (future)  │
│                                                                              │
│  Mobile App                                                                │
│  ├─ Fetch: GET /api/collections/:lang/:type/:filename                      │
│  ├─ Cache: Local app storage for performance                               │
│  ├─ Sync: Bi-directional sync when available                               │
│  └─ Offline: Works with cached data                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
  7. DEPLOYMENT PIPELINE
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│  LOCAL DEVELOPMENT                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  $ npm run dev                                                              │
│  ├─ Start Next.js dev server on localhost:3000                             │
│  ├─ Initialize Supabase connection                                         │
│  ├─ Load Redis client (optional)                                           │
│  ├─ Watch /public for changes (lib/sync-service.ts)                        │
│  └─ Ready to test endpoints                                                │
│                                                                              │
│  To test sync:                                                              │
│  $ curl -X POST http://localhost:3000/api/admin/sync \                     │
│    -H "Content-Type: application/json" \                                   │
│    -d '{ "mode": "scan" }'                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

                              ↓ Git push

┌─────────────────────────────────────────────────────────────────────────────┐
│  VERCEL DEPLOYMENT                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  $ git push origin main                                                     │
│  ├─ Trigger Vercel webhook                                                 │
│  ├─ Start build process:                                                   │
│  │  ├─ npm install (dependencies)                                          │
│  │  ├─ npm run build (Next.js build)                                       │
│  │  │  ├─ Trigger: scripts/setup-database.ts                              │
│  │  │  ├─ Scan /public folder                                              │
│  │  │  ├─ Drop all tables                                                  │
│  │  │  ├─ Create fresh schema                                              │
│  │  │  ├─ Load all files (156 records)                                     │
│  │  │  └─ Populate sync_manifest                                           │
│  │  └─ Build complete                                                       │
│  ├─ Deploy to Vercel CDN                                                   │
│  ├─ Application live at: https://static.kuhandranchatbot.info             │
│  ├─ API ready: https://static.kuhandranchatbot.info/api/*                 │
│  └─ Build time: ~2-3 minutes                                               │
│                                                                              │
│  Environment Variables (set in Vercel):                                     │
│  ├─ SUPABASE_URL                                                           │
│  ├─ SUPABASE_ANON_KEY                                                      │
│  ├─ SUPABASE_SERVICE_ROLE_KEY                                              │
│  ├─ REDIS_URL (or use Vercel KV)                                           │
│  └─ NODE_ENV=production                                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

                              ↓ Live


═══════════════════════════════════════════════════════════════════════════════
  8. DATA FLOW EXAMPLES
═══════════════════════════════════════════════════════════════════════════════

REQUEST FLOW #1: Get Collection Data (Cache Miss)
─────────────────────────────────────────────────

Browser
  ↓
GET /api/collections/en/data/achievements
  ↓
Check Redis [collections:en:data:achievements]
  ↓
Cache MISS
  ↓
Query Supabase:
  SELECT file_content FROM collections
  WHERE lang='en' AND type='data' AND filename='achievements'
  ↓
Parse JSON → { awards: [...] }
  ↓
Store in Redis (TTL: 1 hour)
  ↓
Response (50-200ms)
  ↓
Browser renders achievements


REQUEST FLOW #2: Get Collection Data (Cache Hit)
────────────────────────────────────────────────

Browser
  ↓
GET /api/collections/en/data/achievements
  ↓
Check Redis [collections:en:data:achievements]
  ↓
Cache HIT
  ↓
Return immediately (< 1ms)
  ↓
Browser renders achievements


REQUEST FLOW #3: File Modification Sync
───────────────────────────────────────

Admin edits /public/collections/en/data/achievements.json
  ↓
POST /api/admin/sync { "mode": "pull" }
  ↓
Scan /public folder
  ↓
Calculate hash of modified file
  ↓
Compare with sync_manifest
  ↓
Status = 'modified'
  ↓
Read file content
  ↓
UPSERT into collections table
  ↓
Clear Redis [collections:en:data:achievements]
  ↓
Update sync_manifest with new hash
  ↓
Response: "1 files synced"
  ↓
Next request will rebuild cache from DB


REQUEST FLOW #4: Build-Time Initialization
──────────────────────────────────────────

npm run build
  ↓
Next.js build process
  ↓
During build, trigger scripts/setup-database.ts
  ↓
Connect to Supabase (SERVICE_ROLE_KEY)
  ↓
Drop all existing tables (fresh start)
  ↓
CREATE TABLE collections (...)
CREATE TABLE config_files (...)
... [create all 8 tables]
  ↓
Scan /public folder (156+ files)
  ↓
For each file:
  ├─ Read content
  ├─ Calculate SHA256 hash
  ├─ Parse JSON if applicable
  └─ INSERT into appropriate table
  ↓
INSERT 78 records into collections
INSERT 15 records into config_files
... [insert into all tables]
  ↓
Populate sync_manifest with all file hashes
  ↓
Build complete, ready to deploy
  ↓
Vercel deploys to production


═══════════════════════════════════════════════════════════════════════════════
  9. PERFORMANCE METRICS
═══════════════════════════════════════════════════════════════════════════════

Operation                    Response Time    Notes
─────────────────────────────────────────────────────────────────────────────
Cache HIT (Redis)            < 1ms           Sub-millisecond response
Cache MISS → DB → Cache      50-200ms        Depends on Supabase latency
File scan (156 files)        < 1 second      Local filesystem scan
Database INSERT (100 recs)   < 500ms         Batch insert performance
Sync endpoint (scan mode)    500ms - 2s      Depends on file count
Sync endpoint (pull mode)    1s - 5s         Includes file reads & DB updates
First page load (all data)   2-5s            Warm up, build Redis cache
Subsequent load              500ms - 1s      Mostly from Redis


═══════════════════════════════════════════════════════════════════════════════
  10. TECHNOLOGY STACK
═══════════════════════════════════════════════════════════════════════════════

Frontend:
  • Next.js 15.5.9 (React framework, App Router)
  • TypeScript 5.9.3 (Type safety)
  • Custom domain: static.kuhandranchatbot.info

Backend:
  • Supabase PostgreSQL (Persistent data store)
  • Redis/Vercel KV (Cache layer)
  • Next.js API Routes (Serverless functions)

Infrastructure:
  • Vercel (Deployment, CDN, serverless)
  • Supabase (Database, auth, storage)
  • Redis (Cache, optional)

Database:
  • 8 tables, 300+ records
  • JSON/JSONB storage
  • Full-text search capable
  • Real-time subscriptions available

APIs:
  • REST endpoints for data retrieval
  • Admin sync endpoint for maintenance
  • Server-side caching strategy


═══════════════════════════════════════════════════════════════════════════════

Total System Complexity: MEDIUM
├─ Data: Simple (mostly JSON files)
├─ Infrastructure: Simple (managed services)
├─ Sync: Complex (bidirectional, hashing, manifests)
└─ Scalability: High (Vercel CDN, Supabase scaling)

Status: ✅ READY FOR IMPLEMENTATION
```

