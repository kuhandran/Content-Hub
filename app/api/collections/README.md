# Collections API Documentation

## Overview
API endpoints for accessing collection files and content. Collections are organized by language and folder structure.

## Base URL
```
/api/collections
```

## Endpoints

### List All Collections
- **GET** `/` - List all available collections
  - Returns: array of collection metadata

### Language Collections
- **GET** `/{lang}` - List folders in a language
  - Params: lang (e.g., en, es, fr)
  - Returns: array of folders and their contents

### Folder Contents
- **GET** `/{lang}/{folder}` - List files in folder
  - Params: 
    - lang: language code
    - folder: folder name (e.g., config, data)
  - Returns: array of files with metadata

### File Access
- **GET** `/{lang}/{folder}/{file}` - Get specific file content
  - Params:
    - lang: language code
    - folder: folder name
    - file: filename without extension
  - Returns: parsed JSON content

### Dynamic Routes
- **GET** `/[...slug]` - Access by custom slug path
  - Used for dynamic routing

---

## Response Format
```json
{
  "status": "success",
  "data": {
    "content": { },
    "metadata": {
      "language": "en",
      "folder": "config",
      "file": "languages"
    }
  }
}
```

---

## File Organization
Collections are stored in `public/collections/{lang}/{folder}/`:
- `config/` - Configuration files
- `data/` - Data files (skills, projects, education, etc.)

---

Last Updated: January 7, 2026
