# 🏗️ Content Hub - Monorepo Architecture

A modern monorepo with separate Backend API and Frontend applications, managed with npm workspaces and deployed on Vercel.

## 📁 Project Structure

```
content-hub/
├── apps/
│   ├── backend/               # Backend API Server (Port 3001)
│   │   ├── pages/api/        # API Routes
│   │   │   ├── admin/        # Admin operations
│   │   │   └── ...
│   │   ├── scripts/          # Database setup scripts
│   │   ├── lib/              # Utility functions
│   │   ├── server.js         # HTTP server entrypoint
│   │   ├── package.json      # Backend dependencies
│   │   └── next.config.js    # Backend Next.js config
│   │
│   └── frontend/              # Frontend UI (Port 3000)
│       ├── pages/            # Next.js pages
│       │   ├── index.tsx     # Home page
│       │   └── admin/        # Admin pages
│       ├── components/       # React components
│       ├── public/           # Static assets
│       ├── package.json      # Frontend dependencies
│       └── next.config.js    # Frontend Next.js config
│
├── public/                    # Content files (234 files)
│   ├── collections/          # Multi-language data
│   ├── config/               # Configuration files
│   ├── data/                 # JSON data
│   ├── files/                # Static files
│   ├── image/                # Images
│   ├── js/                   # JavaScript files
│   └── resume/               # Resume files
│
├── package.json              # Root workspace config
├── vercel.json              # Vercel deployment config
├── .env.example             # Environment variables template
├── tsconfig.json            # TypeScript config
└── README.md                # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.x
- npm >= 9.x

### Installation

```bash
# Install dependencies for all workspaces
npm install

# Or install a specific workspace
npm install --workspace=apps/backend
npm install --workspace=apps/frontend
```

### Development

**Run both services:**
```bash
# Run all apps in development mode
npm run dev
```

**Run specific service:**
```bash
# Run only backend (port 3001)
npm run backend:dev

# Run only frontend (port 3000)
npm run frontend:dev
```

**Build for production:**
```bash
# Build all workspaces
npm run build

# Build specific workspace
npm run backend:build
npm run frontend:build
```

**Start production servers:**
```bash
# Start all services
npm start

# Start specific service
npm run backend:start
npm run frontend:start
```

## 🔧 Database Setup

**Initialize database (Backend only):**
```bash
npm run setup-db
```

This will:
- Scan `/public` folder for 234 files
- Create 8 database tables
- Load data from files into database
- Create sync manifest for change tracking

## 📡 Services

### Backend API (Port 3001)
**Technology:** Next.js 15 + Node.js

**Endpoints:**
- `GET /api/admin/operations` - List operations
- `POST /api/admin/operations` - Execute operations
- `GET /api/admin/db` - Database status
- `POST /api/admin/db` - Database management
- `GET /api/admin/data` - Data statistics
- `POST /api/admin/data` - Data operations
- `GET /api/admin/sync` - Sync status
- `POST /api/admin/sync` - Sync operations

**Environment:**
```bash
BACKEND_PORT=3001
SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
```

### Frontend UI (Port 3000)
**Technology:** Next.js 15 + React 19 + TailwindCSS

**Pages:**
- `/` - Home dashboard
- `/admin` - Admin dashboard (coming)
- `/api/admin/operations` - API docs

**Environment:**
```bash
FRONTEND_PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🗄️ Database Tables

| Table | Purpose | Records |
|-------|---------|---------|
| `collections` | Multi-language data | 78 |
| `static_files` | HTML, XML, TXT | 12 |
| `config_files` | JSON configs | 4 |
| `data_files` | JSON data | 8 |
| `images` | Image metadata | 45 |
| `resumes` | Resume files | 3 |
| `javascript_files` | JS source | 2 |
| `sync_manifest` | Change tracking | 156 |

**Total: 234 files, 8 tables**

## 🔄 Operational Workflows

### Initialize Fresh Database
```bash
npm run backend:dev
# Then in another terminal:
curl -X POST http://localhost:3001/api/admin/operations \
  -H "Content-Type: application/json" \
  -d '{"batch": ["createdb", "pumpdata", "status"]}'
```

### Sync Changes
```bash
curl -X POST http://localhost:3001/api/admin/sync \
  -H "Content-Type: application/json" \
  -d '{"mode": "scan"}'
```

### Rebuild Database
```bash
curl -X POST http://localhost:3001/api/admin/operations \
  -H "Content-Type: application/json" \
  -d '{"batch": ["deletedb", "createdb", "pumpdata"]}'
```

## 🌐 Vercel Deployment

### Configuration
- **Install:** `npm ci --workspaces`
- **Build:** `npm run setup-db && npm run build --workspaces`
- **Regions:** iad1 (us-east-1)

### Environment Variables (Set in Vercel Dashboard)
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
POSTGRES_URL
BACKEND_PORT=3001
FRONTEND_PORT=3000
NODE_ENV=production
```

### Deployment
```bash
git push origin main
# Vercel automatically deploys
```

**URLs:**
- Frontend: `https://your-domain.vercel.app`
- Backend API: `https://your-domain.vercel.app/api`

## 📦 Workspace Scripts

**Root level (affects all workspaces):**
```bash
npm run dev          # All apps dev mode
npm run build        # All apps build
npm start            # All apps start
npm test             # All apps test
```

**Backend specific:**
```bash
npm run backend:dev     # Backend dev
npm run backend:build   # Backend build
npm run backend:start   # Backend start
npm run setup-db        # Database setup
```

**Frontend specific:**
```bash
npm run frontend:dev    # Frontend dev
npm run frontend:build  # Frontend build
npm run frontend:start  # Frontend start
```

## 🔐 Environment Variables

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Update with your credentials:
- Supabase URL and Key
- Database connection strings
- API ports
- Frontend API URL

## 📚 API Documentation

See detailed API documentation:
- [MODULAR_API_GUIDE.md](./MODULAR_API_GUIDE.md) - Complete API reference
- [API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md) - Quick commands

## 🔗 Communication Between Services

**Frontend → Backend:**
```typescript
// In frontend pages/components
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const response = await fetch(`${apiUrl}/api/admin/operations`);
```

**Backend Server.js rewrites:**
Backend serves API routes on `/api/*` and rewrites them to port 3001.

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Workspace not installing
```bash
# Clean install
npm install --workspaces --force
```

### Database connection issues
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
- Check Vercel environment variables in production
- Run `npm run setup-db` to initialize tables

## 📋 Features

✅ **Monorepo:** npm workspaces with shared root config
✅ **Dual Services:** Backend API (3001) + Frontend UI (3000)
✅ **Database:** Supabase PostgreSQL with 8 tables
✅ **Sync:** Bidirectional file ↔ database synchronization
✅ **Modular API:** Single operation endpoint with batch support
✅ **Vercel Ready:** Single configuration for both apps
✅ **TypeScript:** Full type safety
✅ **Hot Reload:** Development mode with automatic restart

## 🎯 Next Steps

- [ ] Create admin dashboard
- [ ] Add authentication
- [ ] Implement file upload
- [ ] Add webhook triggers
- [ ] Create scheduled sync tasks
- [ ] Add performance monitoring
- [ ] Setup CI/CD pipeline

## 📄 License

MIT

## 👨‍💻 Author

Kuhandran
