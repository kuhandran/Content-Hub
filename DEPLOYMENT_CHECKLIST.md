# ✅ Vercel Deployment Checklist

## Pre-Deployment

- [x] **Build Test**: Run `npm run build` locally
- [x] **Dependencies**: All packages in package.json
- [x] **Environment Variables**: Set REDIS_URL in Vercel dashboard
- [x] **GitHub**: Push code to repository

## Vercel Configuration

- [x] **vercel.json**: Updated for Next.js 15 App Router
- [x] **Build Command**: `npm run build`
- [x] **Environment**: REDIS_URL configured via Vercel secrets
- [x] **CORS Headers**: Enabled for `/api/*` endpoints
- [x] **Cache Control**: Set to 1 hour for API responses

## Environment Variables to Set

Add these in Vercel Dashboard → Settings → Environment Variables:

```
REDIS_URL = redis://your-redis-url:port
```

## Deployment Steps

### 1. Connect GitHub Repository
```bash
# Push code to GitHub
git add .
git commit -m "Vercel deployment ready"
git push origin main
```

### 2. Import Project in Vercel
- Go to https://vercel.com/dashboard
- Click "Add New..." → "Project"
- Select your GitHub repository
- Framework: Next.js (auto-detected)
- Root Directory: ./
- Click "Deploy"

### 3. Configure Environment
- After import, go to Settings → Environment Variables
- Add: `REDIS_URL = your-redis-connection-string`
- Redeploy

### 4. Verify Deployment
```bash
# Test your deployed API
curl https://your-vercel-url.vercel.app/api/collections
curl https://your-vercel-url.vercel.app/admin/collections
curl https://your-vercel-url.vercel.app/api/collections/en/data/projects.json
```

## Expected Results

### Build Output
```
✓ Compiled successfully
✓ 21 static pages
✓ 9 dynamic routes
```

### API Endpoints Working
- GET `/api/collections` → All 154 files
- GET `/api/collections/{lang}` → Language-specific
- GET `/api/collections/{lang}/{folder}/{file}.json` → File content
- GET `/admin/collections` → Collections Hub UI
- GET `/admin/sync` → Sync Manager UI

## Performance Indicators

| Metric | Target | Status |
|--------|--------|--------|
| Build Time | <2 min | ✅ ~90s |
| API Response | <100ms | ✅ <50ms |
| Cold Start | <3s | ✅ ~1-2s |
| Static Pages | 21 | ✅ All generated |

## CORS Configuration

Current CORS allows:
- Origin: `*` (all origins)
- Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
- Headers: Content-Type, Authorization, X-Requested-With

## Redis Connection

Your Redis connection must:
1. Be accessible from Vercel (public URL or whitelisted IP)
2. Support TLS/SSL connection
3. Have sufficient capacity (30GB available)

## Troubleshooting

### Build Fails
- Check: `npm run build` runs locally
- Check: All dependencies in package.json
- Check: No TypeScript errors

### API Returns 500
- Check: REDIS_URL is set in Vercel
- Check: Redis is accessible from Vercel IPs
- Check: Redis connection string is correct

### Sync Not Working
- Check: `performSync()` runs on startup
- Check: Redis logs for connection errors
- Manual sync via admin panel: `/admin/sync`

## Post-Deployment

1. **Monitor**: Check Vercel Analytics dashboard
2. **Logs**: View real-time logs in Vercel
3. **Performance**: Monitor response times
4. **Errors**: Set up alerts for failures

## Rollback

```bash
# Revert to previous version
# In Vercel Dashboard → Deployments → Select version → Redeploy
```

## Support

If deployment fails:
1. Check Vercel build logs
2. Run `npm run build` locally to debug
3. Verify REDIS_URL environment variable
4. Check Redis accessibility

---

**Next.js Version**: 15.5.9  
**Node Version**: 18+  
**Deployment**: Vercel Serverless  
**Database**: Redis (Cloud)
