# API Architecture Refactoring Guide

## Directory Structure

```
app/api/
├── controllers/          # Request handlers - coordinate between routes and services
├── helpers/             # Utility functions - auth, response formatting
├── services/            # Business logic - database operations, file processing
├── utils/               # Low-level utilities - database connections, cache management
├── admin/               # API routes - clean entry points using controllers
│   ├── sync/           # Original route
│   ├── sync-refactored/# New refactored route using controller pattern
│   └── ...
└── ...
```

## Architecture Layers

### 1. **Route Layer** (`app/api/admin/[resource]/route.js`)
- **Purpose**: Clean entry point for HTTP requests
- **Responsibility**: Parse request, delegate to controller
- **Keep it simple**: Just call controller functions

```javascript
// route.js - CLEAN AND SIMPLE
export async function GET(request) {
  const { status, body } = await handleGet(request);
  return NextResponse.json(body, { status });
}

export async function POST(request) {
  const { status, body } = await handlePost(request);
  return NextResponse.json(body, { status });
}
```

### 2. **Controller Layer** (`app/api/controllers/[resource]Controller.js`)
- **Purpose**: Orchestrate business logic
- **Responsibility**: 
  - Verify authentication
  - Validate input
  - Call services
  - Format responses
  - Handle errors

```javascript
// syncController.js - ORCHESTRATION
async function handlePostSync(request) {
  // 1. Authenticate
  const jwtAuth = verifyJWTToken(request);
  if (!jwtAuth.ok) return { status: 401, body: unauthorizedError() };

  // 2. Validate
  const body = await request.json();
  const mode = body.mode || 'scan';

  // 3. Call service
  const { changes, stats } = await scanForChanges(db);

  // 4. Format response
  return { status: 200, body: successResponse(data) };
}
```

### 3. **Helper Layer** (`app/api/helpers/[function].js`)
- **Purpose**: Reusable utility functions
- **Modules**:
  - `auth.js` - JWT verification, auth responses
  - `response.js` - Response formatting
  - `validation.js` - Input validation (create as needed)

```javascript
// helpers/auth.js - REUSABLE AUTH LOGIC
function verifyJWTToken(request) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader.split(' ')[1];
  const decoded = jwtManager.verifyToken(token);
  return { ok: true, user: decoded };
}

// helpers/response.js - REUSABLE RESPONSE LOGIC
function successResponse(data, message) {
  return { status: 'success', data, message, timestamp: now() };
}
```

### 4. **Service Layer** (`app/api/services/[resource]Service.js`)
- **Purpose**: Pure business logic
- **Responsibility**: 
  - File operations
  - Database queries
  - Data transformations
  - No HTTP concerns

```javascript
// services/syncService.js - PURE BUSINESS LOGIC
async function scanForChanges(db) {
  const currentFiles = scanPublicFolder();
  const manifestRows = await db`SELECT * FROM sync_manifest`;
  
  const changes = compareFiles(currentFiles, manifestRows);
  
  return { changes, stats };
}
```

### 5. **Utils Layer** (`app/api/utils/[utility].js`)
- **Purpose**: Low-level infrastructure
- **Modules**:
  - `db.js` - Database connections
  - `cache.js` - Redis operations
  - `logger.js` - Logging utilities (optional)

```javascript
// utils/db.js - DATABASE CONNECTIONS
async function connectPostgres() {
  if (pgConnection && isConnected) return pgConnection;
  const client = new PostgresClient(process.env.DATABASE_URL);
  return client;
}

async function getActiveDB() {
  try { return await connectPostgres(); }
  catch { return await connectSupabase(); }
}

// utils/cache.js - CACHE OPERATIONS
async function getCached(key) {
  if (!redisClient) await connectRedis();
  const value = await redisClient.get(key);
  return value ? JSON.parse(value) : null;
}
```

## Example: Refactoring an API

### Before (All in route.js)
```javascript
// app/api/admin/sync/route.js - 584 lines of mixed concerns
export async function POST(request) {
  const auth = isAuthorized(request);
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const body = await request.json();
    const mode = body.mode || 'scan';
    
    // Database setup
    const sql = postgres;
    await sql`CREATE TABLE IF NOT EXISTS...`;
    
    // Scan logic
    const currentFiles = scanPublicFolder();
    const manifestRows = await sql`SELECT...`;
    const changes = [];
    
    for (const [path, file] of currentFiles) {
      // Compare logic
      changes.push(...);
    }
    
    // Pull logic
    for (const change of changes) {
      await sql`INSERT...`;
    }
    
    return NextResponse.json({ status: 'success', data: changes });
  } catch (error) {
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
  }
}
```

### After (Using MVC Pattern)
```javascript
// Route - Clean entry point
// app/api/admin/sync-refactored/route.js
export async function POST(request) {
  const { status, body } = await handlePostSync(request);
  return NextResponse.json(body, { status });
}

// Controller - Orchestration
// app/api/controllers/syncController.js
async function handlePostSync(request) {
  const jwtAuth = verifyJWTToken(request);      // Helper
  if (!jwtAuth.ok) return { status: 401, body: unauthorizedError() };
  
  const body = await request.json();
  const mode = body.mode || 'scan';
  
  const db = await getActiveDB();                // Util
  const { changes, stats } = await scanForChanges(db, mode); // Service
  
  return { status: 200, body: successResponse(data) };  // Helper
}

// Service - Business logic
// app/api/services/syncService.js
async function scanForChanges(db, mode) {
  const currentFiles = scanPublicFolder();
  const manifestRows = await db`SELECT...`;
  const changes = [];
  
  for (const [path, file] of currentFiles) {
    changes.push(file);
  }
  
  return { changes, stats: { count: changes.length } };
}
```

