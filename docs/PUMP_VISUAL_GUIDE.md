# 📊 Visual Guide: Pumpdata Flow & Dashboard Integration

## 1. End-to-End Flow Diagram

```
USER INTERACTION
    │
    ▼
┌─────────────────────────────────────────────┐
│  Dashboard: /app/dashboard/page.jsx         │
│  "Pump Data" Button Clicked                 │
│  👤 User → 🖱️ Click → POST Request         │
└──────────────┬────────────────────────────┘
               │
               │ POST /api/admin/operations
               │ { "operation": "pumpdata" }
               │
               ▼
┌─────────────────────────────────────────────┐
│  API Handler: /app/api/admin/operations     │
│  Step 1: Check Authentication               │
│  ✅ JWT Valid? Proceed : Reject             │
└──────────────┬────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  pumpData() Function                        │
│  Step 2: Scan Public Folder                 │
│                                             │
│  /public/                                   │
│  ├── collections/                           │
│  ├── config/                                │
│  ├── data/                                  │
│  ├── files/                                 │
│  ├── image/                                 │
│  ├── js/                                    │
│  └── resume/                                │
│                                             │
│  📁 Returns: 487 files with metadata        │
└──────────────┬────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  mapFileToTable() Function                  │
│  Step 3: Route Each File to Table           │
│                                             │
│  File Path Analysis:                        │
│  ├─ Contains /collections/ → collections   │
│  ├─ Contains /config/ → config_files       │
│  ├─ Contains /data/ → data_files           │
│  ├─ Contains /files/ → static_files        │
│  ├─ Contains /image/ → images              │
│  ├─ Contains /js/ → javascript_files       │
│  └─ Contains /resume/ → resumes            │
└──────────────┬────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Process Each File by Table Type            │
│  Step 4: Prepare Records                    │
│                                             │
│  For Collections:                           │
│  ├─ Parse path: lang, type, filename       │
│  ├─ Parse JSON content                     │
│  └─ Create record with all metadata        │
│                                             │
│  For Config/Data:                           │
│  ├─ Parse JSON content                     │
│  └─ Create record                          │
│                                             │
│  For Images/Resumes:                        │
│  ├─ Store path (not content)                │
│  └─ Create record with metadata            │
│                                             │
│  For Static Files/JS:                       │
│  ├─ Keep as plain text                     │
│  └─ Create record                          │
└──────────────┬────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Initialize Table Buckets                   │
│  Step 5: Group Records                      │
│                                             │
│  Table Buckets (In Memory):                 │
│  ├─ collections: [120 records]              │
│  ├─ config_files: [12 records]              │
│  ├─ data_files: [45 records]                │
│  ├─ static_files: [48 records]              │
│  ├─ images: [150 records]                   │
│  ├─ javascript_files: [8 records]           │
│  ├─ resumes: [1 record]                     │
│  └─ sync_manifest: [487 records]            │
└──────────────┬────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Database Insertion                         │
│  Step 6: Write to Database                  │
│                                             │
│  FOR EACH TABLE (8 tables):                 │
│  ├─ Insert records (batch)                  │
│  ├─ Handle ON CONFLICT (upsert)             │
│  └─ Log results                             │
│                                             │
│  📊 Loaded: 8 tables                        │
└──────────────┬────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Return Response to Dashboard               │
│  Step 7: Send Success Confirmation          │
│                                             │
│  {                                          │
│    "status": "success",                     │
│    "operation": "pumpdata",                 │
│    "files_scanned": 487,                    │
│    "tables_loaded": 8                       │
│  }                                          │
└──────────────┬────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Dashboard Updates UI                       │
│  Step 8: Display Results                    │
│                                             │
│  ✅ "Pump successful!"                      │
│  📁 Collections: 120 files                  │
│  📋 Config: 12 files                        │
│  📊 Data: 45 files                          │
│  ... etc                                    │
└─────────────────────────────────────────────┘
```

---

## 2. File Mapping Decision Tree

