# Data Manager - Complete Setup & Usage Guide

## 📊 Data Manager Sample View

### What You Should See:

```
═══════════════════════════════════════════════════════════════════════
                          💾 DATA MANAGER
                    Database Analysis & Pump Monitor
═══════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────┐
│                    🔄 PUMP MONITOR                                   │
├─────────────────────────────────────────────────────────────────────┤
│  Status: ⏸️ Idle                                                      │
│  Progress: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%             │
│                                                                      │
│  Files Processed: 0    │  Records Created: 0                        │
│  Last Run: Never       │  Status: Ready to pump data                │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│               📈 DATABASE SUMMARY                                    │
├─────────────────────────────────────────────────────────────────────┤
│  📋 Total Tables      │  📊 Total Records    │  💾 Total Size       │
│     9 Tables          │     1,234 Records    │     5.2 MB           │
│                                                                      │
│  ⚡ Last Updated: 2024-01-13 10:30:45                               │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│           📋 DATABASE TABLES ANALYSIS                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────┐  ┌──────────────────────┐               │
│  │ 📋 menu_config       │  │ 📚 collections       │               │
│  │ Records: 12          │  │ Records: 45          │               │
│  │ Size: 16 KB          │  │ Size: 128 KB         │               │
│  │ Created: Jan 13      │  │ Created: Jan 12      │               │
│  └──────────────────────┘  └──────────────────────┘               │
│                                                                      │
│  ┌──────────────────────┐  ┌──────────────────────┐               │
│  │ ⚙️ config_files      │  │ 📊 data_files        │               │
│  │ Records: 8           │  │ Records: 120         │               │
│  │ Size: 64 KB          │  │ Size: 256 KB         │               │
│  │ Created: Jan 12      │  │ Created: Jan 12      │               │
│  └──────────────────────┘  └──────────────────────┘               │
│                                                                      │
│  ┌──────────────────────┐  ┌──────────────────────┐               │
│  │ 📄 static_files      │  │ 🖼️ images            │               │
│  │ Records: 35          │  │ Records: 22          │               │
│  │ Size: 144 KB         │  │ Size: 512 KB         │               │
│  │ Created: Jan 12      │  │ Created: Jan 12      │               │
│  └──────────────────────┘  └──────────────────────┘               │
│                                                                      │
│  ┌──────────────────────┐  ┌──────────────────────┐               │
│  │ ⚡ javascript_files  │  │ 📄 resumes           │               │
│  │ Records: 18          │  │ Records: 6           │               │
│  │ Size: 256 KB         │  │ Size: 32 KB          │               │
│  │ Created: Jan 12      │  │ Created: Jan 12      │               │
│  └──────────────────────┘  └──────────────────────┘               │
│                                                                      │
│  ┌──────────────────────┐                                          │
│  │ 📜 sync_manifest     │                                          │
│  │ Records: 5           │                                          │
│  │ Size: 8 KB           │                                          │
│  │ Created: Jan 13      │                                          │
│  └──────────────────────┘                                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│              🟢 DATABASE HEALTH                                      │
├─────────────────────────────────────────────────────────────────────┤
│  Status: ✅ Healthy                                                  │
│  Message: Database is operational and populated with data           │
│  Last Sync: 2024-01-13 10:30:45                                     │
└─────────────────────────────────────────────────────────────────────┘

                   🔄 Refresh Data    (Auto-updates: 5s)
```

---

## 🗄️ Table Mappings & Structure

### Complete Table Mapping

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATABASE TABLES                              │
├─────────────────────────────────────────────────────────────────────┤

1. MENU_CONFIG (📋)
   ├─ Purpose: Dashboard navigation menus
   ├─ Records: 12 (sidebar menu items)
   ├─ Fields:
   │  ├─ id (UUID) - Primary key
   │  ├─ menu_name (VARCHAR) - overview, collections, analytics, etc.
   │  ├─ display_name (VARCHAR) - Display text
   │  ├─ icon (VARCHAR) - Emoji icon (📊, 📚, 📈, etc.)
   │  ├─ folder_path (TEXT) - public/collections, public/data, etc.
   │  ├─ menu_order (INTEGER) - Sort order (1-12)
   │  └─ has_submenu (BOOLEAN) - Has language submenus
   └─ Indexes: menu_name, menu_order

