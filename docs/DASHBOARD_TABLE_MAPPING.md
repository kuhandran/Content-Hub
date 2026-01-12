# 📊 Dashboard Table Mapping & Architecture

## System Overview

This document shows how the **Pumpdata API** maps file system content to database tables and how those tables power the dashboard.

---

## 🗂️ Public Folder Structure → Database Tables

### Visual Mapping

```
/public (Root Directory)
│
├── collections/                 ──→ TABLE: collections
│   ├── en/
│   │   ├── config/             (lang='en', type='config')
│   │   │   ├── apiConfig.json
│   │   │   ├── pageLayout.json
│   │   │   └── urlConfig.json
│   │   └── data/               (lang='en', type='data')
│   │       ├── achievements.json
│   │       ├── caseStudies.json
│   │       └── skills.json
│   ├── fr/
│   │   ├── config/             (lang='fr', type='config')
│   │   └── data/               (lang='fr', type='data')
│   ├── de/
│   │   ├── config/             (lang='de', type='config')
│   │   └── data/               (lang='de', type='data')
│   └── [11 more languages...]
│
├── config/                      ──→ TABLE: config_files
│   ├── apiRouting.json
│   ├── languages.json
│   ├── pageLayout.json
│   └── urlConfig.json
│
├── data/                        ──→ TABLE: data_files
│   ├── achievements.json
│   ├── caseStudies.json
│   ├── education.json
│   ├── experience.json
│   ├── projects.json
│   ├── skills.json
│   └── errorMessages.json
│
├── files/                       ──→ TABLE: static_files
│   ├── browserconfig.xml
│   ├── manifest.json
│   ├── offline.html
│   ├── privacy-policy.html
│   ├── robots.txt
│   ├── sitemap.xml
│   └── terms-of-service.html
│
├── image/                       ──→ TABLE: images
│   ├── logo.png
│   ├── favicon.ico
│   └── [other images...]
│
├── js/                          ──→ TABLE: javascript_files
│   └── apiRouter.js
│
└── resume/                      ──→ TABLE: resumes
    └── resume.pdf
```

---

## 📋 Database Table Schemas

### 1. **collections** (Multi-Language Content)

```sql
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lang VARCHAR(10) NOT NULL,        -- 'en', 'fr', 'de', 'es', 'hi', 'id', 'my', 'pt', 'si', 'ta', 'th', 'zh', 'ar-ae'
  type VARCHAR(20) NOT NULL,        -- 'config' or 'data'
  filename VARCHAR(255) NOT NULL,   -- 'apiConfig', 'achievements', etc (without extension)
  file_content JSONB NOT NULL,      -- Actual JSON content
  file_hash VARCHAR(64),            -- SHA256 hash for change detection
  synced_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(lang, type, filename)      -- Prevent duplicates per language
);

CREATE INDEX idx_collections_lang ON collections(lang);
```

**Example Records:**
```
id | lang | type   | filename      | file_content
---|------|--------|---------------|------------------------
a1 | en   | config | apiConfig     | { "baseUrl": "...", ... }
a2 | en   | config | pageLayout    | { "header": {...}, ... }
a3 | en   | data   | achievements  | [ {...}, {...}, ... ]
a4 | fr   | config | apiConfig     | { "baseUrl": "...", ... }
a5 | fr   | data   | achievements  | [ {...}, {...}, ... ]
b1 | de   | config | apiConfig     | { "baseUrl": "...", ... }
```

---

### 2. **config_files** (Global Configuration)

```sql
CREATE TABLE config_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL UNIQUE,  -- 'apiRouting', 'languages', 'pageLayout'
  file_type VARCHAR(50),                  -- 'json', 'xml'
  file_content JSONB NOT NULL,            -- Parsed JSON
  file_hash VARCHAR(64),
  synced_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_config_files_filename ON config_files(filename);
```

**Example Records:**
```
id | filename     | file_type | file_content
---|--------------|-----------|---------------------------
c1 | apiRouting   | json      | { "v1": { "...": "..." } }
c2 | languages    | json      | { "en": "English", ... }
c3 | pageLayout   | json      | { "header": {...}, ... }
c4 | urlConfig    | json      | { "baseUrl": "...", ... }
```

**Used By Dashboard:**
- Language selector (from languages.json)
- API routing configuration
- Page layout templates
- URL mappings

---

### 3. **data_files** (Global Data)

```sql
CREATE TABLE data_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL UNIQUE,
  file_type VARCHAR(50),              -- 'json'
  file_content JSONB NOT NULL,        -- Parsed JSON
  file_hash VARCHAR(64),
  synced_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_data_files_filename ON data_files(filename);
```

