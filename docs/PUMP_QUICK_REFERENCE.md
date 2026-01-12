# 🚀 Quick Reference: Pump Operations

## TL;DR - What Gets Pumped?

| Source File Path | Destination Table | What Happens | Used For |
|------------------|-------------------|--------------|----------|
| `public/collections/{lang}/{type}/*.json` | `collections` | Parses JSON, extracts lang & type | Multi-language content |
| `public/config/*.json` | `config_files` | Parses JSON | Global app configuration |
| `public/data/*.json` | `data_files` | Parses JSON | Portfolio data (skills, projects, etc) |
| `public/files/*.*` | `static_files` | Stores as plain text | HTML, XML, manifests |
| `public/image/*.*` | `images` | Stores path & MIME type | Image references |
| `public/js/*.js` | `javascript_files` | Stores as plain text | JavaScript code |
| `public/resume/*.*` | `resumes` | Stores path & file type | Resume/CV files |

---

## API Endpoints

### 1. Pump Data (Local Development)
```bash
POST /api/admin/data
{ "action": "pump" }
```
✅ Local  |  ❌ Vercel (blocked)

### 2. Pump Data (Operations)
```bash
POST /api/admin/operations
{ "operation": "pumpdata" }
```
✅ Local  |  ✅ Vercel (with Postgres)

### 3. Batch Operations
```bash
POST /api/admin/operations
{ "batch": ["createdb", "pumpdata", "syncopublic", "status"] }
```

---

## Key Differences: Pump vs Pumpdata

| Aspect | `pump` (data route) | `pumpdata` (operations) |
|--------|-------------------|------------------------|
| Endpoint | `/api/admin/data` | `/api/admin/operations` |
| Environment | Local only | Works anywhere |
| Used by | Dashboard manual action | Automation, batch ops |
| File system | Uses fs module | Uses fs module |

---

## Collections Table Special Handling

```javascript
// Path: public/collections/en/config/apiConfig.json
// Gets split: ['collections', 'en', 'config', 'apiConfig.json']
//
// INSERT INTO collections VALUES (
//   lang='en',           // From parts[1]
//   type='config',       // From parts[2]
//   filename='apiConfig' // Basename without ext
//   file_content={}      // Parsed JSON
// )
```

**Unique constraint**: `UNIQUE(lang, type, filename)`
- Can have `en/config/apiConfig` AND `fr/config/apiConfig`
- But NOT two `en/config/apiConfig` entries

---

## File Mapping Logic

```javascript
// Path analysis (in order):
if (path contains "/collections/")  → collections table
if (path contains "/files/")        → static_files table
if (path contains "/config/")       → config_files table
if (path contains "/data/")         → data_files table
if (path contains "/image/")        → images table
if (path contains "/js/")           → javascript_files table
if (path contains "/resume/")       → resumes table
else                                → unknown (skipped)
```

---

## JSON Parsing Rules

### ✅ Parsed to JSONB
- `collections/*`
- `config_files/*`
- `data_files/*`

### ❌ Stored as Plain Text
- `static_files/*` (HTML, XML)
- `javascript_files/*` (JS code)
- `resumes/*` (PDFs, DOCX - stored as path only)

### ℹ️ Special Cases
- `images/*` - Path & MIME type stored, not content
- `sync_manifest` - Always created, tracks all files

---

## Response Example

```json
{
  "status": "success",
  "operation": "pumpdata",
  "files_scanned": 487,
  "tables_loaded": 8,
  "timestamp": "2026-01-12T10:30:45.123Z"
}
```

---

## Upsert Behavior

**All tables use ON CONFLICT**:
- New file → INSERT
- Existing file (same hash) → Skip
- Existing file (different hash) → UPDATE

Safe to run multiple times! ✅

---

## Error Handling

```javascript
// JSON parsing errors → Logged as warning, file skipped
// Database errors → Logged per table
// Invalid table name → Rejected at insert
// No file system → Rejected at scan
```