```
FILE PATH DETECTED
│
├─→ /collections/ in path?
│   └─→ YES: TABLE = "collections"
│       ├─ Extract: lang from path[langIdx + 1]
│       ├─ Extract: type from path[langIdx + 2]
│       ├─ Parse: JSON content
│       └─ Create: Record with lang, type, filename, content
│
├─→ /files/ in path?
│   └─→ YES: TABLE = "static_files"
│       ├─ Extract: filename
│       ├─ Extract: file type (html, xml, txt)
│       ├─ Store: Plain text content
│       └─ Create: Record with filename, type, content
│
├─→ /config/ in path?
│   └─→ YES: TABLE = "config_files"
│       ├─ Extract: filename
│       ├─ Parse: JSON content
│       └─ Create: Record with filename, content
│
├─→ /data/ in path?
│   └─→ YES: TABLE = "data_files"
│       ├─ Extract: filename
│       ├─ Parse: JSON content
│       └─ Create: Record with filename, content
│
├─→ /image/ in path?
│   └─→ YES: TABLE = "images"
│       ├─ Extract: filename
│       ├─ Extract: file extension → MIME type
│       ├─ Store: Path (not content)
│       └─ Create: Record with filename, path, mime_type
│
├─→ /js/ in path?
│   └─→ YES: TABLE = "javascript_files"
│       ├─ Extract: filename
│       ├─ Store: Plain text content
│       └─ Create: Record with filename, path, content
│
├─→ /resume/ in path?
│   └─→ YES: TABLE = "resumes"
│       ├─ Extract: filename
│       ├─ Extract: file type (pdf, docx)
│       ├─ Store: Path (not content)
│       └─ Create: Record with filename, type, path
│
└─→ NO MATCH?
    └─→ SKIP: File not mapped
        (Logged as "unknown" type)
```

---

## 3. Collections Table Special Handling

```
PUBLIC FOLDER STRUCTURE
│
public/collections/
├── en/
│   ├── config/                          ← lang = 'en', type = 'config'
│   │   ├── apiConfig.json               ├─→ Record: (lang='en', type='config', filename='apiConfig')
│   │   ├── pageLayout.json              ├─→ Record: (lang='en', type='config', filename='pageLayout')
│   │   └── urlConfig.json               └─→ Record: (lang='en', type='config', filename='urlConfig')
│   │
│   └── data/                            ← lang = 'en', type = 'data'
│       ├── achievements.json            ├─→ Record: (lang='en', type='data', filename='achievements')
│       ├── caseStudies.json             ├─→ Record: (lang='en', type='data', filename='caseStudies')
│       └── skills.json                  └─→ Record: (lang='en', type='data', filename='skills')
│
├── fr/
│   ├── config/                          ← lang = 'fr', type = 'config'
│   │   └── apiConfig.json               ├─→ Record: (lang='fr', type='config', filename='apiConfig')
│   │
│   └── data/                            ← lang = 'fr', type = 'data'
│       └── achievements.json            └─→ Record: (lang='fr', type='data', filename='achievements')
│
└── [11 more languages...]


COLLECTIONS TABLE RESULT:
│
lang │ type   │ filename      │ unique?
─────┼────────┼───────────────┼────────
en   │ config │ apiConfig     │ ✅ UNIQUE(en, config, apiConfig)
en   │ config │ pageLayout    │ ✅ UNIQUE(en, config, pageLayout)
en   │ data   │ achievements  │ ✅ UNIQUE(en, data, achievements)
fr   │ config │ apiConfig     │ ✅ UNIQUE(fr, config, apiConfig) ← Different from EN!
fr   │ data   │ achievements  │ ✅ UNIQUE(fr, data, achievements) ← Different from EN!
de   │ config │ apiConfig     │ ✅ UNIQUE(de, config, apiConfig) ← Different from EN/FR!
...
```

---

## 4. Data Type Handling

