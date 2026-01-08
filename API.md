# Content Hub Sync API Documentation

## Overview

The Sync API provides three core modes for bidirectional file ↔ database synchronization:

1. **Scan** - Detect changes in `/public` folder
2. **Pull** - Apply changes from `/public` to database
3. **Push** - Apply changes from database to `/public` (future)

---

## Endpoint: `/api/admin/sync`

### GET Request

**Purpose:** Check if sync endpoint is active and view available modes

**Request:**
```bash
GET /api/admin/sync
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Sync endpoint is active",
  "available_modes": ["scan", "pull", "push"],
  "usage": "POST /api/admin/sync with { mode: \"scan\" | \"pull\" | \"push\" }",
  "timestamp": "2026-01-08T10:30:00Z"
}
```

---

### POST Request - SCAN Mode

**Purpose:** Detect new, modified, and deleted files in `/public` folder without applying changes

**Request:**
```json
POST /api/admin/sync
Content-Type: application/json

{
  "mode": "scan"
}
```

**Response (200):**
```json
{
  "status": "success",
  "mode": "scan",
  "files_scanned": 156,
  "new_files": 3,
  "modified_files": 5,
  "deleted_files": 1,
  "timestamp": "2026-01-08T10:30:00Z",
  "changes": [
    {
      "path": "public/collections/en/data/achievements.json",
      "relativePath": "collections/en/data/achievements.json",
      "status": "new",
      "table": "collections",
      "hash": "a3f5d8c2b1e9f4a6c8d2e5f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a",
      "fileType": "json"
    },
    {
      "path": "public/data/skills.json",
      "relativePath": "data/skills.json",
      "status": "modified",
      "table": "data_files",
      "hash": "b4g6e9d3c2f0a5b7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b",
      "fileType": "json"
    },
    {
      "path": "public/files/old-resume.pdf",
      "relativePath": "files/old-resume.pdf",
      "status": "deleted",
      "table": "static_files",
      "hash": "c5h7f0e4d3g1b6c8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c",
      "fileType": "pdf"
    }
  ]
}
```

**Field Descriptions:**
- `files_scanned` - Total files found in `/public`
- `new_files` - Count of files not in database
- `modified_files` - Count of files with changed hashes
- `deleted_files` - Count of files in database but missing from `/public`
- `changes` - Array of up to 100 detected changes with:
  - `path` - Full file path
  - `relativePath` - Path relative to `/public`
  - `status` - "new", "modified", or "deleted"
  - `table` - Database table: `collections`, `data_files`, `config_files`, `static_files`, `images`, `resumes`, `javascript_files`
  - `hash` - SHA256 hash of file content
  - `fileType` - File extension

---

### POST Request - PULL Mode

**Purpose:** Apply detected changes from `/public` to database (inserts/updates/deletes)

**Request:**
```json
POST /api/admin/sync
Content-Type: application/json

{
  "mode": "pull"
}
```

**Response (200):**
```json
{
  "status": "success",
  "mode": "pull",
  "files_scanned": 156,
  "new_files": 3,
  "modified_files": 5,
  "deleted_files": 1,
  "timestamp": "2026-01-08T10:30:00Z",
  "changes": [
    {
      "path": "public/collections/en/data/achievements.json",
      "relativePath": "collections/en/data/achievements.json",
      "status": "new",
      "table": "collections",
      "hash": "a3f5d8c2b1e9f4a6c8d2e5f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a",
      "fileType": "json"
    }
  ]
}
```

**What happens:**
1. Scans `/public` folder
2. Compares against `sync_manifest` table in database
3. For **new files**: Inserts into appropriate table + updates sync_manifest
4. For **modified files**: Updates record in table + updates sync_manifest
5. For **deleted files**: Deletes from table + removes from sync_manifest

---

### POST Request - PUSH Mode

**Purpose:** Apply changes from database to `/public` (not yet implemented)

**Request:**
```json
POST /api/admin/sync
Content-Type: application/json

{
  "mode": "push"
}
```

