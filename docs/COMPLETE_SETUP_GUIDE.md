# Content Hub - Complete Setup & Usage Guide

## 🎯 What is Content Hub?

Content Hub is a **multilingual content management and API system** that:
1. Stores content in Redis for fast access
2. Provides REST APIs to fetch content
3. Includes an admin panel to manage collections
4. Supports 11 languages automatically
5. Syncs content from your file system to Redis
6. Provides real-time monitoring and statistics

---

## 🚀 Quick Start

### 1. Start the Application
```bash
npm run dev
# Server runs at http://localhost:3000
```

### 2. Access the Admin Panel
```
http://localhost:3000/admin/collections
```

### 3. Trigger Sync
```
Visit /admin/sync and click "Start Sync Now"
Or POST to /api/v1/sync
```

### 4. Fetch Your Content
```bash
# Get all projects in English
curl http://localhost:3000/api/collections/en/data/projects.json

# Get skills in Spanish
curl http://localhost:3000/api/collections/es/data/skills.json
```

---

## 📂 Your Content Structure

Content lives in `/public/collections/` organized by language:

```
/public/collections/
├── en/                          # English
│   ├── config/                  # 3 config files
│   │   ├── apiConfig.json
│   │   ├── pageLayout.json
│   │   └── urlConfig.json
│   └── data/                    # 11 data files
│       ├── achievements.json
│       ├── caseStudies.json
│       ├── education.json
│       ├── experience.json
│       ├── projects.json
│       ├── skills.json
│       └── ... (5 more)
├── es/                          # Spanish
│   ├── config/
│   └── data/
├── fr/                          # French
│   ├── config/
│   └── data/
├── de/                          # German
├── hi/                          # Hindi
├── ta/                          # Tamil
├── ar-AE/                       # Arabic (UAE)
├── my/                          # Malay
├── id/                          # Indonesian
├── si/                          # Sinhala
└── th/                          # Thai
```

**Total:** 11 languages × 14 files = 154 files managed automatically

---

## 🔌 API Endpoints

### Get Your Content
```bash
# List all available content
GET /api/collections

# List files for a language
GET /api/collections/{lang}

# Get specific file
GET /api/collections/{lang}/{folder}/{file}.json

# Examples:
GET /api/collections/en/data/projects.json
GET /api/collections/es/data/skills.json
GET /api/collections/fr/config/apiConfig.json
```

### Admin APIs
```bash
# Get sync status
GET /api/v1/sync-status

# Get Redis statistics
GET /api/v1/redis-stats

# Get system config
GET /api/v1/config

# Trigger sync (requires auth)
POST /api/v1/sync
```

---

## 🎨 Admin Panel Features

### Collections Hub (`/admin/collections`)
- 📊 View statistics (11 languages, 154 total files)
- 🇬🇧 Browse collections by language with country flags
- 📈 See config and data file counts per language
- 🎯 Click to manage individual language collections

### Sync Manager (`/admin/sync`)
- 🔄 Trigger manual content sync
- 📊 Real-time Redis memory monitoring
- 📝 Detailed sync logs with per-file status
- ⚡ Auto-flush Redis before sync (clears old data)
- 📈 View statistics (configs, collections, files, errors)

### Dashboard (`/admin/dashboard`)
- 📊 System overview and stats
- 🔄 Last sync status and timestamp

---

## 🔄 How Sync Works

### Automatic on Startup
```
1. App starts
2. Redis is flushed (cleared)
3. All 154 files are loaded from /public/collections
4. Files are stored in Redis with fast access
5. Admin panel shows results
```

### Manual from Admin Panel
```
1. Visit /admin/sync
2. Click "Start Sync Now"
3. Watch detailed logs in real-time
4. See memory usage updates every 5 seconds
5. View final statistics
```

### Redis Key Pattern
```
cms:file:collections/{lang}/{folder}/{file}.json

Examples:
cms:file:collections/en/data/projects.json
cms:file:collections/es/data/skills.json
cms:file:collections/fr/config/apiConfig.json
```

---

## 💾 Redis Setup

Your Redis instance is configured at:
```
redis-19930.c232.us-east-1-2.ec2.cloud.redislabs.com:19930
Capacity: 30GB
```

### Memory Management
- **Automatic flush before sync**: Clears old data, brings memory to 0%
- **Image storage disabled**: Images served by Next.js, not stored in Redis
- **Efficient caching**: Only JSON configs and data stored, not binary files
- **Memory monitoring**: Real-time stats in admin panel

### Current Usage
- After full sync: ~50-100MB (14 files × 11 languages)
- Max capacity: 30GB
- Safety margin: Plenty of room

---

## 📱 Languages Supported

| Code | Language | Flag | Available |
|------|----------|------|-----------|
| `en` | English | 🇬🇧 | ✅ |
| `es` | Spanish | 🇪🇸 | ✅ |
| `fr` | French | 🇫🇷 | ✅ |
| `de` | German | 🇩🇪 | ✅ |
| `hi` | Hindi | 🇮🇳 | ✅ |
| `ta` | Tamil | 🇮🇳 | ✅ |
| `ar-AE` | Arabic (UAE) | 🇦🇪 | ✅ |
| `my` | Malay | 🇲🇾 | ✅ |
| `id` | Indonesian | 🇮🇩 | ✅ |
| `si` | Sinhala | 🇱🇰 | ✅ |
| `th` | Thai | 🇹🇭 | ✅ |

