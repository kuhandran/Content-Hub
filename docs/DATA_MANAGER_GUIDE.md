# Data Manager Dashboard - Complete Documentation

## Overview

The **Data Manager** tab (💾) is a comprehensive database analysis and monitoring tool integrated into the Admin Dashboard. It provides real-time insights into:
- Pump operation progress and status
- Complete database table analysis
- Record counts for all tables
- Database health metrics
- Storage usage statistics

## Features

### 1. Pump Monitor Card
Displays real-time pump operation status with:
- **Status Badge** - Shows current pump state:
  - ⏸️ Idle - No active operation
  - ⏳ Processing - Pump operation in progress
  - ✅ Completed - Last operation finished
  - ❌ Error - Last operation failed
- **Progress Bar** - Visual representation of completion (0-100%)
- **Files Processed** - Count of files analyzed
- **Records Created** - Total records inserted into database
- **Last Run** - Timestamp of last pump operation
- **Status Message** - Detailed operation information

### 2. Database Summary (4 Cards)
Quick overview metrics:
- **📋 Total Tables** - Number of tables in database (9 total)
- **📊 Total Records** - Cumulative record count across all tables
- **💾 Total Size** - Database size in MB
- **⚡ Last Updated** - When summary was last refreshed

### 3. Database Tables Analysis
Interactive grid showing all 9 tables:

#### Tables Included:
1. **menu_config** (📋)
   - Dashboard navigation menus
   - Expected records: 9 (sidebar menu items)
   - Fields: menu_name, display_name, icon, folder_path, menu_order, has_submenu

2. **collections** (📚)
   - Multi-language content configurations
   - 11 supported languages: en, es, fr, de, ar-AE, hi, id, my, si, ta, th
   - Stores both config and data for each language

3. **config_files** (⚙️)
   - Configuration files (apiRouting.json, languages.json, pageLayout.json, etc.)
   - Tracks file hash for change detection

4. **data_files** (📊)
   - Core application data (achievements, caseStudies, education, experience, projects, skills)
   - Stores JSON content with versioning

5. **static_files** (📄)
   - Web assets (robots.txt, sitemap.xml, manifest.json, browserconfig.xml)
   - Offline.html, privacy-policy.html, terms-of-service.html

6. **images** (🖼️)
   - Image file metadata
   - Stores dimensions, alt text, image URLs

7. **javascript_files** (⚡)
   - JS bundles and assets
   - Tracks minification status

8. **resumes** (📄)
   - Resume document data

9. **sync_manifest** (📜)
   - Audit log of all pump/sync operations
   - Tracks status, file counts, errors

#### Each Table Card Shows:
- **Table Name & Icon** - Visual identification
- **Record Count Badge** - Number of records (highlighted)
- **Records Stat** - Detailed count
- **Size Stat** - Storage usage in KB
- **Created Date** - When table was first populated
- **Expandable Details** (click to expand):
  - Last Updated timestamp
  - Column count
  - Index count
  - Growth rate (Low/Medium/High)

### 4. Refresh Data Button
- Manual refresh trigger
- Updates all statistics immediately
- Shows "Refreshing..." state while loading
- Automatically polls every 5 seconds

### 5. Database Health Section
Visual health indicators showing:
- 🟢 Healthy - Database operational with data
- 🟡 Warning - Database exists but low record count
- 🔴 Critical - Database empty or errors

Status message indicates:
- ✅ "Database is operational and populated with data" (if records > 0)
- ⚠️ "Database is empty. Run 'Load Primary Data' to populate." (if records = 0)

## API Endpoints

### GET /api/admin/database-stats
Returns comprehensive database statistics.

**Response Structure:**
```json
{
  "success": true,
  "summary": {
    "totalTables": 9,
    "totalRecords": 1234,
    "totalSize": 2048576,
    "lastUpdated": "2024-01-12 10:30:45",
    "health": "healthy"
  },
  "tables": [
    {
      "name": "menu_config",
      "icon": "📋",
      "recordCount": 9,
      "size": 16384,
      "createdAt": "2024-01-12T10:00:00Z",
      "updatedAt": "2024-01-12T10:15:00Z",
      "columnCount": 9,
      "indexCount": 2,
      "growthRate": "Low"
    },
    // ... more tables
  ]
}
```

**Features:**
- Queries all 9 database tables
- Retrieves record counts via COUNT(*)
- Calculates table sizes in bytes
- Gets created/updated timestamps
- Determines growth rate (Low < 10, Medium < 100, High ≥ 100)
- Assigns appropriate icons for each table

### GET /api/admin/pump-monitor
Returns current pump operation status and history.

**Response Structure:**
```json
{
  "status": "idle",
  "progress": 0,
  "filesProcessed": 0,
  "recordsCreated": 0,
  "message": "Ready to pump data",
  "lastRun": "2024-01-12T10:15:00Z",
  "statistics": {
    "totalOperations": 5,
    "successfulOperations": 4,
    "failedOperations": 1,
    "totalFilesProcessed": 1234
  },
  "timestamp": "2024-01-12T10:30:45Z"
}
```

**Features:**
- Queries sync_manifest table for latest operation
- Calculates progress based on status
- Provides aggregated statistics across all pump operations
- Returns operation timestamps in ISO format

## Data Flow

