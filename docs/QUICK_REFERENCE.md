# 🚀 Admin Dashboard - Quick Reference

## Dashboard Access
```
Login Page:       http://localhost:3000/login
Dashboard:        http://localhost:3000/dashboard
Admin Pages:      http://localhost:3000/dashboard/*
```

## Quick Links

### Pages Available
| Page | URL | Purpose |
|------|-----|---------|
| Collections | `/dashboard` | Edit content by language |
| Images | `/dashboard/images` | Manage image assets |
| Files | `/dashboard/files` | Manage static files |
| Config | `/dashboard/config` | Edit system configuration |
| Resume | `/dashboard/resume` | Manage resume templates |
| Overview | `/dashboard/overview` | System health & operations |

## Authentication

### Login Flow (4 Steps)
```
1. Enter Username/Password
2. Receive TOTP QR Code
3. Scan in Authenticator App
4. Enter 6-digit Code
5. Access Dashboard ✅
```

### Supported Authenticators
- Google Authenticator
- Microsoft Authenticator
- Authy
- 1Password
- LastPass
- Any TOTP-compatible app

## API Quick Reference

### Authentication Endpoints
```bash
# Register
POST /api/auth/register
  {"username": "admin", "password": "..."}

# Login
POST /api/auth/login
  {"username": "admin", "password": "..."}

# MFA Setup
POST /api/auth/mfa/setup
  (requires session_token)

# MFA Verify
POST /api/auth/mfa/verify
  {"code": "123456"}

# Logout
POST /api/auth/logout
```

### Admin API Endpoints (Protected)
```bash
# Collections
GET  /api/admin/data?action=read
POST /api/admin/data

# Configuration
GET  /api/admin/config-read
POST /api/admin/config

# Database
POST /api/admin/db

# Cache
POST /api/admin/cache

# Files
GET  /api/admin/files-storage-read
POST /api/admin/files

# System
GET  /api/health
```

### Authentication Methods
```bash
# Option 1: Session Cookie (Dashboard)
Cookie: auth_token=eyJhbGc...

# Option 2: Bearer Token (API)
Authorization: Bearer YOUR_ADMIN_TOKEN

# Option 3: API Key (API)
x-api-key: YOUR_ADMIN_TOKEN
```

## Environment Variables

### Required
```bash
JWT_SECRET=<32+ random chars>
ADMIN_TOKEN=<32+ random chars>
MFA_ENCRYPTION_KEY=<32-char hex>
DATABASE_URL=postgresql://...
```

### Optional
```bash
REDIS_URL=redis://...
NODE_ENV=production
```

### Generate Secure Keys
```bash
# JWT_SECRET & ADMIN_TOKEN
openssl rand -base64 32

# MFA_ENCRYPTION_KEY (hex)
openssl rand -hex 16
```

## Common Commands

### Development
```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm test                 # Run unit tests
./test-all.sh           # Run all tests
npm run lint            # Check code quality
```

### Testing
```bash
# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Secure123!"}'

# Test health
curl http://localhost:3000/api/health

# Test with token
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/admin/data?action=read
```

## Deployment

### Vercel
```bash
# 1. Set environment variables in Vercel dashboard
# 2. Push to GitHub
git push origin main

# 3. Deployment automatic
# 4. Test on production domain
```

### Docker
```bash
docker build -t content-hub .
docker run -p 3000:3000 \
  -e JWT_SECRET=... \
  -e ADMIN_TOKEN=... \
  -e DATABASE_URL=... \
  content-hub
```

## Dashboard Features

### Collections Page
- 📚 Multi-language support (11 languages)
- ⚙️ Edit config files (JSON)
- 📊 Edit data files (JSON)
- 💾 Save/clear/close operations
- 🎨 Syntax highlighting

### Images Page
- 🖼️ Grid view with preview
- ⬆️ Upload new images
- 🗑️ Delete images
- 📋 View properties

### Files Page
- 📄 Table view with sorting
- 📥 Download files
- 🗑️ Delete files
- 👁️ View contents

### Config Page
- ⚙️ JSON config editor
- 💾 Save changes
- ✅ Syntax validation
- 🔄 Change tracking

### Resume Page
- 📋 Template selection
- 📝 Content management
- 👁️ Preview templates
- 📥 Export resume

### Overview Page
- 🏥 Service health (Supabase, Redis, API)
- 📊 Performance metrics
- ⚡ Cache management
- 🗄️ Database operations

## Troubleshooting

### Can't Login
→ Check username/password
→ Verify database connection
→ Check JWT_SECRET matches

### MFA Not Working
→ Verify MFA_ENCRYPTION_KEY is set
→ Check authenticator time sync
→ Ensure app has permission

### API Returns 401
→ Check ADMIN_TOKEN
→ Verify Authorization header format
→ Check session cookie exists

### Database Connection Fails
→ Verify DATABASE_URL
→ Check database is running
→ Test: psql "$DATABASE_URL"

### Pages Not Loading
→ Check middleware.js
→ Verify auth_token cookie
→ Clear browser cache
→ Check browser console

## Security Checklist

- ✅ Use HTTPS only (production)
- ✅ Keep tokens secure (32+ chars)
- ✅ Rotate tokens regularly
- ✅ Enable MFA for all users
- ✅ Use strong passwords (12+ chars)
- ✅ Keep dependencies updated
- ✅ Monitor access logs
- ✅ Backup database regularly

## File Locations

### Dashboard Pages
```
app/dashboard/
├── layout.jsx           # Main layout
├── page.jsx            # Collections
├── images/page.jsx
├── files/page.jsx
├── config/page.jsx
├── resume/page.jsx
└── overview/page.jsx
```

### Authentication
```
app/login/page.jsx          # Login page
app/api/auth/
├── register.js
├── login.js
├── logout.js
└── mfa/
    ├── setup.js
    └── verify.js
```

### Admin APIs
```
app/api/admin/
├── data.js
├── db.js
├── cache.js
├── config-read.js
├── files.js
└── ... (other endpoints)
```

### Libraries
```
lib/
├── auth.js              # Auth helper
├── users.js            # User DB
├── session.js          # JWT helper
└── mfa.js             # TOTP crypto
```

## Performance Tips

- Use Redis for caching
- Monitor database queries
- Clear cache periodically
- Optimize images (WebP)
- Enable gzip compression
- Use CDN for static files
- Monitor API response times
- Check bundle size: `npm run build`

## Documentation

📖 Full Guides Available:
- [Admin Dashboard Guide](./docs/ADMIN_DASHBOARD.md)
- [Deployment & Testing](./docs/DEPLOYMENT_TESTING.md)
- [Complete Technical Guide](./docs/DASHBOARD_COMPLETE.md)
- [Completion Status](./docs/COMPLETION_STATUS.md)

## Support Resources

### Files to Check
1. `.env.local` - Environment variables
2. `middleware.js` - Auth middleware
3. `package.json` - Dependencies
4. `lib/auth.js` - Auth logic

### Logs to Monitor
1. Console: `npm run dev` output
2. Browser: DevTools Console
3. Vercel: Function logs
4. Database: Query logs

## Quick Deployment

```bash
# 1. Test locally
npm run build && npm test

# 2. Push to GitHub
git add -A
git commit -m "Ready for production"
git push origin main

# 3. Vercel auto-deploys
# (watch Vercel dashboard)

# 4. Test production
https://your-domain.vercel.app/login

# 5. Register first admin
curl -X POST https://your-domain.vercel.app/api/auth/register \
  -d '{"username":"admin","password":"..."}'
```

---

**Version:** 2.0.0
**Updated:** January 15, 2025
**Status:** Production Ready ✅
