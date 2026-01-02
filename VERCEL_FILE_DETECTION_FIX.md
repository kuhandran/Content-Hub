# Vercel File Detection Fix

## Problem
Certain files (especially in `/public/collections/`) are not being detected or served in Vercel deployment.

## Root Causes

### 1. **Missing `includeFiles` Configuration**
Vercel doesn't automatically include all files in your deployment. Without explicit configuration, files outside the `/api` directory might not be included in the serverless function bundle.

### 2. **Dual Approach Conflict**
Your app has two ways to serve files:
- **Static file serving** via `app.use(express.static())` in `/api/index.js`
- **Redis-based serving** via `/api/collections` route

This creates confusion about which files need to be where.

### 3. **Collections Route Dependency**
The `/api/collections` route expects files to be in Redis (using keys like `cms:file:ar-AE/data/contentLabels.json`), but there's no guarantee these files are seeded in production.

## Solutions

### ✅ Solution 1: Include Static Files in Deployment (IMPLEMENTED)

I've updated your `vercel.json` to explicitly include necessary directories:

```json
{
  "includeFiles": [
    "public/**",
    "views/**",
    "src/**"
  ]
}
```

This ensures all files in these directories are bundled with your serverless function.

### 🔧 Solution 2: Ensure Redis is Seeded (RECOMMENDED)

Since your collections route uses Redis, you need to seed Redis in production:

#### Option A: Seed During Build
Add to your `vercel.json`:

```json
{
  "buildCommand": "npm install && node scripts/generate-manifest.js && node scripts/seed-vercel-kv.js"
}
```

**Required Environment Variables in Vercel:**
- `KV_REST_API_URL` or `VERCEL_KV_REST_API_URL`
- `KV_REST_API_TOKEN` or `VERCEL_KV_REST_API_TOKEN`

#### Option B: Seed via API Endpoint
Use the admin seed endpoint after deployment:

```bash
curl -X POST https://your-app.vercel.app/api/admin/seed \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Option C: Seed via Script
Run locally after deployment:

```bash
KV_REST_API_URL=your_url \
KV_REST_API_TOKEN=your_token \
node scripts/seed-vercel-kv.js
```

### 🔄 Solution 3: Fallback to File System

Update `/src/routes/collections.js` to fallback to file system if Redis fails:

```javascript
// GET /api/collections/* - Read any collection file
router.get('/*', async (req, res) => {
  try {
    const filePath = req.params[0]; // e.g., 'ar-AE/data/contentLabels.json'
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path required' });
    }

    // Try Redis first
    if (redis) {
      const key = `cms:file:${filePath}`;
      const content = await redis.get(key);
      
      if (content) {
        if (filePath.endsWith('.json')) {
          try {
            const jsonContent = JSON.parse(content);
            return res.json(jsonContent);
          } catch (parseErr) {
            console.error('[COLLECTIONS] JSON parse error:', parseErr);
            return res.status(500).json({ error: 'Invalid JSON' });
          }
        }
        res.type('text/plain');
        return res.send(content);
      }
    }

    // Fallback to file system
    const fs = require('fs');
    const path = require('path');
    const fullPath = path.join(__dirname, '../../public/collections', filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.warn('[COLLECTIONS] File not found:', filePath);
      return res.status(404).json({ 
        error: 'File not found',
        path: filePath
      });
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    
    if (filePath.endsWith('.json')) {
      try {
        const jsonContent = JSON.parse(content);
        return res.json(jsonContent);
      } catch (parseErr) {
        console.error('[COLLECTIONS] JSON parse error:', parseErr);
        return res.status(500).json({ error: 'Invalid JSON' });
      }
    }

    res.type('text/plain');
    res.send(content);

  } catch (error) {
    console.error('[COLLECTIONS] Error reading file:', error);
    res.status(500).json({ 
      error: error.message
    });
  }
});
```

## Verification Steps

After deploying with the fix:

### 1. Check File Access
```bash
# Test static file access
curl https://your-app.vercel.app/collections/en/data/caseStudies.json

# Test API access
curl https://your-app.vercel.app/api/collections/en/data/caseStudies.json
```

### 2. Check Logs
```bash
vercel logs your-deployment-url
```

Look for:
- `[COLLECTIONS] File not found` warnings
- `Redis not connected` errors
- 404 errors for specific files

### 3. Verify Redis Connection
```bash
curl https://your-app.vercel.app/health
```

Check if Redis is connected in the response.

## Environment Variables Checklist

Ensure these are set in Vercel:

- ✅ `REDIS_URL` - For Redis connection
- ✅ `KV_REST_API_URL` - For Vercel KV REST API
- ✅ `KV_REST_API_TOKEN` - For Vercel KV authentication
- ✅ `NODE_ENV=production`
- ✅ `JWT_SECRET` - For authentication

## Quick Fix Commands

### Redeploy with new config:
```bash
git add vercel.json
git commit -m "Fix: Add includeFiles to vercel.json"
git push
```

### Seed Redis after deployment:
```bash
# Using the seed script
./seed-vercel-via-curl.sh

# Or manually
curl -X POST https://your-app.vercel.app/api/admin/seed \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Testing Locally

Test the fix locally before deploying:

```bash
# Install Vercel CLI
npm i -g vercel

# Run locally with Vercel environment
vercel dev

# Test endpoints
curl http://localhost:3000/api/collections/en/data/caseStudies.json
```

## Need More Help?

Check these files for additional context:
- [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- [scripts/seed-vercel-kv.js](scripts/seed-vercel-kv.js)
