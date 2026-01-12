# 📊 Dashboard Tab Mapping & Structure

## Current Structure (Proposed)

```
DASHBOARD SIDEBAR TABS
│
├─ 📊 Overview (NEW)
│  ├─ Load Primary Data ← Query all tables for quick stats
│  ├─ Service Status
│  └─ Quick Actions
│
├─ 📚 Collections
│  ├─ Language Selector (from collections.lang)
│  │  ├─ English
│  │  │  ├─ Config ← collections WHERE lang='en' AND type='config'
│  │  │  └─ Data ← collections WHERE lang='en' AND type='data'
│  │  ├─ French
│  │  │  ├─ Config ← collections WHERE lang='fr' AND type='config'
│  │  │  └─ Data ← collections WHERE lang='fr' AND type='data'
│  │  └─ [11 more languages...]
│  │
│  └─ Sync Data
│     ├─ Compare: /public/collections vs DB
│     ├─ Show: Similar files ✅
│     ├─ Show: Different files ⚠️
│     └─ Show: Missing files ❌
│
├─ ⚙️ Config
│  ├─ File List ← config_files table
│  ├─ File Viewer/Editor
│  └─ Sync Data
│     ├─ Compare: /public/config vs DB
│     ├─ Show: Similar ✅ / Different ⚠️ / Missing ❌
│     └─ Sync Button
│
├─ 📋 Data
│  ├─ File List ← data_files table
│  ├─ File Viewer/Editor
│  └─ Sync Data
│     ├─ Compare: /public/data vs DB
│     ├─ Show: Similar ✅ / Different ⚠️ / Missing ❌
│     └─ Sync Button
│
├─ 📄 Files
│  ├─ File List ← static_files table
│  ├─ File Viewer
│  └─ Sync Data
│     ├─ Compare: /public/files vs DB
│     ├─ Show: Similar ✅ / Different ⚠️ / Missing ❌
│     └─ Sync Button
│
├─ 🖼️ Images
│  ├─ Gallery/List ← images table (file_path)
│  ├─ Image Viewer
│  └─ Sync Data
│     ├─ Compare: /public/image vs DB
│     ├─ Show: Similar ✅ / Different ⚠️ / Missing ❌
│     └─ Sync Button
│
├─ ✨ JavaScript
│  ├─ File List ← javascript_files table
│  ├─ Code Viewer
│  └─ Sync Data
│     ├─ Compare: /public/js vs DB
│     ├─ Show: Similar ✅ / Different ⚠️ / Missing ❌
│     └─ Sync Button
│
├─ 📑 Resume
│  ├─ File List ← resumes table (file_path)
│  ├─ File Viewer
│  └─ Sync Data
│     ├─ Compare: /public/resume vs DB
│     ├─ Show: Similar ✅ / Different ⚠️ / Missing ❌
│     └─ Sync Button
│
└─ 🔍 Sync Manifest (DB Only)
   ├─ Last Synced Files
   ├─ Change History
   └─ Timestamp Tracking
```

---

## 1. Collections Tab (Expandable)

### Structure
```
Collections (Expandable)
├─ Language Picker (Dropdown or List)
│  ├─ English (en)
│  ├─ French (fr)
│  ├─ German (de)
│  └─ [11 more...]
│
├─ Type Selector (When lang selected)
│  ├─ Config
│  └─ Data
│
├─ File Browser
│  └─ Files from: collections WHERE lang='{selected}' AND type='{selected}'
│
└─ Sync Data (New)
   ├─ Compare:
   │  ├─ Files in /public/collections/{lang}/{type}/
   │  ├─ Files in DB (collections table)
   │  └─ Check hash equality
   │
   └─ Status Display:
      ├─ ✅ Similar (Same hash) → No action needed
      ├─ ⚠️ Different (Different hash) → Update in DB
      └─ ❌ Missing (In /public but not DB) → Needs pump
```

### SQL Query Example
```sql
-- Get all languages
SELECT DISTINCT lang FROM collections ORDER BY lang;

-- Get specific language config
SELECT filename, file_content FROM collections 
WHERE lang='en' AND type='config';

-- Get specific language data
SELECT filename, file_content FROM collections 
WHERE lang='en' AND type='data';
```

---

## 2. Overview Tab (NEW - Load Primary Data)

