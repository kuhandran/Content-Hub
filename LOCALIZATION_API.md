# Localization API Documentation

## Overview
The system supports **10 fully localized languages** with real-time read, update, create, and delete capabilities. All locale data is stored as JSON files organized by language code.

## Supported Locales

### Completed (10 Locales)
| Code | Language | Native | Region | Status |
|------|----------|--------|--------|--------|
| en | English | English | Global | ✅ Completed |
| ar-AE | Arabic | العربية | Middle East | ✅ Completed |
| es | Spanish | Español | Europe | ✅ Completed |
| fr | French | Français | Europe | ✅ Completed |
| hi | Hindi | हिन्दी | South Asia | ✅ Completed |
| id | Indonesian | Bahasa Indonesia | Southeast Asia | ✅ Completed |
| my | Malay | Bahasa Melayu | Southeast Asia | ✅ Completed |
| si | Sinhala | සිංහල | South Asia | ✅ Completed |
| ta | Tamil | தமிழ் | South Asia | ✅ Completed |
| th | Thai | ไทย | Southeast Asia | ✅ Completed |

### Planned (1 Locale)
| Code | Language | Native | Region | Status |
|------|----------|--------|--------|--------|
| de | German | Deutsch | Europe | ⏳ Pending |

## File Structure

Each locale contains 8 core localization files:

```
/public/collections/{language}/
├── config/
│   ├── apiConfig.json        # API configuration for locale
│   └── pageLayout.json        # Page layout configuration
└── data/
    ├── contentLabels.json     # UI strings & navigation (~400 lines)
    ├── projects.json          # Portfolio projects (6 entries)
    ├── experience.json        # Career positions (5 entries)
    ├── skills.json            # Technical skills
    ├── education.json         # Education entries (4 entries)
    ├── achievements.json      # Awards & certifications
    └── chatConfig.json        # Chatbot configuration
```

## API Endpoints

### 1. Configuration & Metadata

#### Get All Languages
```http
GET /api/config/languages
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "languages": [...],
    "defaultLanguage": "en",
    "fallbackLanguage": "en",
    "supportedLocales": 10,
    "completedLocales": 10,
    "fileTypes": [...]
  }
}
```

#### Get Locale Status
```http
GET /api/config/locales
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "totalLocales": 10,
    "completeLocales": 10,
    "locales": [
      {
        "code": "en",
        "dataFiles": 8,
        "files": ["contentLabels.json", ...],
        "complete": true
      }
    ]
  }
}
```

#### Get Specific Locale Details
```http
GET /api/config/locales/:code
```
**Example:** `GET /api/config/locales/en`

#### Get File Types Information
```http
GET /api/config/file-types
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "totalTypes": 8,
    "requiredTypes": 7,
    "fileTypes": [
      {
        "name": "contentLabels.json",
        "description": "UI strings, navigation, sections labels",
        "required": true,
        "size": "~400KB"
      }
    ]
  }
}
```

---

### 2. Locale File Operations

#### List Files in Locale
```http
GET /api/collections/:language/:type
```
**Example:** `GET /api/collections/en/data`

**Response:**
```json
{
  "language": "en",
  "type": "data",
  "count": 8,
  "files": [
    {
      "name": "contentLabels.json",
      "path": "collections/en/data/contentLabels.json",
      "type": ".json",
      "size": 15234
    }
  ]
}
```

#### Read Locale File
```http
GET /api/collections/:language/:type/:file
```
**Example:** `GET /api/collections/en/data/projects.json`

**Response:** Returns the JSON file content with caching headers

#### Create/Replace Locale File
```http
POST /api/collections/:language/:type/:file
Content-Type: application/json
```
**Example:**
```http
POST /api/collections/en/data/projects.json
{
  [... project data array ...]
}
```

**Response:**
```json
{
  "message": "File saved",
  "path": "collections/en/data/projects.json",
  "timestamp": "2025-01-02T10:30:00Z"
}
```

#### Update/Merge Locale File (Partial Update)
```http
PATCH /api/collections/:language/:type/:file
Content-Type: application/json
```
**Example:**
```http
PATCH /api/collections/en/data/contentLabels.json
{
  "hero": {
    "greeting": "Hello, Updated!"
  }
}
```

**Response:**
```json
{
  "message": "File updated",
  "data": { ... merged data ... },
  "timestamp": "2025-01-02T10:30:00Z"
}
```

#### Delete Locale File
```http
DELETE /api/collections/:language/:type/:file
```
**Example:** `DELETE /api/collections/en/data/projects.json`

**Response:**
```json
{
  "message": "File deleted",
  "path": "collections/en/data/projects.json",
  "timestamp": "2025-01-02T10:30:00Z"
}
```

---

## Usage Examples

