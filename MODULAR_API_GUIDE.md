# Modular Admin API Documentation

## Overview

The Admin API provides a complete modular system for managing the Content Hub database and syncing operations. You can:
- Create/delete databases
- Pump data from /public folder
- Sync public folder with database
- Combine operations for operational workflows

## Architecture

```
/api/admin/
├── operations/    - Master orchestration endpoint
├── db/           - Database management (create, delete, status)
├── data/         - Data operations (pump, clear, statistics)
└── sync/         - Sync management (scan, pull, push)
```

---

## 1. OPERATIONS ENDPOINT
### `/api/admin/operations`

Master orchestration endpoint for single and batch operations.

### GET /api/admin/operations
Returns available operations and usage examples.

**Response:**
```json
{
  "status": "success",
  "message": "Admin Operations API",
  "available_operations": [
    {
      "name": "createdb",
      "description": "Create all database tables"
    },
    {
      "name": "deletedb",
      "description": "Delete all data from tables"
    },
    {
      "name": "pumpdata",
      "description": "Load data from /public to database"
    },
    {
      "name": "syncopublic",
      "description": "Detect changes in /public folder"
    },
    {
      "name": "status",
      "description": "Get system status and counts"
    }
  ],
  "usage": {
    "single": "POST /api/admin/operations { \"operation\": \"createdb\" }",
    "batch": "POST /api/admin/operations { \"batch\": [\"createdb\", \"pumpdata\", \"status\"] }"
  }
}
```

### POST /api/admin/operations - Single Operation

**Request:**
```bash
curl -X POST https://your-domain.com/api/admin/operations \
  -H "Content-Type: application/json" \
  -d '{"operation": "createdb"}'
```

**Operations:**

#### 1. createdb
Creates all 8 database tables with indexes.
```json
{
  "operation": "createdb"
}
```

**Response:**
```json
{
  "status": "success",
  "operation": "createdb",
  "tables": 8,
  "statements_executed": 10,
  "timestamp": "2026-01-08T10:30:00Z"
}
```

#### 2. deletedb
Deletes all data from all tables (clearing database).
```json
{
  "operation": "deletedb"
}
```

**Response:**
```json
{
  "status": "success",
  "operation": "deletedb",
  "tables_cleared": 8,
  "timestamp": "2026-01-08T10:30:00Z"
}
```

#### 3. pumpdata
Scans /public folder and loads all data into database.
```json
{
  "operation": "pumpdata"
}
```

**Response:**
```json
{
  "status": "success",
  "operation": "pumpdata",
  "files_scanned": 234,
  "tables_loaded": 8,
  "timestamp": "2026-01-08T10:30:00Z"
}
```

#### 4. syncopublic
Scans /public and detects changes (new, modified, deleted files).
```json
{
  "operation": "syncopublic"
}
```

**Response:**
```json
{
  "status": "success",
  "operation": "syncopublic",
  "files_scanned": 234,
  "changes": {
    "new": 5,
    "modified": 3,
    "deleted": 1
  },
  "timestamp": "2026-01-08T10:30:00Z"
}
```

#### 5. status
Returns current system status and database record counts.
```json
{
  "operation": "status"
}
```

**Response:**
```json
{
  "status": "success",
  "operation": "status",
  "database": {
    "collections": 78,
    "static_files": 12,
    "config_files": 4,
    "data_files": 8,
    "images": 45,
    "resumes": 3,
    "javascript_files": 2,
    "sync_manifest": 156
  },
  "public_folder_files": 234,
  "timestamp": "2026-01-08T10:30:00Z"
}
```

### POST /api/admin/operations - Batch Operations

Run multiple operations in sequence. Perfect for operational workflows.

**Request:**
```bash
curl -X POST https://your-domain.com/api/admin/operations \
  -H "Content-Type: application/json" \
  -d '{
    "batch": ["createdb", "pumpdata", "status"]
  }'
```

**Response:**
```json
{
  "status": "success",
  "operations": ["createdb", "pumpdata", "status"],
  "results": [
    {
      "status": "success",
      "operation": "createdb",
      "tables": 8,
      "statements_executed": 10
    },
    {
      "status": "success",
      "operation": "pumpdata",
      "files_scanned": 234,
      "tables_loaded": 8
    },
    {
      "status": "success",
      "operation": "status",
      "database": {...}
    }
  ],
  "timestamp": "2026-01-08T10:30:00Z"
}
```

