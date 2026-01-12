# 📥 Pumpdata API - Complete Guide

## Overview

The **Pumpdata** operation is the core mechanism for loading content from the `/public` folder into the database. It intelligently maps files from disk to database tables based on their file path location.

---

## 🔄 Two Entry Points

### 1. **POST `/api/admin/data`** (action: 'pump')
- **Location**: [app/api/admin/data/route.js](../app/api/admin/data/route.js)
- **Environment**: Local development only (blocked on Vercel)
- **Method**: RESTful POST request
- **Use Case**: Manual triggering from dashboard

### 2. **POST `/api/admin/operations`** (operation: 'pumpdata')
- **Location**: [app/api/admin/operations/route.js](../app/api/admin/operations/route.js)
- **Environment**: Works locally & serverless
- **Method**: RESTful POST request with single or batch operations
- **Use Case**: Batch operations, automation, scheduled tasks

---

## 📁 File-to-Table Mapping

The mapping is defined in [lib/sync-config.js](../lib/sync-config.js):

```javascript
function mapFileToTable(filePath) {
  if (filePath.includes(`${path.sep}collections${path.sep}`)) 
    → table: 'collections'
  if (filePath.includes(`${path.sep}files${path.sep}`)) 
    → table: 'static_files'
  if (filePath.includes(`${path.sep}config${path.sep}`)) 
    → table: 'config_files'
  if (filePath.includes(`${path.sep}data${path.sep}`)) 
    → table: 'data_files'
  if (filePath.includes(`${path.sep}image${path.sep}`)) 
    → table: 'images'
  if (filePath.includes(`${path.sep}js${path.sep}`)) 
    → table: 'javascript_files'
  if (filePath.includes(`${path.sep}resume${path.sep}`)) 
    → table: 'resumes'
}
```

### Path Examples & Mappings

| File Path | Detected Table | Reason |
|-----------|----------------|--------|
| `public/collections/en/config/apiConfig.json` | **collections** | Contains `/collections/` |
| `public/config/pageLayout.json` | **config_files** | Contains `/config/` |
| `public/data/achievements.json` | **data_files** | Contains `/data/` |
| `public/files/manifest.json` | **static_files** | Contains `/files/` |
| `public/image/logo.png` | **images** | Contains `/image/` |
| `public/js/apiRouter.js` | **javascript_files** | Contains `/js/` |
| `public/resume/myresume.pdf` | **resumes** | Contains `/resume/` |

---

## 🔍 Detailed Flow: How Data Gets Pumped

### Step 1: Scan Public Folder
```javascript
const files = scanPublicFolder();
// Returns array of file objects with:
// - path: absolute path
// - relativePath: relative from /public
// - content: file contents (string)
// - hash: SHA256 hash
// - table: mapped table name
// - fileType: extension (json, js, pdf, etc)
```

### Step 2: Initialize Table Buckets
```javascript
const tables = {
  collections: [],        // Multi-lang content
  static_files: [],       // HTML, XML, TXT
  config_files: [],       // JSON configs
  data_files: [],         // JSON data
  images: [],             // PNG, JPG, GIF
  resumes: [],            // PDF, DOCX
  javascript_files: [],   // JS scripts
  sync_manifest: []       // Track what was synced
};
```

### Step 3: Process Each File (Switch by Table)

#### **Case: Collections** ✅ Special Handling
```javascript
// Example: public/collections/en/config/apiConfig.json

const parts = file.relativePath.split(path.sep);
// ['collections', 'en', 'config', 'apiConfig.json']

const langIdx = parts.findIndex(p => p === 'collections');
// langIdx = 0

tables.collections.push({
  lang: parts[langIdx + 1],        // 'en'
  type: parts[langIdx + 2],        // 'config'
  filename: 'apiConfig',            // basename without ext
  file_content: JSON.parse(...),    // Parsed JSON
  file_hash: file.hash,
  synced_at: now
});
```

**Collections Table Structure:**
```sql
CREATE TABLE collections (
  id UUID PRIMARY KEY,
  lang VARCHAR(10),           -- 'en', 'fr', 'es', 'de', 'hi', etc
  type VARCHAR(20),           -- 'config' or 'data'
  filename VARCHAR(255),      -- 'apiConfig', 'achievements', etc
  file_content JSONB,         -- Actual JSON content
  file_hash VARCHAR(64),      -- SHA256 hash
  synced_at TIMESTAMP,
  UNIQUE(lang, type, filename)
);
```

#### **Case: Config Files** 📋
```javascript
// Example: public/config/pageLayout.json

tables.config_files.push({
  filename: 'pageLayout',
  file_type: 'json',
  file_content: JSON.parse(file.content),
  file_hash: file.hash,
  synced_at: now
});
```

**Config Files Table:**
```sql
CREATE TABLE config_files (
  id UUID PRIMARY KEY,
  filename VARCHAR(255) UNIQUE,
  file_type VARCHAR(50),      -- 'json', 'xml'
  file_content JSONB,
  file_hash VARCHAR(64),
  synced_at TIMESTAMP
);
```