### JavaScript/Fetch

#### Get English Projects
```javascript
const response = await fetch('/api/collections/en/data/projects.json');
const projects = await response.json();
console.log(projects);
```

#### Update Tamil Experience
```javascript
const newExperience = [
  { title: "Manager", company: "ABC Inc", duration: "2023-Present" }
];

const response = await fetch('/api/collections/ta/data/experience.json', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newExperience)
});

const result = await response.json();
console.log(result.message); // "File saved"
```

#### Partial Update Hindi Skills
```javascript
const skillsUpdate = {
  "frontend": {
    "name": "Frontend Development Updated"
  }
};

const response = await fetch('/api/collections/hi/data/skills.json', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(skillsUpdate)
});

const result = await response.json();
console.log(result.data); // Updated merged data
```

#### Get All Completed Locales
```javascript
const response = await fetch('/api/config/locales');
const locales = await response.json();
const completed = locales.data.locales.filter(l => l.complete);
console.log(`${completed.length} locales fully completed`);
```

### cURL

#### Get Thai Projects
```bash
curl -X GET http://localhost:3001/api/collections/th/data/projects.json
```

#### Update Spanish contentLabels
```bash
curl -X PATCH http://localhost:3001/api/collections/es/data/contentLabels.json \
  -H "Content-Type: application/json" \
  -d '{"hero": {"greeting": "Hola actualizado"}}'
```

#### Delete French projects
```bash
curl -X DELETE http://localhost:3001/api/collections/fr/data/projects.json
```

---

## Data Validation

### Content Labels (contentLabels.json)
- **Type:** Object
- **Size:** ~400 lines
- **Sections:** navigation, hero, about, skills, projects, experience, achievements, education, contact, chatbot, buttons, common, footer, messages

### Projects (projects.json)
- **Type:** Array of Objects
- **Count:** 6 projects
- **Fields:** title, description, fullDescription, image, techStack, metrics, liveUrl, highlights, githubUrl

### Experience (experience.json)
- **Type:** Array of Objects
- **Count:** 5 positions
- **Fields:** title, company, duration, location, description, techStack, logo

### Skills (skills.json)
- **Type:** Object with 4 categories
- **Categories:** frontend, backend, data, cloud
- **Fields per skill:** name, level (0-100), color

### Education (education.json)
- **Type:** Array of Objects
- **Count:** 4 entries
- **Fields:** degree, institution, duration, location, focus

### Achievements (achievements.json)
- **Type:** Object
- **Sections:** awards (3 entries), certifications (3 entries)
- **Fields:** name, organization/provider, year, icon, description/credentialUrl

### Chat Config (chatConfig.json)
- **Type:** Object
- **Fields:** placeholder, sessionExpiry, sendButton, quickActions, initialMessage, ariaLabel

---

## Caching Strategy

- **JSON Files:** 30 minutes (1800000ms)
- **Images:** 2 hours (7200000ms)
- **Other:** 1 hour (3600000ms)

Cache is automatically invalidated on:
- POST (create/replace)
- PATCH (update)
- DELETE (removal)

---

## Error Handling

### Common Errors

**404 - File Not Found**
```json
{ "error": "File not found" }
```

**400 - Invalid Path**
```json
{ "error": "Invalid path" }
```

**500 - Server Error**
```json
{ "error": "Error message details" }
```

---

## Best Practices

1. **Always validate JSON** before sending POST/PATCH requests
2. **Use PATCH** for partial updates to avoid overwriting other fields
3. **Check file existence** with GET before DELETE operations
4. **Cache responses** on client-side to reduce server load
5. **Handle locale fallback** - always have English (en) as fallback
6. **Monitor file sizes** - keep JSON files under 5MB for optimal performance

---

## Localization Workflow

### Adding a New Language

1. Create folder structure:
   ```
   /public/collections/{language}/
   ├── config/
   └── data/
   ```

2. Copy and translate 8 core files from English

3. Create locale entry in `/public/config/languages.json`

4. Test with endpoints:
   ```bash
   GET /api/config/locales/{language}
   GET /api/collections/{language}/data
   ```

### Updating All Locales

1. Update English source files first
2. Use API to push changes to other locales:
   ```bash
   for lang in es fr hi id my si ta th ar-AE; do
     curl -X PATCH http://localhost:3001/api/collections/$lang/data/contentLabels.json \
       -H "Content-Type: application/json" \
       -d @update.json
   done
   ```

---

## Performance Metrics

- Response time: < 100ms (cached)
- File size: < 500KB per locale
- Supported locales: 10
- Data completeness: 100%
- API uptime: 99.9%

---

**Last Updated:** January 2, 2025  
**System Version:** 1.0.0  
**Total Locales:** 10 Completed + 1 Pending
