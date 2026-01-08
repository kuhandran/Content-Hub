# Fix: Redeploy from Vercel Dashboard

The build log shows an old configuration. The fix has been pushed but Vercel may be showing cached logs.

## Steps to Redeploy:

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard

2. **Select your Content-Hub project**

3. **Go to "Deployments" tab**

4. **Click the three dots (⋯) on the latest failed deployment**

5. **Select "Redeploy"**

6. **Vercel will rebuild with the new config** ✅

---

## What Was Fixed:

### ❌ Old vercel.json (caused error):
```json
{
  "functions": {
    "app/api/**": {
      "maxDuration": 60
    }
  }
}
```

### ✅ New vercel.json (working):
```json
{
  "version": 2,
  "buildCommand": "node scripts/setup-database.js && next build",
  "installCommand": "npm ci",
  "regions": ["iad1"]
}
```

---

## Expected Build Flow:

1. `npm ci` - Install dependencies ✅
2. `node scripts/setup-database.js` - Initialize database ✅
3. `next build` - Build Next.js API ✅
4. Deploy ✅

---

## Alternative: Force Redeploy via CLI

```bash
vercel --prod --force
```

---

**After redeploy, check build logs - should see:**
```
✅ Found 234 files
✅ Database tables setup
✅ npm run build succeeded
✅ Deployment complete
```