**To add a new language:**
1. Create folder: `/public/collections/{lang-code}/`
2. Add subfolders: `config/` and `data/`
3. Copy JSON files from existing language
4. Translate content as needed
5. Run sync - automatically picked up!

---

## 🔐 Authentication

### Admin Access
- Protected: `/admin/*` pages
- Login required: `/login`
- Token stored in: `localStorage.adminToken`
- User stored in: `localStorage.adminUser`

### API Access
- **Public APIs** (`/api/collections/*`): No auth needed
- **Admin APIs** (`/api/v1/sync`, `/admin/*`): Token required
- **CORS enabled**: All origins allowed for public endpoints

---

## 📊 Data Examples

### Projects Data
```json
[
  {
    "title": "FWD Insurance React Native App",
    "description": "Enterprise insurance platform...",
    "image": "https://...",
    "techStack": ["React Native", "Redux", "TypeScript"],
    "metrics": "15% efficiency improvement",
    "liveUrl": "https://fwd.com",
    "caseStudySlug": "fwd-insurance-react-native"
  }
]
```

### Skills Data
```json
{
  "frontend": ["React", "TypeScript", "Next.js"],
  "backend": ["Node.js", "Express"],
  "cloud": ["AWS", "Docker"],
  "data": ["Redis", "MongoDB"]
}
```

### Experience Data
```json
[
  {
    "id": 1,
    "company": "Company Name",
    "role": "Senior Developer",
    "duration": "2020 - 2023",
    "description": "...",
    "achievements": ["..."]
  }
]
```

---

## 🛠️ Common Tasks

### Update Content
```bash
1. Edit files in /public/collections/{lang}/{folder}/
2. Visit /admin/sync
3. Click "Start Sync Now"
4. Changes appear in API immediately
```

### Add New Language
```bash
1. Create /public/collections/{new-lang}/config/
2. Create /public/collections/{new-lang}/data/
3. Copy JSON files from existing language
4. Translate content
5. Run sync - automatically detected!
```

### Monitor System
```bash
1. Visit /admin/sync
2. Check Redis Memory Monitor
3. View sync logs for errors
4. Check /api/v1/redis-stats for detailed metrics
```

### Fetch Content in App
```javascript
// Simple fetch
const projects = await fetch(
  '/api/collections/en/data/projects.json'
).then(r => r.json())

// React hook
function useContent(lang, folder, file) {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetch(`/api/collections/${lang}/${folder}/${file}.json`)
      .then(r => r.json())
      .then(setData)
  }, [lang, folder, file])
  return data
}
```

---

## 🚨 Troubleshooting

### API Returns "File not found"
- **Cause**: Content not synced to Redis yet
- **Fix**: Visit `/admin/sync` and click "Start Sync Now"

### Redis Memory > 90%
- **Cause**: Old data accumulating
- **Fix**: Manual sync auto-flushes before syncing (happens automatically)

### Sync Fails with Errors
- **Check**: Admin panel shows detailed error messages
- **Review**: `/api/v1/sync-status` for last sync result
- **Logs**: Check browser console for network errors

### Can't Access Admin Panel
- **Cause**: Not authenticated
- **Fix**: Visit `/login` first, then `/admin/collections`

### API Endpoints Not Responding
- **Check**: Dev server is running (`npm run dev`)
- **Verify**: http://localhost:3000 loads
- **Test**: `curl http://localhost:3000/api/collections`

---

## 📈 Performance Tips

1. **Cache API responses** in your app (5+ minutes)
2. **Use language-specific endpoints** instead of fetching all
3. **Lazy load collections** for large lists
4. **Monitor Redis stats** - scale up if needed
5. **Auto-sync schedule** - set up webhook on content changes

---

## 🔗 Useful Links

- **Admin Collections**: http://localhost:3000/admin/collections
- **Sync Manager**: http://localhost:3000/admin/sync
- **Dashboard**: http://localhost:3000/admin/dashboard
- **API Docs**: See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **API URLs**: See [API_URLS_REFERENCE.md](./API_URLS_REFERENCE.md)
- **Design Guide**: See [DESIGN_DOCUMENTATION.md](./DESIGN_DOCUMENTATION.md)

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | Complete API reference |
| [API_URLS_REFERENCE.md](./API_URLS_REFERENCE.md) | All available URLs |
| [DESIGN_DOCUMENTATION.md](./DESIGN_DOCUMENTATION.md) | UI/UX design guide |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture |

---

## 🎯 Next Steps

1. ✅ Start the dev server: `npm run dev`
2. ✅ Visit admin panel: http://localhost:3000/admin/collections
3. ✅ Run sync: Visit /admin/sync and click "Start Sync Now"
4. ✅ Test API: `curl http://localhost:3000/api/collections/en/data/projects.json`
5. ✅ Integrate into app using the API URLs
6. ✅ Monitor stats in admin panel
7. ✅ Set up auto-sync for content updates

---

## 💡 Tips & Tricks

- **Real-time sync logs**: Watch detailed progress in admin panel
- **Multi-language support**: Automatically detected from folder structure
- **CORS enabled**: Use API from any frontend
- **Memory efficient**: Automatic flush before sync keeps space clean
- **Fast access**: Content cached in Redis for microsecond lookups

---

## 🚀 You're All Set!

Your Content Hub is ready to:
- 📚 Manage 11 language collections
- 🔌 Serve content via REST APIs
- 📊 Monitor Redis performance
- 🎛️ Control everything from admin panel
- ⚡ Auto-detect new languages and files

**Start building!** 🎉
