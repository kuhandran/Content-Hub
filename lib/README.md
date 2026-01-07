# Lib Directory - Utility Libraries

## Overview
Core utility libraries and services used throughout the application.

## Files

### prisma.ts
**Purpose:** Prisma ORM client singleton

```typescript
export const prisma = PrismaClient instance
```

- Initializes Prisma with logging
- Reuses connection in development
- Used by all database operations

---

### redis-client.ts
**Purpose:** Redis cache client and operations

**Key Methods:**
- `get(key)` - Get value from cache
- `set(key, value, ttl)` - Store value with TTL
- `del(key)` - Delete key
- `exists(key)` - Check key existence
- `keys(pattern)` - Find keys by pattern
- `getInfo()` - Get Redis stats
- `uploadFile()` - Upload collection file
- `getFile()` - Retrieve file
- `deleteFile()` - Remove file
- `flushAll()` - Clear all cache

---

### sync-service.ts
**Purpose:** Content synchronization between sources

**Functions:**
- `syncCollections()` - Sync all collection content
- `watchAndSync()` - Watch for file changes
- `syncSingleFile()` - Sync individual file
- `getSyncStatus()` - Get last sync timestamp

**Status:**
Currently disabled in `instrumentation.ts` to prevent infinite loops.

---

### external-content-loader.ts
**Purpose:** Load and parse external content

**Functions:**
- `loadExternalContent()` - Fetch external data
- `parseContent()` - Parse various formats
- `transformContent()` - Transform to internal format

---

## Usage Examples

### Database Access
```typescript
import { prisma } from '@/lib/prisma'

const messages = await prisma.chatMessage.findMany()
```

### Cache Operations
```typescript
import { redis } from '@/lib/redis-client'

const data = await redis.get('key')
await redis.set('key', value)
```

---

Last Updated: January 7, 2026
