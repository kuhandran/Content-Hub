# CORS Configuration

## Issue Fixed
Fixed CORS policy error when fetching from `https://static-api-opal.vercel.app/api/config-file/languages.json` from origin `http://localhost:3000`.

## Solution Implemented

### 1. Added CORS Middleware to API Entry Point
**File: [api/index.js](api/index.js#L15-L43)**
- Added comprehensive CORS middleware
- Allows requests from localhost and production domains
- Handles OPTIONS preflight requests

### 2. Added CORS to Local Development Server
**File: [src/app.js](src/app.js#L10-L38)**
- Mirrored CORS configuration for local development
- Ensures consistent behavior between local and production

### 3. Added CORS Headers to Config-Read Route
**File: [src/routes/config-read.js](src/routes/config-read.js#L24-L46)**
- Applies CORS headers specifically to configuration file endpoints
- Handles language file requests with proper headers

## Allowed Origins
The following origins are now whitelisted:
- `http://localhost:3000` - Local development
- `http://localhost:8080` - Alternative local port
- `http://localhost:5173` - Vite dev server
- `http://localhost:5174` - Alternative Vite port
- `https://static-api-opal.vercel.app` - Production API
- `https://opal-tau.vercel.app` - Production frontend
- `https://opal.vercel.app` - Production frontend

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
