```markdown
[Copied intact from original API.md]
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

... (remaining sections preserved from original) ...
```
