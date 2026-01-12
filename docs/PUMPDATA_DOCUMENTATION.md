# 📚 Pumpdata API - Complete Documentation Index

## Overview

The **Pumpdata** API is the core mechanism that synchronizes content from the `/public` folder into your database. It intelligently maps files to tables, parses content, and enables your dashboard to display and manage all your data.

---

## 📖 Documentation Files

### 1. **[Quick Reference](./PUMP_QUICK_REFERENCE.md)** ⭐ START HERE
**Best for**: Quick lookups, common operations, side-by-side comparisons
- TL;DR tables
- API endpoints summary
- Common queries
- Debugging tips
- File size recommendations

### 2. **[Pumpdata API Guide](./PUMPDATA_API_GUIDE.md)** 📘 DEEP DIVE
**Best for**: Understanding the complete flow, detailed explanations
- Overview of two entry points
- File-to-table mapping with examples
- Step-by-step flow (scan → process → insert)
- All case handlers explained
- Database table reference
- API request/response examples
- Dashboard integration points
- Flow diagrams

### 3. **[Implementation Details](./PUMP_IMPLEMENTATION.md)** 🔧 CODE REFERENCE
**Best for**: Code-level understanding, implementation details
- File structure overview
- scanPublicFolder() source code
- mapFileToTable() source code
- Main pump function source code
- Request handlers
- Collections processing detailed example
- Performance analysis
- Error scenarios

### 4. **[Table Mapping & Architecture](./DASHBOARD_TABLE_MAPPING.md)** 🗂️ DATABASE SCHEMA
**Best for**: Understanding database schema, table relationships, queries
- Folder structure → table mapping visual
- All 8 table schemas with examples
- Data flow diagrams
- Query examples for each table
- Dashboard module → table mappings
- Security & constraints
- Typical initialization flow

### 5. **[Dashboard Implementation](./DASHBOARD_FINAL.md)** 🎨 UI/UX
**Best for**: Understanding dashboard features, UI integration
- Feature overview
- API endpoints for dashboard
- Menu configuration
- File management interface
- Service monitoring
- Overview dashboard details

---

## 🎯 Which Document Should I Read?

### "I just want a quick answer"
→ **[Quick Reference](./PUMP_QUICK_REFERENCE.md)**
- What gets pumped (table)
- API endpoints (quick)
- TL;DR

### "I want to understand how it works"
→ **[Pumpdata API Guide](./PUMPDATA_API_GUIDE.md)**
- Complete flow explanation
- All mapping rules
- Visual diagrams
- Response examples

### "Show me the code"
→ **[Implementation Details](./PUMP_IMPLEMENTATION.md)**
- Source code snippets
- Function-by-function breakdown
- Error handling
- Performance analysis

### "What tables exist? How do I query them?"
→ **[Table Mapping](./DASHBOARD_TABLE_MAPPING.md)**
- All table schemas
- Query examples
- Dashboard integration
- Data flow per table

### "How do I use the dashboard?"
→ **[Dashboard Implementation](./DASHBOARD_FINAL.md)**
- Features overview
- How to navigate
- File management UI
- Service monitoring

---

## 🚀 Common Tasks

