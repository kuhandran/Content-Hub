# 🎉 Content Hub - Complete Monorepo Setup

Welcome to the Content Hub monorepo! This document summarizes the entire setup with both backend API and frontend UI in separate services.

## 📦 What You Have

### ✅ Backend API (Port 3001)
- **Framework:** Next.js 15.5.9
- **Language:** JavaScript/CommonJS
- **Location:** `apps/backend/`
- **Features:**
  - Modular API endpoints (`/api/admin/operations`, `/api/admin/db`, `/api/admin/data`, `/api/admin/sync`)
  - Database operations (create, delete, pump, sync)
  - File scanning (234 files)
  - Change detection
  - Batch operations support
- **Database:** Supabase PostgreSQL (8 tables)
- **Entry Point:** `apps/backend/server.js`

### ✅ Frontend UI (Port 3000)
- **Framework:** Next.js 15.5.9
- **Language:** TypeScript/React 19
- **Location:** `apps/frontend/`
- **Features:**
  - Home dashboard
  - API status monitoring
  - Quick operations
  - Admin interface (coming)
  - TailwindCSS styling
- **Styling:** TailwindCSS 3
- **Entry Point:** `apps/frontend/pages/index.tsx`

### ✅ Root Configuration
- **Workspaces:** npm workspaces (root `package.json`)
- **Deployment:** Single `vercel.json` for both apps
- **Scripts:** Coordinated dev, build, start commands
- **Docker:** Compose file + Dockerfiles for containerization

---

## 🚀 Quick Start

### 1. Clone and Setup
```bash
# Clone repository
git clone https://github.com/kuhandran/Content-Hub.git
cd Content-Hub

# Run setup script
bash setup-monorepo.sh
```

### 2. Configure Environment
```bash
# Copy example to local
cp .env.example .env.local

# Edit with your credentials
# Add Supabase URL and Key
nano .env.local
```

### 3. Start Development Servers

**Option A: Using Bash Scripts**
```bash
bash dev.sh
# Starts both backend (3001) and frontend (3000)
```

**Option B: Using npm Commands**
```bash
# Terminal 1 - Backend
npm run backend:dev

# Terminal 2 - Frontend
npm run frontend:dev
```

**Option C: Using Docker Compose**
```bash
docker-compose up --build
```

### 4. Access Application
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001/api
- **API Operations:** http://localhost:3001/api/admin/operations

---

## 📁 Project Structure

```
Content-Hub/
├── apps/
│   ├── backend/                    # API Server (Port 3001)
│   │   ├── pages/api/             # API routes
│   │   │   ├── admin/
│   │   │   │   ├── operations.js  # Batch operations
│   │   │   │   ├── db.js          # Database management
│   │   │   │   ├── data.js        # Data operations
│   │   │   │   └── sync.js        # Sync operations
│   │   ├── scripts/
│   │   │   └── setup-database.js  # Database initialization
│   │   ├── lib/
│   │   │   └── sync-service.js    # Utility functions
│   │   ├── server.js              # HTTP entrypoint
│   │   ├── package.json
│   │   ├── next.config.js
│   │   ├── Dockerfile
│   │   └── tsconfig.json
│   │
│   └── frontend/                   # React UI (Port 3000)
│       ├── pages/
│       │   ├── index.tsx          # Home dashboard
│       │   └── _document.tsx      # Root document
│       ├── components/            # React components
│       ├── public/                # Static assets
│       ├── package.json
│       ├── next.config.js
│       ├── Dockerfile
│       └── tsconfig.json
│
├── public/                         # Content files (234 files)
│   ├── collections/              # Multi-language data (13 langs)
│   ├── config/                   # Configuration files
│   ├── data/                     # JSON data
│   ├── files/                    # Static files
│   ├── image/                    # Images
│   ├── js/                       # JavaScript
│   └── resume/                   # Resumes
│
├── package.json                   # Root workspace config
├── vercel.json                   # Vercel deployment (both apps)
├── tsconfig.json                 # TypeScript config
├── .env.example                  # Environment template
├── docker-compose.yml            # Docker compose file
│
├── setup-monorepo.sh            # Setup script
├── dev.sh                       # Development script
├── build.sh                     # Build script
│
├── MONOREPO_GUIDE.md            # Monorepo architecture
├── MODULAR_API_GUIDE.md         # API documentation
├── API_QUICK_REFERENCE.md       # API quick commands
└── DEPLOYMENT_GUIDE.md          # Deployment guide
```