**Example Records:**
```
id | filename            | file_type | file_content
---|---------------------|-----------|-----------------------------------
d1 | achievements        | json      | [ {...}, {...}, ... ]
d2 | caseStudies         | json      | [ {...}, {...}, ... ]
d3 | caseStudiesTranslations | json | { "en": {...}, "fr": {...} }
d4 | education           | json      | [ {...}, {...}, ... ]
d5 | experience          | json      | [ {...}, {...}, ... ]
d6 | projects            | json      | [ {...}, {...}, ... ]
d7 | skills              | json      | [ {...}, {...}, ... ]
d8 | contentLabels       | json      | { "achievement": "Achievement", ... }
d9 | errorMessages       | json      | { "404": "Not Found", ... }
```

**Used By Dashboard:**
- Portfolio data display
- Project showcase
- Education/Experience listing
- Skills display
- Error message mapping

---

### 4. **static_files** (HTML, XML, Text Content)

```sql
CREATE TABLE static_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL UNIQUE,
  file_type VARCHAR(50),              -- 'html', 'xml', 'txt'
  file_content TEXT NOT NULL,         -- NOT PARSED (plain text)
  file_hash VARCHAR(64),
  synced_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_static_files_filename ON static_files(filename);
```

**Example Records:**
```
id | filename          | file_type | file_content
---|-------------------|-----------|-------------------------------
s1 | offline           | html      | <!DOCTYPE html>...
s2 | privacy-policy    | html      | <html>...</html>
s3 | terms-of-service  | html      | <html>...</html>
s4 | browserconfig     | xml       | <?xml version="1.0"?>...
s5 | manifest          | json      | { "name": "...", ... }
s6 | robots            | txt       | User-agent: *...
s7 | sitemap           | xml       | <?xml version="1.0"?>...
```

---

### 5. **images** (Image Files)

```sql
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL UNIQUE,  -- 'logo', 'favicon'
  file_path VARCHAR(512),                 -- Full relative path 'image/logo.png'
  mime_type VARCHAR(50),                  -- 'image/png', 'image/jpeg', 'image/svg+xml'
  file_hash VARCHAR(64),
  synced_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_images_filename ON images(filename);
```

**Example Records:**
```
id | filename | file_path           | mime_type
---|----------|---------------------|-------------------
i1 | logo     | image/logo.png      | image/png
i2 | favicon  | image/favicon.ico   | image/x-icon
i3 | og-image | image/og-image.jpg  | image/jpeg
```

---

### 6. **javascript_files** (JavaScript Code)

```sql
CREATE TABLE javascript_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL UNIQUE,
  file_path VARCHAR(512),                 -- 'js/apiRouter.js'
  file_content TEXT NOT NULL,             -- Raw JavaScript (NOT PARSED)
  file_hash VARCHAR(64),
  synced_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_javascript_files_filename ON javascript_files(filename);
```

**Example Records:**
```
id | filename   | file_path      | file_content
---|------------|----------------|-------------------
j1 | apiRouter  | js/apiRouter.js| // Router logic...
```

---

### 7. **resumes** (Resume Files)

```sql
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL UNIQUE,
  file_type VARCHAR(50),                  -- 'pdf', 'docx'
  file_path VARCHAR(512),                 -- 'resume/resume.pdf'
  file_hash VARCHAR(64),
  synced_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_resumes_filename ON resumes(filename);
```

**Example Records:**
```
id | filename | file_type | file_path        | file_hash
---|----------|-----------|------------------|-----------
r1 | resume   | pdf       | resume/resume.pdf | abc123...
r2 | cv       | docx      | resume/cv.docx   | def456...
```

---

### 8. **sync_manifest** (Track Changes)

```sql
CREATE TABLE sync_manifest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path VARCHAR(512) NOT NULL UNIQUE,     -- 'collections/en/config/apiConfig.json'
  file_hash VARCHAR(64),                      -- SHA256 hash at last sync
  table_name VARCHAR(50),                     -- Which table it's in
  last_synced TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_sync_manifest_path ON sync_manifest(file_path);
```

**Example Records:**
```
id | file_path                                  | file_hash | table_name
---|--------------------------------------------|-----------|-----------------
m1 | collections/en/config/apiConfig.json      | abc123... | collections
m2 | collections/en/data/achievements.json     | def456... | collections
m3 | config/pageLayout.json                    | ghi789... | config_files
m4 | data/achievements.json                    | jkl012... | data_files
m5 | image/logo.png                            | mno345... | images
```

---

## 🔄 Data Flow: File → Table → Dashboard

### Path 1: Collections (Multi-Language)
```
File Path: public/collections/en/config/apiConfig.json
    ↓
scanPublicFolder() reads file
    ↓
mapFileToTable() → 'collections'
    ↓
Extract: lang='en', type='config', filename='apiConfig'
    ↓
Parse JSON content
    ↓
INSERT INTO collections (lang, type, filename, file_content, ...)
    ↓
Dashboard queries: SELECT * FROM collections WHERE lang='en' AND type='config'
    ↓
Display in UI
```

