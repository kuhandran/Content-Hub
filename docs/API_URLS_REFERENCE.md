# Content Hub - Complete API URLs Reference

## 🚀 Quick Reference

All endpoints are accessible at your Content Hub instance:
- **Development**: `http://localhost:3000`
- **Production**: Your deployment URL

---

## 📋 Collections API URLs

### 1. Browse All Collections
```
GET /api/collections
```

**Usage:**
```bash
curl http://localhost:3000/api/collections
```

**Returns:** All 154 files across 11 languages, organized by language and folder

---

### 2. Language Specific Collections

#### English (en)
```
GET /api/collections/en
```

#### Spanish (es)
```
GET /api/collections/es
```

#### French (fr)
```
GET /api/collections/fr
```

#### German (de)
```
GET /api/collections/de
```

#### Hindi (hi)
```
GET /api/collections/hi
```

#### Tamil (ta)
```
GET /api/collections/ta
```

#### Arabic - UAE (ar-AE)
```
GET /api/collections/ar-AE
```

#### Malay (my)
```
GET /api/collections/my
```

#### Indonesian (id)
```
GET /api/collections/id
```

#### Sinhala (si)
```
GET /api/collections/si
```

#### Thai (th)
```
GET /api/collections/th
```

---

## 📄 Content File URLs

### Projects Data
```
GET /api/collections/en/data/projects.json
GET /api/collections/es/data/projects.json
GET /api/collections/fr/data/projects.json
GET /api/collections/de/data/projects.json
GET /api/collections/hi/data/projects.json
GET /api/collections/ta/data/projects.json
GET /api/collections/ar-AE/data/projects.json
GET /api/collections/my/data/projects.json
GET /api/collections/id/data/projects.json
GET /api/collections/si/data/projects.json
GET /api/collections/th/data/projects.json
```

**Example:**
```bash
curl http://localhost:3000/api/collections/en/data/projects.json
```

---

### Skills Data
```
GET /api/collections/{lang}/data/skills.json
```

**All Languages:**
```
http://localhost:3000/api/collections/en/data/skills.json
http://localhost:3000/api/collections/es/data/skills.json
http://localhost:3000/api/collections/fr/data/skills.json
http://localhost:3000/api/collections/de/data/skills.json
http://localhost:3000/api/collections/hi/data/skills.json
http://localhost:3000/api/collections/ta/data/skills.json
http://localhost:3000/api/collections/ar-AE/data/skills.json
http://localhost:3000/api/collections/my/data/skills.json
http://localhost:3000/api/collections/id/data/skills.json
http://localhost:3000/api/collections/si/data/skills.json
http://localhost:3000/api/collections/th/data/skills.json
```

---

### Experience Data
```
GET /api/collections/{lang}/data/experience.json
```

**All Languages:**
```
http://localhost:3000/api/collections/en/data/experience.json
http://localhost:3000/api/collections/es/data/experience.json
http://localhost:3000/api/collections/fr/data/experience.json
... (repeat for all languages)
```

---

### Education Data
```
GET /api/collections/{lang}/data/education.json
```

**All Languages:**
```
http://localhost:3000/api/collections/en/data/education.json
http://localhost:3000/api/collections/es/data/education.json
... (repeat for all languages)
```

---

### Achievements Data
```
GET /api/collections/{lang}/data/achievements.json
```

**All Languages:**
```
http://localhost:3000/api/collections/en/data/achievements.json
http://localhost:3000/api/collections/es/data/achievements.json
... (repeat for all languages)
```

---

### Case Studies Data
```
GET /api/collections/{lang}/data/caseStudies.json
GET /api/collections/{lang}/data/caseStudiesTranslations.json
```

**All Languages:**
```
http://localhost:3000/api/collections/en/data/caseStudies.json
http://localhost:3000/api/collections/en/data/caseStudiesTranslations.json
... (repeat for all languages)
```

---

### Content Labels
```
GET /api/collections/{lang}/data/contentLabels.json
GET /api/collections/{lang}/data/defaultContentLabels.json
```

**All Languages:**
```
http://localhost:3000/api/collections/en/data/contentLabels.json
http://localhost:3000/api/collections/en/data/defaultContentLabels.json
... (repeat for all languages)
```

---

### Configuration Data
```
GET /api/collections/{lang}/data/chatConfig.json
GET /api/collections/{lang}/data/errorMessages.json
```

**All Languages:**
```
http://localhost:3000/api/collections/en/data/chatConfig.json
http://localhost:3000/api/collections/en/data/errorMessages.json
... (repeat for all languages)
```

---

## ⚙️ Config Files

### API Config
```
GET /api/collections/{lang}/config/apiConfig.json
```

**All Languages:**
```
http://localhost:3000/api/collections/en/config/apiConfig.json
http://localhost:3000/api/collections/es/config/apiConfig.json
http://localhost:3000/api/collections/fr/config/apiConfig.json
... (repeat for all languages)
```

