# Admin API Documentation

## Overview
Admin-only API endpoints for administrative operations. All endpoints require admin authentication.

## Base URL
```
/api/admin
```

## Endpoints

### Content Management
- **POST** `/upload` - Upload new content files
  - Requires: Admin authentication
  - Body: FormData with file and metadata
  
- **DELETE** `/delete` - Delete content
  - Requires: Admin authentication
  - Body: { id: string, type: string }

### Synchronization
- **POST** `/sync` - Trigger content synchronization
  - Requires: Admin authentication
  - Syncs content between Redis and database

- **GET** `/sync` - Get last sync status
  - Returns: sync timestamp and status

### Languages
- **GET** `/languages` - List all configured languages
  - Returns: array of language codes
  
- **POST** `/languages` - Add new language
  - Requires: Admin authentication
  - Body: { code: string, name: string }

---

## Authentication
All admin endpoints require:
- Valid admin session/token
- Admin role verification

---

## Error Handling
Failed requests return:
```json
{
  "status": "error",
  "error": "detailed error message",
  "code": "ERROR_CODE"
}
```

---

Last Updated: January 7, 2026