2. COLLECTIONS (📚)
   ├─ Purpose: Multi-language content storage
   ├─ Records: 45+ (varies by languages & types)
   ├─ Fields:
   │  ├─ id (UUID) - Primary key
   │  ├─ language (VARCHAR) - en, es, fr, de, ar-AE, hi, id, my, si, ta, th
   │  ├─ type (VARCHAR) - config, data
   │  ├─ filename (VARCHAR) - achievements.json, etc.
   │  ├─ file_path (TEXT) - public/collections/{lang}/{type}/
   │  ├─ file_hash (VARCHAR) - SHA-256 for change detection
   │  ├─ content (JSONB) - Actual JSON file content
   │  ├─ created_at (TIMESTAMP) - Creation time
   │  └─ updated_at (TIMESTAMP) - Last update time
   └─ Indexes: language, type, file_path, created_at DESC, file_hash

3. CONFIG_FILES (⚙️)
   ├─ Purpose: Application configuration files
   ├─ Records: 8 (apiRouting, languages, pageLayout, etc.)
   ├─ Fields:
   │  ├─ id, filename, file_path, file_hash
   │  ├─ content (JSONB) - Configuration data
   │  ├─ file_size (INTEGER) - Bytes
   │  ├─ created_at, updated_at
   └─ Source: public/config/ directory

4. DATA_FILES (📊)
   ├─ Purpose: Core application data
   ├─ Records: 120+ (achievements, caseStudies, education, etc.)
   ├─ Contains: Skills, experience, projects, resume data
   └─ Source: public/data/ directory

5. STATIC_FILES (📄)
   ├─ Purpose: Web assets and static content
   ├─ Records: 35 (robots.txt, sitemap.xml, manifest.json, etc.)
   ├─ Fields: filename, file_path, file_hash, file_type, file_size
   └─ Source: public/files/ directory

6. IMAGES (🖼️)
   ├─ Purpose: Image metadata and references
   ├─ Records: 22 (portfolio images, icons, etc.)
   ├─ Fields: filename, file_path, image_url, alt_text, dimensions
   └─ Source: public/image/ directory

7. JAVASCRIPT_FILES (⚡)
   ├─ Purpose: JS bundles and assets
   ├─ Records: 18
   ├─ Fields: filename, file_path, content (TEXT), minified (BOOLEAN)
   └─ Source: public/js/ directory

8. RESUMES (📄)
   ├─ Purpose: Resume document storage
   ├─ Records: 6
   ├─ Fields: filename, file_path, content (JSONB), file_size
   └─ Source: public/resume/ directory

9. SYNC_MANIFEST (📜)
   ├─ Purpose: Pump operation audit log
   ├─ Records: 5+ (one per pump operation)
   ├─ Fields:
   │  ├─ id (UUID) - Primary key
   │  ├─ table_name (VARCHAR) - Which table was pumped
   │  ├─ status (VARCHAR) - completed, in-progress, error
   │  ├─ message (TEXT) - Operation details
   │  ├─ files_count (INTEGER) - Files processed
   │  ├─ hash_mismatches (INTEGER) - Changed files
   │  ├─ missing_files (INTEGER) - New files
   │  ├─ metadata (JSONB) - Additional info
   │  ├─ created_at, updated_at
   └─ Used for: Tracking pump history and debugging

└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Supabase Monitoring Queries

### Get Record Counts for All Tables

```sql
SELECT 
  'menu_config' as table_name, COUNT(*) as count FROM menu_config
UNION ALL
SELECT 'collections', COUNT(*) FROM collections
UNION ALL
SELECT 'config_files', COUNT(*) FROM config_files
UNION ALL
SELECT 'data_files', COUNT(*) FROM data_files
UNION ALL
SELECT 'static_files', COUNT(*) FROM static_files
UNION ALL
SELECT 'images', COUNT(*) FROM images
UNION ALL
SELECT 'javascript_files', COUNT(*) FROM javascript_files
UNION ALL
SELECT 'resumes', COUNT(*) FROM resumes
UNION ALL
SELECT 'sync_manifest', COUNT(*) FROM sync_manifest
ORDER BY table_name;
```

