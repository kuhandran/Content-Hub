# Admin Dashboard - Complete Feature Guide

## 📊 Dashboard Overview

The enhanced Admin Dashboard now includes **10 tabs** with comprehensive data management, analytics, and control features:

### Tab Structure

```
🔧 Admin Dashboard
├── 📊 Overview          → Load Primary Data + Quick Actions
├── 📚 Collections       → Language Picker + Type Selector
├── 📈 Analytics         → KPIs, Charts, Activity Logs
├── 🎛️ Control Panel     → CRUD Operations for All Tables
├── ⚙️ Config            → Config Files Management
├── 📄 Data              → Data Files Management
├── 📦 Files             → Static Files Management
├── 🖼️ Images            → Image Files Management
├── ⚡ JavaScript         → JavaScript Files Management
└── 📋 Resume            → Resume Files Management
```

---

## 🚀 Key Features

### 1. **Overview Tab** (📊)
**Primary Data Pump**
- 🚀 **Load Primary Data** - Scans `/public` folder and pumps all files to database tables
- Status: Shows loading indicator during operation
- Supported tables: All 8 main database tables

**Database Statistics**
- Real-time record counts for each table
- Grid view with visual card layout
- Auto-updates after pump operations

**Quick Actions**
- 🔄 **Refresh Statistics** - Update all record counts
- 🗑️ **Clear All Data** - (Confirmation required) Clears all database tables
- 📋 **View Sync Manifest** - Shows sync history
- 📊 **Database Health Check** - Validates database connectivity

---

### 2. **Collections Tab** (📚)
**Language Picker**
- Select from 11 languages:
  - en (English)
  - es (Spanish)
  - fr (French)
  - de (German)
  - ar-AE (Arabic)
  - hi (Hindi)
  - id (Indonesian)
  - my (Burmese)
  - si (Sinhala)
  - ta (Tamil)
  - th (Thai)

**Type Selector**
- config (Configuration files)
- data (Data files)

**Sync Data Button**
- 🔄 Compares `/public/collections` with database
- Shows Similar ✅, Different ⚠️, Missing ❌ files
- Supports multi-language comparison

---

### 3. **Analytics Tab** (📈)
**KPI Cards** (Key Performance Indicators)
- 📁 **Total Files** - Count of all files in database
- 📊 **Database Tables** - Number of tables (8)
- ✅ **Sync Success** - Successful sync operations
- ❌ **Sync Failed** - Failed sync operations
- 🕐 **Last Sync** - Timestamp of most recent sync

**Files by Type Chart**
- Horizontal bar charts showing file distribution
- Visual representation of usage by table type
- Percentage-based layout

**Table Growth Trend**
- Timeline view of record growth
- 5-day historical data
- Visual bar representation

**Recent Activity Log**
- Timestamp, Type, Message
- Activity types: PUMP, SYNC, CREATE, DELETE, UPDATE
- Last 5 operations displayed

---

### 4. **Control Panel** (🎛️)
**Table Selector**
- 8 button grid to select any table
- Active table highlighted in blue
- Record count displayed for selected table

**CRUD Operations**
- ➕ **Create** - Add new records to any table
- 📖 **Read** - View all records (max 100)
- ✏️ **Edit** - Modify existing records
- 🗑️ **Delete** - Remove records (with confirmation)

**Dynamic Forms**
- Context-aware forms based on table type
- Field validation for required fields
- Pre-populated edit forms from existing data

**Available Tables**
1. **collections** - Language-based content
2. **config_files** - Configuration data
3. **data_files** - Core data
4. **static_files** - Static assets
5. **images** - Image metadata
6. **javascript_files** - JS bundles
7. **resumes** - Resume data
8. **sync_manifest** - Sync history

---

### 5-10. **File Management Tabs** (⚙️ Config, 📄 Data, 📦 Files, 🖼️ Images, ⚡ JS, 📋 Resume)
**Sync Data Feature**
- 🔄 Compare table with `/public` folder
- Real-time file status detection
- SHA-256 hash-based comparison

**Results Display**
- ✅ **Similar Files** - Matching hash and filename
- ⚠️ **Different Files** - Hash mismatch (needs update)
- ❌ **Missing Files** - In /public but not in database

**Summary Bar**
- Quick overview of comparison results
- Color-coded status badges
- Click to expand detailed file lists

---

## 🔗 API Endpoints