```
┌─────────────────────────────────────────────┐
│  BASED ON FILE EXTENSION & TABLE TYPE       │
└─────────────────────────────────────────────┘
            │
            ▼
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
    JSON FILES         NON-JSON FILES
        │                   │
        ├─ collections      ├─ static_files
        ├─ config_files     ├─ javascript_files
        └─ data_files       ├─ images
                            └─ resumes
        │                   │
        ▼                   ▼
    PARSE JSON          STORE AS-IS
    Parse to object     Keep as plain text
    OR file path        OR file path
        │                   │
        ▼                   ▼
    JSONB Column        TEXT Column
    Searchable          Referenced only
    Queryable           (path-based)
    Indexed             (no indexing)

EXAMPLE:
├─ collections/en/config/apiConfig.json
│  ├─ Input: {"baseUrl": "...", "apiKey": "..."}
│  ├─ Stored: JSONB (parsed)
│  └─ Query: SELECT file_content WHERE ... AND filename = 'apiConfig'
│
├─ config/pageLayout.json
│  ├─ Input: {"header": {...}, "footer": {...}}
│  ├─ Stored: JSONB (parsed)
│  └─ Query: SELECT file_content::text WHERE filename = 'pageLayout'
│
├─ files/offline.html
│  ├─ Input: <html>...</html>
│  ├─ Stored: TEXT (plain)
│  └─ Query: SELECT file_content FROM static_files WHERE filename = 'offline'
│
├─ image/logo.png
│  ├─ Input: [PNG binary]
│  ├─ Stored: image/png (MIME type) + "image/logo.png" (path)
│  └─ Query: SELECT file_path FROM images WHERE filename = 'logo'
│
└─ resume/resume.pdf
   ├─ Input: [PDF binary]
   ├─ Stored: "resume/resume.pdf" (path only)
   └─ Query: SELECT file_path FROM resumes WHERE filename = 'resume'
```

---

## 5. Dashboard Integration Flow

```
DASHBOARD SIDEBAR MENU
│
├─ Overview
│  └─ [Quick Action Cards]
│      ├─ 📥 Pump Data      ──→ POST /api/admin/operations { "operation": "pumpdata" }
│      ├─ 🔄 Sync Changes   ──→ POST /api/admin/operations { "operation": "syncopublic" }
│      ├─ 📊 Status         ──→ POST /api/admin/operations { "operation": "status" }
│      └─ 🗑️ Clear Data     ──→ POST /api/admin/operations { "operation": "deletedb" }
│
├─ Collections ✏️
│  ├─ English
│  │  ├─ Config    ──→ SELECT * FROM collections WHERE lang='en' AND type='config'
│  │  └─ Data      ──→ SELECT * FROM collections WHERE lang='en' AND type='data'
│  ├─ French
│  │  ├─ Config    ──→ SELECT * FROM collections WHERE lang='fr' AND type='config'
│  │  └─ Data      ──→ SELECT * FROM collections WHERE lang='fr' AND type='data'
│  └─ [11 more languages...]
│
├─ Config 📋
│  └─ [File listing]  ──→ SELECT * FROM config_files
│     ├─ apiRouting.json
│     ├─ languages.json
│     └─ pageLayout.json
│
├─ Data 📊
│  └─ [File listing]  ──→ SELECT * FROM data_files
│     ├─ achievements.json
│     ├─ caseStudies.json
│     └─ skills.json
│
├─ Files 📄
│  └─ [File listing]  ──→ SELECT * FROM static_files
│     ├─ offline.html
│     ├─ robots.txt
│     └─ sitemap.xml
│
├─ Images 🖼️
│  └─ [Gallery]       ──→ SELECT * FROM images
│     ├─ Display: <img src="/image/logo.png" />
│     └─ Reference: file_path from database
│
├─ JavaScript ✨
│  └─ [File listing]  ──→ SELECT * FROM javascript_files
│     └─ apiRouter.js
│
└─ Resume 📑
   └─ [File listing]  ──→ SELECT * FROM resumes
      └─ Download link using file_path
```

---

## 6. Record Creation by Table Type