---

## 2. DATABASE ENDPOINT
### `/api/admin/db`

Low-level database management.

### GET /api/admin/db
Get database status and record counts.

**Response:**
```json
{
  "status": "success",
  "database": {
    "collections": 78,
    "static_files": 12,
    "config_files": 4,
    "data_files": 8,
    "images": 45,
    "resumes": 3,
    "javascript_files": 2,
    "sync_manifest": 156
  },
  "total_records": 308,
  "timestamp": "2026-01-08T10:30:00Z"
}
```

### POST /api/admin/db - Database Actions

#### Create Tables
```bash
curl -X POST https://your-domain.com/api/admin/db \
  -H "Content-Type: application/json" \
  -d '{"action": "create"}'
```

**Response:**
```json
{
  "status": "success",
  "action": "create",
  "tables": 8,
  "statements_executed": 10
}
```

#### Delete All Data
```bash
curl -X POST https://your-domain.com/api/admin/db \
  -H "Content-Type: application/json" \
  -d '{"action": "delete"}'
```

**Response:**
```json
{
  "status": "success",
  "action": "delete",
  "tables_cleared": 8
}
```

#### Drop Single Table
```bash
curl -X POST https://your-domain.com/api/admin/db \
  -H "Content-Type: application/json" \
  -d '{"action": "drop", "table": "collections"}'
```

**Response:**
```json
{
  "status": "success",
  "action": "drop",
  "table": "collections"
}
```

---

## 3. DATA ENDPOINT
### `/api/admin/data`

Data management and statistics.

### GET /api/admin/data
Get data statistics from both /public and database.

**Response:**
```json
{
  "status": "success",
  "public_folder": {
    "total_files": 234,
    "by_type": {
      "collections": 78,
      "static_files": 12,
      "config_files": 4,
      "data_files": 8,
      "images": 45,
      "resumes": 3,
      "javascript_files": 2
    }
  },
  "database": {
    "collections": 78,
    "static_files": 12,
    "config_files": 4,
    "data_files": 8,
    "images": 45,
    "resumes": 3,
    "javascript_files": 2,
    "sync_manifest": 156
  },
  "timestamp": "2026-01-08T10:30:00Z"
}
```

### POST /api/admin/data - Data Actions

#### Pump Data (Load from /public)
```bash
curl -X POST https://your-domain.com/api/admin/data \
  -H "Content-Type: application/json" \
  -d '{"action": "pump"}'
```

**Response:**
```json
{
  "status": "success",
  "action": "pump",
  "files_scanned": 234,
  "tables_loaded": 8,
  "details": {
    "collections": [...],
    "static_files": [...],
    "config_files": [...],
    "data_files": [...],
    "images": [...],
    "resumes": [...],
    "javascript_files": [...],
    "sync_manifest": [...]
  }
}
```

#### Clear Data (Delete all)
```bash
curl -X POST https://your-domain.com/api/admin/data \
  -H "Content-Type: application/json" \
  -d '{"action": "clear"}'
```

**Response:**
```json
{
  "status": "success",
  "action": "clear",
  "tables_cleared": 8
}
```

---

## 4. SYNC ENDPOINT
### `/api/admin/sync`

Bidirectional sync operations.

### GET /api/admin/sync
Get sync status and available modes.

**Response:**
```json
{
  "status": "success",
  "endpoint": "/api/admin/sync",
  "modes": [
    {
      "mode": "scan",
      "description": "Detect changes in /public folder"
    },
    {
      "mode": "pull",
      "description": "Apply changes from /public to database"
    },
    {
      "mode": "push",
      "description": "Sync database back to /public (coming soon)"
    }
  ],
  "database": {...},
  "public_files": 234,
  "timestamp": "2026-01-08T10:30:00Z"
}
```

### POST /api/admin/sync - Sync Modes

#### Scan Mode
Detect new, modified, and deleted files.

```bash
curl -X POST https://your-domain.com/api/admin/sync \
  -H "Content-Type: application/json" \
  -d '{"mode": "scan"}'
```