### Analytics API
```
GET /api/admin/analytics
Response: {
  status: "success",
  analytics: {
    totalFiles: number,
    totalTables: 8,
    lastSync: timestamp,
    syncSuccess: number,
    syncFailed: number,
    filesByType: { [key]: count },
    tableGrowth: [ { date, count } ],
    recentActivity: [ { time, type, message } ],
    dataCounts: { [table]: count }
  }
}
```

### Table Management APIs
```
GET  /api/admin/table/[table]              → List all records
POST /api/admin/table/[table]              → Create new record
GET  /api/admin/table/[table]/[id]         → Get single record
PUT  /api/admin/table/[table]/[id]         → Update record
DELETE /api/admin/table/[table]/[id]       → Delete record
```

### Sync Compare API (Existing)
```
POST /api/admin/sync-compare
Body: { table: "table_name", language?: "en" }
Response: {
  status: "success",
  comparison: {
    similar: [ { filename, path, hash, status } ],
    different: [ { filename, path, publicHash, dbHash } ],
    missing: [ { filename, path } ],
    summary: { similar_count, different_count, missing_count }
  }
}
```

---

## 📊 Database Tables

| Table | Purpose | Fields |
|-------|---------|--------|
| **collections** | Multi-language content | id, language, type, content, created_at |
| **config_files** | Configuration data | id, filename, file_path, file_hash, created_at |
| **data_files** | Core data files | id, filename, file_path, file_hash, created_at |
| **static_files** | Static assets | id, filename, file_path, file_hash, created_at |
| **images** | Image metadata | id, filename, file_path, created_at |
| **javascript_files** | JS bundles | id, filename, file_path, file_hash, created_at |
| **resumes** | Resume data | id, filename, file_path, created_at |
| **sync_manifest** | Sync history | id, table, status, message, created_at |

---

## 🚀 How to Use

### 1. **Pump Data** (Load Primary Data)
1. Navigate to `/admin`
2. Go to **Overview tab**
3. Click **🚀 Load Primary Data**
4. Monitor the loading indicator
5. Check database statistics after completion

### 2. **Compare Files**
1. Select any file management tab (Config, Data, Files, etc.)
2. Click **🔄 Sync Data** button
3. Review results:
   - ✅ Green = Matching files
   - ⚠️ Yellow = Hash mismatches
   - ❌ Red = Missing in database
4. Take action on different/missing files

### 3. **Manage Collections**
1. Go to **Collections tab**
2. Select language from dropdown
3. Select type (config/data)
4. Click **🔄 Sync Data**
5. Review multi-language results

### 4. **CRUD Operations**
1. Go to **Control Panel tab**
2. Click table button to select
3. Use:
   - **➕ Create** - Add new records
   - **Record List** - View existing records
   - **✏️ Edit** - Modify records
   - **🗑️ Delete** - Remove records

### 5. **View Analytics**
1. Go to **Analytics tab**
2. Review KPI cards for overview
3. Check charts for file distribution
4. Monitor growth trends
5. Review recent activity log

---

## 🎨 UI Features

**Color Scheme**
- Blue (#0078d4) - Primary actions, selected states
- Green (#107c10) - Success, similar files
- Yellow (#ffc107) - Warnings, different files
- Red (#c50f1f) - Errors, missing files
- Gray (#f0f0f0) - Neutral, backgrounds

**Responsive Design**
- Desktop: Full-width layout with sidebar
- Tablet: Adaptive grid layouts
- Mobile: Stacked vertical layouts

**Loading States**
- ⏳ Loading indicators on buttons
- Disabled state during operations
- Success/Error notifications

---

## ⚠️ Important Notes

1. **Clear All Data** - Permanently removes all records. Use with caution!
2. **Database Limits** - Control Panel loads max 100 records per table
3. **Sync Operations** - Uses SHA-256 hash comparison for file matching
4. **Language Support** - Collections support 11 languages
5. **Backup** - Always backup before bulk operations

---

## 🔒 Security

- **Authentication Required** - All endpoints require valid auth token
- **Table Whitelist** - Only allowed tables can be accessed
- **Input Validation** - All user inputs are validated
- **SQL Injection Prevention** - Parameterized queries used
- **Confirmation Dialogs** - Destructive actions require confirmation

---

## 📱 Access Point

**URL:** `http://localhost:3000/admin`

**Requires:** Valid authentication via `/login`

---

**Last Updated:** January 12, 2026
**Version:** 1.0.0