### What It Does
```
Overview Page
│
├─ Load Primary Data Button (Replaces "Manage Collection")
│  ├─ Queries all tables
│  ├─ Shows counts:
│  │  ├─ Collections: 120 files
│  │  ├─ Config Files: 12 files
│  │  ├─ Data Files: 45 files
│  │  ├─ Static Files: 48 files
│  │  ├─ Images: 150 files
│  │  ├─ JavaScript Files: 8 files
│  │  └─ Resumes: 1 file
│  │
│  └─ Quick Access Cards:
│     ├─ Last Synced: [timestamp from sync_manifest]
│     ├─ Total Files: [sum of all]
│     └─ Languages: [count distinct from collections]
│
├─ Service Status Cards
│  ├─ Database: Online/Offline
│  ├─ API: Online/Offline
│  └─ Last Sync: [from sync_manifest.last_synced]
│
└─ Quick Actions
   ├─ 📥 Pump Data (Load all from /public to DB)
   ├─ 🔄 Sync Data (Compare /public vs DB)
   ├─ 🗑️ Clear All (Delete all from DB)
   └─ 📊 Status (Get detailed stats)
```

### SQL Queries
```sql
-- Count records in all tables
SELECT 
  (SELECT COUNT(*) FROM collections) as collections_count,
  (SELECT COUNT(*) FROM config_files) as config_count,
  (SELECT COUNT(*) FROM data_files) as data_count,
  (SELECT COUNT(*) FROM static_files) as static_count,
  (SELECT COUNT(*) FROM images) as images_count,
  (SELECT COUNT(*) FROM javascript_files) as js_count,
  (SELECT COUNT(*) FROM resumes) as resumes_count;

-- Get languages in collections
SELECT DISTINCT lang FROM collections ORDER BY lang;

-- Get last sync timestamp
SELECT MAX(last_synced) FROM sync_manifest;
```

---

## 3. Sync Data Feature (All Tabs)

### How It Works

```
Sync Data Comparison
│
├─ Step 1: Scan Public Folder
│  └─ Get all files from /public/{type}/
│
├─ Step 2: Query Database
│  └─ Get all files from {table_name}
│
├─ Step 3: Compare by Hash
│  ├─ File exists in both?
│  │  ├─ Same hash? ✅ Similar
│  │  └─ Different hash? ⚠️ Different
│  │
│  ├─ File only in /public? ❌ Missing from DB
│  │
│  └─ File only in DB? ❌ Missing from /public
│
├─ Step 4: Display Results
│  ├─ Similar Files ✅
│  │  └─ No action needed
│  │
│  ├─ Different Files ⚠️
│  │  └─ Update Button (Re-pump this file)
│  │
│  └─ Missing Files ❌
│     └─ Add Button (Pump missing files)
│
└─ Step 5: Sync Button
   └─ Run pump for this tab only
```

### Display Example (Config Tab)
```
┌─────────────────────────────────────┐
│ Config Tab - Sync Data              │
├─────────────────────────────────────┤
│                                     │
│ ✅ SIMILAR (In sync)                │
│ ├─ apiRouting.json                 │
│ ├─ languages.json                  │
│ └─ urlConfig.json                  │
│                                     │
│ ⚠️ DIFFERENT (Need update)          │
│ ├─ pageLayout.json [Update]        │
│ └─ menuConfig.json [Update]        │
│                                     │
│ ❌ MISSING (In /public but not DB)  │
│ ├─ newConfig.json [Add]            │
│ └─ tempConfig.json [Add]           │
│                                     │
│ [Sync All Changes] Button           │
│                                     │
└─────────────────────────────────────┘
```

### SQL Query for Sync
```sql
-- Check what's in database
SELECT filename, file_hash FROM config_files;

-- Will be compared with:
SELECT * FROM sync_manifest WHERE table_name='config_files';

-- Comparison logic:
-- IF file_hash SAME → Similar ✅
-- IF file_hash DIFFERENT → Different ⚠️
-- IF in /public but NOT in sync_manifest → Missing ❌
-- IF in sync_manifest but NOT in /public → Deleted ❌
```

---

## 4. Each Tab Structure (Consistent)

### File Browser Tabs Pattern
```
┌──────────────────────────────────┐
│ {TAB_NAME}                       │
├──────────────────────────────────┤
│                                  │
│ File Browser                     │
│ ├─ File List                     │
│ │  ├─ file1.json                │
│ │  ├─ file2.json                │
│ │  └─ file3.json                │
│ │                               │
│ └─ File Viewer/Editor           │
│    ├─ Content Display           │
│    ├─ Syntax Highlighting       │
│    └─ Edit/Save Buttons         │
│                                  │
│ Sync Data Section               │
│ ├─ Similar ✅                   │
│ ├─ Different ⚠️                 │
│ ├─ Missing ❌                   │
│ └─ [Sync Button]                │
│                                  │
└──────────────────────────────────┘
```

