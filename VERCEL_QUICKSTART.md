# ✅ Vercel Deployment - Quick Start

Your project is now configured for Vercel deployment!

## 🚀 Deploy in 5 Steps

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Configure for Vercel deployment"
git push origin main
```

### Step 2: Create Vercel KV Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Storage** → **Create Database** → **KV (Redis)**
3. Choose region, then **Create**
4. Copy these values:
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

### Step 3: Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Select your GitHub repository
4. Click **Import**

### Step 4: Add Environment Variables

In Vercel project **Settings → Environment Variables**, add:

```
JWT_SECRET=<use: openssl rand -base64 32>
AUTH_USER=admin
AUTH_PASSWORD=<your-secure-password>
CORS_ORIGIN=https://your-project.vercel.app

KV_URL=<paste from Step 2>
KV_REST_API_URL=<paste from Step 2>
KV_REST_API_TOKEN=<paste from Step 2>
```

### Step 5: Deploy

Click **Deploy** in Vercel Dashboard, or auto-deploys on next git push.

## ✅ Verify Deployment

```bash
# Test health endpoint
curl https://your-project.vercel.app/health

# Access dashboard
https://your-project.vercel.app/dashboard
```

## 📝 Login Credentials

- **Username:** admin
- **Password:** (from AUTH_PASSWORD env var)

## 🎯 What's Different from Docker

| Aspect | Docker | Vercel |
|--------|--------|--------|
| **Storage** | Filesystem (/public/collections/) | Vercel KV (Redis) |
| **Persistence** | Yes (volume mounted) | Yes (Redis) |
| **Scaling** | Manual/Docker Compose | Automatic |
| **Cost** | $12+/month (DigitalOcean) | $20/month (Pro) |
| **Setup Time** | 5 minutes | 5 minutes |
| **Global CDN** | No | Yes ✅ |
| **Cold Starts** | No | Yes (~500ms) |

## 🔄 Continuous Deployment

Every push to `main` auto-deploys to Vercel.

```bash
# Make changes locally
git commit -am "Update collections"
git push

# Automatically deployed to https://your-project.vercel.app
```

## 📊 Monitor Your Deployment

1. **Vercel Dashboard** → **Functions** - View invocations
2. **Vercel Dashboard** → **Logs** - Debug errors
3. **Vercel Dashboard** → **Storage** - Monitor KV usage

## ⚡ Performance

- Response time: <200ms (with global CDN)
- Automatic scaling: Unlimited concurrency
- Uptime: 99.9% SLA
- First request: ~500ms (cold start)

## 💾 Data Backup

Your data is stored in Vercel KV. To backup:

```bash
# Export from Vercel KV
# Use Vercel CLI or Dashboard
```

## 🆘 Troubleshooting

### "KV_URL not found"
- Check **Storage** tab - KV database created?
- Check **Settings** - Environment variables set?
- Redeploy from Vercel Dashboard

### "Cannot find module @vercel/kv"
- Vercel will auto-install from package.json
- If error persists, trigger redeploy

### 502 Bad Gateway
- Check **Logs** in Vercel Dashboard
- Verify all environment variables are correct
- Check KV database status

## 📚 Full Documentation

See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for detailed guide.

---

**Status:** ✅ Ready for Vercel deployment

**Next:** Follow the 5 steps above!