## Benefits

✅ **Separation of Concerns** - Each layer has one responsibility  
✅ **Reusability** - Services and helpers used by multiple routes  
✅ **Testability** - Easy to unit test services in isolation  
✅ **Maintainability** - Bug fixes in one place  
✅ **Scalability** - Easy to add new endpoints  
✅ **Consistency** - Same patterns across all APIs  

## Step-by-Step Refactoring Plan

### Phase 1: Foundation (DONE)
- ✅ Create folder structure (controllers, helpers, services, utils)
- ✅ Create utils (db.js, cache.js)
- ✅ Create helpers (auth.js, response.js)
- ✅ Create service example (syncService.js)
- ✅ Create controller example (syncController.js)

### Phase 2: Refactor Admin APIs
- [ ] admin/data → dataController + dataService
- [ ] admin/config → configController + configService
- [ ] admin/database-stats → statsController + statsService
- [ ] admin/pump-monitor → pumpController + pumpService
- [ ] ... (other admin endpoints)

### Phase 3: Refactor Auth APIs
- [ ] auth/login → authController + authService
- [ ] auth/logout → authController
- [ ] auth/mfa → mfaController + mfaService
- [ ] auth/register → registerController + registerService

### Phase 4: Refactor Dashboard APIs
- [ ] dashboard/files → filesController + filesService
- [ ] dashboard/menus → menusController + menusService
- [ ] ... (other dashboard endpoints)

## Migration Checklist for Each API

1. **Create Controller** (`app/api/controllers/[resource]Controller.js`)
   - [ ] Extract handler logic from route
   - [ ] Add authentication with `verifyJWTToken()`
   - [ ] Use helpers for responses

2. **Create Service** (`app/api/services/[resource]Service.js`)
   - [ ] Extract business logic from route
   - [ ] Use database utilities
   - [ ] No HTTP/request concerns

3. **Create Helpers** (if needed)
   - [ ] Extract validation logic
   - [ ] Extract data transformation
   - [ ] Create reusable utilities

4. **Update Route** (`app/api/[resource]/route.js`)
   - [ ] Import controller
   - [ ] Call controller functions
   - [ ] Remove all business logic
   - [ ] Keep it <10 lines

5. **Test**
   - [ ] Verify API still works
   - [ ] Check error messages
   - [ ] Test authentication
   - [ ] Compare with old response format

## Code Quality Standards

### Controllers
- Authentication check at top
- Clear method names: handleGet, handlePost, handlePut, handleDelete
- Always return { status, body }
- Coordinate but don't implement business logic

### Services
- Pure functions, no side effects where possible
- Clear naming: scanForChanges, pullChanges, compareFiles
- Throw errors, don't return error objects
- Detailed console logging

### Helpers
- Reusable across all APIs
- Single responsibility
- Consistent return format
- Export as default or named functions

### Utils
- Infrastructure code only
- Connection management
- Error handling
- State tracking

## Testing Strategy

```javascript
// Test service in isolation
const { scanForChanges } = require('../services/syncService');

test('scanForChanges returns array of changes', async () => {
  const db = mockDatabase();
  const { changes, stats } = await scanForChanges(db);
  expect(changes).toBeArray();
});

// Test controller with mocked services
jest.mock('../services/syncService');
const { handlePostSync } = require('../controllers/syncController');

test('handlePostSync returns 401 for invalid token', async () => {
  const request = mockRequest({ auth: 'invalid' });
  const { status } = await handlePostSync(request);
  expect(status).toBe(401);
});
```

## Performance Considerations

1. **Database Connections**: Reuse connections via `getActiveDB()`
2. **Caching**: Use Redis for frequently accessed data
3. **Async Operations**: Parallel requests where possible
4. **Error Handling**: Fail fast, detailed error messages

## Common Patterns

### Pattern 1: Service with Database
```javascript
// services/userService.js
async function getUser(db, userId) {
  const user = await db`SELECT * FROM users WHERE id = ${userId}`;
  return user;
}
```

### Pattern 2: Service with Caching
```javascript
// services/settingsService.js
async function getSettings(db) {
  const cached = await getCached('settings');
  if (cached) return cached;
  
  const settings = await db`SELECT * FROM settings`;
  await setCached('settings', settings, 3600);
  return settings;
}
```

### Pattern 3: Service with Multiple Operations
```javascript
// services/syncService.js
async function fullSync(db) {
  const changes = await scanForChanges(db);
  const result = await pullChanges(db, changes);
  await updateManifest(db, result);
  return result;
}
```

---

**Created**: January 15, 2026  
**Version**: 1.0  
**Status**: Foundation Complete, Ready for Phase 2 Refactoring
