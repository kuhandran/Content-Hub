# Quick API Reference

## Domain
`static.kuhandranchatbot.info` or your Vercel domain

## Available Endpoints

### Master Orchestration
```
GET    /api/admin/operations          - List available operations
POST   /api/admin/operations          - Execute single or batch operation
```

### Database Management
```
GET    /api/admin/db                  - Database status
POST   /api/admin/db                  - Create/delete/drop tables
```

### Data Operations
```
GET    /api/admin/data                - Data statistics
POST   /api/admin/data                - Pump or clear data
```

### Sync Management
```
GET    /api/admin/sync                - Sync status
POST   /api/admin/sync                - Scan/pull/push changes
```

---

## Quick Commands

### 1. Initialize Everything
```bash
curl -X POST https://static.kuhandranchatbot.info/api/admin/operations \
  -H "Content-Type: application/json" \
  -d '{"batch": ["createdb", "pumpdata", "status"]}'
```

### 2. Check Status
```bash
curl https://static.kuhandranchatbot.info/api/admin/operations \
  -X POST -H "Content-Type: application/json" \
  -d '{"operation": "status"}'
```

### 3. Sync Changes
```bash
curl -X POST https://static.kuhandranchatbot.info/api/admin/sync \
  -H "Content-Type: application/json" \
  -d '{"mode": "scan"}'
```

### 4. Pump Data
```bash
curl -X POST https://static.kuhandranchatbot.info/api/admin/data \
  -H "Content-Type: application/json" \
  -d '{"action": "pump"}'
```

### 5. Clear Database
```bash
curl -X POST https://static.kuhandranchatbot.info/api/admin/operations \
  -H "Content-Type: application/json" \
  -d '{"operation": "deletedb"}'
```

### 6. Full Refresh
```bash
curl -X POST https://static.kuhandranchatbot.info/api/admin/operations \
  -H "Content-Type: application/json" \
  -d '{"batch": ["deletedb", "createdb", "pumpdata", "status"]}'
```

### 7. Detect Changes
```bash
curl -X POST https://static.kuhandranchatbot.info/api/admin/sync \
  -H "Content-Type: application/json" \
  -d '{"mode": "scan"}'
```

### 8. Apply Changes to Database
```bash
curl -X POST https://static.kuhandranchatbot.info/api/admin/sync \
  -H "Content-Type: application/json" \
  -d '{"mode": "pull"}'
```

---

## Operations

| Operation | Description | Endpoint |
|-----------|-------------|----------|
| `createdb` | Create all database tables | /api/admin/operations |
| `deletedb` | Clear all data from tables | /api/admin/operations |
| `pumpdata` | Load data from /public | /api/admin/operations |
| `syncopublic` | Detect /public changes | /api/admin/operations |
| `status` | Get system status | /api/admin/operations |

---

## Data Actions

| Action | Description | Endpoint |
|--------|-------------|----------|
| `pump` | Load /public data to database | /api/admin/data |
| `clear` | Delete all database data | /api/admin/data |

---

## Database Actions

| Action | Description | Endpoint |
|--------|-------------|----------|
| `create` | Create tables with schema | /api/admin/db |
| `delete` | Clear all table data | /api/admin/db |
| `drop {table}` | Drop specific table | /api/admin/db |

---

## Sync Modes

| Mode | Description | Endpoint |
|------|-------------|----------|
| `scan` | Detect changes | /api/admin/sync |
| `pull` | Apply /public changes to DB | /api/admin/sync |
| `push` | Apply DB changes to /public | /api/admin/sync |

---

## Response Pattern

All successful responses follow this pattern:
```json
{
  "status": "success",
  "operation": "operation_name",
  "...additional_fields": "...",
  "timestamp": "2026-01-08T10:30:00Z"
}
```

---

## Common Workflows

### First-Time Setup
```
1. createdb      - Initialize schema
2. pumpdata      - Load from /public
3. status        - Verify setup
```

### Regular Sync (After Updates)
```
1. syncopublic   - Check for changes
2. pull          - Apply changes to database
3. status        - Verify completion
```

### Emergency Database Refresh
```
1. deletedb      - Clear all data
2. pumpdata      - Reload from /public
3. status        - Verify reset
```

---

## File Organization

Files are automatically categorized into tables:
- `/public/collections/*` → collections table (78 records)
- `/public/config/*` → config_files table (4 records)
- `/public/data/*` → data_files table (8 records)
- `/public/files/*` → static_files table (12 records)
- `/public/image/*` → images table (45 records)
- `/public/js/*` → javascript_files table (2 records)
- `/public/resume/*` → resumes table (3 records)

**Total: 234 files, 8 tables**

---

## Batch Operations Example

Run multiple operations in sequence:
```json
{
  "batch": [
    "createdb",      // Step 1: Create schema
    "pumpdata",      // Step 2: Load data
    "syncopublic",   // Step 3: Check changes
    "status"         // Step 4: Report status
  ]
}
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (invalid operation) |
| 500 | Server error |
| 501 | Not implemented |

---

## Useful Aliases (Shell)

Add these to your `.bashrc` or `.zshrc`:

```bash
alias content-status='curl https://static.kuhandranchatbot.info/api/admin/operations -X POST -H "Content-Type: application/json" -d "{\"operation\": \"status\"}"'

alias content-sync='curl -X POST https://static.kuhandranchatbot.info/api/admin/sync -H "Content-Type: application/json" -d "{\"mode\": \"scan\"}"'

alias content-pump='curl -X POST https://static.kuhandranchatbot.info/api/admin/data -H "Content-Type: application/json" -d "{\"action\": \"pump\"}"'

alias content-refresh='curl -X POST https://static.kuhandranchatbot.info/api/admin/operations -H "Content-Type: application/json" -d "{\"batch\": [\"deletedb\", \"createdb\", \"pumpdata\", \"status\"]}"'
```

Then use:
```bash
content-status
content-sync
content-pump
content-refresh
```

---

Last Updated: January 8, 2026