### Tab → Table → Data Mapping

| Tab | Table | Source Path | Type | Fields |
|-----|-------|-------------|------|--------|
| Collections | collections | `/public/collections/` | Multi-lang | lang, type, filename, file_content |
| Config | config_files | `/public/config/` | Config | filename, file_type, file_content |
| Data | data_files | `/public/data/` | Data | filename, file_type, file_content |
| Files | static_files | `/public/files/` | Static | filename, file_type, file_content |
| Images | images | `/public/image/` | Images | filename, file_path, mime_type |
| JavaScript | javascript_files | `/public/js/` | Scripts | filename, file_path, file_content |
| Resume | resumes | `/public/resume/` | Documents | filename, file_type, file_path |

---

## 5. Implementation Checklist

### Phase 1: Tab Structure
- [ ] Update sidebar menu items (8 tabs)
- [ ] Create Overview tab with "Load Primary Data"
- [ ] Create expandable Collections tab with language picker
- [ ] Create Config, Data, Files, Images, JS, Resume tabs

### Phase 2: File Browser
- [ ] List files from each table
- [ ] Show file content in editor
- [ ] Add edit/save functionality
- [ ] Show file metadata (size, type, last modified)

### Phase 3: Sync Data Feature
- [ ] Scan /public folder for each tab
- [ ] Compare with database (by hash)
- [ ] Show Similar ✅ / Different ⚠️ / Missing ❌
- [ ] Add sync buttons to update DB

### Phase 4: Database Integration
- [ ] Write queries for each tab
- [ ] Implement hash comparison logic
- [ ] Show sync_manifest data
- [ ] Track last synced timestamp

---

## 6. API Endpoints Needed

```javascript
// Already exists:
POST /api/admin/operations { "operation": "pumpdata" }

// Already exists:
POST /api/admin/operations { "operation": "syncopublic" }

// Suggested improvements:
POST /api/admin/operations { 
  "operation": "pumpdata",
  "table": "config_files"  // Pump specific table only
}

POST /api/admin/operations {
  "operation": "syncopublic",
  "table": "config_files"  // Sync specific table only
}

GET /api/admin/sync-status
// Returns comparison results:
// {
//   "similar": [...],
//   "different": [...],
//   "missing": [...]
// }
```

---

## 7. UI State Management

### Collections Tab State
```javascript
const [collections, setCollections] = useState({
  selectedLang: 'en',      // English
  selectedType: 'config',  // config or data
  files: [],               // Files from DB
  syncStatus: {
    similar: [],
    different: [],
    missing: []
  }
});
```

### Generic Tab State
```javascript
const [tabState, setTabState] = useState({
  files: [],               // From database
  selectedFile: null,      // Currently viewing
  content: '',             // File content
  syncStatus: {
    similar: [],
    different: [],
    missing: []
  },
  isSyncing: false        // Loading state
});
```

---

## 8. Sync Algorithm (Pseudo-code)

```javascript
async function syncTab(tableName, publicFolder) {
  // Step 1: Scan /public/{folder}
  const filesInPublic = scanFolder(publicFolder);
  
  // Step 2: Get from database
  const filesInDB = await queryTable(tableName);
  
  // Step 3: Build sync_manifest map
  const manifest = await getSyncManifest(tableName);
  
  // Step 4: Compare
  const result = {
    similar: [],      // Same hash
    different: [],    // Different hash
    missing: []       // In /public but not in DB
  };
  
  for (const file of filesInPublic) {
    const manifestEntry = manifest[file.name];
    
    if (!manifestEntry) {
      result.missing.push(file);  // Not synced before
    } else if (manifestEntry.hash !== file.hash) {
      result.different.push(file); // Hash changed
    } else {
      result.similar.push(file);   // All good
    }
  }
  
  return result;
}
```

---

## 9. Question for Confirmation

Before implementing, please confirm:

1. ✅ **Collections Tab**: 
   - Language picker → Config/Data subtabs?
   - Correct structure?

2. ✅ **Overview Tab**:
   - "Load Primary Data" instead of "Manage Collection"?
   - Show counts from all tables?

3. ✅ **Sync Data**:
   - Compare /public folder vs DB?
   - Show Similar ✅ / Different ⚠️ / Missing ❌?
   - Add sync button per tab?

4. ✅ **Implementation Order**:
   - Implement tabs first?
   - Then add Sync Data feature?
   - Then optimize?

5. ✅ **API Changes**:
   - Keep current endpoints?
   - Add table-specific sync?
   - Add comparison endpoint?

---

**Ready to implement once you confirm the structure!** ✅