---

## Performance Notes

- **Scan**: O(n) where n = files in /public
- **Parse**: O(n) - concurrent JSON parsing
- **Insert**: Batch insert per table (faster)
- **Typical**: 400-500 files in ~2-3 seconds

---

## Database Size Reference

```
Typical Content Hub Installation:
├── 120 collections files (13 languages × 2 types × ~5 files)
├── 12 config files (global configs)
├── 45 data files (achievements, skills, projects, etc)
├── 48 static files (HTML, XML, manifests)
├── 150 images (logos, favicons, etc)
├── 8 JavaScript files (routers, utilities)
├── 1 resume file
└── ~487 total files scanned

Database Storage: ~10-50 MB (depends on image counts)
```

---

## Common Queries

### Get English Configuration
```sql
SELECT filename, file_content 
FROM collections 
WHERE lang='en' AND type='config'
```

### Get All Languages
```sql
SELECT DISTINCT lang FROM collections ORDER BY lang
```

### Get Specific Data File
```sql
SELECT file_content FROM data_files WHERE filename='skills'
```

### Check What Was Synced
```sql
SELECT file_path, table_name, last_synced 
FROM sync_manifest 
ORDER BY last_synced DESC
```

### Find Outdated Files
```sql
SELECT * FROM sync_manifest 
WHERE last_synced < now() - interval '1 day'
```

---

## Debugging

### Check File Scan
```bash
# See what files would be scanned
POST /api/admin/operations { "operation": "status" }
# Response shows: public_folder_files count
```

### Check Database Tables
```bash
POST /api/admin/operations { "operation": "status" }
# Response shows: database object with all table counts
```

### Monitor Changes
```bash
SELECT * FROM sync_manifest 
WHERE last_synced > now() - interval '1 hour'
```

### Find Missing Files
```javascript
// Files in database but not in /public
SELECT * FROM sync_manifest 
WHERE file_path NOT IN (select files from /public)
```

---

## Environment Variables Required

```bash
# For Postgres (preferred)
DATABASE_URL=postgres://user:pass@host/dbname

# For Supabase fallback
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# Optional
PUBLIC_DIR=/path/to/public  # Defaults to ./public
```

---

## Limitations

| Scenario | Status | Workaround |
|----------|--------|------------|
| File > 10MB | ❌ May fail | Split into smaller files |
| Vercel serverless | ❌ No fs | Use `/api/admin/operations` with DB |
| Docker (no /public mounted) | ❌ Scan fails | Mount /public volume |
| Too many files (>5000) | ⚠️ Slow | Consider pagination |

---

## File Size Recommendations

| Type | Recommended Size | Max Size |
|------|-----------------|----------|
| JSON configs | < 500 KB | 2 MB |
| JSON data | < 1 MB | 5 MB |
| HTML/XML | < 1 MB | 10 MB |
| JavaScript | < 500 KB | 2 MB |
| Images | < 2 MB | 10 MB |
| Resume | < 5 MB | 10 MB |

---

## Testing Locally

```bash
# 1. Create test file
echo '{"test": "data"}' > public/data/test.json

# 2. Trigger pump
curl -X POST http://localhost:3000/api/admin/operations \
  -H "Content-Type: application/json" \
  -d '{"operation":"pumpdata"}'

# 3. Verify in database
SELECT * FROM data_files WHERE filename='test'
# Should show your test JSON

# 4. Cleanup
DELETE FROM data_files WHERE filename='test'
```

---

## Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Operation completed |
| 400 | Bad request | Invalid operation name |
| 401 | Unauthorized | Missing JWT token |
| 500 | Server error | Database connection failed |

---

## Next Steps

1. **[Detailed Guide](./PUMPDATA_API_GUIDE.md)** - Full implementation details
2. **[Table Mapping](./DASHBOARD_TABLE_MAPPING.md)** - Visual schema & queries
3. **[Dashboard Docs](./DASHBOARD_FINAL.md)** - UI integration