---

## 🛠️ Commands Reference

### Development
```bash
# All services
npm run dev                    # All apps in dev mode
npm run build                  # Build all apps
npm start                      # Start all in production

# Backend only
npm run backend:dev            # Backend dev mode
npm run backend:build          # Build backend
npm run backend:start          # Start backend

# Frontend only
npm run frontend:dev           # Frontend dev mode
npm run frontend:build         # Build frontend
npm run frontend:start         # Start frontend

# Database
npm run setup-db               # Initialize database
```

### Scripts
```bash
bash setup-monorepo.sh         # One-time setup
bash dev.sh                    # Start dev servers
bash build.sh                  # Build for production
```

### Docker
```bash
docker-compose up --build      # Start with Docker
docker-compose down            # Stop containers
docker-compose logs -f         # View logs
```

---

## 🗄️ Database Information

### Tables (8 Total)
| Table | Purpose | Records |
|-------|---------|---------|
| collections | Multi-language data (13 langs) | ~78 |
| static_files | HTML, XML, TXT files | ~12 |
| config_files | JSON configurations | ~4 |
| data_files | JSON data files | ~8 |
| images | Image metadata | ~45 |
| resumes | Resume files | ~3 |
| javascript_files | JavaScript source | ~2 |
| sync_manifest | Change tracking | ~156 |

### File Counts
- **Total files in /public:** 234
- **Supported languages:** 13 (ar-AE, de, en, es, fr, hi, id, my, si, ta, th)
- **Automatic categorization:** By folder path

---

## 📡 API Operations

### Available Operations
```
GET    /api/admin/operations          List operations
POST   /api/admin/operations          Execute operation
```

### Single Operations
```bash
curl -X POST http://localhost:3001/api/admin/operations \
  -H "Content-Type: application/json" \
  -d '{"operation": "createdb"}'  # Create tables
  -d '{"operation": "deletedb"}'  # Clear data
  -d '{"operation": "pumpdata"}'  # Load from /public
  -d '{"operation": "syncopublic"}'  # Detect changes
  -d '{"operation": "status"}'    # Get status
```

### Batch Operations
```bash
curl -X POST http://localhost:3001/api/admin/operations \
  -H "Content-Type: application/json" \
  -d '{
    "batch": ["createdb", "pumpdata", "status"]
  }'
```

---

## 🌐 Vercel Deployment

### One-Click Deployment
1. Push code: `git push origin main`
2. Vercel auto-detects monorepo structure
3. Deploys both backend and frontend
4. Sets environment variables in dashboard

### Configuration
- **Build:** `npm run setup-db && npm run build --workspaces`
- **Install:** `npm ci --workspaces`
- **Framework:** Next.js (auto-detected)

### URLs After Deployment
- Frontend: `https://your-domain.vercel.app`
- Backend API: `https://your-domain.vercel.app/api`
- API Ops: `https://your-domain.vercel.app/api/admin/operations`

---

## 🐳 Docker Deployment

### Local Development
```bash
docker-compose up --build
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

### Production
```bash
docker build -t content-hub-backend apps/backend
docker build -t content-hub-frontend apps/frontend
docker run -p 3001:3001 content-hub-backend
docker run -p 3000:3000 content-hub-frontend
```

---

## 📚 Documentation

### Key Guides
- **[MONOREPO_GUIDE.md](./MONOREPO_GUIDE.md)** - Architecture & setup
- **[MODULAR_API_GUIDE.md](./MODULAR_API_GUIDE.md)** - Complete API docs
- **[API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md)** - Quick commands
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Deployment instructions

### API Endpoints
- `GET /api/admin/operations` - List available operations
- `POST /api/admin/operations` - Execute operations/batch
- `GET /api/admin/db` - Database status
- `POST /api/admin/db` - Database management
- `GET /api/admin/data` - Data statistics
- `POST /api/admin/data` - Data operations
- `GET /api/admin/sync` - Sync status
- `POST /api/admin/sync` - Sync operations (scan/pull/push)

---

## 🎯 Common Workflows

### Initialize Database
```bash
npm run backend:dev
# In another terminal:
curl -X POST http://localhost:3001/api/admin/operations \
  -H "Content-Type: application/json" \
  -d '{"batch": ["createdb", "pumpdata", "status"]}'