**Sample Output:**
```
table_name          | count
────────────────────┼───────
collections         |   45
config_files        |    8
data_files          |  120
images              |   22
javascript_files    |   18
menu_config         |   12
resumes             |    6
static_files        |   35
sync_manifest       |    5
```

---

### Get Detailed Table Statistics

```sql
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  (SELECT COUNT(*) FROM information_schema.statistics 
   WHERE table_name = tablename) as indexes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

### Check Collections by Language

```sql
SELECT 
  language,
  type,
  COUNT(*) as count,
  MIN(created_at) as first_created,
  MAX(updated_at) as last_updated
FROM collections
GROUP BY language, type
ORDER BY language, type;
```

**Sample Output:**
```
language | type   | count | first_created           | last_updated
─────────┼────────┼───────┼─────────────────────────┼─────────────
ar-AE    | config |     1 | 2024-01-12 10:00:00 UTC | 2024-01-13
ar-AE    | data   |     5 | 2024-01-12 10:00:00 UTC | 2024-01-13
de       | config |     1 | 2024-01-12 10:00:00 UTC | 2024-01-13
de       | data   |     5 | 2024-01-12 10:00:00 UTC | 2024-01-13
...
```

---

### Monitor Pump Operations

```sql
SELECT 
  table_name,
  status,
  COUNT(*) as operations,
  MAX(created_at) as last_operation,
  SUM(files_count) as total_files
FROM sync_manifest
GROUP BY table_name, status
ORDER BY last_operation DESC;
```

**Sample Output:**
```
table_name        | status    | operations | last_operation          | total_files
──────────────────┼───────────┼────────────┼─────────────────────────┼────────────
all               | completed |          2 | 2024-01-13 10:30:45 UTC | 320
collections       | completed |          1 | 2024-01-13 10:15:30 UTC | 45
data_files        | completed |          1 | 2024-01-13 10:15:30 UTC | 120
```

---

### Get Latest Pump Status

```sql
SELECT 
  table_name,
  status,
  message,
  files_count,
  metadata->'progress' as progress_percent,
  created_at,
  updated_at
FROM sync_manifest
WHERE created_at = (SELECT MAX(created_at) FROM sync_manifest)
ORDER BY table_name;
```

---

### Monitor Database Growth

```sql
SELECT 
  DATE_TRUNC('day', created_at)::date as date,
  COUNT(DISTINCT table_name) as tables_updated,
  SUM(files_count) as files_processed,
  COUNT(*) as operations
FROM sync_manifest
WHERE status = 'completed'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC
LIMIT 7;
```

---

## 🚀 Usage Instructions

### Step 1: Initial Setup

1. **Create Database Tables**
   ```bash
   # Copy all SQL from DATABASE_SCHEMA.sql
   # Paste in Supabase SQL Editor
   # Execute
   ```

2. **Verify Tables Created**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

3. **Check Menu Items (should be 12)**
   ```sql
   SELECT menu_order, menu_name, display_name, icon 
   FROM menu_config 
   ORDER BY menu_order;
   ```

### Step 2: Load Primary Data

1. Go to Admin Dashboard: `https://static.kuhandranchatbot.info/admin`
2. Click **Overview** (📊) tab
3. Click **🚀 Load Primary Data** button
4. Watch progress bar fill up
5. Should see "✅ Pump completed successfully"

### Step 3: Monitor Data in Data Manager

1. Click **Data Manager** (💾) tab
2. **Pump Monitor** shows:
   - Status: ✅ Completed
   - Progress: 100%
   - Files Processed: 320
   - Records Created: 271

3. **Database Summary** shows:
   - Total Tables: 9
   - Total Records: 271
   - Total Size: 5.2 MB
   - Last Updated: Just now

