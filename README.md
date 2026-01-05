# Portfolio Data API

Static portfolio data server with Redis storage, multi-language support, and auto-sync capabilities.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/kuhandran/portfolio-data-api.git
cd portfolio-data-api

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your REDIS_URL

# Run locally
npm run dev
```

## 📡 API Endpoints

### Collections API (Multi-Language)
```
GET /api/collections/{locale}/{category}/{file}

Examples:
/api/collections/en/data/contentLabels.json
/api/collections/fr/data/experience.json
/api/collections/ar-AE/config/pageLayout.json
```

**Supported Locales**: en, ar-AE, de, es, fr, hi, id, my, si, ta, th

### Auto-Sync Endpoints
```
POST   /api/auto-sync          - Rebuild manifest from Redis
GET    /api/auto-sync/status   - Get current file status
POST   /api/auto-sync/upload   - Upload new files
```

### Admin Dashboard
```
GET    /dashboard              - Admin interface
GET    /sync-manager           - File management UI
```

## 🏗️ Deployment

### Deploy to Vercel

1. **Connect GitHub Repository**
   - Import project in Vercel dashboard
   - Connect to your GitHub repository

2. **Set Environment Variables**
   ```
   REDIS_URL=your_redis_url_here
   ```

3. **Deploy**
   ```bash
   git push origin main
   ```
   Vercel auto-deploys on push. Build command runs `seed-redis-build.js` to populate Redis.

## 📁 Project Structure

See [docs/README.md](docs/README.md) for complete project structure and documentation.

```
portfolio-data-api/
├── api/                    # Vercel serverless functions
├── docs/                   # Documentation
├── public/                 # Static files (seeded to Redis)
│   ├── collections/        # Multi-language content
│   ├── config/            # Configuration files
│   ├── data/              # Core data files
│   ├── files/             # Static files
│   ├── image/             # Images
│   └── resume/            # Resume files
├── scripts/               # Build scripts
├── src/                   # Source code
│   ├── routes/           # API routes
│   └── middleware/       # Express middleware
├── views/                # Admin UI views
├── package.json
├── vercel.json           # Vercel configuration
└── README.md             # This file
```

## 🛠️ Technology Stack

- **Runtime**: Node.js 20.x
- **Framework**: Express.js
- **Storage**: Redis (Upstash)
- **Deployment**: Vercel Serverless
- **Languages**: 11 locales supported

## 📊 Features

✅ **Multi-Language Support** - 11 languages with automatic fallback to English  
✅ **Redis Storage** - Fast, scalable key-value storage  
✅ **Auto-Sync** - Build-time seeding and runtime updates  
✅ **File Management UI** - Professional web interface for uploads  
✅ **CORS Enabled** - Cross-origin requests supported  
✅ **Serverless** - Scales automatically with traffic  

## 🔐 Security

- Environment variables for sensitive configuration
- CORS with allowed origins configuration
- Redis over TLS
- No credentials in repository

## 📝 Environment Variables

```bash
# Required
REDIS_URL=redis://...              # Redis connection URL

# Optional
PORT=3000                          # Server port (local dev)
NODE_ENV=development               # Environment mode
```

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

## 📚 Documentation

For detailed documentation, see [docs/README.md](docs/README.md)

## 🔗 Links

- **Production**: https://static-api-opal.vercel.app
- **GitHub**: https://github.com/kuhandran/portfolio-data-api
- **Dashboard**: https://static-api-opal.vercel.app/dashboard
- **Sync Manager**: https://static-api-opal.vercel.app/sync-manager