#### **Case: Data Files** 📊
```javascript
// Example: public/data/achievements.json

tables.data_files.push({
  filename: 'achievements',
  file_type: 'json',
  file_content: JSON.parse(file.content),
  file_hash: file.hash,
  synced_at: now
});
```

#### **Case: Static Files** 📄
```javascript
// Example: public/files/offline.html

tables.static_files.push({
  filename: 'offline',
  file_type: 'html',
  file_content: file.content,  // Plain text, NOT parsed
  file_hash: file.hash,
  synced_at: now
});
```

#### **Case: Images** 🖼️
```javascript
// Example: public/image/logo.png

tables.images.push({
  filename: 'logo',
  file_path: 'collections/en/image/logo.png',  // Relative path
  mime_type: 'image/png',      // Constructed from extension
  file_hash: file.hash,
  synced_at: now
});
```

**Images Table:**
```sql
CREATE TABLE images (
  id UUID PRIMARY KEY,
  filename VARCHAR(255) UNIQUE,
  file_path VARCHAR(512),      -- File location
  mime_type VARCHAR(50),       -- 'image/png', 'image/jpg'
  file_hash VARCHAR(64),
  synced_at TIMESTAMP
);
```

#### **Case: JavaScript Files** ⚡
```javascript
// Example: public/js/apiRouter.js

tables.javascript_files.push({
  filename: 'apiRouter',
  file_type: 'js',
  file_path: 'js/apiRouter.js',
  file_content: file.content,  // Raw JavaScript
  file_hash: file.hash,
  synced_at: now
});
```

#### **Case: Resumes** 📄
```javascript
// Example: public/resume/resume.pdf

tables.resumes.push({
  filename: 'resume',
  file_type: 'pdf',
  file_path: 'resume/resume.pdf',
  file_hash: file.hash,
  synced_at: now
});
```

### Step 4: Sync Manifest (All Tables)
```javascript
// Track every file for change detection
tables.sync_manifest.push({
  file_path: file.relativePath,    // Original path
  file_hash: file.hash,            // Current hash
  table_name: file.table,          // Which table it went to
  last_synced: now
});
```

### Step 5: Insert into Database
```javascript
let loaded = 0;
for (const [tableName, data] of Object.entries(tables)) {
  if (data.length === 0) continue;  // Skip empty tables
  
  try {
    // Using Supabase client
    await supabase.from(tableName).insert(data);
    loaded++;
  } catch (error) {
    console.error(`❌ ${tableName}: ${error.message}`);
  }
}
```

---

## 📡 API Requests & Responses

### Request 1: Pump via Data Endpoint
```bash
POST /api/admin/data
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "action": "pump"
}
```

**Response (Success):**
```json
{
  "status": "success",
  "operation": "pumpdata",
  "files_scanned": 487,
  "tables_loaded": 8,
  "details": {
    "collections": 120,
    "config_files": 12,
    "data_files": 45,
    "images": 150,
    "static_files": 48,
    "javascript_files": 8,
    "resumes": 1,
    "sync_manifest": 487
  }
}
```

### Request 2: Pumpdata via Operations Endpoint (Single)
```bash
POST /api/admin/operations
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "operation": "pumpdata"
}
```

### Request 3: Batch Operations (Includes Pumpdata)
```bash
POST /api/admin/operations
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "batch": ["createdb", "pumpdata", "status"]
}
```

**Response (Batch):**
```json
{
  "status": "success",
  "operations": ["createdb", "pumpdata", "status"],
  "results": [
    { "status": "success", "operation": "createdb", "tables": 8 },
    { "status": "success", "operation": "pumpdata", "files_scanned": 487, "tables_loaded": 8 },
    { "status": "success", "operation": "status", "database": { ... } }
  ],
  "timestamp": "2026-01-12T10:30:45.123Z"
}
```

---

## 🎯 Dashboard Integration

### Where Pump is Called

**File**: [app/dashboard/page.jsx](../app/dashboard/page.jsx)

```jsx
// Admin actions available in dashboard
const adminActions = [
  { 
    id: 'pump', 
    name: 'Pump Data', 
    icon: '📥',
    description: 'Load files from /public to database'
  },
  { 
    id: 'sync', 
    name: 'Sync Changes', 
    icon: '🔄',
    description: 'Detect changes in /public folder'
  },
  // ... other actions
];
```

### UI Integration Points

1. **Overview Page** → Quick action cards
2. **Admin Panel** → Batch operations
3. **Manual Triggers** → One-off data loads

---

## 🔐 Database Tables Reference

### Collections Table (Multi-language)
```sql
SELECT * FROM collections;
-- Result:
-- id | lang | type   | filename      | file_content | file_hash | synced_at
-- ... | en   | config | apiConfig     | {...}        | abc123... | 2026-01-12
-- ... | en   | data   | achievements  | {...}        | def456... | 2026-01-12
-- ... | fr   | config | apiConfig     | {...}        | ghi789... | 2026-01-12
```

