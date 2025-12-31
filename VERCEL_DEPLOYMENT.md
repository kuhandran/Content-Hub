// Vercel deployment guide for Collections CMS

# 🚀 Deploy to Vercel

This is a complete guide to deploy your Collections CMS to Vercel with persistent storage.

## Prerequisites

- Vercel account (free at vercel.com)
- GitHub repository with your code
- Vercel KV database (free tier available)

## Step 1: Set Up Vercel KV

Vercel KV is Redis-backed storage that persists across deployments.

### Create KV Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Storage** tab
3. Click **Create Database**
4. Select **KV** (Redis)
5. Choose region (closest to you)
6. Click **Create**
7. Copy the connection strings:
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

## Step 2: Prepare Your Code

### Update package.json

```bash
# Install Vercel KV support
npm install @vercel/kv
```

### Create Environment Variables

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com)
3. Click **New Project**
4. Select your GitHub repository
5. Click **Import**

## Step 3: Configure Environment Variables

In your Vercel project settings:

1. Go to **Settings → Environment Variables**
2. Add these variables:

```
JWT_SECRET=your-random-secret-32-chars
AUTH_USER=admin
AUTH_PASSWORD=your-secure-password
CORS_ORIGIN=https://your-project.vercel.app

KV_URL=<from step 1>
KV_REST_API_URL=<from step 1>
KV_REST_API_TOKEN=<from step 1>
```

## Step 4: Deploy

Vercel auto-deploys on push to main branch, or:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel deploy --prod

# Or configure auto-deployment in Vercel Dashboard
```

## Step 5: Test Your Deployment

```bash
# Health check
curl https://your-project.vercel.app/health

# Access dashboard
https://your-project.vercel.app/dashboard
```

## How It Works

- **api/index.js** - Main serverless function handling all routes
- **Vercel KV** - Stores file data, authentication tokens, and collections
- **Serverless Functions** - Auto-scale based on demand
- **Edge Network** - Global CDN for fast response times

## Data Storage Architecture

Instead of reading/writing files to disk (not possible in serverless):

```
Filesystem (old)           →    Vercel KV (new)
/public/collections/       →    KV: cms:collections:*
/backups/                  →    KV: cms:backup:*
Authentication tokens      →    KV: cms:token:*
```

All data is automatically synchronized and persists between deployments.

## Scaling

Your Vercel deployment automatically scales:
- ✅ Unlimited concurrent users
- ✅ Automatic load balancing
- ✅ Global CDN
- ✅ 99.9% uptime SLA

## Monitoring

1. Go to **Vercel Dashboard → Functions**
2. View invocations, duration, and errors
3. Check **Logs** for detailed output
4. Monitor **KV Storage** usage

## Troubleshooting

### KV Connection Fails
- Check environment variables are set
- Verify KV database is created
- Restart Vercel deployment: **Deployments → Redeploy**

### 500 Errors
- Check **Logs** in Vercel Dashboard
- Verify all environment variables are set
- Check KV database status

### Files Not Persisting
- Ensure KV_* variables are set correctly
- Check Vercel KV storage in Dashboard
- Monitor invocation logs

## Limits

| Feature | Limit |
|---------|-------|
| Function Duration | 30 seconds (Pro) |
| Request Body | 4.5MB |
| Concurrency | Unlimited |
| KV Storage | 2.5GB free tier |

## Pricing

- **Vercel Pro**: $20/month (recommended)
- **KV Storage**: Free tier (2.5GB)
- **Bandwidth**: First 100GB free per month

## Next Steps

1. Push code to GitHub
2. Create Vercel project
3. Set environment variables
4. Deploy
5. Monitor logs and usage

---

**Questions?** See [DEPLOY.md](../DEPLOY.md) for other deployment options.
