# Deploy to Vercel - Step by Step

## No Local Commands Needed! ✅

Everything will run automatically on Vercel. You don't need to run `node scripts/setup-database.js` locally.

---

## Step 1: Connect Repository to Vercel

### Option A: Via Web (Easiest)
1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Select your GitHub repository (Content-Hub)
4. Click **"Import"**

### Option B: Via Vercel CLI
```bash
npm install -g vercel
vercel
```

---

## Step 2: Configure Environment Variables

In Vercel dashboard:

1. Go to Settings → Environment Variables
2. Add these variables (copy from your `.env`):

```
SUPABASE_URL=https://nphcjikbofyaexoquolc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SUPABASE_URL=https://nphcjikbofyaexoquolc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
REDIS_URL=redis://default:7qqVS3b9pHULdelwly3uY1QFk7hNYBwx@redis-19930...
JWT_SECRET=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9...
```

---

## Step 3: Deploy

### Option A: Via Git Push (Automatic)
```bash
cd /Users/kuhandransamudrapandiyan/Projects/Content-Hub

# Add all files
git add .

# Commit
git commit -m "Database sync setup - ready for deployment"

# Push to GitHub
git push origin main
```

Vercel automatically detects the push and:
1. Installs dependencies ✅
2. Runs `npm run setup-db` ✅
3. Scans 234 files ✅
4. Creates 8 database tables ✅
5. Loads data into tables ✅
6. Deploys your API ✅

### Option B: Via Vercel CLI
```bash
vercel --prod
```

---

## What Happens During Deployment 🚀

```
1. Push to GitHub
           ↓
2. Vercel detects push
           ↓
3. npm ci (installs dependencies)
           ↓
4. npm run setup-db (runs setup-database.js)
   ├─ 🔍 Scans /public folder
   ├─ 🗑️  Clears all tables
   ├─ 📊 Creates 8 database tables
   ├─ 📥 Loads 234 files
   └─ ✅ Syncs to sync_manifest
           ↓
5. API Endpoints Ready
   ├─ GET /api/admin/sync
   └─ POST /api/admin/sync
           ↓
6. 🟢 Live on vercel domain
```

---

## Verify Deployment

### Check Build Logs
1. Go to Vercel dashboard
2. Click your project
3. Click "Deployments" tab
4. Find the latest deployment
5. Click "View Build Logs"
6. Look for:
   ```
   ✅ Found 234 files
   ✅ Database tables setup
   ✅ Loaded X records
   ✅ Database setup completed successfully
   ```

### Test API Endpoint
Once deployment completes, test:

```bash
# Check status
curl https://your-vercel-domain.vercel.app/api/admin/sync

# Should return:
{
  "status": "success",
  "message": "Sync endpoint is active",
  "available_modes": ["scan", "pull", "push"]
}
```

### Scan for Changes
```bash
curl -X POST https://your-vercel-domain.vercel.app/api/admin/sync \
  -H "Content-Type: application/json" \
  -d '{"mode": "scan"}'
```

---

## Files Ready for Deployment ✅

```
Content-Hub/
├── scripts/
│   └── setup-database.js          ✅ Runs on Vercel build
├── app/api/admin/sync/
│   └── route.js                   ✅ API endpoint
├── lib/
│   └── sync-service.js            ✅ Utilities
├── package.json                    ✅ setup-db command
├── vercel.json                     ✅ Build config (updated)
└── .env                            ✅ Environment vars
```

---

## Timeline

| Step | Time | Status |
|------|------|--------|
| Push to GitHub | Now | 🟢 You do this |
| Vercel builds | 1-2 min | 🟢 Automatic |
| npm ci installs | 30 sec | 🟢 Automatic |
| setup-db runs | 2-3 min | 🟢 Automatic |
| Tables created | 1-2 min | 🟢 Automatic |
| Data loaded | 1-2 min | 🟢 Automatic |
| **Total** | **~5-7 minutes** | ✅ Live |

---

## If Build Fails

### Check Build Logs
1. Vercel dashboard → Deployments
2. Click failed deployment
3. View logs for errors

### Common Issues

**Issue**: "Missing environment variable"
- **Fix**: Add the variable in Vercel Settings

**Issue**: "Database connection error"
- **Fix**: Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correct

**Issue**: "Timeout during setup"
- **Fix**: Increase timeout in vercel.json (already set to 60s)

---

## Rollback (if needed)

If something goes wrong:

1. Go to Vercel Deployments
2. Click on a previous successful deployment
3. Click "Redeploy"
4. Vercel re-runs that version

---

## Git Commands (if needed)

```bash
# Check status
git status

# Add all files
git add .

# Check what will be committed
git diff --cached

# Commit
git commit -m "Database sync setup - production ready"

# Push
git push origin main

# Verify pushed
git log --oneline -5
```

---

## You're Done! 🎉

Once you push to GitHub, Vercel handles everything:
- ✅ Installs packages
- ✅ Runs database setup
- ✅ Creates tables
- ✅ Loads data
- ✅ Deploys API
- ✅ Ready for use

**No local Node.js commands needed!**

Just push and Vercel does the rest automatically.

```bash
git add .
git commit -m "Deploy"
git push origin main
```

Then visit: `https://your-vercel-domain.vercel.app/api/admin/sync`

🚀 **Your API is live!**