### Pump Operation Workflow:
1. User clicks "Load Primary Data" in Overview tab
2. Pump reads all files from `/public` folder structure
3. Files are categorized:
   - `/public/collections/{language}/{type}/` → collections table
   - `/public/config/` → config_files table
   - `/public/data/` → data_files table
   - `/public/files/` → static_files table
   - `/public/image/` → images table
   - `/public/js/` → javascript_files table
   - `/public/resume/` → resumes table
4. Records created in database with:
   - File name and path
   - SHA-256 hash for change detection
   - JSON content (when applicable)
   - Timestamps (created_at, updated_at)
5. sync_manifest table logs the operation with:
   - Table name affected
   - Operation status (completed/error)
   - File count and record count
   - Success/failure messages

### Data Manager Monitoring:
1. Component fetches `/api/admin/database-stats` (polls every 5 seconds)
2. Component fetches `/api/admin/pump-monitor` (polls every 2 seconds during pump)
3. UI updates in real-time with:
   - Progress bar movement
   - Record count increments
   - Status badge changes
   - Table statistics refresh

## Key Differentiators from Control Panel

| Feature | Control Panel | Data Manager |
|---------|---------------|--------------|
| **Purpose** | CRUD operations | Monitoring & Analysis |
| **Create Records** | ✅ Manual form input | ❌ No |
| **Edit Records** | ✅ Full editor | ❌ No |
| **Delete Records** | ✅ Yes | ❌ No |
| **View Records** | ✅ Individual records with JsonViewer | ✅ Aggregate statistics |
| **Pump Monitoring** | ❌ No | ✅ Real-time progress |
| **Table Analysis** | ❌ No | ✅ Complete metrics |
| **Database Health** | ❌ No | ✅ Yes |
| **Record Counts** | ❌ No | ✅ All tables with sizes |
| **Growth Tracking** | ❌ No | ✅ Yes (calculated) |
| **History** | ❌ No | ✅ Last 5 operations shown |

## Usage Guide

### Initial Setup
1. Navigate to Admin Dashboard (`/admin`)
2. Click "💾 Data Manager" tab
3. See current database state with all tables and record counts

### Monitor Pump Operation
1. Go to "Overview" tab
2. Click "🚀 Load Primary Data" button
3. Switch to "💾 Data Manager" tab
4. Watch progress bar fill as files are processed
5. Monitor "Files Processed" and "Records Created" updates
6. See "Last Run" timestamp update when pump completes

### Analyze Database Health
1. Open "💾 Data Manager"
2. Review summary cards:
   - Total Tables (should be 9)
   - Total Records (increases after pump)
   - Total Size (grows with data)
3. Review health status:
   - 🟢 Healthy = database has data
   - 🟡 Warning = low record count
   - 🔴 Critical = empty or errors

### Explore Individual Tables
1. Scroll to "Database Tables Analysis" section
2. Click any table card to expand
3. View detailed information:
   - Record count with colored badge
   - Storage size in KB
   - Creation date
   - Column and index counts
   - Growth rate classification

### Refresh Statistics
1. Click "🔄 Refresh Data" button
2. UI shows "Refreshing..." state
3. Wait for completion
4. All statistics update with latest data

## Performance Considerations

- **Polling Interval**: 5 seconds for database stats, 2 seconds for pump status
- **Query Optimization**: Uses indexed columns (menu_order, created_at, file_hash)
- **Response Caching**: Stats cached per request, not stored
- **Real-time Updates**: Auto-polling disabled if tab inactive

## Database Schema Integration

All 9 tables are pre-created with:
- **UUID Primary Keys** - Distributed system support
- **Timestamps** - created_at, updated_at with timezone
- **Indexes** - Performance optimization for queries
- **JSONB Storage** - Flexible content handling
- **File Hashing** - Change detection via SHA-256
- **Row-Level Security** - Authenticated access only
- **Unique Constraints** - Prevent duplicate file_path entries

## Troubleshooting

### 0 Records in menu_config
- **Cause**: SQL schema executed without menu INSERT statements
- **Solution**: Run STEP 6 INSERT from DATABASE_SCHEMA.sql
- **Verification**: Should show 9 records (overview, collections, config, data, files, images, js, placeholder, resume)

### All Tables Empty After Pump
- **Cause**: Pump operation failed or `/public` folder doesn't exist
- **Solution**: 
  1. Check `/public` folder structure is correct
  2. Verify file permissions
  3. Check sync_manifest table for error messages
  4. Run pump again

### Data Manager Shows "Unauthorized"
- **Cause**: Not logged into admin dashboard
- **Solution**: Log in at `/login` first, then access `/admin`

### Tables Not Appearing
- **Cause**: Database connection issue
- **Solution**: 
  1. Verify DATABASE_URL environment variable is set
  2. Check Supabase connection status
  3. Run verification queries from DATABASE_SCHEMA.sql

## Related Components

- **[AnalyticsPanel.jsx](../AnalyticsPanel.jsx)** - KPI charts and metrics
- **[ControlPanel.jsx](../ControlPanel.jsx)** - CRUD operations
- **[AdminDashboard.jsx](../AdminDashboard.jsx)** - Main dashboard container
- **[DATABASE_SCHEMA.sql](./DATABASE_SCHEMA.sql)** - Schema creation script

## Future Enhancements

- [ ] Export statistics as CSV/JSON
- [ ] Historical trend graphs
- [ ] Database backup/restore interface
- [ ] Table-specific operation logs
- [ ] Performance profiling metrics
- [ ] Query cost estimation
- [ ] Disk usage warnings/alerts
- [ ] Data cleanup/archival tools
