# Content Hub API Documentation

## 🔌 Available API Endpoints

### Collections API

#### 1. List All Collections
```
GET /api/collections
```

**Response:**
```json
{
  "total_files": 154,
  "languages": ["en", "es", "fr", "de", "hi", "ta", "ar-AE", "my", "id", "si", "th"],
  "collections": {
    "en": {
      "config": ["apiConfig", "pageLayout", "urlConfig"],
      "data": ["achievements", "caseStudies", "education", "experience", "projects", "skills", ...]
    },
    "es": { ... }
  }
}
```

---

#### 2. List Files for a Language
```
GET /api/collections/{lang}
```

**Parameters:**
- `lang` (string): Language code (e.g., `en`, `es`, `fr`, `de`, `hi`, `ta`, `ar-AE`, `my`, `id`, `si`, `th`)

**Example:**
```
GET /api/collections/en
```

**Response:**
```json
{
  "language": "en",
  "total_files": 14,
  "config": {
    "count": 3,
    "files": ["apiConfig", "pageLayout", "urlConfig"]
  },
  "data": {
    "count": 11,
    "files": ["achievements", "caseStudies", "caseStudiesTranslations", "chatConfig", "contentLabels", ...]
  }
}
```

---

#### 3. Get a Specific File
```
GET /api/collections/{lang}/{folder}/{file}.json
```

**Parameters:**
- `lang` (string): Language code
- `folder` (string): Either `config` or `data`
- `file` (string): File name without extension

**Examples:**

```
# Get English projects
GET /api/collections/en/data/projects.json

# Get Spanish skills
GET /api/collections/es/data/skills.json

# Get French API configuration
GET /api/collections/fr/config/apiConfig.json

# Get German education data
GET /api/collections/de/data/education.json
```

**Response (example for projects):**
```json
{
  "projects": [
    {
      "id": 1,
      "title": "Project Name",
      "description": "Project description",
      "technologies": ["React", "Next.js", "TypeScript"],
      "link": "https://example.com",
      "github": "https://github.com/user/repo",
      "image": "/images/project.jpg",
      "featured": true
    }
  ]
}
```

---

### Available Data Files

#### Config Files (per language)
- `apiConfig.json` - API routing configuration
- `pageLayout.json` - Page layout settings
- `urlConfig.json` - URL configuration

#### Data Files (per language)
- `achievements.json` - Achievements and awards
- `caseStudies.json` - Case studies
- `caseStudiesTranslations.json` - Case study translations
- `chatConfig.json` - Chat configuration
- `contentLabels.json` - Content labels
- `defaultContentLabels.json` - Default content labels
- `education.json` - Education history
- `errorMessages.json` - Error messages
- `experience.json` - Experience history
- `projects.json` - Portfolio projects
- `skills.json` - Skills list

---

### Languages Supported

| Code | Language | Flag |
|------|----------|------|
| `en` | English | 🇬🇧 |
| `es` | Spanish | 🇪🇸 |
| `fr` | French | 🇫🇷 |
| `de` | German | 🇩🇪 |
| `hi` | Hindi | 🇮🇳 |
| `ta` | Tamil | 🇮🇳 |
| `ar-AE` | Arabic (UAE) | 🇦🇪 |
| `my` | Malay | 🇲🇾 |
| `id` | Indonesian | 🇮🇩 |
| `si` | Sinhala | 🇱🇰 |
| `th` | Thai | 🇹🇭 |

---

## 📝 Usage Examples

### JavaScript/TypeScript

```typescript
// Fetch projects for English
const response = await fetch('/api/collections/en/data/projects.json')
const data = await response.json()
console.log(data.projects)

// Fetch all available collections
const collectionsResponse = await fetch('/api/collections')
const collections = await collectionsResponse.json()
console.log(collections.languages) // ['en', 'es', 'fr', ...]

// Fetch files for specific language
const langResponse = await fetch('/api/collections/es')
const langData = await langResponse.json()
console.log(langData.data.files) // ['achievements', 'caseStudies', ...]
```

### React Hook

```typescript
function useCollectionData(lang: string, folder: 'config' | 'data', file: string) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`/api/collections/${lang}/${folder}/${file}.json`)
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [lang, folder, file])

  return { data, loading, error }
}

// Usage
const { data: projects } = useCollectionData('en', 'data', 'projects')
```

### React Component

```tsx
export default function ProjectsPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/collections/en/data/projects.json')
      .then(res => res.json())
      .then(data => {
        setProjects(data.projects || [])
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div className="projects">
      {projects.map(project => (
        <div key={project.id} className="project-card">
          <h3>{project.title}</h3>
          <p>{project.description}</p>
          <div className="tech-stack">
            {project.technologies.map(tech => (
              <span key={tech}>{tech}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

---

## 🔄 Sync and Admin APIs

### Sync Management
```
POST /api/v1/sync
```
Trigger manual sync from public folder to Redis. Requires authentication.

### Redis Statistics
```
GET /api/v1/redis-stats
```
Get current Redis memory usage and statistics.

### Sync Status
```
GET /api/v1/sync-status
```
Get last sync result and statistics.

### Config
```
GET /api/v1/config
```
Get system configuration and languages list.

---

## ✅ CORS Support

All collection endpoints support CORS with:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, OPTIONS`
- `Cache-Control: public, max-age=3600`

---

## 🚀 Quick Start

1. **Get all available content:**
   ```bash
   curl http://localhost:3000/api/collections
   ```

2. **Get specific language files:**
   ```bash
   curl http://localhost:3000/api/collections/en
   ```

3. **Get specific content:**
   ```bash
   curl http://localhost:3000/api/collections/en/data/projects.json
   ```

4. **Use in your application:**
   ```javascript
   const projects = await fetch(
     'http://localhost:3000/api/collections/en/data/projects.json'
   ).then(r => r.json())
   ```

---

## 🛠️ Development

All endpoints are automatically generated from your content structure in `/public/collections/`.

To add new content:
1. Create files in `/public/collections/{lang}/{config|data}/`
2. Run sync from admin panel (`/admin/sync`)
3. Access via API endpoints

---

## 📊 Response Headers

All responses include:
- `Content-Type: application/json`
- `Cache-Control: public, max-age=3600`
- `Access-Control-Allow-Origin: *`

---

## ❌ Error Responses

### 404 - File Not Found
```json
{
  "error": "File not found",
  "details": "Could not find projects.json in en/data",
  "redisKey": "cms:file:collections/en/data/projects.json",
  "suggestion": "Make sure to run sync first to populate Redis"
}
```

### 400 - Bad Request
```json
{
  "error": "Missing required parameters: lang, folder, file"
}
```

### 500 - Server Error
```json
{
  "error": "Internal server error",
  "details": "Error message here"
}
```

---

## 🔐 Authentication

Collection endpoints are public by default. Admin endpoints (`/api/v1/sync`, `/admin/*`) require authentication via `adminToken` in localStorage.

---

## 📚 Related Documentation

- [Design Documentation](./DESIGN_DOCUMENTATION.md)
- [System Architecture](./ARCHITECTURE.md)
- [Content Loader](./lib/external-content-loader.ts)
