# Auto-Sync System - Quick Reference

## 🎯 What It Does

Automatically detects and syncs files from these folders to Redis **every 30 minutes** (in production) or **instantly** (in development):

```
public/
├── collections/  ✅ Auto-synced
├── config/       ✅ Auto-synced
├── data/         ✅ Auto-synced
├── files/        ✅ Auto-synced
├── image/        ✅ Auto-synced
└── resume/       ✅ Auto-synced
```

## 🚀 Quick Start

### Production (Vercel)

1. **Deploy to Vercel:**
   ```bash
   git add .
   git commit -m "Add auto-sync system"
   git push
   ```

2. **It's automatic!** Files sync every 30 minutes via Vercel Cron

3. **Manual sync (if needed):**
   ```bash
   curl -X POST https://your-app.vercel.app/api/auto-sync
   ```

### Development (Local)

1. **Start Redis:**
   ```bash
   brew services start redis  # macOS
   # or
   sudo systemctl start redis  # Linux
   ```

2. **Set environment variable:**
   ```bash
   export REDIS_URL=redis://localhost:6379
   ```

3. **Start file watcher:**
   ```bash
   npm run sync
   ```

4. **Start your server (in another terminal):**
   ```bash
   npm start
   ```

5. **Add/edit files - they sync automatically!**

## 📋 Commands

| Command | Description |
|---------|-------------|
| `npm run sync` | Start file watcher (real-time sync in dev) |
| `npm run dev:watch` | Same as above |
| `npm run auto-sync` | Trigger manual sync (requires running server) |
| `./setup-auto-sync.sh` | Check setup and test endpoints |

## 🔍 Check Status

```bash
# Check sync status
curl http://localhost:3000/api/auto-sync/status

# Production
curl https://your-app.vercel.app/api/auto-sync/status
```

## 📁 How to Add Files

Just add files to any monitored folder:

```bash
# Add a new file
echo '{"key": "value"}' > public/data/newFile.json

# Development: Synced instantly (if watcher is running)
# Production: Synced within 30 minutes (or manually trigger)

# Access the file
curl http://localhost:3000/api/collections/en/data/newFile.json
```

## ⚙️ Configuration

### Sync Frequency (Production)

Edit `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/auto-sync",
      "schedule": "*/30 * * * *"  // Every 30 minutes
    }
  ]
}
```

**Other schedules:**
- `*/15 * * * *` - Every 15 minutes
- `0 * * * *` - Every hour
- `0 0 * * *` - Daily at midnight

### Environment Variables

**Required:**
- `REDIS_URL` - Redis connection URL

**Optional:**
- `CRON_SECRET` - Secret for cron authentication (production)

## 🛠️ Files Created

| File | Purpose |
|------|---------|
| `src/routes/auto-sync.js` | Auto-sync API endpoint |
| `scripts/watch-and-sync.js` | File watcher for development |
| `AUTO_SYNC_GUIDE.md` | Complete documentation |
| `setup-auto-sync.sh` | Setup verification script |
| `vercel.json` (updated) | Cron job configuration |
| `package.json` (updated) | Added npm scripts |

## 📖 Documentation

- **Complete Guide:** [AUTO_SYNC_GUIDE.md](AUTO_SYNC_GUIDE.md)
- **Vercel Fix:** [VERCEL_FILE_DETECTION_FIX.md](VERCEL_FILE_DETECTION_FIX.md)

## ✅ Testing

```bash
# 1. Run setup check
./setup-auto-sync.sh

# 2. Test auto-sync endpoint
curl -X POST http://localhost:3000/api/auto-sync

# 3. Check status
curl http://localhost:3000/api/auto-sync/status

# 4. Test file access
curl http://localhost:3000/api/collections/en/data/contentLabels.json
```

## 🐛 Troubleshooting

**Files not syncing?**
```bash
# Check Redis connection
redis-cli ping  # Should return PONG

# Check REDIS_URL
echo $REDIS_URL

# Manually trigger sync
curl -X POST http://localhost:3000/api/auto-sync
```

**Watcher not working?**
```bash
# Ensure Redis is running
brew services start redis

# Check if watcher is running
ps aux | grep watch-and-sync

# Restart watcher
npm run sync
```

**Production not syncing?**
```bash
# Check Vercel environment variables
vercel env ls

# Check cron logs
vercel logs --filter "/api/auto-sync"

# Manually trigger
curl -X POST https://your-app.vercel.app/api/auto-sync
```

## 💡 Pro Tips

1. **Use watcher in development** - Get instant feedback
2. **Test locally first** - Before pushing to production
3. **Monitor sync status** - Use `/api/auto-sync/status` endpoint
4. **Check logs regularly** - Catch issues early
5. **Keep files small** - Optimize JSON, compress images

## 🎉 Done!

Your files are now automatically synced. Just add files to the monitored folders and they'll be available via the API.

**Questions?** See [AUTO_SYNC_GUIDE.md](AUTO_SYNC_GUIDE.md) for detailed documentation.