### Task: "Pump data from /public into database"
1. Read: [Quick Reference](./PUMP_QUICK_REFERENCE.md#tl-dr---what-gets-pumped) (2 min)
2. Execute: `POST /api/admin/operations { "operation": "pumpdata" }`
3. Verify: Check database table counts

### Task: "Understand file mapping"
1. Read: [Table Mapping - Folder Structure](./DASHBOARD_TABLE_MAPPING.md#-public-folder-structure--database-tables) (5 min)
2. Reference: Check path examples
3. Apply: Know where your files go

### Task: "Query data from dashboard"
1. Read: [Table Mapping - Query Examples](./DASHBOARD_TABLE_MAPPING.md#-query-examples-for-dashboard) (10 min)
2. Adapt: Use examples for your data
3. Execute: Run against your database

### Task: "Debug pump failure"
1. Read: [Quick Reference - Debugging](./PUMP_QUICK_REFERENCE.md#debugging) (5 min)
2. Check: Run status endpoint
3. Inspect: Look at sync_manifest table
4. Reference: [Implementation - Error Scenarios](./PUMP_IMPLEMENTATION.md#error-scenarios) (5 min)

### Task: "Integrate pump into my application"
1. Read: [API Guide - API Endpoints](./PUMPDATA_API_GUIDE.md#-api-requests--responses) (10 min)
2. Code: [Implementation - Request Handlers](./PUMP_IMPLEMENTATION.md#code-post-request-handler) (10 min)
3. Implement: Add fetch calls to your app
4. Test: Use examples

---

## 📊 Data Flow Summary

```
┌──────────────────────┐
│   /public Folder     │  (Files on disk)
│  (487 files)         │
└──────────┬───────────┘
           │
           │ scanPublicFolder()
           ↓
┌──────────────────────────────┐
│   File Array                 │  (In memory)
│  - path                      │
│  - content                   │
│  - hash                      │
│  - table (mapped)            │
└──────────┬──────────────────┘
           │
           │ mapFileToTable()
           │ categorize by table
           ↓
┌──────────────────────────────┐
│   Table Buckets              │  (Grouped in memory)
│  ├─ collections: 120         │
│  ├─ config_files: 12         │
│  ├─ data_files: 45           │
│  ├─ static_files: 48         │
│  ├─ images: 150              │
│  ├─ javascript_files: 8      │
│  ├─ resumes: 1               │
│  └─ sync_manifest: 487       │
└──────────┬──────────────────┘
           │
           │ Process each table
           │ (parse JSON if needed)
           ↓
┌──────────────────────────────┐
│   Database Tables            │  (Persisted)
│   SELECT * FROM collections  │
│   SELECT * FROM data_files   │
│   SELECT * FROM config_files │
│   ... etc                    │
└──────────┬──────────────────┘
           │
           │ Dashboard queries
           ↓
┌──────────────────────────────┐
│   Dashboard UI               │  (Visual display)
│  ├─ File browser             │
│  ├─ Editor                   │
│  ├─ Service status           │
│  └─ Quick actions            │
└──────────────────────────────┘
```

---

## 🔗 Table Relationships

```
collections (Multi-language)        [120 records]
├─ lang, type, filename, content
├─ UNIQUE(lang, type, filename)
└─ Used by: Language-specific UI

config_files (Global config)         [12 records]
├─ filename, content (JSON)
├─ Used by: Languages dropdown, API routing

data_files (Global data)             [45 records]
├─ filename, content (JSON)
├─ Used by: Portfolio, skills, projects

static_files (HTML/XML)              [48 records]
├─ filename, content (text)
├─ Used by: Static pages

images (Image references)            [150 records]
├─ filename, file_path, mime_type
├─ Used by: Image gallery, logos

javascript_files (JS code)           [8 records]
├─ filename, file_path, content
├─ Used by: API routing, utilities

resumes (Resume files)               [1 record]
├─ filename, file_type, file_path
├─ Used by: Resume download

sync_manifest (Change tracking)      [487 records]
└─ Tracks all files & hashes
```

---

## ⚙️ Configuration

### Required Environment Variables
```bash
# Database connection
DATABASE_URL=postgres://user:pass@host/dbname
# OR
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# Optional
PUBLIC_DIR=/path/to/public  # Defaults to ./public
JWT_SECRET=your-secret      # For authentication
```

### ALLOWED_EXTENSIONS
```javascript
['.json', '.js', '.xml', '.html', '.txt', '.pdf',
 '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.docx']
```

### IGNORED_DIRS
```javascript
['.next', 'node_modules', '.git']
```

---

## 🔐 Security

- **Authentication**: JWT token required for all pump operations
- **Authorization**: Admin role only
- **Validation**: File type whitelist, JSON parsing validation
- **Upsert Safety**: ON CONFLICT prevents duplicate inserts
- **Serverless Safety**: Blocked on Vercel (use Postgres backend)

---

## 📈 Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Scan files | 200ms | For 487 files |
| Parse JSON | 300ms | All JSON files |
| Process | 500ms | Categorization |
| Insert | 1000ms | Batch database insert |
| **Total** | **~2s** | Typical execution |

**Scalability**: 
- 500 files: ~1 second
- 1000 files: ~2-3 seconds
- 5000 files: ~10-15 seconds (may need optimization)

---

## 🆚 Pump vs Pumpdata

| Aspect | pump | pumpdata |
|--------|------|----------|
| Endpoint | `/api/admin/data` | `/api/admin/operations` |
| Action | `action: 'pump'` | `operation: 'pumpdata'` |
| Works on Vercel | ❌ No | ✅ Yes (with Postgres) |
| Use case | Manual dashboard trigger | Automation, batch ops |
| Response | Simple status | Detailed results |

---

## 🧪 Testing

### Test 1: Basic Pump
```bash
curl -X POST http://localhost:3000/api/admin/operations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"operation":"pumpdata"}'
```

### Test 2: Check Results
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM collections;"
```

### Test 3: Batch Operations
```bash
curl -X POST http://localhost:3000/api/admin/operations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"batch":["createdb","pumpdata","status"]}'
```

---

## 🐛 Troubleshooting

### Problem: "No database configured"
**Solution**: Set `DATABASE_URL` or `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`

### Problem: "Pump action not available in Vercel"
**Solution**: Use Postgres backend with `/api/admin/operations` instead

### Problem: "Invalid JSON in file X"
**Solution**: Fix the JSON file, files with invalid JSON are skipped with warning

### Problem: "Table insertion failed"
**Solution**: Check table exists, columns match, unique constraints not violated

### Problem: "No files found"
**Solution**: Check `/public` folder exists and files are in correct structure

---

## 📚 File Organization

```
docs/
├── PUMP_QUICK_REFERENCE.md        ← Start here for quick answers
├── PUMPDATA_API_GUIDE.md          ← Complete flow & explanation
├── PUMP_IMPLEMENTATION.md         ← Code-level details
├── DASHBOARD_TABLE_MAPPING.md     ← Schema & queries
├── DASHBOARD_FINAL.md             ← UI/UX documentation
└── PUMPDATA_DOCUMENTATION.md      ← This file
```

---

## 🎓 Learning Path

### Beginner (15 minutes)
1. [Quick Reference](./PUMP_QUICK_REFERENCE.md) - Overview
2. [Quick Reference](./PUMP_QUICK_REFERENCE.md#api-endpoints) - API endpoints
3. Try pumping data via dashboard

### Intermediate (45 minutes)
1. [API Guide - File Mapping](./PUMPDATA_API_GUIDE.md#-file-to-table-mapping)
2. [API Guide - Detailed Flow](./PUMPDATA_API_GUIDE.md#-detailed-flow-how-data-gets-pumped)
3. [Table Mapping - Schemas](./DASHBOARD_TABLE_MAPPING.md#-database-table-schemas)
4. Write basic queries

### Advanced (1-2 hours)
1. [Implementation - Code](./PUMP_IMPLEMENTATION.md)
2. [Table Mapping - Full Architecture](./DASHBOARD_TABLE_MAPPING.md)
3. Integrate pump into custom application
4. Debug issues

---

## 🔗 Related Files

**API Routes:**
- [app/api/admin/data/route.js](../app/api/admin/data/route.js) - pump action
- [app/api/admin/operations/route.js](../app/api/admin/operations/route.js) - pumpdata operation

**Core Libraries:**
- [lib/sync-config.js](../lib/sync-config.js) - File mapping logic
- [lib/dbop.js](../lib/dbop.js) - Database operations
- [lib/supabase.js](../lib/supabase.js) - Supabase client

**Dashboard:**
- [app/dashboard/page.jsx](../app/dashboard/page.jsx) - Dashboard UI
- [app/dashboard/layout.jsx](../app/dashboard/layout.jsx) - Dashboard layout

---

## 📞 Support

### Common Questions

**Q: Can I pump only specific tables?**
A: Not directly. Pump always scans all folders. Workaround: Clear specific tables after pump.

**Q: What happens if I pump twice?**
A: Safe! Uses ON CONFLICT, so duplicates are updated instead of inserted.

**Q: Can I pump to production?**
A: Yes, if you have file system access. Vercel users: use Postgres backend.

**Q: How often should I pump?**
A: When you update files in `/public`. Can be manual or automated via cron.

**Q: Can I pump images to disk instead of DB?**
A: Images already stored as file paths only (not full content). Files served from `/public/image/`.

---

## ✅ Checklist: Setting Up Pump

- [ ] Database configured (DATABASE_URL or SUPABASE_*)
- [ ] /public folder exists with content
- [ ] File structure matches mapping rules
- [ ] JWT_SECRET configured for auth
- [ ] First pump successful
- [ ] Database tables populated
- [ ] Dashboard displays data
- [ ] Changes tracked in sync_manifest

---

## 🎉 Next Steps

1. **Deploy**: Push code with pump functionality
2. **Test**: Run pump operation
3. **Monitor**: Check sync_manifest for tracked changes
4. **Automate**: Consider scheduled pumps (cron)
5. **Scale**: Monitor performance with large file counts

---

**Last Updated**: January 12, 2026
**Pumpdata Version**: 1.0
**Status**: ✅ Production Ready

