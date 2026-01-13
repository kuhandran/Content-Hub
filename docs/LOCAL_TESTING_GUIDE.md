# Local Testing Guide - Data Manager & APIs

## ✅ Setup Complete for Local Testing

### Current Status
- ✅ Dev server running on `http://localhost:3000`
- ✅ `.env.local` configured with Supabase database credentials
- ✅ Comprehensive request logging enabled on all APIs
- ✅ Request IDs, timing, and error tracking implemented

---

## 🚀 Running Locally

### Start Dev Server
```bash
cd /Users/kuhandransamudrapandiyan/Projects/Content-Hub
npm run dev
```

**Expected Output:**
```
▲ Next.js 16.1.1 (Turbopack)
- Local:         http://localhost:3000
- Network:       http://192.168.100.32:3000
- Environments: .env.local
✓ Ready in 517ms
```

### Access Admin Dashboard
```
http://localhost:3000/admin
```

---

## 📊 API Endpoints with Comprehensive Logging

### 1. Database Stats API
**URL**: `http://localhost:3000/api/admin/database-stats`

**Request Log Output Example:**
```
[db-stats-1705068000000] Starting database-stats request...
[db-stats-1705068000000] Environment: development
[db-stats-1705068000000] Database URL configured: YES
[db-stats-1705068000000] Connected to database successfully
[db-stats-1705068000000] Executing tables query...
[db-stats-1705068000000] Found 9 tables: menu_config, collections, config_files, data_files, static_files, images, javascript_files, resumes, sync_manifest
[db-stats-1705068000000] Success - 9 tables, 1234 records, 2.50 MB (125ms)
```

**Response Includes:**
- `requestId` - Unique identifier for tracking
- `duration` - API response time in milliseconds
- `summary` - Database statistics
- `tables` - Detailed table information

### 2. Pump Monitor API
**URL**: `http://localhost:3000/api/admin/pump-monitor`

**Request Log Output Example:**
```
[pump-monitor-1705068005000] Starting pump-monitor request...
[pump-monitor-1705068005000] Environment: development
[pump-monitor-1705068005000] Connected to database successfully
[pump-monitor-1705068005000] Latest sync: completed (250 files)
[pump-monitor-1705068005000] Success - Status: completed, Progress: 100%, Operations: 5 (85ms)
```

**Response Includes:**
- `requestId` - Unique identifier for tracking
- `duration` - API response time in milliseconds
- `status` - Current pump operation status
- `progress` - Percentage complete (0-100%)
- `statistics` - Aggregated pump operation stats

---

## 🔍 Testing Procedures

### Test 1: Check Database Connection
```bash
# Test if database is connected
curl -v http://localhost:3000/api/admin/database-stats 2>&1 | grep -A 5 "requestId"
```

**Expected:**
- Request ID appears in response
- Duration shows in milliseconds
- No "Database connection failed" errors

### Test 2: Monitor Pump Operation
```bash
# Trigger and monitor pump
curl -v http://localhost:3000/api/admin/pump-monitor 2>&1 | grep -A 10 "status"
```

**Expected:**
- Status: `idle`, `in-progress`, `completed`, or `error`
- Progress percentage (0-100%)
- Files processed count

### Test 3: View Detailed Logs
```bash
# Watch dev server logs in real-time
tail -f /tmp/dev-local.log | grep "\[db-stats"
tail -f /tmp/dev-local.log | grep "\[pump-monitor"
```

---

## 📝 Environment Configuration

### `.env.local` Variables
Your `.env.local` file should contain:

```
DATABASE_URL=your_supabase_connection_string
POSTGRES_PRISMA_URL=your_postgres_url (optional)
NODE_ENV=development
DEBUG=true (optional - for verbose logging)
TRACE=true (optional - for detailed tracing)
```

**Verify Configuration:**
```bash
# Check if .env.local exists
ls -la /Users/kuhandransamudrapandiyan/Projects/Content-Hub/.env.local

# Check current environment
echo "NODE_ENV: $NODE_ENV"
echo "DEBUG: $DEBUG"
```

---

## 🔧 Understanding the Logs

### Log Format
```
[request-id] [timestamp] [service] [level] message
```

### Log Levels
- **ERROR** (🔴) - Critical issues that prevent operation
- **WARN** (🟡) - Warning conditions that should be addressed
- **INFO** (🔵) - Informational messages about operations
- **DEBUG** (🟣) - Detailed debugging information
- **TRACE** (⚪) - Very detailed trace information

### Interpreting Request IDs
```
db-stats-1705068000000     ← Database stats request
pump-monitor-1705068005000 ← Pump monitor request
```

The number after the type is the Unix timestamp when the request started.

---

## 📊 Data Manager Tab Testing

### Step 1: Access Data Manager
1. Go to `http://localhost:3000/admin`
2. Login with your credentials
3. Click **💾 Data Manager** tab

### Step 2: Monitor Pump Operation
1. Go to **📊 Overview** tab
2. Click **"🚀 Load Primary Data"** button
3. Switch back to **💾 Data Manager** tab
4. Watch the progress bar fill up

