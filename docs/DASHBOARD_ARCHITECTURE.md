# Dashboard Architecture Diagram

**Comprehensive visual guide to the Admin Dashboard implementation**

---

## System Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                           │
│                 http://localhost:3000/admin                  │
└──────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
        ┌───────────▼──────────┐   ┌────▼──────────────┐
        │  Frontend (React)    │   │ Backend (Node.js) │
        │  AdminDashboard.jsx  │   │ /api/admin/*      │
        └───────────┬──────────┘   └────┬──────────────┘
                    │                   │
                    │                   │
        ┌───────────▼──────────┐   ┌────▼──────────────┐
        │ State Management     │   │ API Routes        │
        │ - activeTab          │   │ - sync-compare    │
        │ - activeLanguage     │   │ - data (pump)     │
        │ - syncData           │   └────┬──────────────┘
        │ - dataCounts         │        │
        └──────────────────────┘   ┌────▼──────────────┐
                    │              │ File System       │
                    │              │ /public/          │
                    │              │ ├── collections/  │
        ┌───────────▼──────────┐   │ ├── config/       │
        │ CSS Modules          │   │ ├── data/         │
        │ AdminDashboard.css   │   │ ├── files/        │
        │ - Dark theme         │   │ ├── image/        │
        │ - Responsive         │   │ ├── js/           │
        │ - Color coding       │   │ └── resume/       │
        └──────────────────────┘   └────┬──────────────┘
                    │                   │
                    └───────────────────┤
                                  ┌─────▼──────────┐
                                  │  Database      │
                                  │  (Postgres/    │
                                  │   Supabase)    │
                                  │                │
                                  │  8 Tables:     │
                                  │  - collections │
                                  │  - config      │
                                  │  - data        │
                                  │  - files       │
                                  │  - images      │
                                  │  - javascript  │
                                  │  - resumes     │
                                  │  - manifest    │
                                  └────────────────┘
```

---

## Request Flow Diagram

### Scenario: User Clicks "Sync Data" on Config Tab

```
┌─────────────────┐
│ User Clicks     │
│ "🔄 Sync Data"  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ React Component         │
│ handleSyncData('config')│
└────────┬────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ POST /api/admin/sync-compare │
│ { table: 'config_files' }    │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ scanFolderForTable()         │
│ Scans /public/config/        │
│ Returns: [files with hashes] │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ getFilesFromDB()             │
│ Queries config_files table   │
│ Returns: [DB files]          │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ compareFiles()               │
│ Matches by filename          │
│ Compares SHA-256 hashes      │
└────────┬─────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Return Results:                │
│ {                              │
│   similar: [12 files],         │
│   different: [2 files],        │
│   missing: [0 files]           │
│ }                              │
└────────┬───────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ React Updates UI             │
│ - Shows summary bar          │
│ - Lists different files      │
│ - Lists missing files        │
│ - Color codes each           │
└──────────────────────────────┘
```

---

## Data Flow: File Pump Operation

```
┌─────────────────────────────┐
│ User Clicks                 │
│ "🚀 Load Primary Data"      │
└────────┬────────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Confirmation Dialog      │
│ "Continue?"              │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ POST /api/admin/data         │
│ { action: 'pump' }           │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ scanPublicFolder()           │
│ Recursive scan of /public    │
│ Reads all allowed files      │
│ Calculates SHA-256 hashes    │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ mapFileToTable()             │
│ Routes files to 8 tables:    │
│ - /collections/* → collections
│ - /config/* → config_files   │
│ - /data/* → data_files       │
│ - /files/* → static_files    │
│ - /image/* → images          │
│ - /js/* → javascript_files   │
│ - /resume/* → resumes        │
│ - all → sync_manifest        │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Database Operations          │
│ INSERT/UPSERT for each table │
│ ON CONFLICT DO UPDATE        │
│ (safe for re-runs)           │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Update sync_manifest         │
│ Track file_hash + timestamp  │
│ For future change detection  │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Return Success Response      │
│ {                            │
│   status: 'success',         │
│   stats: {                   │
│     collections: 180,        │
│     config_files: 10,        │
│     data_files: 45,          │
│     ...                      │
│   }                          │
│ }                            │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ React Updates UI             │
│ - Show success message       │
│ - Update statistics          │
│ - Refresh data counts        │
└──────────────────────────────┘
```

---

## Collections Tab Special Flow

```
┌──────────────────────────────┐
│ Collections Tab Rendered     │
└────────┬─────────────────────┘
         │
    ┌────┴────┐
    │          │
    ▼          ▼
┌─────────┐  ┌────────────┐
│Language │  │   Type     │
│Selector │  │  Selector  │
│(11 opts)│  │(config/data│
└────┬────┘  └──────┬─────┘
     │              │
     │ User selects │
     │ language="en"│
     │ type="config"│
     │              │
     └──────┬───────┘
            │
            ▼
┌────────────────────────────────┐
│ Compute key:                   │
│ "en/config"                    │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ User clicks "🔄 Sync Data"     │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ POST /api/admin/sync-compare       │
│ { table: 'collections' }           │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ scanFolderForTable('collections')  │
│ Scans /public/collections/**        │
│ Extracts lang + type from path     │
│ Returns ALL lang/type combinations │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ getCollectionsFromDB()             │
│ SELECT lang, type, filename, hash  │
│ FROM collections                   │
│ Returns ALL records                │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ compareCollections()               │
│ Group DB by lang/type/filename     │
│ Match public files                 │
│ Compare hashes                     │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Return Results:                    │
│ {                                  │
│   similar: [                       │
│     {lang:"en", type:"config", ... │
│   ],                               │
│   different: [...],                │
│   missing: [...]                   │
│ }                                  │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ React Displays:                    │
│ Files for en/config only           │
│ (even though all data was returned)│
│ User sees filtered results         │
└────────────────────────────────────┘
```

---

## Component Hierarchy

```
App
└── AdminDashboard
    ├── Sidebar
    │   ├── Title (🔧 Admin Dashboard)
    │   └── NavItems (8 tabs)
    │       ├── Overview
    │       ├── Collections
    │       ├── Config
    │       ├── Data
    │       ├── Files
    │       ├── Images
    │       ├── JavaScript
    │       └── Resume
    │
    └── MainContent
        ├── OverviewTab
        │   ├── LoadPrimaryDataButton
        │   ├── StatsGrid
        │   │   ├── StatCard (collections)
        │   │   ├── StatCard (config_files)
        │   │   ├── StatCard (data_files)
        │   │   └── ... (8 cards)
        │   └── QuickActionsGrid
        │       ├── RefreshButton
        │       ├── ClearButton
        │       ├── ManifestButton
        │       └── HealthCheckButton
        │
        ├── CollectionsTab
        │   ├── CollectionSelector
        │   │   ├── LanguageSelect
        │   │   └── TypeSelect
        │   └── SyncSection
        │       ├── SyncButton
        │       └── SyncResults
        │
        └── GenericTab (Config/Data/Files/Images/JS/Resume)
            ├── FileList
            ├── SyncButton
            └── SyncResults
                ├── SummaryBar
                │   ├── SimilarBadge
                │   ├── DifferentBadge
                │   └── MissingBadge
                ├── DifferentFileSection
                │   └── FileItems (yellow border)
                ├── MissingFileSection
                │   └── FileItems (red border)
                └── SimilarFileSection (accordion)
                    └── FileItems (green border)
```

---

## State Management Flow

```
AdminDashboard Component

┌─────────────────────────┐
│ useState Hooks          │
├─────────────────────────┤
│ activeTab               │ ← which tab is selected
│ activeLanguage          │ ← selected language (Collections)
│ activeCollectionType    │ ← selected type (Collections)
│ syncData                │ ← sync comparison results
│ syncLoading             │ ← is sync in progress?
│ dataCounts              │ ← table row counts
│ loadingData             │ ← is pump in progress?
└─────────────────────────┘
         │
         │
    ┌────┴────────────┐
    │                 │
    ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ Event        │  │ Effect       │
│ Handlers     │  │ Hooks        │
├──────────────┤  ├──────────────┤
│ handleLoadPri│  │ loadDataStat-│
│ maryData()   │  │ istics()     │
│ handleSyncDa │  │ (on mount)   │
│ ta()         │  │              │
└──────────────┘  └──────────────┘
    │
    │ Call APIs
    │
    ├─→ POST /api/admin/data
    │   └─ setDataCounts()
    │
    ├─→ POST /api/admin/sync-compare
    │   └─ setSyncData()
    │
    └─→ GET /api/admin/data
        └─ setDataCounts()
```

---

## File Organization

```
Project Root
│
├── app/
│   ├── api/
│   │   └── admin/
│   │       └── sync-compare/
│   │           └── route.js ★ NEW
│   │
│   └── admin/
│       └── page.jsx ★ NEW
│
├── components/
│   ├── AdminDashboard.jsx ★ NEW
│   └── AdminDashboard.module.css ★ NEW
│
├── docs/
│   ├── IMPLEMENTATION_COMPLETE.md ★ NEW
│   ├── QUICK_START.md ★ NEW
│   ├── COMPLETION_SUMMARY.md ★ NEW
│   ├── DASHBOARD_ARCHITECTURE.md ★ NEW (this file)
│   └── ... (original docs)
│
├── public/
│   ├── collections/
│   │   ├── en/ { config/, data/ }
│   │   ├── es/ { config/, data/ }
│   │   └── ... (11 languages)
│   ├── config/
│   ├── data/
│   ├── files/
│   ├── image/
│   ├── js/
│   └── resume/
│
└── (other project files)

★ = New files created in this implementation
```

---

## API Response Examples

### GET /api/admin/data
```json
{
  "status": "success",
  "public_folder": {
    "total_files": 245,
    "by_type": {
      "collections": 50,
      "config_files": 10,
      "data_files": 35,
      "static_files": 8,
      "images": 60,
      "javascript_files": 15,
      "resumes": 2,
      "sync_manifest": 245
    }
  },
  "database": {
    "collections": 180,
    "config_files": 10,
    "data_files": 45,
    "static_files": 8,
    "images": 70,
    "javascript_files": 15,
    "resumes": 2,
    "sync_manifest": 330
  },
  "timestamp": "2026-01-12T15:30:00Z"
}
```

### POST /api/admin/sync-compare
```json
{
  "status": "success",
  "table": "config_files",
  "timestamp": "2026-01-12T15:30:00Z",
  "comparison": {
    "similar": [
      {
        "filename": "apiConfig",
        "path": "config/apiConfig.json",
        "hash": "abc123def456...",
        "status": "similar",
        "message": "In sync"
      }
    ],
    "different": [
      {
        "filename": "pageLayout",
        "path": "config/pageLayout.json",
        "publicHash": "def456...",
        "dbHash": "abc123...",
        "status": "different",
        "message": "Hash mismatch - needs update"
      }
    ],
    "missing": [
      {
        "filename": "newConfig",
        "path": "config/newConfig.json",
        "status": "missing",
        "message": "In /public but not in database"
      }
    ],
    "summary": {
      "total_in_public": 12,
      "total_in_db": 11,
      "similar_count": 10,
      "different_count": 1,
      "missing_count": 1
    }
  }
}
```

---

## UI State Transitions

```
Initial State
├─ activeTab: 'overview'
├─ syncData: null
├─ syncLoading: false
├─ dataCounts: { ... }
└─ loadingData: false
    │
    │ User clicks Config tab
    ▼
State After Tab Change
├─ activeTab: 'config' ✓
├─ syncData: null ✓ (cleared)
├─ syncLoading: false
├─ dataCounts: { ... }
└─ loadingData: false
    │
    │ User clicks "Sync Data"
    ▼
State During Sync
├─ activeTab: 'config'
├─ syncData: null
├─ syncLoading: true ✓ (button shows "⏳ Syncing...")
├─ dataCounts: { ... }
└─ loadingData: false
    │
    │ API returns results
    ▼
State After Sync
├─ activeTab: 'config'
├─ syncData: { similar, different, missing, summary } ✓
├─ syncLoading: false ✓ (button back to "🔄 Sync Data")
├─ dataCounts: { ... }
└─ loadingData: false
    │
    │ Results displayed with color coding
    │ ✅ Green for similar
    │ ⚠️ Yellow for different
    │ ❌ Red for missing
    ▼
User Can:
├─ Switch to another tab (clears syncData)
├─ Click Sync Data again (updates results)
├─ Click "Load Primary Data" to pump (if different/missing found)
└─ Scroll through results
```

---

## Error Handling Flow

```
User Action
    │
    ▼
┌──────────────┐
│ Try {        │
│  - Fetch API │
│  - Parse JSON│
│  - Set State │
│ }            │
└──────┬───────┘
       │
       ├─→ Success
       │   └─ Update state
       │      Display results
       │
       └─→ Error
           ├─ catch block
           ├─ console.error()
           ├─ alert() user
           │  "❌ Error: [message]"
           └─ Keep UI responsive
              (loading state cleared)
```

---

## Performance Considerations

```
┌─────────────────────────────┐
│ File Scanning               │
├─────────────────────────────┤
│ - Recursive directory walk  │
│ - Filter by extension       │
│ - Only allowed files        │
│ - Lazy: only on demand      │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Hash Calculation            │
├─────────────────────────────┤
│ - SHA-256 (standard)        │
│ - Only file content         │
│ - UTF-8 encoding            │
│ - Once per file             │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Database Queries            │
├─────────────────────────────┤
│ - SELECT only needed cols   │
│ - No full content retrieval │
│ - SQL or Supabase native    │
│ - Indexed lookups           │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ UI Rendering                │
├─────────────────────────────┤
│ - CSS Modules (scoped)      │
│ - Virtual scrolling optional│
│ - Lazy detail expansion     │
│ - Responsive grid layout    │
└─────────────────────────────┘
```

---

**This architecture supports:**
✅ Multi-language collections  
✅ 8 independent table types  
✅ Real-time sync comparison  
✅ Responsive design  
✅ Error handling  
✅ Loading states  
✅ Color-coded status  
✅ Expandable details  
✅ Mobile friendly  
✅ Production ready