**Response:**
```json
{
  "status": "success",
  "mode": "scan",
  "files_scanned": 234,
  "changes": {
    "new": 5,
    "modified": 3,
    "deleted": 1,
    "files": [
      {
        "path": "public/data/newfile.json",
        "status": "NEW"
      },
      {
        "path": "public/config/languages.json",
        "status": "MODIFIED"
      }
    ]
  }
}
```

#### Pull Mode
Apply changes from /public to database.

```bash
curl -X POST https://your-domain.com/api/admin/sync \
  -H "Content-Type: application/json" \
  -d '{"mode": "pull"}'
```

**Response:**
```json
{
  "status": "success",
  "mode": "pull",
  "files_synced": 8,
  "timestamp": "2026-01-08T10:30:00Z"
}
```

#### Push Mode (Coming Soon)
Apply database changes back to /public.

```bash
curl -X POST https://your-domain.com/api/admin/sync \
  -H "Content-Type: application/json" \
  -d '{"mode": "push"}'
```

**Response:**
```json
{
  "status": "pending",
  "mode": "push",
  "message": "Push functionality coming soon - sync database back to /public"
}
```

---

## Common Operational Workflows

### 1. Fresh Database Setup (Initial Deployment)
```bash
# Create tables, clear any existing data, load from /public
curl -X POST https://your-domain.com/api/admin/operations \
  -H "Content-Type: application/json" \
  -d '{"batch": ["createdb", "deletedb", "pumpdata", "status"]}'
```

### 2. Sync Changes (After File Updates)
```bash
# Detect and apply changes
curl -X POST https://your-domain.com/api/admin/operations \
  -H "Content-Type: application/json" \
  -d '{"batch": ["syncopublic", "status"]}'
```

### 3. Rebuild Database
```bash
# Complete database refresh
curl -X POST https://your-domain.com/api/admin/operations \
  -H "Content-Type: application/json" \
  -d '{"batch": ["deletedb", "pumpdata", "status"]}'
```

### 4. Check System Health
```bash
# Get complete status
curl https://your-domain.com/api/admin/operations \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"operation": "status"}'
```

### 5. Detailed Data Analysis
```bash
# Get statistics from both /public and database
curl https://your-domain.com/api/admin/data
```

---

## Environment Variables Required

```bash
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-key
POSTGRES_URL=your-postgres-connection-string (optional)
NODE_ENV=production
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "status": "error",
  "error": "Error message describing what went wrong",
  "timestamp": "2026-01-08T10:30:00Z"
}
```

**Common Errors:**
- `400` - Bad request (invalid operation or action)
- `500` - Server error (database connection, file access, etc.)
- `501` - Not implemented (for push mode currently)

---

## Rate Limiting & Safety

- Batch operations run sequentially (safe)
- deletedb completely clears database (reversible with pumpdata)
- All operations logged and timestamped
- File hash-based change detection (SHA256)
- Upsert operations prevent duplicates

---

## Database Tables

The system manages 8 tables:

| Table | Purpose | Records |
|-------|---------|---------|
| `collections` | Multi-language data (13 languages) | ~78 |
| `static_files` | HTML, XML, TXT files | ~12 |
| `config_files` | JSON configuration | ~4 |
| `data_files` | JSON data files | ~8 |
| `images` | Image metadata | ~45 |
| `resumes` | Resume files | ~3 |
| `javascript_files` | JS source files | ~2 |
| `sync_manifest` | Change tracking | ~156 |

---

## File Type Detection

Automatically categorizes files:
- `/collections/*` → collections table
- `/files/*` → static_files table
- `/config/*` → config_files table
- `/data/*` → data_files table
- `/image/*` → images table
- `/resume/*` → resumes table
- `/js/*` → javascript_files table

---

## Next Steps

1. ✅ Completed: Single operation endpoints
2. ✅ Completed: Batch operation support
3. ✅ Completed: Detailed statistics
4. 🔄 In Progress: Push mode (database → /public)
5. 🔄 In Progress: Webhook triggers
6. 🔄 In Progress: Scheduled sync tasks
7. 🔄 In Progress: Admin UI dashboard

---

## Support

For issues or questions about the modular API system, refer to:
- Database logs: `/logs/database.log`
- Sync manifest: Database `sync_manifest` table
- Error logs: Vercel deployment logs
