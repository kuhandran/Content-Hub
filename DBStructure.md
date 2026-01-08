# Content Hub - Database Structure

## Overview
Content Hub uses **Supabase PostgreSQL** as the primary database with **Redis** for caching.

**Architecture Pattern:**
```
/public/collections/ (Source of Truth for initial data)
           ↓
    Build Script (scans files)
           ↓
    Creates Tables
           ↓
    Loads data into Supabase
           ↓
    Redis caches frequently accessed data
           ↓
    API Endpoints serve with cache-first strategy
```

---

## Database Tables

### 1. **collections** Table
Stores all language-specific collection data from `/public/collections/[lang]/[config|data]/*`

```sql
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lang VARCHAR(10) NOT NULL,          -- en, es, fr, de, hi, ar-AE, my, id, si, ta, th, zh, pt
  type VARCHAR(20) NOT NULL,          -- 'config' or 'data'
  filename VARCHAR(255) NOT NULL,     -- achievements, urlConfig, projects, etc.
  file_content JSONB NOT NULL,        -- Complete JSON object
  file_hash VARCHAR(64),              -- SHA256 hash for change detection
  synced_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(lang, type, filename),
  INDEX idx_lang ON lang,
  INDEX idx_type ON type,
  INDEX idx_lang_type ON (lang, type)
);
```

**Columns:**
- `id` - Unique identifier
- `lang` - Language code
- `type` - 'config' (configuration files) or 'data' (content files)
- `filename` - File name without extension (e.g., "achievements")
- `file_content` - Full JSON content
- `file_hash` - Hash for detecting if file changed
- `synced_at` - Last sync timestamp
- `created_at` / `updated_at` - Audit timestamps

**Sample Data:**
```json
{
  "lang": "en",
  "type": "data",
  "filename": "achievements",
  "file_content": { "awards": [...], "certifications": [...] },
  "file_hash": "abc123...",
  "synced_at": "2026-01-08T10:30:00Z"
}
```

---

### 2. **static_files** Table
Stores files from `/public/files/*` (manifest.json, robots.txt, sitemap.xml, etc.)

```sql
CREATE TABLE static_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL UNIQUE,
  file_type VARCHAR(50),              -- json, xml, html, etc.
  file_content TEXT NOT NULL,
  file_hash VARCHAR(64),
  synced_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  INDEX idx_filename ON filename,
  INDEX idx_file_type ON file_type)
);
```

**Sample Data:**
```json
{
  "filename": "manifest.json",
  "file_type": "json",
  "file_content": "{ \"name\": \"Content Hub\", ... }",
  "file_hash": "def456..."
}
```

---

### 3. **config_files** Table
Stores files from `/public/config/*` (apiRouting.json, languages.json, pageLayout.json, urlConfig.json)

```sql
CREATE TABLE config_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL UNIQUE,
  file_type VARCHAR(50),              -- json, yaml, etc.
  file_content JSONB NOT NULL,
  file_hash VARCHAR(64),
  synced_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  INDEX idx_filename ON filename
);
```

---

### 4. **data_files** Table
Stores files from `/public/data/*` (achievements.json, projects.json, skills.json, etc.)

```sql
CREATE TABLE data_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL UNIQUE,
  file_type VARCHAR(50),
  file_content JSONB NOT NULL,
  file_hash VARCHAR(64),
  synced_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  INDEX idx_filename ON filename
);
```

---

### 5. **images** Table
Stores image metadata from `/public/image/*`

```sql
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL UNIQUE,
  file_path VARCHAR(512),             -- relative path in /public/image
  mime_type VARCHAR(50),              -- image/png, image/jpeg, etc.
  file_hash VARCHAR(64),
  synced_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  INDEX idx_filename ON filename,
  INDEX idx_mime_type ON mime_type
);
```

**Note:** Image binary data is stored in Supabase Storage, not as BYTEA in the table.

---

### 6. **resumes** Table
Stores resume/document metadata from `/public/resume/*`

```sql
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL UNIQUE,
  file_type VARCHAR(50),              -- pdf, docx, json, etc.
  file_path VARCHAR(512),
  description TEXT,
  version VARCHAR(50),
  file_hash VARCHAR(64),
  synced_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  INDEX idx_filename ON filename,
  INDEX idx_file_type ON file_type
);
```

---

### 7. **javascript_files** Table
Stores JavaScript files from `/public/js/*`

```sql
CREATE TABLE javascript_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL UNIQUE,
  file_path VARCHAR(512),
  file_content TEXT NOT NULL,
  file_hash VARCHAR(64),
  synced_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  INDEX idx_filename ON filename
);
```

---

### 8. **sync_manifest** Table
Tracks all synced files and their hashes for change detection

```sql
CREATE TABLE sync_manifest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path VARCHAR(512) NOT NULL UNIQUE,  -- /public/collections/en/data/achievements.json
  file_hash VARCHAR(64) NOT NULL,
  table_name VARCHAR(50),                  -- collections, static_files, etc.
  last_synced TIMESTAMP DEFAULT now(),
  INDEX idx_file_path ON file_path,
  INDEX idx_table_name ON table_name
);
```

---

## Sync Strategy

### **Initial Sync (During Build)**
1. Drop all tables
2. Scan `/public` folder recursively
3. Detect file types based on path and extension
4. Create fresh tables with proper structure
5. Load all files into corresponding tables
6. Generate file hashes
7. Populate `sync_manifest` table