### Path 2: Config Files (Global)
```
File Path: public/config/languages.json
    ↓
scanPublicFolder() reads file
    ↓
mapFileToTable() → 'config_files'
    ↓
Extract: filename='languages'
    ↓
Parse JSON content
    ↓
INSERT INTO config_files (filename, file_content, ...)
    ↓
Dashboard queries: SELECT file_content FROM config_files WHERE filename='languages'
    ↓
Populate language dropdown
```

### Path 3: Images (Stored Path, Not Content)
```
File Path: public/image/logo.png
    ↓
scanPublicFolder() reads metadata only
    ↓
mapFileToTable() → 'images'
    ↓
Extract: filename='logo', path='image/logo.png', mime_type='image/png'
    ↓
INSERT INTO images (filename, file_path, mime_type, ...)
    ↓
Dashboard queries: SELECT file_path FROM images WHERE filename='logo'
    ↓
Render <img src="/image/logo.png" />
```

---

## 📊 Query Examples for Dashboard

### Query 1: Get All English Configuration
```sql
SELECT filename, file_content 
FROM collections 
WHERE lang='en' AND type='config';

-- Returns: apiConfig, chatConfig, pageLayout, urlConfig, etc
-- Used by: Dashboard layout, API routing
```

### Query 2: Get Specific Language Data
```sql
SELECT file_content 
FROM collections 
WHERE lang='fr' AND type='data' AND filename='achievements';

-- Returns: French achievements for display
-- Used by: Portfolio page (French version)
```

### Query 3: Get Global Configuration
```sql
SELECT file_content 
FROM config_files 
WHERE filename='languages';

-- Returns: Language mapping { "en": "English", "fr": "Français", ... }
-- Used by: Language selector dropdown
```

### Query 4: Get All Skills Data
```sql
SELECT file_content 
FROM data_files 
WHERE filename='skills';

-- Returns: Skills JSON array
-- Used by: Skills section in portfolio
```

### Query 5: Get All Images
```sql
SELECT filename, file_path, mime_type 
FROM images;

-- Returns: All image metadata
-- Used by: Image gallery, logos, favicons
```

---

## 🎯 Dashboard Module → Table Mapping

### Sidebar Collections Menu
```
Collections (Expandable)
├── English
│   ├── Config   → SELECT FROM collections WHERE lang='en', type='config'
│   └── Data     → SELECT FROM collections WHERE lang='en', type='data'
├── French
│   ├── Config   → SELECT FROM collections WHERE lang='fr', type='config'
│   └── Data     → SELECT FROM collections WHERE lang='fr', type='data'
├── German
│   └── ...
└── [11 more languages]
```

### File Browser
```
Overview
├── Service Cards       → Dashboard Status monitoring
└── Quick Actions       → Pump, Sync, Clear operations

Collections
└── [Language Selector] → From collections table

Config
└── [File Listing]      → From config_files table

Data
└── [File Listing]      → From data_files table

Files
└── [File Listing]      → From static_files table

Images
└── [Image Preview]     → From images table (file_path)

JavaScript
└── [File Listing]      → From javascript_files table

Resume
└── [File Listing]      → From resumes table
```

---

## 🔐 Security & Constraints

### Unique Constraints Prevent Duplicates
```
Collections:    UNIQUE(lang, type, filename)  → One file per lang/type/name combo
Config Files:   UNIQUE(filename)               → One global config per name
Data Files:     UNIQUE(filename)               → One global data per name
Static Files:   UNIQUE(filename)               → One file per name
Images:         UNIQUE(filename)               → One image per name
Resumes:        UNIQUE(filename)               → One resume per name
JavaScript:     UNIQUE(filename)               → One JS file per name
```

### Cascading Deletes
When a resource is deleted from /public folder:
- sync_manifest tracks the change
- Next pump detects missing file
- Database record can be cleaned up (optional)

---

## 📈 Typical Flow for Dashboard Initialization

```
1. User accesses /dashboard
   ↓
2. Dashboard layout loads
   ↓
3. Fetch menu structure
   GET /api/dashboard/menus
   ↓
4. Query collections table
   SELECT DISTINCT lang FROM collections
   ↓
5. Build language submenus
   ├── English
   ├── French
   ├── German
   └── ...
   ↓
6. User clicks "Collections" → "English" → "Config"
   ↓
7. Fetch files
   GET /api/dashboard/files?type=collections&lang=en&subtype=config
   ↓
8. Query collections table
   SELECT * FROM collections WHERE lang='en' AND type='config'
   ↓
9. Display apiConfig.json, pageLayout.json, etc
   ↓
10. User selects file → Show content in editor
    ↓
11. User can edit → POST to /api/admin/data (update action)
    ↓
12. Database updated, file displayed in editor
```

---

## 📚 Related Documentation

- [Pumpdata API Guide](./PUMPDATA_API_GUIDE.md) - Detailed pump mechanism
- [Dashboard Implementation](./DASHBOARD_FINAL.md) - UI/UX details
- [Authentication Setup](./AUTH_SETUP.md) - Security & JWT

