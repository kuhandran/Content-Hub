# Content Hub - Project Structure

## Overview
Content Hub is a multi-language content management system built with Next.js 15, Prisma, and PostgreSQL.

## Root Level Files
- **next.config.ts** - Next.js configuration (only config file needed)
- **package.json** - Dependencies and scripts
- **tsconfig.json** - TypeScript configuration
- **prisma.config.ts** - Prisma database configuration
- **prisma/** - Database schema and migrations
- **.env.local** - Environment variables (local development)
- **.env.example** - Template for environment variables

## Directory Structure

```
Content-Hub/
├── app/                          # Next.js App Router
│   ├── api/                      # API endpoints organized by purpose
│   │   ├── v1/                   # Public API v1
│   │   ├── admin/                # Admin-only operations
│   │   ├── chat/                 # Chat functionality (deprecated, use /v1/chat)
│   │   ├── collections/          # Collection file operations
│   │   └── proxy/                # External proxy services
│   ├── admin/                    # Admin dashboard pages
│   │   ├── dashboard/
│   │   ├── chat/
│   │   ├── users/
│   │   ├── collections/
│   │   └── settings/
│   ├── login/                    # Login page
│   ├── components/               # React components
│   │   └── shared/               # Reusable shared components
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
├── lib/                          # Utility libraries
│   ├── prisma.ts                 # Prisma client singleton
│   ├── redis-client.ts           # Redis client and operations
│   ├── sync-service.ts           # Content synchronization
│   └── external-content-loader.ts # External content loading
├── prisma/                       # Database
│   └── schema.prisma             # Data models
├── public/                       # Static assets
│   ├── collections/              # Collection JSON files (languages)
│   ├── data/                     # Data files (skills, projects, etc.)
│   ├── files/                    # Static files
│   ├── image/                    # Image assets
│   ├── config/                   # Configuration files
│   └── js/                       # Client-side JavaScript
├── scripts/                      # Utility scripts
│   ├── seed-redis-build.js
│   ├── flush-redis.js
│   ├── watch-and-sync.js
│   └── generate-manifest.js
└── docs/                         # Documentation files
```

## API Organization

### /api/v1/ - Public API (v1)
**Purpose:** Main public API for all client applications
- **auth/** - Authentication endpoints
- **chat/** - Chat history and sessions
- **pages/** - Page content retrieval
- **config/** - Configuration data
- **assets/** - Static file serving
- **external/** - External content integration

### /api/admin/ - Admin Operations
**Purpose:** Admin-only operations, require authentication
- **delete/** - Delete content
- **upload/** - Upload new content
- **sync/** - Sync content between systems
- **languages/** - Manage languages

### /api/chat/ - Chat Endpoints (Legacy)
**Purpose:** Deprecated - use /api/v1/chat instead
- **messages/** - Chat messages
- **sessions/** - Chat sessions
- **preferences/** - User preferences

### /api/collections/ - Collection Files
**Purpose:** Direct file operations on collections
- **[lang]/[folder]/[file]/** - Get specific file
- **[lang]/[folder]/** - List folder contents
- **[lang]/** - List language contents
- **route.ts** - List all collections

### /api/proxy/ - External Proxies
**Purpose:** Proxy requests to external services

---

## Component Structure

### /app/components/shared/
Reusable components used across the application:
- **Header.tsx** - Navigation header with inline styles
- **Sidebar.tsx** - Left sidebar navigation

### /app/admin/ Pages
Dashboard pages with layout:
- **dashboard/** - Main dashboard KPIs
- **chat/** - Chat management
- **users/** - User management
- **collections/** - Collection management
- **settings/** - System settings

---

## Database

### Prisma Models
- **ChatMessage** - Stores conversation messages
- **ChatSession** - Groups chat conversations
- **ChatPreference** - User preferences

### Connection
- Provider: PostgreSQL (db.prisma.io)
- Config: prisma.config.ts
- URL: DATABASE_URL env variable

---

## Key Features

### Multi-Language Support
- Languages defined in `public/config/languages.json`
- Content organized by language code (en, es, fr, etc.)

### Redis Caching
- Used for performance optimization
- Client configuration in `lib/redis-client.ts`
- Operations like upload, sync, and retrieval

### Content Synchronization
- `lib/sync-service.ts` handles content sync
- Watches for changes and updates Redis cache
- Disabled in instrumentation.ts to prevent infinite loops

### Styling
- No Tailwind CSS - using inline `style` props only
- All styles are inline CSS properties
- Responsive layouts using CSS Grid and Flexbox

---

## Environment Variables
Required in `.env.local`:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string (optional)
- `NODE_ENV` - Environment (development/production)

---

## Development Commands

```bash
npm run dev        # Start dev server
npm run build      # Build production
npm run start      # Start production server
npm run lint       # Run linter
```

---

Last Updated: January 7, 2026