```
COLLECTIONS RECORD CREATION:
Input File: public/collections/en/config/apiConfig.json
Content: {"baseUrl": "https://api.example.com"}

Processing:
├─ Read file → content = '{"baseUrl": "..."}'
├─ Hash file → hash = 'abc123...'
├─ Map table → table = 'collections'
├─ Parse path → ['collections', 'en', 'config', 'apiConfig.json']
├─ Extract lang → lang = 'en' (position 1)
├─ Extract type → type = 'config' (position 2)
├─ Extract filename → filename = 'apiConfig' (basename)
└─ Parse JSON → file_content = {baseUrl: "..."}

Output Record:
{
  lang: 'en',
  type: 'config',
  filename: 'apiConfig',
  file_content: {baseUrl: "https://api.example.com"},
  file_hash: 'abc123...',
  synced_at: '2026-01-12T10:30:00Z'
}
│
└─→ INSERT INTO collections (lang, type, filename, file_content, file_hash, synced_at)


CONFIG FILES RECORD CREATION:
Input File: public/config/pageLayout.json
Content: {"header": {...}, "footer": {...}}

Processing:
├─ Read file → content = '{"header": {...}}'
├─ Hash file → hash = 'def456...'
├─ Map table → table = 'config_files'
├─ Extract filename → filename = 'pageLayout'
└─ Parse JSON → file_content = {header: {...}, footer: {...}}

Output Record:
{
  filename: 'pageLayout',
  file_type: 'json',
  file_content: {header: {...}, footer: {...}},
  file_hash: 'def456...',
  synced_at: '2026-01-12T10:30:00Z'
}
│
└─→ INSERT INTO config_files (filename, file_type, file_content, file_hash, synced_at)


IMAGES RECORD CREATION:
Input File: public/image/logo.png
Content: [PNG binary data] (NOT stored)

Processing:
├─ Read metadata → filename = 'logo'
├─ Hash file → hash = 'ghi789...'
├─ Map table → table = 'images'
├─ Extract extension → ext = 'png'
├─ Create MIME type → mime_type = 'image/png'
└─ Store path → file_path = 'image/logo.png'

Output Record:
{
  filename: 'logo',
  file_path: 'image/logo.png',
  mime_type: 'image/png',
  file_hash: 'ghi789...',
  synced_at: '2026-01-12T10:30:00Z'
}
│
└─→ INSERT INTO images (filename, file_path, mime_type, file_hash, synced_at)
└─→ Dashboard renders: <img src="/image/logo.png" />
```

---

## 7. Error Handling & Upsert Logic

```
┌─────────────────────────────────┐
│  FILE READY FOR DATABASE        │
│  (Record created)               │
└────────────┬────────────────────┘
             │
             ▼
    ┌────────────────────┐
    │ UNIQUE CONSTRAINT? │
    └────┬───────────────┘
         │
         ├─ YES (e.g., collections)
         │  ├─ UNIQUE(lang, type, filename)
         │  └─ Use ON CONFLICT ... DO UPDATE
         │
         └─ YES (others)
            ├─ UNIQUE(filename)
            └─ Use ON CONFLICT ... DO UPDATE


┌──────────────────────────────────┐
│  INSERT INTO collections         │
│  ... ON CONFLICT (lang, type,    │
│  filename) DO UPDATE ...         │
└────────────┬─────────────────────┘
             │
             ▼
    ┌────────────────────────┐
    │ RECORD EXISTS BEFORE?  │
    └───┬────────────────┬───┘
        │                │
      YES              NO
        │                │
        ▼                ▼
    UPDATE          INSERT
    (upsert)        (new)
    │               │
    ├─ Same hash    └─ Record added
    │  └─ Skip         to database
    │                  │
    └─ Different       └─ Success ✅
       hash
       └─ Update
          │
          └─ Success ✅


ERROR HANDLING:
├─ JSON Parse Error
│  └─ Log warning, skip file, continue
│
├─ File Read Error
│  └─ Log warning, skip file, continue
│
├─ Database Insert Error
│  └─ Log error per table, try next table
│
├─ Authentication Error
│  └─ Return 401 Unauthorized
│
└─ File System Error
   └─ Return 500 Internal Server Error
```

---

## 8. Performance Timeline