---

### Page Layout Config
```
GET /api/collections/{lang}/config/pageLayout.json
```

**All Languages:**
```
http://localhost:3000/api/collections/en/config/pageLayout.json
http://localhost:3000/api/collections/es/config/pageLayout.json
... (repeat for all languages)
```

---

### URL Config
```
GET /api/collections/{lang}/config/urlConfig.json
```

**All Languages:**
```
http://localhost:3000/api/collections/en/config/urlConfig.json
http://localhost:3000/api/collections/es/config/urlConfig.json
... (repeat for all languages)
```

---

## 🔧 Admin & System APIs

### Collections List (All)
```
GET /api/collections
```

### Collections by Language
```
GET /api/collections/{lang}
```

### Sync Status
```
GET /api/v1/sync-status
```

### Redis Statistics
```
GET /api/v1/redis-stats
```

### System Configuration
```
GET /api/v1/config
```

### Manual Sync (POST - requires auth)
```
POST /api/v1/sync
```

---

## 🎯 Usage Examples

### JavaScript Fetch
```javascript
// Get English projects
const response = await fetch(
  'http://localhost:3000/api/collections/en/data/projects.json'
)
const projects = await response.json()
console.log(projects)

// Get all available collections
const collections = await fetch(
  'http://localhost:3000/api/collections'
).then(r => r.json())
console.log(collections.languages)
```

### React Component
```jsx
import { useEffect, useState } from 'react'

export default function Projects() {
  const [projects, setProjects] = useState([])

  useEffect(() => {
    fetch('/api/collections/en/data/projects.json')
      .then(r => r.json())
      .then(setProjects)
  }, [])

  return (
    <div>
      {projects.map(p => (
        <div key={p.title}>{p.title}</div>
      ))}
    </div>
  )
}
```

### cURL Commands
```bash
# List all collections
curl http://localhost:3000/api/collections

# Get English projects
curl http://localhost:3000/api/collections/en/data/projects.json

# Get Spanish skills
curl http://localhost:3000/api/collections/es/data/skills.json

# Pretty print JSON
curl http://localhost:3000/api/collections/en/data/projects.json | jq .
```

### Node.js
```javascript
const fetch = require('node-fetch')

async function getProjects(lang = 'en') {
  const url = `http://localhost:3000/api/collections/${lang}/data/projects.json`
  const response = await fetch(url)
  return await response.json()
}

getProjects('en').then(console.log)
```

---

## 📊 Response Examples

### Projects Response
```json
[
  {
    "title": "Project Name",
    "description": "Project description",
    "image": "https://...",
    "techStack": ["React", "Node.js"],
    "metrics": "Performance improvement",
    "liveUrl": "https://...",
    "caseStudySlug": "slug"
  }
]
```

### Skills Response
```json
{
  "frontend": [
    "React",
    "TypeScript",
    "Next.js"
  ],
  "backend": [
    "Node.js",
    "Express"
  ],
  "cloud": [
    "AWS",
    "Docker"
  ],
  "data": [
    "Redis",
    "MongoDB"
  ]
}
```

### Collections List Response
```json
{
  "total_files": 154,
  "languages": ["en", "es", "fr", ...],
  "collections": {
    "en": {
      "config": ["apiConfig", "pageLayout", "urlConfig"],
      "data": ["achievements", "caseStudies", ...]
    }
  }
}
```

---

## ✅ Verification Checklist

Use these URLs to verify your Content Hub is working:

- [ ] `GET /api/collections` - Lists all content
- [ ] `GET /api/collections/en` - Lists English content
- [ ] `GET /api/collections/en/data/projects.json` - Gets projects
- [ ] `GET /api/collections/en/data/skills.json` - Gets skills
- [ ] `GET /api/collections/es/data/projects.json` - Gets Spanish projects
- [ ] `GET /api/v1/sync-status` - Check last sync
- [ ] `GET /api/v1/redis-stats` - Check Redis status

---

## 🔐 Security Notes

- Collection endpoints (`/api/collections/*`) are **public** and CORS-enabled
- Admin endpoints (`/api/v1/sync`, `/admin/*`) require **authentication**
- All responses are cached for 1 hour: `Cache-Control: public, max-age=3600`
- Requests from any origin are allowed: `Access-Control-Allow-Origin: *`

---

## 🚀 Next Steps

1. **Test all URLs** using the examples above
2. **Integrate into your app** using the fetch examples
3. **Set up CI/CD** to auto-sync when content changes
4. **Monitor Redis** using the stats endpoint
5. **Translate content** by creating files in new language folders

---

## 📞 Support

For issues or questions:
1. Check [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
2. View logs: `/admin/sync`
3. Check Redis stats: `/api/v1/redis-stats`
4. Review system config: `/api/v1/config`
