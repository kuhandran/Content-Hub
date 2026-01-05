# Portfolio Data API Documentation

Complete API documentation for the static portfolio data API with Redis storage and auto-sync capabilities.

## 📁 Project Structure

```
portfolio-data-api/
├── api/                          # Vercel serverless functions
│   └── index.js                  # Main API entry point
├── docs/                         # Documentation
│   └── README.md                 # This file
├── lib/                          # Libraries
│   └── vercel-kv-storage.js     # Redis storage utilities
├── logs/                         # Log files (local only)
├── public/                       # Static files (seeded to Redis at build)
│   ├── collections/              # Localized content by language
│   │   ├── en/                   # English content
│   │   ├── ar-AE/                # Arabic content
│   │   ├── de/                   # German content
│   │   ├── es/                   # Spanish content
│   │   ├── fr/                   # French content
│   │   ├── hi/                   # Hindi content
│   │   ├── id/                   # Indonesian content
│   │   ├── my/                   # Malay content
│   │   ├── si/                   # Sinhala content
│   │   ├── ta/                   # Tamil content
│   │   └── th/                   # Thai content
│   ├── config/                   # Configuration files
│   │   ├── apiRouting.json
│   │   ├── languages.json
│   │   ├── pageLayout.json
│   │   └── urlConfig.json
│   ├── data/                     # Core data files
│   │   ├── achievements.json
│   │   ├── caseStudies.json
│   │   ├── contentLabels.json
│   │   ├── education.json
│   │   ├── errorMessages.json
│   │   ├── experience.json
│   │   ├── projects.json
│   │   └── skills.json
│   ├── files/                    # Static files
│   │   ├── offline.html
│   │   ├── privacy-policy.html
│   │   ├── robots.txt
│   │   └── sitemap.xml
│   ├── image/                    # Image assets
│   └── resume/                   # Resume files
├── scripts/                      # Build and utility scripts
│   ├── seed-redis-build.js      # Build-time Redis seeding
│   └── [other scripts]
├── src/                          # Source code
│   ├── config/                   # Configuration
│   │   └── allowedOrigins.js
│   ├── core/                     # Core functionality
│   │   └── cache-manager.js
│   ├── data/                     # Embedded data
│   ├── lib/                      # Libraries
│   ├── middleware/               # Express middleware
│   ├── routes/                   # API routes
│   │   └── auto-sync.js         # Auto-sync endpoints
│   ├── utils/                    # Utilities
│   ├── app.js                    # Express app setup
│   └── server.js                 # Server entry point
├── views/                        # HTML views
│   ├── dashboard.ejs             # Admin dashboard
│   ├── login.ejs                 # Login page
│   └── sync-manager.html         # File sync manager UI
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── LICENSE
├── package.json
├── README.md                     # Main project README
└── vercel.json                   # Vercel configuration
```

## 🚀 Key Features

### 1. Multi-Language Collections API
- 11 languages supported (en, ar-AE, de, es, fr, hi, id, my, si, ta, th)
- Dynamic content routing: `/api/collections/{locale}/{category}/{file}`
- Automatic fallback to English if translation missing

### 2. Redis Storage
- All files stored in Redis with key pattern: `cms:file:{path}`
- Manifest stored at: `cms:manifest`
- Build-time seeding via `seed-redis-build.js`
- Runtime uploads via `/api/auto-sync/upload`

### 3. Auto-Sync System
- **Build-time**: Automatic seeding from `public/` folder during Vercel deployment
- **Runtime**: Rebuild manifest from Redis keys via `POST /api/auto-sync`
- **Upload**: Multi-file upload UI for config, data, files, images, collections

### 4. File Management UI
- Professional sidebar navigation at `/sync-manager`
- Upload files to config, data, files, image folders
- Upload collections with locale selector
- Refresh file status from Redis
- Expandable file categories with detailed listings

## 📡 API Endpoints

### Collections API
```
GET /api/collections/{locale}/{category}/{file}
Example: /api/collections/en/data/contentLabels.json
```

### Auto-Sync Endpoints
```
POST   /api/auto-sync          - Rebuild manifest from Redis
GET    /api/auto-sync/status   - Get current file status
POST   /api/auto-sync/upload   - Upload new files
```

### Admin Routes
```
GET    /dashboard              - Admin dashboard
GET    /sync-manager           - File management UI
```

## 🛠️ Development

### Environment Variables
```bash
REDIS_URL=redis://...          # Redis connection (required)
PORT=3000                       # Server port (optional)
NODE_ENV=development           # Environment (development/production)
```

### Local Setup
```bash
npm install
npm run dev
```

### Deploy to Vercel
```bash
git push origin main           # Auto-deploys via Vercel GitHub integration
```

## 🔐 Security

- CORS configured for allowed origins
- Redis connection over TLS
- Environment variables for sensitive data
- No credentials stored in repository

## 📊 File Categories

1. **Collections** (103 files): Localized content across 11 languages
2. **Config** (5 files): API routing, languages, page layout, URL config
3. **Data** (11 files): Achievements, education, experience, projects, skills
4. **Files** (9 files): Static HTML, XML, TXT files
5. **Image** (0 files): Image assets
6. **Resume** (0 files): Resume documents

**Total: 128 files** stored in Redis

## 🏗️ Deployment Architecture

```
GitHub Push → Vercel Build → seed-redis-build.js runs → Files seeded to Redis → Serverless functions deployed
```

- **Build Command**: `npm install && node scripts/seed-redis-build.js`
- **Functions**: Serverless Node.js 20.x
- **Storage**: Upstash Redis (Vercel KV)
- **Region**: Automatic edge distribution

## 📝 License

MIT License - See LICENSE file for details