```
PUMP OPERATION TIMELINE
(487 files in /public)

0ms   ████ Start
      │
25ms  ████████ Scan directory structure
      │
50ms  ████████████ Read all files
      │          (File I/O)
100ms ████████████████████ Calculate hashes
      │                    (SHA256)
150ms ████████████████████████████ Parse JSON files
      │                           (90 files)
200ms ████████████████████████████████████ Categorize by table
      │                                   (mapFileToTable)
250ms ████████████████████████████████████████ Build records
      │                                       (In memory)
300ms ████████████████████████████████████████████ Database batch inserts
      │                                           (Per table)
350ms ████████████████████████████████████████████████
      │
2000ms ████████████████████████████████████████████████████ Insertion complete
       │
       └─→ Total: ~2 seconds for 487 files
```

---

## 9. Database State Before & After

```
BEFORE PUMP:
┌──────────────────┐
│ collections      │  (empty)
│ config_files     │  (empty)
│ data_files       │  (empty)
│ static_files     │  (empty)
│ images           │  (empty)
│ javascript_files │  (empty)
│ resumes          │  (empty)
│ sync_manifest    │  (empty)
└──────────────────┘


DURING PUMP:
┌──────────────────────────────────────┐
│ scanPublicFolder()                   │
│ ├─ 487 files found                   │
│ └─ Loading into memory...            │
│                                      │
│ Processing by table:                 │
│ ├─ collections: 120 files ready      │
│ ├─ config_files: 12 files ready      │
│ ├─ data_files: 45 files ready        │
│ ├─ static_files: 48 files ready      │
│ ├─ images: 150 files ready           │
│ ├─ javascript_files: 8 files ready   │
│ ├─ resumes: 1 file ready             │
│ └─ sync_manifest: 487 entries ready  │
│                                      │
│ Database insertion starting...       │
└──────────────────────────────────────┘


AFTER PUMP:
┌──────────────────────────────────────┐
│ collections      │ 120 rows ✅       │
│ config_files     │ 12 rows ✅        │
│ data_files       │ 45 rows ✅        │
│ static_files     │ 48 rows ✅        │
│ images           │ 150 rows ✅       │
│ javascript_files │ 8 rows ✅         │
│ resumes          │ 1 row ✅          │
│ sync_manifest    │ 487 rows ✅       │
│                                      │
│ Total: ~874 records                  │
│ Status: ✅ READY FOR DASHBOARD       │
└──────────────────────────────────────┘


DASHBOARD CAN NOW:
├─ Show Collections menu with languages
├─ Load config files  
├─ Display portfolio data
├─ Manage files
├─ View images
├─ Run JavaScript
└─ Track changes via sync_manifest
```

---

## 10. Common Query Patterns

```
PATTERN 1: Get all languages
SELECT DISTINCT lang FROM collections ORDER BY lang;
Result: ['en', 'fr', 'de', 'es', 'hi', 'id', 'my', 'pt', 'si', 'ta', 'th', 'zh', 'ar-ae']
└─→ Used by: Language selector dropdown


PATTERN 2: Get config for specific language
SELECT file_content FROM collections 
WHERE lang='en' AND type='config' AND filename='apiConfig';
Result: {"baseUrl": "https://api.example.com", ...}
└─→ Used by: API routing, page setup


PATTERN 3: Get all data files
SELECT filename, file_content FROM data_files;
Result: achievements, caseStudies, skills, projects, education, ...
└─→ Used by: Portfolio page data


PATTERN 4: Get image paths
SELECT filename, file_path, mime_type FROM images;
Result: logo → image/logo.png, favicon → image/favicon.ico, ...
└─→ Used by: Image gallery, logos


PATTERN 5: Track synced files
SELECT file_path, table_name, last_synced FROM sync_manifest 
ORDER BY last_synced DESC LIMIT 10;
Result: Last 10 synced files with timestamps
└─→ Used by: Change tracking, audit log


PATTERN 6: Find outdated files
SELECT file_path FROM sync_manifest 
WHERE last_synced < now() - interval '7 days';
Result: Files not updated in 7 days
└─→ Used by: Change detection, monitoring
```

---

**Visual Guide Complete** ✅

For detailed information, see:
- [Quick Reference](./PUMP_QUICK_REFERENCE.md)
- [API Guide](./PUMPDATA_API_GUIDE.md)
- [Implementation](./PUMP_IMPLEMENTATION.md)
- [Table Mapping](./DASHBOARD_TABLE_MAPPING.md)

