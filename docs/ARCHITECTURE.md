# Content Hub - System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Content Hub System                          │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
    ┌─────────┐            ┌──────────┐           ┌──────────┐
    │ Frontend│            │   API    │           │  Redis   │
    │ (React) │            │ (Next.js)│           │  Cache   │
    └─────────┘            └──────────┘           └──────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
            ┌──────────────┐        ┌──────────────┐
            │  Local Files │        │ External API │
            │  (/public)   │        │  (Vercel)    │
            └──────────────┘        └──────────────┘
```

## Architecture Components

### 1. Frontend Layer
**Framework**: Next.js 15.5.9 with React 19
**Location**: `/app`

#### Pages
- **Collections Hub** (`/admin/collections`) - Browse and manage language collections
- **Dashboard** (`/admin/dashboard`) - System overview and sync controls
- **Sync Manager** (`/admin/sync`) - Advanced sync controls with real-time monitoring
- **Collections Detail** (`/admin/collections/[lang]`) - Manage individual language content
- **Other Admin Pages** - Configuration, files, images, pages management

#### Client Components
- Modern dark-themed UI with gradient backgrounds
- Responsive design (mobile, tablet, desktop)
- Real-time statistics and monitoring
- Interactive forms and editors

### 2. API Layer
**Framework**: Next.js App Router API Routes
**Location**: `/app/api/v1`

#### Endpoints

##### Configuration Endpoints
- **GET `/api/v1/config`**
  - Returns all available languages and their metadata
  - Source: `/public/config/languages.json`
  - Response: Array of language objects

##### Content Endpoints
- **GET `/api/v1/pages/[lang]`**
  - Returns all collections for a specific language
  - Query: Config count, data count, full items list
  - Response: Language data with structure

- **GET `/api/v1/pages/[lang]/[slug]`**
  - Returns specific page/content by slug
  - Supports markdown and JSON parsing

##### Asset Endpoints
- **GET `/api/v1/assets/files/[file]`**
  - Returns file content
  - Supports caching

- **GET `/api/v1/assets/images/[file]`**
  - Returns image from public folder
  - Supports optimization

##### Admin Endpoints
- **POST `/api/v1/sync`**
  - Triggers manual content sync
  - Flushes Redis and reloads all content
  - Response: Sync summary with counts and errors

- **GET `/api/v1/sync-status`**
  - Returns last sync result
  - Shows sync history and statistics

- **GET `/api/v1/redis-stats`**
  - Returns Redis memory usage
  - Shows capacity and utilization percentage

- **POST `/api/v1/external`**
  - Fetches content from external API
  - Caches response in Redis
  - Used for portfolio data integration

### 3. Cache Layer
**Technology**: Redis (Cloud-based)
**Provider**: RedisLabs
**Capacity**: 30GB

#### Redis Key Patterns
```
config:root                              → Languages configuration
cms:file:collections/{lang}/config/*    → Language config files
cms:file:collections/{lang}/data/*      → Language data files
assets:files:{filename}                 → Additional files
index:collections                       → Collections index
sync:last-result                        → Last sync metadata
```

#### Data Storage Strategy
- Configuration cached for fast access
- Collections synced on startup and manual trigger
- Images served directly from public folder (not cached)
- File assets cached with expiration

### 4. Data Layer
**Storage**: Local File System & External API

#### Local Storage (`/public`)
```
/public/
├── /collections/          # Language-specific content
│   ├── /en/
│   │   ├── /config/      # 3 config files
│   │   └── /data/        # 11 data files
│   ├── /es/
│   └── ... (11 languages total)
├── /config/              # System configuration
│   ├── languages.json
│   ├── apiRouting.json
│   └── pageLayout.json
├── /data/                # Global data
├── /files/               # Downloadable files
├── /image/               # Images (served by Next.js)
└── /js/                  # Frontend utilities
```

#### Content Distribution
- **Total Languages**: 11
- **Files per Language**: 14 (3 config + 11 data)
- **Total Collection Files**: 154
- **Images**: 23
- **Additional Files**: 13

#### External API
```
https://static.kuhandranchatbot.info/api/collections/{lang}/data/{type}.json
```

Provides:
- Projects
- Skills
- Experience
- Education
- And more...

### 5. Synchronization System
**Module**: `/lib/sync-service.ts`
**Trigger**: Startup + Manual
**Frequency**: As needed

#### Sync Pipeline

1. **Initialization**
   - Clear logs buffer
   - Log sync start timestamp

2. **Configuration Load**
   - Read `languages.json`
   - Cache in Redis as `config:root`

3. **Collections Sync** (Core)
   - Iterate all 11 languages
   - For each language:
     - Load 3 config files
     - Load 11 data files
     - Store with `cms:file:collections/{lang}/*` pattern
   - Total: 22 collection group syncs

4. **Images Sync**
   - Count images in `/public/image/`
   - Skip Redis storage (served by Next.js)
   - Total: 23 images counted

5. **Files Sync**
   - Load all files from `/public/files/`
   - Cache with `assets:files:*` pattern
   - Total: 13 files synced

6. **Reporting**
   - Aggregate all counts
   - Collect any errors
   - Store sync result in Redis

#### Sync Lifecycle

```
START
  ↓
Flush Redis (0%)
  ↓
Load Config
  ↓
Load Collections (11 langs × 2 groups)
  ↓
Load Images
  ↓
Load Files
  ↓
Calculate Stats
  ↓
Store Result
  ↓
END
```

### 6. Monitoring & Analytics
**Location**: `/admin/sync`

#### Real-time Metrics
- Memory usage: Used / Max / Percentage
- Sync progress: Step tracking
- Item counts: Configs, collections, images, files
- Error logging: Detailed error messages

#### Refresh Strategy
- Redis stats: Every 5 seconds
- Sync logs: Real-time during sync
- Collection counts: On page load

## Data Flow Examples

### Example 1: User Viewing Collections
```
User visits /admin/collections
    ↓
Component mounts
    ↓
Fetch /api/v1/config (get all languages)
    ↓
For each language:
  Fetch /api/v1/pages/{lang} (get counts)
    ↓
Display collections grid
```

### Example 2: Manual Content Sync
```
User clicks "Sync Now"
    ↓
POST /api/v1/sync
    ↓
Redis.flushAll() (clear all)
    ↓
performSync() flow (as above)
    ↓
Return sync summary
    ↓
Update dashboard with results
    ↓
Fetch redis stats
```

### Example 3: External Content Fetch
```
User requests portfolio data
    ↓
/api/v1/external endpoint
    ↓
Check Redis cache
    ↓
If not cached:
  Fetch from external API
  Cache in Redis
    ↓
Return data
```

## Security Architecture

### Authentication
- Token-based auth (stored in localStorage)
- Admin routes protected with auth middleware
- API endpoints validate tokens

### Data Protection
- Redis password protected
- HTTPS enforced in production
- CORS configured for trusted origins
- Input validation on all endpoints

### Error Handling
- Try-catch blocks in all async operations
- Graceful error responses
- Detailed logging for debugging
- User-friendly error messages

## Performance Characteristics

### Load Times
- Initial page load: ~500ms
- Collections page: ~700ms
- Dashboard: ~600ms
- API response time: <100ms (cached)

### Memory Usage
- Production Redis: ~2-5GB (current)
- Max capacity: 30GB
- Auto-optimization: LRU eviction enabled
- Peak usage: Post-sync (temporary)

### Scalability
- Horizontal scaling: Add Redis clusters
- Load balancing: Deploy multiple Next.js instances
- CDN integration: Cloudflare/AWS CloudFront
- Multi-region support: Available with infrastructure changes

## Deployment Architecture

### Development
```
Local Machine
  ├─ Next.js Dev Server (localhost:3000)
  ├─ Redis Cloud (redis-19930.c232.us-east-1-2.ec2.cloud.redislabs.com)
  └─ Public Files (local /public)
```

### Production (Recommended)
```
Vercel/AWS/Netlify
  ├─ Next.js App (auto-scaling)
  ├─ Redis Cluster (replicated)
  ├─ S3/CDN (static assets)
  └─ CloudWatch/Datadog (monitoring)
```

## Integration Points

### External APIs
- **Static Content**: `static-api-opal.vercel.app`
- **Weather API**: (Optional, extensible)
- **Email Service**: (Optional, for contact forms)
- **Analytics**: (Optional, Vercel Analytics)

### Third-party Services
- **Redis**: RedisLabs (managed service)
- **Hosting**: Vercel (Next.js optimized)
- **Domain**: Custom domain (via provider)
- **SSL**: Automatic (Let's Encrypt)

## Development Workflow

### Local Development
```
npm install
npm run dev
# Dev server starts on localhost:3000
# Auto-sync on startup
```

### Building
```
npm run build
npm start
# Production-optimized build
```

### Testing
```
npm test          # Run tests (configured if needed)
npm run lint      # TypeScript & ESLint checks
```

## Maintenance Tasks

### Regular Maintenance
- Monitor Redis usage
- Check sync logs for errors
- Update dependencies monthly
- Review performance metrics

### Scheduled Tasks
- Clear old sync logs (weekly)
- Verify external API connectivity (daily)
- Backup configuration (weekly)
- Monitor uptime (continuous)

## Future Architecture Improvements

- [ ] Add message queue (RabbitMQ/Kafka)
- [ ] Implement webhooks for auto-sync
- [ ] Add GraphQL API layer
- [ ] Implement microservices architecture
- [ ] Add search engine (Elasticsearch)
- [ ] Implement content versioning
- [ ] Add multi-tenancy support

---

**Last Updated**: January 6, 2026
**Architecture Version**: 2.0
**Status**: Production Ready
