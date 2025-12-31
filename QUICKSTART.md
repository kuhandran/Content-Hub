# 🚀 Quick Start Guide - Portfolio CMS

## Start Server

```bash
npm start
```

Server will be available at: **http://localhost:3001**

## Access Dashboard

Open browser: **http://localhost:3001/cms**

Visual cache management, TTL settings, language selector, and API docs.

## API Quick Reference

### Create Content
```bash
# English
curl -X POST http://localhost:3001/api/v1/en/data/projects.json \
  -H "Content-Type: application/json" \
  -d '{"title":"My Project"}'

# Spanish  
curl -X POST http://localhost:3001/api/v1/es/data/projects.json \
  -H "Content-Type: application/json" \
  -d '{"title":"Mi Proyecto"}'
```

### Get Content (Auto-Cached)
```bash
curl http://localhost:3001/api/v1/en/data/projects.json
```

### Update Content
```bash
# Full update
curl -X POST http://localhost:3001/api/v1/en/data/projects.json \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated"}'

# Partial update (merge)
curl -X PATCH http://localhost:3001/api/v1/en/data/projects.json \
  -H "Content-Type: application/json" \
  -d '{"description":"New description"}'
```

### Delete Content
```bash
curl -X DELETE http://localhost:3001/api/v1/en/data/projects.json
```

## Cache Management

### View Cache Stats
```bash
curl http://localhost:3001/api/cache/stats | jq
```

### Clear Specific Cache
```bash
curl -X POST http://localhost:3001/api/cache/invalidate \
  -H "Content-Type: application/json" \
  -d '{"keys":["collections:en/data/projects.json"]}'
```

### Clear All Cache
```bash
curl -X POST http://localhost:3001/api/cache/clear
```

### Update TTL Settings
```bash
curl -X POST http://localhost:3001/api/cache/ttl \
  -H "Content-Type: application/json" \
  -d '{
    "defaultTTL": 3600000,
    "jsonTTL": 1800000,
    "imageTTL": 7200000,
    "otherTTL": 3600000
  }'
```

## Folder Structure

```
public/collections/
├── en/                 # English
│   ├── config/        # Settings
│   ├── data/          # JSON content
│   ├── image/         # Pictures
│   ├── resume/        # PDFs
│   └── extra/         # Other
├── es/                # Spanish
├── fr/                # French  
└── de/                # German
```

## Languages Supported

- 🇬🇧 English (en)
- 🇪🇸 Spanish (es)
- 🇫🇷 French (fr)
- 🇩🇪 German (de)

Add more by creating new folders in `public/collections/`

## Features

✅ **Hot Reload** - Files update without restart  
✅ **Smart Cache** - Path-specific invalidation  
✅ **Multi-Language** - Ready for Hugging Face translation  
✅ **Dashboard** - Visual cache management  
✅ **RESTful API** - Standard HTTP methods  
✅ **Configurable** - TTL, paths, languages  

## Deployment

Ready for Vercel! Just commit and push:

```bash
git add .
git commit -m "CMS with hot reload and cache"
git push origin main
```

Then deploy to Vercel normally.

## Troubleshooting

**Q: Changes not showing?**  
A: Cache may be serving old data. Clear via dashboard or API.

**Q: Port 3001 in use?**  
A: Set different port: `PORT=3002 npm start`

**Q: File watcher not working?**  
A: Restart server: `npm start`

---

Happy coding! 🎉
