# CORS Configuration

## Overview
This application uses a centralized CORS configuration to ensure all API endpoints properly handle cross-origin requests from allowed origins.

## Solution Implemented

### 1. Centralized Allowed Origins
**File: [src/config/allowedOrigins.js](src/config/allowedOrigins.js)**
- Single source of truth for all allowed origins
- Easy to maintain and update across the entire application
- All route files import from this central configuration

### 2. CORS Middleware in API Entry Point
**File: [api/index.js](api/index.js#L8-L45)**
- Comprehensive CORS middleware for Vercel serverless deployment
- Uses centralized allowedOrigins configuration
- Handles OPTIONS preflight requests

### 3. CORS in Local Development Server
**File: [src/app.js](src/app.js#L6-L27)**
- Mirrors CORS configuration for local development
- Uses centralized allowedOrigins configuration
- Ensures consistent behavior between local and production

### 4. CORS in All Route Files
All public-facing route files now include explicit CORS middleware:
- **[src/routes/collections.js](src/routes/collections.js)** - Collection files API
- **[src/routes/config-read.js](src/routes/config-read.js)** - Configuration files API
- **[src/routes/config.js](src/routes/config.js)** - Configuration metadata API
- **[src/routes/image-read.js](src/routes/image-read.js)** - Image files API
- **[src/routes/resume-read.js](src/routes/resume-read.js)** - Resume files API
- **[src/routes/files-storage-read.js](src/routes/files-storage-read.js)** - Storage files API
- **[src/routes/files-redis.js](src/routes/files-redis.js)** - Files Redis API
- **[src/routes/legacy.js](src/routes/legacy.js)** - Legacy API routes

## Allowed Origins
The following origins are whitelisted in [src/config/allowedOrigins.js](src/config/allowedOrigins.js):
- `http://localhost:3000` - Local development
- `http://localhost:8080` - Alternative local port
- `http://localhost:5173` - Vite dev server
- `http://localhost:5174` - Alternative Vite port
- `https://static-api-opal.vercel.app` - Production API
- `https://opal-tau.vercel.app` - Production frontend
- `https://opal.vercel.app` - Production frontend
- `https://www.kuhandranchatbot.info` - Production domain

## CORS Methods Allowed
- GET
- POST
- PUT
- DELETE
- OPTIONS (preflight)
- PATCH

## CORS Headers Set
```
Access-Control-Allow-Origin: [matching origin]
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 3600
```

## How to Add a New Allowed Origin
1. Open [src/config/allowedOrigins.js](src/config/allowedOrigins.js)
2. Add the new origin to the `allowedOrigins` array
3. Save the file
4. Redeploy the application

The change will automatically apply to all API endpoints without needing to modify individual route files.

## Testing CORS
You can test CORS by making a request from any allowed origin:

```javascript
fetch('https://static-api-opal.vercel.app/api/collections/en/data/contentLabels.json', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

## Language Files Status
All 11 language collections are synced and ready:
- ✅ en (English)
- ✅ ar-AE (Arabic)
- ✅ es (Spanish)
- ✅ fr (French)
- ✅ de (German)
- ✅ hi (Hindi)
- ✅ id (Indonesian)
- ✅ my (Burmese)
- ✅ si (Sinhala)
- ✅ ta (Tamil)
- ✅ th (Thai)

## Configuration Files
The following configuration files are available at `/api/config-file/`:
- `languages.json` - Language definitions and metadata
- `apiConfig.json` - API configuration
- `pageLayout.json` - Page layout configuration
- `urlConfig.json` - URL routing configuration

## Deployment Status
✅ Changes committed to main branch
✅ Pushed to origin/main
✅ Ready for Vercel deployment

## Testing CORS
To test CORS from localhost:3000, fetch from:
```javascript
fetch('https://static-api-opal.vercel.app/api/config-file/languages.json')
  .then(res => res.json())
  .then(data => console.log(data))
```

Or during local development:
```javascript
fetch('http://localhost:3000/api/config-file/languages.json')
  .then(res => res.json())
  .then(data => console.log(data))
```