**Response (501):**
```json
{
  "status": "error",
  "mode": "push",
  "error": "Push mode is not yet implemented",
  "timestamp": "2026-01-08T10:30:00Z"
}
```

---

## Error Responses

### Invalid Mode (400)
```json
{
  "status": "error",
  "mode": "invalid-mode",
  "error": "Unknown mode: invalid-mode. Use 'scan', 'pull', or 'push'",
  "timestamp": "2026-01-08T10:30:00Z"
}
```

### Server Error (500)
```json
{
  "status": "error",
  "mode": "unknown",
  "error": "Internal server error message",
  "timestamp": "2026-01-08T10:30:00Z"
}
```

---

## Database Tables

All changes are synced to these tables:

| Table | Purpose | Content Type |
|-------|---------|--------------|
| `collections` | Multilingual content (13 languages) | JSON |
| `config_files` | Configuration files | JSON |
| `data_files` | Data files (skills, projects, etc.) | JSON |
| `static_files` | Static assets (HTML, XML, etc.) | Text/Binary |
| `images` | Image files metadata | Image paths |
| `resumes` | Resume files metadata | File paths |
| `javascript_files` | JavaScript utilities | JavaScript code |
| `sync_manifest` | Change tracking | File hashes + timestamps |

---

## File Type Detection

The API automatically detects which table a file belongs to based on its path:

```
/public/collections/[lang]/[type]/ → collections table
/public/config/                    → config_files table
/public/data/                      → data_files table
/public/files/                     → static_files table
/public/image/                     → images table
/public/resume/                    → resumes table
/public/js/                        → javascript_files table
```

---

## Usage Examples

### 1. Check endpoint status
```bash
curl -X GET http://localhost:3000/api/admin/sync
```

### 2. Scan for changes
```bash
curl -X POST http://localhost:3000/api/admin/sync \
  -H "Content-Type: application/json" \
  -d '{"mode": "scan"}'
```

### 3. Pull changes to database
```bash
curl -X POST http://localhost:3000/api/admin/sync \
  -H "Content-Type: application/json" \
  -d '{"mode": "pull"}'
```

---

## Setup and Initialization

### 1. Set Environment Variables
Create `.env` file in project root:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Run Database Setup Script
```bash
npm run setup-db
# or
node scripts/setup-database.js
```

This script will:
- ✅ Drop all existing tables (fresh start)
- ✅ Scan `/public` folder (156+ files)
- ✅ Create database schema
- ✅ Load all files into database
- ✅ Populate sync_manifest

### 3. Test API Endpoint
```bash
npm run dev
# Open http://localhost:3000/api/admin/sync in browser
```

---

## Architecture Flow

```
/public folder (Source of Truth)
    ↓
    ├─→ SCAN: Detect changes vs sync_manifest
    │
    ├─→ PULL: Apply changes to database
    │   ├─ New files → INSERT
    │   ├─ Modified files → UPDATE
    │   └─ Deleted files → DELETE
    │
    └─→ PUSH: (Future) Apply DB changes to /public

Database Tables (Supabase PostgreSQL)
    ├─ collections (78 records, 13 languages)
    ├─ config_files
    ├─ data_files
    ├─ static_files
    ├─ images
    ├─ resumes
    ├─ javascript_files
    └─ sync_manifest (156 file hashes)
```

---

## Performance Notes

- **Scan Mode**: ~500ms for 156 files
- **Pull Mode**: ~2-3s depending on file sizes
- **Hash Algorithm**: SHA256 for change detection
- **Concurrent Changes**: Up to 5 concurrent file operations

---

## Future Enhancements

- [ ] Implement PUSH mode (database → /public)
- [ ] Add webhook triggers on sync completion
- [ ] Support scheduled sync intervals
- [ ] Add rollback capability
- [ ] Implement real-time file watching (fs.watch)
- [ ] Add compression for large files
- [ ] Support for S3 storage

