# Content Hub - Quick Reference Guide

## 🚀 Quick Start

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Access Points
- **Admin Dashboard**: http://localhost:3000/admin/dashboard
- **Collections Hub**: http://localhost:3000/admin/collections
- **Sync Manager**: http://localhost:3000/admin/sync
- **Public API**: http://localhost:3000/api/v1

---

## 📁 Project Structure

```
content-hub/
├── app/
│   ├── admin/                    # Admin pages
│   │   ├── collections/         # Collections management
│   │   ├── dashboard/           # Main dashboard
│   │   ├── sync/                # Sync manager
│   │   └── ...other pages
│   ├── api/v1/                  # REST API endpoints
│   │   ├── sync/
│   │   ├── config/
│   │   ├── pages/
│   │   └── ...
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── lib/
│   ├── redis-client.ts          # Redis wrapper
│   ├── sync-service.ts          # Sync logic
│   └── ...utilities
├── public/
│   ├── collections/             # Content by language
│   │   ├── en/, es/, fr/, ...  # 11 languages
│   ├── config/                  # System config
│   ├── data/                    # Global data
│   ├── files/                   # Downloadable files
│   ├── image/                   # Image assets
│   └── ...
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🎨 Design System

### Colors
```
Primary Background:  #0f172a to #1e293b (gradient)
Accent Color:        #3b82f6 (Blue)
Secondary:           #8b5cf6 (Purple)
Text Primary:        #ffffff (White)
Text Secondary:      #cbd5e1 (Light slate)
Text Tertiary:       #94a3b8 (Slate)
```

### Typography
- **Headings**: Font weight 700-800
- **Body**: Font weight 400-600
- **Font Family**: System fonts (-apple-system, Segoe UI, Roboto)

### Spacing
- Base unit: 1rem = 16px
- Cards padding: 2rem
- Grid gap: 2rem
- Margins: 1rem to 3rem

---

## 📊 Content Management

### Supported Languages
```
en    - English          🇬🇧
es    - Spanish          🇪🇸
fr    - French           🇫🇷
de    - German           🇩🇪
hi    - Hindi            🇮🇳
ta    - Tamil            🇮🇳
ar-AE - Arabic           🇦🇪
my    - Myanmar          🇲🇾
id    - Indonesian       🇮🇩
si    - Sinhala          🇱🇰
th    - Thai             🇹🇭
```

### Content Types per Language
- 3 Config files (apiConfig, pageLayout, urlConfig)
- 11 Data files (projects, skills, experience, education, etc.)

### Adding New Content

**Step 1: Add file to public**
```bash
mkdir -p public/collections/en/data
# Create your JSON file
```

**Step 2: Sync to Redis**
- Visit http://localhost:3000/admin/sync
- Click "Start Sync Now"
- Monitor the sync logs

**Step 3: Access the content**
```javascript
// Via API
fetch('/api/v1/pages/en')

// Via external API
fetch('https://static-api-opal.vercel.app/api/collections/en/data/projects.json')
```

---

## 🔄 Sync Operations

### Manual Sync
**Location**: `/admin/dashboard` or `/admin/sync`

**What it does**:
1. Flushes all Redis cache (0%)
2. Loads configuration
3. Syncs all 11 languages
4. Loads image metadata
5. Loads additional files
6. Reports results

**Expected Time**: ~1 second
**Result**: Synced data + counts + errors

### Auto-Sync
- Runs automatically on app startup
- Creates initial Redis cache
- Outputs detailed logs to console

---

## 🔌 API Endpoints

### GET /api/v1/config
Returns all languages and metadata
```json
{
  "languages": [
    { "code": "en", "name": "English", ... },
    { "code": "es", "name": "Spanish", ... }
  ]
}
```

### GET /api/v1/pages/[lang]
Returns all collections for language
```json
{
  "language": "en",
  "configs": { "count": 3, "items": [...] },
  "data": { "count": 11, "items": [...] },
  "total": 14
}
```

### POST /api/v1/sync
Triggers manual sync
```json
{
  "success": true,
  "data": {
    "timestamp": "2026-01-06T...",
    "configs": 1,
    "collections": 22,
    "images": 23,
    "files": 13,
    "errors": [],
    "logs": [...]
  }
}
```

### GET /api/v1/redis-stats
Returns Redis memory stats
```json
{
  "memory": {
    "used": "512 MB",
    "max": "30 GB",
    "available": "29.5 GB",
    "percentage": 1.7
  }
}
```

---

## 🛠️ Common Tasks

### Update Content
1. Edit file in `/public/collections/{lang}/data/`
2. Go to `/admin/sync`
3. Click "Start Sync Now"
4. Verify in collections page

### Check Memory Usage
1. Go to `/admin/sync`
2. Look at "Redis Monitor" card
3. Shows used/max and percentage

### View Sync Logs
1. Go to `/admin/sync`
2. Scroll to "Sync Output" section
3. See detailed [SYNC] logs

### Manage Languages
1. Edit `/public/config/languages.json`
2. Add/remove language entries
3. Run sync to update system

---

## 📱 Responsive Breakpoints

```
Mobile:  < 480px   (single column, compact)
Tablet:  480-768px (2 columns, medium padding)
Desktop: > 768px   (3+ columns, full spacing)
```

All pages are fully responsive with:
- Fluid typography (clamp)
- Flexible grids
- Touch-friendly buttons
- Optimized images

---

## ⚡ Performance Tips

1. **First Load**: ~700ms (includes sync)
2. **Page Load**: ~300ms (cached)
3. **API Response**: <100ms (Redis)

### Optimization
- Use Redis for caching
- Lazy load images
- Code splitting enabled
- Compression enabled

---

## 🐛 Troubleshooting

### Problem: Sync Fails
**Solution**:
- Check Redis connection
- Verify file paths exist
- Review error logs
- Check disk space

### Problem: Content Not Showing
**Solution**:
- Verify sync completed
- Check language code
- Ensure file exists in /public
- Clear browser cache

### Problem: Slow Performance
**Solution**:
- Monitor Redis memory
- Check network latency
- Review browser console
- Profile with DevTools

---

## 📚 Documentation

- **DESIGN_UPDATES.md** - UI/UX design details
- **ARCHITECTURE.md** - System architecture
- **API_INTEGRATION_GUIDE.md** - External API integration
- **This file** - Quick reference

---

## 🔐 Environment Variables

```bash
# Required
REDIS_URL=redis://...

# Optional
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
EXTERNAL_API_URL=https://static-api-opal.vercel.app
```

---

## 📦 Dependencies

**Core**:
- Next.js 15.5.9
- React 19
- TypeScript 5

**Database**:
- redis (npm package)

**Dev**:
- @types/node
- @types/react
- typescript
- eslint
- prettier

---

## 🚀 Deployment Checklist

- [ ] Build passes without errors (`npm run build`)
- [ ] All tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Environment variables configured
- [ ] Redis instance available
- [ ] Database backups configured
- [ ] Monitoring enabled
- [ ] CI/CD pipeline set up
- [ ] Domain/SSL configured
- [ ] Performance benchmarked

---

## 📞 Support Resources

**Common Issues**:
- Check error logs first
- Review sync output
- Check network tab
- Look at browser console

**Documentation**:
- Inline code comments
- TypeScript types
- API documentation
- Architecture guide

**External Resources**:
- Next.js docs: https://nextjs.org/docs
- React docs: https://react.dev
- Redis docs: https://redis.io/docs

---

**Version**: 2.0
**Last Updated**: January 6, 2026
**Maintained**: Active Development