### Config Files Table
```sql
SELECT * FROM config_files;
-- id | filename     | file_type | file_content | file_hash | synced_at
-- ... | pageLayout   | json      | {...}        | abc123... | 2026-01-12
-- ... | urlConfig    | json      | {...}        | def456... | 2026-01-12
```

### Data Files Table
```sql
SELECT * FROM data_files;
-- id | filename      | file_type | file_content | file_hash | synced_at
-- ... | achievements  | json      | {...}        | abc123... | 2026-01-12
-- ... | skills        | json      | {...}        | def456... | 2026-01-12
```

### Sync Manifest Table
```sql
SELECT * FROM sync_manifest;
-- id | file_path                              | file_hash | table_name     | last_synced
-- ... | collections/en/config/apiConfig.json | abc123... | collections    | 2026-01-12
-- ... | config/pageLayout.json                | def456... | config_files   | 2026-01-12
```

---

## 🚀 Usage Examples

### Example 1: Manual Pump from Dashboard
```javascript
async function handlePumpData() {
  const response = await fetch('/api/admin/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'pump' })
  });
  
  const result = await response.json();
  console.log(`✅ Pumped ${result.files_scanned} files into ${result.tables_loaded} tables`);
}
```

### Example 2: Batch with Pump
```javascript
async function setupDatabase() {
  const response = await fetch('/api/admin/operations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      batch: ['createdb', 'pumpdata', 'status']
    })
  });
  
  const { results } = await response.json();
  results.forEach(r => {
    console.log(`${r.operation}: ${r.status}`);
  });
}
```

### Example 3: Query Specific Collections
```javascript
// Get all English configuration files
const { data } = await supabase
  .from('collections')
  .select('*')
  .eq('lang', 'en')
  .eq('type', 'config');

// Result: All EN config files (apiConfig, chatConfig, etc)
```

---

## ⚠️ Important Notes

### 1. **JSON Parsing**
- ✅ **Parsed**: collections, config_files, data_files
- ❌ **NOT Parsed**: static_files, javascript_files, resumes

### 2. **Unique Constraints**
- **collections**: Unique on (lang, type, filename)
- **static_files**: Unique on filename
- **config_files**: Unique on filename
- **data_files**: Unique on filename
- **images**: Unique on filename
- **resumes**: Unique on filename
- **javascript_files**: Unique on filename

### 3. **Upsert Behavior**
When pumping:
- If file exists → Updates hash & content
- If file new → Inserts new record
- Uses ON CONFLICT logic for safe re-runs

### 4. **Environment Constraints**
- ✅ Works: Local development
- ❌ Blocked: Vercel (no filesystem access)
- ✅ Works: Docker containers with /public mounted
- ✅ Works: Self-hosted servers

---

## 🔗 Related Files

- **API Route**: [app/api/admin/operations/route.js](../app/api/admin/operations/route.js)
- **Data Route**: [app/api/admin/data/route.js](../app/api/admin/data/route.js)
- **Config**: [lib/sync-config.js](../lib/sync-config.js)
- **DB Ops**: [lib/dbop.js](../lib/dbop.js)
- **Dashboard**: [app/dashboard/page.jsx](../app/dashboard/page.jsx)

---

## 📊 Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                  REQUEST: POST /api/admin/operations    │
│                  { operation: 'pumpdata' }              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  scanPublicFolder()        │
        │  (Walk /public recursively)│
        └────────┬───────────────────┘
                 │
                 ▼ (Files array)
    ┌────────────────────────────────────────┐
    │ mapFileToTable(filePath)               │
    │ ┌──────────────────────────────────┐  │
    │ │ /collections/ → collections      │  │
    │ │ /config/ → config_files          │  │
    │ │ /data/ → data_files              │  │
    │ │ /files/ → static_files           │  │
    │ │ /image/ → images                 │  │
    │ │ /js/ → javascript_files          │  │
    │ │ /resume/ → resumes               │  │
    │ └──────────────────────────────────┘  │
    └──────┬─────────────────────────────────┘
           │
           ▼ (Mapped files)
    ┌──────────────────────────────────────┐
    │ Process Each File by Table Type      │
    │ ┌────────────────────────────────┐  │
    │ │ Extract lang, type, filename   │  │
    │ │ Parse JSON (if applicable)     │  │
    │ │ Calculate hash & timestamp     │  │
    │ └────────────────────────────────┘  │
    └──────┬───────────────────────────────┘
           │
           ▼ (Table buckets populated)
    ┌────────────────────────────────┐
    │ Insert into Database Tables    │
    │ - collections                  │
    │ - static_files                 │
    │ - config_files                 │
    │ - data_files                   │
    │ - images                       │
    │ - resumes                      │
    │ - javascript_files             │
    │ - sync_manifest                │
    └────────┬───────────────────────┘
             │
             ▼ (Results)
    ┌────────────────────────────────┐
    │ Return JSON Response            │
    │ {                               │
    │   status: 'success',           │
    │   files_scanned: 487,          │
    │   tables_loaded: 8             │
    │ }                              │
    └────────────────────────────────┘
```

