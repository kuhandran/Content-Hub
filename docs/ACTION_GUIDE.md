# 🎯 Pumpdata API - Action Guide

## Quick Start Checklist

### ✅ Prerequisites
- [ ] Database configured (DATABASE_URL or SUPABASE_*)
- [ ] /public folder exists with files
- [ ] File structure matches mapping rules
- [ ] JWT_SECRET configured
- [ ] Node.js environment ready

### ✅ First-Time Setup
- [ ] Read: [PUMP_QUICK_REFERENCE.md](./PUMP_QUICK_REFERENCE.md)
- [ ] Understand: File → Table mapping
- [ ] Know: Two entry points (data route vs operations route)
- [ ] Test: Local pump operation

### ✅ Integration
- [ ] Review: [PUMP_IMPLEMENTATION.md](./PUMP_IMPLEMENTATION.md)
- [ ] Understand: API request/response format
- [ ] Implement: Fetch call in your app
- [ ] Test: Pump via dashboard
- [ ] Verify: Data in database

### ✅ Querying Data
- [ ] Review: [DASHBOARD_TABLE_MAPPING.md](./DASHBOARD_TABLE_MAPPING.md)
- [ ] Learn: SQL queries for each table
- [ ] Practice: Query examples
- [ ] Adapt: For your specific needs

### ✅ Production Ready
- [ ] Set environment variables
- [ ] Test all operations
- [ ] Monitor performance
- [ ] Consider automation (cron)
- [ ] Document schema for team

---

## Common Actions

### Action 1: Pump Data Manually
**When**: You updated files in /public
**Steps**:
1. Click "Pump Data" button in dashboard
2. OR: `POST /api/admin/operations { "operation": "pumpdata" }`
3. Check response: `files_scanned` and `tables_loaded`
4. Verify: Query database for records