### **Incremental Sync (Runtime)**
1. Check if new files exist in `/public` since last sync
2. Calculate file hashes
3. Compare with `sync_manifest`
4. If changed/new:
   - Update database
   - Clear Redis cache for that key
   - Update `sync_manifest`
5. If deleted:
   - Remove from database
   - Clear cache
   - Remove from manifest

### **Bidirectional Sync Endpoint**
```
POST /api/admin/sync
- Accepts: { mode: 'scan' | 'push' | 'pull' }
- scan: Check for changes in /public
- push: Apply DB changes to /public (if allowed)
- pull: Apply /public changes to DB
```

---

## File Type Detection Logic

```typescript
// Mapping of folder paths to table names
const folderToTable = {
  'public/collections': 'collections',
  'public/files': 'static_files',
  'public/config': 'config_files',
  'public/data': 'data_files',
  'public/image': 'images',
  'public/js': 'javascript_files',
  'public/resume': 'resumes'
}
```

---

## Caching Strategy (Redis)

### **Cache Keys:**
```
collections:{lang}:{type}:{filename}  → JSON content
static_file:{filename}                → File content
config:{filename}                     → JSON content
data:{filename}                       → JSON content
images:{filename}                     → Metadata
resumes:{filename}                    → Metadata
```

### **TTL (Time To Live):**
- Collections: 1 hour (frequently accessed)
- Config: 24 hours (rarely changes)
- Static files: 7 days (never changes)
- Images/Resumes: 24 hours

### **Cache Invalidation:**
- On file update → immediate cache clear
- On sync → clear all related keys
- Automatic expiry after TTL

---

## Build Process

### **When `npm run build` is executed:**
1. Run `scripts/setup-database.ts`
   - Connect to Supabase
   - Drop all tables (fresh start)
   - Create new tables with schema
   - Scan `/public` folder
   - Load all files
   - Generate manifests
   - Calculate hashes
   - Insert into database
2. Build Next.js application
3. Deploy to Vercel

### **When `npm run dev` (development):**
1. Use existing database
2. No automatic sync (manual via `/api/admin/sync`)

---

## File Structure to Database Mapping

```
/public/
├── collections/
│   ├── en/
│   │   ├── config/
│   │   │   ├── apiConfig.json        → collections (lang=en, type=config, filename=apiConfig)
│   │   │   ├── pageLayout.json       → collections (lang=en, type=config, filename=pageLayout)
│   │   │   └── urlConfig.json        → collections (lang=en, type=config, filename=urlConfig)
│   │   └── data/
│   │       ├── achievements.json     → collections (lang=en, type=data, filename=achievements)
│   │       ├── projects.json         → collections (lang=en, type=data, filename=projects)
│   │       └── ...
│   ├── es/ ... (repeat for other languages)
├── config/
│   ├── apiRouting.json               → config_files (filename=apiRouting)
│   ├── languages.json                → config_files (filename=languages)
│   └── ...
├── data/
│   ├── achievements.json             → data_files (filename=achievements)
│   ├── projects.json                 → data_files (filename=projects)
│   └── ...
├── files/
│   ├── manifest.json                 → static_files (filename=manifest)
│   ├── robots.txt                    → static_files (filename=robots)
│   └── ...
├── image/
│   └── (image files)                 → images table + Supabase Storage
├── js/
│   └── (JavaScript files)            → javascript_files table
└── resume/
    └── (resume files)                → resumes table + Supabase Storage
```

---

## API Endpoints

### **GET /api/collections/:lang/:type/:filename**
```
Sequence:
1. Check Redis cache
2. If miss → Query collections table
3. Return & cache result
4. TTL: 1 hour
```

### **GET /api/config/:filename**
```
1. Check Redis cache (TTL: 24h)
2. If miss → Query config_files table
3. Return & cache
```

### **POST /api/admin/sync**
```
Body: { mode: 'scan' | 'push' | 'pull' }
- scan: Detect changes in /public folder
- pull: Update DB from /public changes
- push: Update /public from DB changes (limited)
Response: { files_synced, new_files, deleted_files, changed_files }
```

### **GET /api/admin/manifest**
```
Returns sync_manifest to show all tracked files
```

---

## Deployment Process

1. **Local Development:**
   - Manually run sync or use dev endpoint
   - Changes in `/public` → synced to DB via endpoint

2. **Building for Production:**
   - `npm run build` triggers setup-database.ts
   - Drops and recreates all tables
   - Scans `/public` folder
   - Loads latest data
   - Generates new hashes

3. **On Vercel:**
   - Database is persistent (Supabase)
   - Build creates fresh tables
   - Data auto-loaded during build
   - Redis cache warmed on first request

---

## Security Considerations

- ✅ Supabase RLS (Row Level Security) for auth
- ✅ Service role key only for build scripts
- ✅ Anonymous key for public API endpoints
- ✅ Sync endpoints require authentication (future)
- ✅ File uploads validated before DB insert
- ✅ Hash comparison prevents duplicate loads

---

## Monitoring & Debugging

**Check last sync time:**
```sql
SELECT filename, last_synced FROM sync_manifest ORDER BY last_synced DESC LIMIT 10;
```

**Find changed files:**
```sql
SELECT file_path FROM sync_manifest WHERE file_hash != current_hash;
```

**Cache hit rate:**
```
Via Redis: INFO stats → hits / (hits + misses)
```