```

### Sync After File Changes
```bash
curl -X POST http://localhost:3001/api/admin/sync \
  -H "Content-Type: application/json" \
  -d '{"mode": "scan"}'
```

### Full Database Rebuild
```bash
curl -X POST http://localhost:3001/api/admin/operations \
  -H "Content-Type: application/json" \
  -d '{"batch": ["deletedb", "createdb", "pumpdata"]}'
```

---

## 🔒 Environment Variables

**Required:**
```
SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
```

**Optional:**
```
POSTGRES_URL=postgres_connection
REDIS_URL=redis_connection
```

**Configured:**
```
BACKEND_PORT=3001
FRONTEND_PORT=3000
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## ✨ Key Features

✅ Separate backend and frontend services
✅ npm workspaces for monorepo management
✅ Single Vercel configuration for both apps
✅ Modular API with batch operations support
✅ Automatic database initialization
✅ File scanning and change detection
✅ Multi-language support (13 languages)
✅ Docker containerization
✅ Development and production scripts
✅ Complete deployment documentation
✅ TypeScript + TailwindCSS
✅ API monitoring dashboard

---

## 🚨 Troubleshooting

### Port Already in Use
```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### Database Connection Issues
```bash
# Verify credentials in .env.local
# Run setup again
npm run setup-db
```

### Build Errors
```bash
# Clean install
npm install --workspaces --force
npm run build
```

### Docker Issues
```bash
# Rebuild images
docker-compose build --no-cache
docker-compose up
```

---

## 📞 Support

- GitHub Issues: https://github.com/kuhandran/Content-Hub/issues
- Documentation: See guides in root directory
- Vercel Support: https://vercel.com/support
- Supabase Support: https://supabase.com/docs

---

## 🎊 Next Steps

1. ✅ Run `setup-monorepo.sh` - Initial setup
2. ✅ Configure `.env.local` - Add credentials
3. ✅ Start dev servers - `bash dev.sh`
4. ✅ Initialize database - See workflows above
5. ✅ Explore API - `http://localhost:3001/api/admin/operations`
6. ✅ Visit frontend - `http://localhost:3000`
7. ✅ Deploy to Vercel - `git push origin main`

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────┐
│         User's Browser                  │
│      (http://localhost:3000)            │
└────────────────────┬────────────────────┘
                     │
                     ▼
     ┌───────────────────────────────┐
     │      Frontend UI (3000)       │
     │   - Home Dashboard            │
     │   - API Status Monitor        │
     │   - Quick Operations          │
     └────────────┬──────────────────┘
                  │
         ┌────────▼────────┐
         │   /api Routes   │
         │   (Rewrite to   │
         │    3001)        │
         └────────┬────────┘
                  │
                  ▼
     ┌──────────────────────────────┐
     │   Backend API (3001)         │
     │ ┌────────────────────────┐   │
     │ │ /api/admin/operations  │   │
     │ │ /api/admin/db          │   │
     │ │ /api/admin/data        │   │
     │ │ /api/admin/sync        │   │
     │ └────────────┬───────────┘   │
     └──────────────┼────────────────┘
                    │
                    ▼
        ┌──────────────────────┐
        │ Supabase PostgreSQL  │
        │  (8 Tables, 234      │
        │   Files)             │
        └──────────────────────┘
```

---

## 📅 Last Updated

January 8, 2026

---

**Welcome to Content Hub! 🚀**

You now have a production-ready monorepo with separate backend and frontend services, ready to scale and maintain independently while sharing infrastructure configuration.