**Documentation**: [PUMP_QUICK_REFERENCE.md#api-endpoints](./PUMP_QUICK_REFERENCE.md#api-endpoints)

---

### Action 2: Get All Languages
**When**: Building language selector
**Query**:
```sql
SELECT DISTINCT lang FROM collections ORDER BY lang;
```
**Result**: List of all supported languages
**Documentation**: [DASHBOARD_TABLE_MAPPING.md#query-1-get-all-english-configuration](./DASHBOARD_TABLE_MAPPING.md#query-1-get-all-english-configuration)

---

### Action 3: Get Configuration for Language
**When**: Loading app config for specific language
**Query**:
```sql
SELECT file_content FROM collections 
WHERE lang='en' AND type='config' AND filename='apiConfig';
```
**Result**: Parsed JSON config object
**Documentation**: [DASHBOARD_TABLE_MAPPING.md#query-2-get-specific-language-data](./DASHBOARD_TABLE_MAPPING.md#query-2-get-specific-language-data)

---

### Action 4: Get All Portfolio Data
**When**: Loading portfolio/skills page
**Query**:
```sql
SELECT filename, file_content FROM data_files;
```
**Result**: achievements, skills, projects, experience, etc
**Documentation**: [DASHBOARD_TABLE_MAPPING.md#query-4-get-all-skills-data](./DASHBOARD_TABLE_MAPPING.md#query-4-get-all-skills-data)

---

### Action 5: Get Image References
**When**: Rendering images in UI
**Query**:
```sql
SELECT filename, file_path, mime_type FROM images;
```
**Usage**:
```html
<img src="/image/logo.png" alt="Logo" />
```
**Documentation**: [DASHBOARD_TABLE_MAPPING.md#query-5-get-all-images](./DASHBOARD_TABLE_MAPPING.md#query-5-get-all-images)

---

### Action 6: Track Synced Files
**When**: Debugging what was last synced
**Query**:
```sql
SELECT file_path, table_name, last_synced FROM sync_manifest 
ORDER BY last_synced DESC LIMIT 10;
```
**Result**: Last 10 files synced with timestamps
**Documentation**: [PUMP_QUICK_REFERENCE.md#debugging](./PUMP_QUICK_REFERENCE.md#debugging)

---

### Action 7: Find Outdated Files
**When**: Checking for stale data
**Query**:
```sql
SELECT file_path FROM sync_manifest 
WHERE last_synced < now() - interval '7 days';
```
**Result**: Files not updated in 7 days
**Documentation**: [PUMP_VISUAL_GUIDE.md#10-common-query-patterns](./PUMP_VISUAL_GUIDE.md#10-common-query-patterns)

---

### Action 8: Debug Pump Failure
**When**: Pump operation failed
**Steps**:
1. Check error message in response
2. Review: [PUMP_QUICK_REFERENCE.md#debugging](./PUMP_QUICK_REFERENCE.md#debugging)
3. Run status: `POST /api/admin/operations { "operation": "status" }`
4. Check: Database table counts
5. Inspect: sync_manifest for last entries
6. Reference: [PUMP_IMPLEMENTATION.md#error-scenarios](./PUMP_IMPLEMENTATION.md#error-scenarios)

**Common issues**:
- No database configured → Set DATABASE_URL
- File system error → Check /public folder
- JSON parse error → Fix JSON files
- Permission denied → Check file permissions

---

### Action 9: Batch Operations
**When**: Need multiple operations together
**API**:
```bash
POST /api/admin/operations
{ "batch": ["createdb", "pumpdata", "status"] }
```
**Response**: Array of results for each operation
**Documentation**: [PUMP_QUICK_REFERENCE.md#3-batch-operations](./PUMP_QUICK_REFERENCE.md#3-batch-operations)

---

### Action 10: Export Data
**When**: Need backup or migration
**Steps**:
1. Query: `SELECT * FROM <table_name>;`
2. Export: To JSON/CSV
3. Backup: Store safely
4. Reference: [PUMPDATA_DOCUMENTATION.md#-configuration](./PUMPDATA_DOCUMENTATION.md#-configuration)

---

## Decision Matrix: Which Endpoint?

```
Need to pump data?
├─ On production/Vercel?
│  └─ Use: /api/admin/operations { "operation": "pumpdata" }
│
├─ On local development?
│  ├─ Use: /api/admin/data { "action": "pump" } (simpler)
│  └─ Or: /api/admin/operations { "operation": "pumpdata" } (portable)
│
└─ As part of batch?
   └─ Use: /api/admin/operations { "batch": [...] }
```

**Reference**: [PUMP_QUICK_REFERENCE.md#tl-dr---what-gets-pumped](./PUMP_QUICK_REFERENCE.md#tl-dr---what-gets-pumped)

---

## Decision Matrix: Which Document?

```
Need to...
├─ Get quick answer?
│  └─ Read: PUMP_QUICK_REFERENCE.md (5 min)
│
├─ Understand flow?
│  └─ Read: PUMP_VISUAL_GUIDE.md (15 min)
│
├─ Learn API details?
│  └─ Read: PUMPDATA_API_GUIDE.md (20 min)
│
├─ See code?
│  └─ Read: PUMP_IMPLEMENTATION.md (30 min)
│
├─ Query data?
│  └─ Read: DASHBOARD_TABLE_MAPPING.md (20 min)
│
└─ Find something?
   └─ Read: PUMPDATA_DOCUMENTATION.md (index)
```

---

## Performance Monitoring

### Monitor: Pump Speed
```javascript
const start = Date.now();
const response = await fetch('/api/admin/operations', {
  method: 'POST',
  body: JSON.stringify({ operation: 'pumpdata' })
});
const time = Date.now() - start;
console.log(`Pump took: ${time}ms for ${response.files_scanned} files`);
```

### Monitor: Database Size
```sql
-- Check all table sizes
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables 
WHERE schemaname = 'public';
```

### Monitor: Recent Changes
```sql
-- Check what changed in last hour
SELECT file_path, table_name, last_synced FROM sync_manifest 
WHERE last_synced > now() - interval '1 hour';
```

**Reference**: [PUMPDATA_DOCUMENTATION.md#-performance](./PUMPDATA_DOCUMENTATION.md#-performance)

---

## Troubleshooting Flowchart

```
Pump Failed?
│
├─ Check error message
│  ├─ "No database configured"
│  │  └─ Fix: Set DATABASE_URL or SUPABASE_*
│  │
│  ├─ "Not available in Vercel"
│  │  └─ Fix: Use /api/admin/operations instead
│  │
│  ├─ "Invalid JSON"
│  │  └─ Fix: Validate JSON in files
│  │
│  └─ Other error
│     └─ See: PUMPDATA_DOCUMENTATION.md#troubleshooting
│
├─ Check files
│  ├─ /public folder exists?
│  ├─ Files in correct structure?
│  ├─ JSON files valid?
│  └─ File permissions OK?
│
├─ Check database
│  ├─ Connection working?
│  ├─ Tables created?
│  ├─ Unique constraints OK?
│  └─ Storage space available?
│
└─ Still stuck?
   └─ Reference: PUMP_QUICK_REFERENCE.md#debugging
```

---

## Environment Checklist

### Required
- [ ] `DATABASE_URL` set and working
  ```bash
  psql $DATABASE_URL -c "SELECT 1"
  ```
  
- OR: `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
  ```bash
  curl $SUPABASE_URL/health
  ```

### Recommended
- [ ] `JWT_SECRET` configured for auth
- [ ] `PUBLIC_DIR` set (if non-standard)
- [ ] Node.js 16+ installed
- [ ] npm/yarn installed

### Optional
- [ ] `NODE_ENV=production` for prod
- [ ] Monitoring/logging configured
- [ ] Cron job for automated pumps

**Reference**: [PUMPDATA_DOCUMENTATION.md#-configuration](./PUMPDATA_DOCUMENTATION.md#-configuration)

---

## Testing Checklist

### Test 1: Connectivity
```bash
curl -X GET http://localhost:3000/api/admin/operations \
  -H "Authorization: Bearer $JWT_TOKEN"
# Should return: Available operations list
```

### Test 2: Basic Pump
```bash
curl -X POST http://localhost:3000/api/admin/operations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"operation":"pumpdata"}'
# Should return: {status: "success", files_scanned: X, tables_loaded: Y}
```

### Test 3: Verify Data
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM collections;"
# Should return: 120 (or your file count)
```

### Test 4: Query Example
```bash
psql $DATABASE_URL -c "
  SELECT lang, COUNT(*) FROM collections GROUP BY lang;
"
# Should return: All languages with counts
```

### Test 5: Batch Operation
```bash
curl -X POST http://localhost:3000/api/admin/operations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"batch":["createdb","pumpdata","status"]}'
# Should return: Array of 3 results
```

**Reference**: [PUMP_QUICK_REFERENCE.md#testing-locally](./PUMP_QUICK_REFERENCE.md#testing-locally)

---

## Files Created/Modified

### Documentation (New)
- ✅ `docs/PUMP_QUICK_REFERENCE.md`
- ✅ `docs/PUMPDATA_API_GUIDE.md`
- ✅ `docs/PUMP_IMPLEMENTATION.md`
- ✅ `docs/DASHBOARD_TABLE_MAPPING.md`
- ✅ `docs/PUMP_VISUAL_GUIDE.md`
- ✅ `docs/PUMPDATA_DOCUMENTATION.md`
- ✅ `docs/README_PUMPDATA.md` (this file)

### Code (Existing - Not Modified)
- `/app/api/admin/data/route.js` - pump action
- `/app/api/admin/operations/route.js` - pumpdata operation
- `/lib/sync-config.js` - file mapping
- `/lib/dbop.js` - DB operations

---

## Summary

You now have **complete documentation** covering:
1. ✅ Quick reference (5 min)
2. ✅ Complete API guide (20 min)
3. ✅ Code implementation (30 min)
4. ✅ Database schema & queries (20 min)
5. ✅ Visual diagrams (15 min)
6. ✅ Master index & navigation (index)
7. ✅ Action guide (this file)

**Total**: ~2 hours to become expert, or 15 minutes for basics.

---

## Next Actions

### Immediate (Next 5 minutes)
1. Read: [PUMP_QUICK_REFERENCE.md](./PUMP_QUICK_REFERENCE.md)
2. Understand: File → Table mapping

### Short Term (Next hour)
1. Trigger: First pump operation
2. Verify: Data in database
3. Query: Get some data

### Medium Term (Next day)
1. Integrate: Pump into your app
2. Test: Full workflow
3. Monitor: Performance

### Long Term (Ongoing)
1. Automate: Scheduled pumps
2. Monitor: Changes tracking
3. Scale: Handle more files
4. Extend: Custom queries

---

## Support Resources

### Documentation
- Quick answers: [PUMP_QUICK_REFERENCE.md](./PUMP_QUICK_REFERENCE.md)
- Deep dive: [PUMPDATA_API_GUIDE.md](./PUMPDATA_API_GUIDE.md)
- Code: [PUMP_IMPLEMENTATION.md](./PUMP_IMPLEMENTATION.md)
- Schema: [DASHBOARD_TABLE_MAPPING.md](./DASHBOARD_TABLE_MAPPING.md)
- Visuals: [PUMP_VISUAL_GUIDE.md](./PUMP_VISUAL_GUIDE.md)

### Code Files
- [app/api/admin/data/route.js](../app/api/admin/data/route.js)
- [app/api/admin/operations/route.js](../app/api/admin/operations/route.js)
- [lib/sync-config.js](../lib/sync-config.js)

### Dashboard
- [app/dashboard/page.jsx](../app/dashboard/page.jsx)
- [app/dashboard/layout.jsx](../app/dashboard/layout.jsx)

---

**Status**: ✅ Complete Package Ready
**Version**: 1.0
**Date**: January 12, 2026