4. **Table Analysis** shows each table:
   - menu_config: 12 records (0 change expected)
   - collections: 45 records
   - config_files: 8 records
   - data_files: 120 records
   - static_files: 35 records
   - images: 22 records
   - javascript_files: 18 records
   - resumes: 6 records
   - sync_manifest: 1 record (pump operation log)

### Step 4: Verify with Supabase Queries

Run these in Supabase SQL Editor to verify:

```sql
-- Check all record counts
SELECT 'menu_config' as table_name, COUNT(*) as count FROM menu_config
UNION ALL SELECT 'collections', COUNT(*) FROM collections
UNION ALL SELECT 'config_files', COUNT(*) FROM config_files
UNION ALL SELECT 'data_files', COUNT(*) FROM data_files
UNION ALL SELECT 'static_files', COUNT(*) FROM static_files
UNION ALL SELECT 'images', COUNT(*) FROM images
UNION ALL SELECT 'javascript_files', COUNT(*) FROM javascript_files
UNION ALL SELECT 'resumes', COUNT(*) FROM resumes
UNION ALL SELECT 'sync_manifest', COUNT(*) FROM sync_manifest;

-- Check latest pump operation
SELECT table_name, status, files_count, created_at 
FROM sync_manifest 
ORDER BY created_at DESC LIMIT 1;

-- Check language distribution
SELECT language, COUNT(*) as count FROM collections GROUP BY language;
```

---

## 📋 Quick Reference: Expected Record Counts

| Table | Expected Records | Purpose |
|-------|------------------|---------|
| menu_config | 12 | Dashboard navigation |
| collections | 45+ | 11 languages × 2-5 types each |
| config_files | 8 | apiRouting, languages, pageLayout, etc. |
| data_files | 120+ | achievements, caseStudies, education, etc. |
| static_files | 35 | Web assets (robots.txt, manifest.json, etc.) |
| images | 22 | Portfolio and icon images |
| javascript_files | 18 | JS bundles and assets |
| resumes | 6 | Resume documents |
| sync_manifest | 1+ | One entry per pump operation |
| **TOTAL** | **~271** | All data combined |

---

## 🔧 Troubleshooting

### Issue: Data Manager shows "0 records"
**Solution**: Run "Load Primary Data" button in Overview tab

### Issue: Collections empty
**Solution**: 
1. Make sure `/public/collections/{language}/` folders exist
2. Ensure JSON files are in correct structure
3. Run pump operation again

### Issue: Pump shows "Error"
**Check**:
1. `/public` folder exists and is readable
2. All subdirectories exist (config, data, files, image, js, resume)
3. JSON files are valid (no syntax errors)

### Issue: Tables show wrong counts
**Fix**:
1. Refresh the Data Manager page
2. Wait 5 seconds for auto-update
3. Click "🔄 Refresh Data" button
4. Check Supabase directly with query

---

## 📊 Real-Time Monitoring Dashboard

The Data Manager provides real-time insights:

```
✅ PUMP OPERATIONS
   • Real-time progress (0-100%)
   • Files processed counter
   • Records created counter
   • Operation status (Idle/Processing/Completed/Error)

✅ DATABASE METRICS
   • Total tables count
   • Total records across all tables
   • Storage size in MB
   • Last updated timestamp

✅ TABLE ANALYSIS
   • Individual record counts per table
   • Storage size per table
   • Creation and update timestamps
   • Growth rate classification (Low/Medium/High)
   • Column and index counts

✅ HEALTH STATUS
   • 🟢 Healthy (data present)
   • 🟡 Warning (low data)
   • 🔴 Critical (empty/errors)

✅ AUTO-REFRESH
   • Updates every 5 seconds
   • Manual refresh button
   • Pump monitoring every 2 seconds
```

---

## 🎯 What to Monitor

| Metric | Normal | Warning | Critical |
|--------|--------|---------|----------|
| Total Records | > 100 | 10-100 | < 10 |
| Health Status | 🟢 | 🟡 | 🔴 |
| Last Updated | Within 5 min | > 5 min | Never |
| Pump Status | Completed | In-progress | Error |
| Storage | > 1 MB | 100 KB-1 MB | < 100 KB |

This Data Manager gives you complete visibility into your database health and pump operations!