**What to See in Logs:**
```
[pump-monitor] Starting pump-monitor request...
[pump-monitor] Connected to database successfully
[pump-monitor] Latest sync: in-progress (250 files)
[pump-monitor] Success - Status: in-progress, Progress: 45%, Operations: 1
```

### Step 3: Monitor Table Statistics
1. In **💾 Data Manager** tab
2. Watch the summary cards update:
   - Total Tables: 9
   - Total Records: increases as pump runs
   - Total Size: grows as data is added
   - Last Updated: refreshes every 5 seconds

**What to See in Logs:**
```
[db-stats] Starting database-stats request...
[db-stats] Connected to database successfully
[db-stats] Found 9 tables: menu_config, collections, ...
[db-stats] Success - 9 tables, 1234 records, 2.50 MB (125ms)
```

---

## 🐛 Troubleshooting

### Issue: "Database connection failed"
**Log Message:**
```
[db-stats] Failed to connect to database
```

**Solution:**
1. Check `.env.local` exists
2. Verify DATABASE_URL is set correctly
3. Test Supabase connection:
   ```bash
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM menu_config;"
   ```

### Issue: Empty Records in Tables
**Log Message:**
```
[db-stats] Success - 9 tables, 0 records, 0.00 MB
```

**Solution:**
1. Run pump operation: Click "Load Primary Data"
2. Check if `/public` folder exists and has files
3. Review sync_manifest table for pump errors

### Issue: Request ID Missing in Response
**Problem:** Cannot trace requests

**Solution:**
1. Verify latest code is deployed
2. Check that logging middleware is enabled
3. Look for error messages with `[ERROR]` prefix

### Issue: Slow Response Times
**Log Message:**
```
[db-stats] Success - 9 tables, 5000 records, 10.50 MB (2500ms)
```

**Solution:**
1. Check if database has excessive records
2. Run database optimization:
   ```sql
   VACUUM ANALYZE menu_config;
   VACUUM ANALYZE collections;
   -- etc for all tables
   ```
3. Check database connection quality

---

## 📈 Performance Metrics

### Expected Response Times
| Endpoint | Expected Time | Max Time |
|----------|---------------|----------|
| database-stats | 100-200ms | 500ms |
| pump-monitor | 50-100ms | 300ms |
| Full page load | 500-1000ms | 2000ms |

### Database Query Performance
```
[db-stats] Executing tables query... (50ms)
[db-stats] Getting record counts... (75ms)
[db-stats] Calculating sizes... (30ms)
Total: ~155ms
```

---

## 🔐 Authentication Notes

### Local Development
- Authentication is enabled but can be mocked locally
- APIs return 401 "Unauthorized" without valid session
- Use the admin dashboard (authenticated session) to test

### Testing Authenticated Requests
```bash
# Get auth token from session
# Then use in header
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/admin/database-stats
```

---

## 📝 Logging Configuration

### Enable Debug Mode
```bash
export DEBUG=true
npm run dev
```

**Output includes:**
- Detailed database queries
- Connection pool info
- Request/response timing

### Enable Trace Mode
```bash
export TRACE=true
npm run dev
```

**Output includes:**
- All debug info
- Every database operation
- Full stack traces

---

## ✅ Verification Checklist

Before pushing to Vercel:

- [ ] Dev server starts without errors
- [ ] API endpoints respond with request IDs
- [ ] Database stats show correct table count
- [ ] Pump monitor responds with status
- [ ] Response times are under 500ms
- [ ] No authentication errors in logs
- [ ] `.env.local` has all required variables
- [ ] Data Manager tab loads and displays data
- [ ] All 9 tables exist in database
- [ ] Logs show comprehensive request tracking

---

## 🚀 Next: Deploy to Vercel

Once local testing is complete:

```bash
git add .
git commit -m "Complete local testing with comprehensive logging"
git push origin main
vercel --prod
```

---

## 📞 Log Analysis

### Common Log Patterns

**Success Pattern:**
```
[request-id] Starting ...
[request-id] Connected to database successfully
[request-id] Executing query...
[request-id] Found X records
[request-id] Success - ... (Xms)
```

**Error Pattern:**
```
[request-id] Starting ...
[request-id] Error: [error message]
[request-id] Failed to [operation]
```

### Parsing Logs
```bash
# Filter by request ID
grep "[db-stats" /tmp/dev-local.log

# Show only errors
grep "\[ERROR\]" /tmp/dev-local.log

# Show timing information
grep "Success.*ms)" /tmp/dev-local.log

# Follow logs in real-time
tail -f /tmp/dev-local.log | grep "pump-monitor"
```

---

## 💡 Tips

1. **Keep logs window open** while testing to see real-time activity
2. **Use request IDs** to track requests across logs
3. **Monitor response times** to catch performance issues early
4. **Check for 401/403 errors** if APIs return "Unauthorized"
5. **Verify database connection** before testing features
6. **Run full test cycle** before pushing to production

---

## ✅ Local Testing Ready!

Your Data Manager is now fully configured for local testing with:
- ✅ Comprehensive request logging
- ✅ Request ID tracking
- ✅ Response timing metrics
- ✅ Error reporting with details
- ✅ Database connection verification
- ✅ Development environment (.env.local)

**Start testing now!** 🚀
