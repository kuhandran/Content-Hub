# Dashboard Deployment & Testing Guide

## Quick Start

### Local Development
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local

# Generate ADMIN_TOKEN (use a secure 32+ character string)
# Generate MFA_ENCRYPTION_KEY (32-char hex string for AES-256)
# Example: openssl rand -hex 16

# Start dev server
npm run dev

# Dashboard will be at http://localhost:3000/dashboard
```

### Testing the Dashboard Locally

#### 1. Register Admin User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "SecurePassword123!"
  }'
```

#### 2. Login and Get MFA QR Code
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "SecurePassword123!"
  }'
```

Response will include:
- `session_token`: Temporary token for MFA setup
- `mfa_secret`: TOTP secret (in QR code)
- `qr_code`: Base64 encoded QR PNG

#### 3. Verify TOTP Code
```bash
# Get 6-digit code from your authenticator app (e.g., Google Authenticator, Authy)
curl -X POST http://localhost:3000/api/auth/mfa/verify \
  -H "Content-Type: application/json" \
  -b "session_token=..." \
  -d '{
    "code": "123456"
  }'
```

Response will include:
- `auth_token`: Final session cookie for dashboard access

#### 4. Access Dashboard
Navigate to: `http://localhost:3000/dashboard`

### Running Tests

#### Unit Tests
```bash
npm test
```

Tests cover:
- Database SSL configuration
- Auth token validation
- Session JWT verification
- MFA TOTP generation

#### Smoke Tests
```bash
./test-all.sh
```

Tests cover:
- Auth endpoints (register, login, MFA)
- Admin operations (data, db, cache)
- File operations
- Cache management
- System health

#### Build Verification
```bash
npm run build
```

Verifies:
- Next.js compilation (all pages and APIs)
- No TypeScript errors
- All routes properly configured

## Vercel Deployment

### 1. Prerequisites
- Vercel account
- GitHub repository connected
- Environment variables configured

### 2. Set Environment Variables on Vercel

Go to **Project Settings → Environment Variables**:

```
JWT_SECRET=your-secure-32-char-key
ADMIN_TOKEN=your-secure-admin-token
MFA_ENCRYPTION_KEY=32-char-hex-key-for-aes256
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://host:port (optional)
NODE_ENV=production
```

### 3. Generate Secure Tokens

**JWT_SECRET (32+ characters):**
```bash
# macOS/Linux
openssl rand -base64 32

# Or use a password generator: minimum 32 random characters
```

**ADMIN_TOKEN:**
```bash
# macOS/Linux - 32+ character hex string
openssl rand -hex 32

# Or generate: minimum 32 random alphanumeric characters
```

**MFA_ENCRYPTION_KEY (32-char hex for AES-256):**
```bash
# macOS/Linux
openssl rand -hex 16
```

### 4. Deploy to Vercel
```bash
# Push to GitHub (automatically triggers deploy)
git push origin main

# Or manually deploy via Vercel dashboard
vercel deploy --prod
```

### 5. Test on Vercel

#### Register First Admin
```bash
curl -X POST https://your-domain.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "SecurePassword123!"
  }'
```

#### Login with MFA
1. Visit: `https://your-domain.vercel.app/login`
2. Enter credentials
3. Scan QR code
4. Enter TOTP code
5. Access dashboard: `https://your-domain.vercel.app/dashboard`

#### Run Smoke Tests Against Production
```bash
DOMAIN=your-domain.vercel.app ./test-all.sh
```

## Dashboard Page Testing Checklist

### Collections Page (`/dashboard`)
- [ ] Language tabs switch correctly
- [ ] Config files load and display
- [ ] Data files load and display
- [ ] JSON editor opens and closes
- [ ] Save button saves file content
- [ ] Clear cache button works
- [ ] Close button closes editor

### Images Page (`/dashboard/images`)
- [ ] Image grid displays all images
- [ ] Upload button opens file picker
- [ ] View button shows image details
- [ ] Delete button removes image
- [ ] Page responsiveness on mobile

### Files Page (`/dashboard/files`)
- [ ] File table displays all files
- [ ] File size and type visible
- [ ] View button shows file content
- [ ] Download button works
- [ ] Delete button removes file

### Config Page (`/dashboard/config`)
- [ ] All config files displayed as cards
- [ ] Edit button opens config editor
- [ ] JSON syntax highlighting works
- [ ] Save button persists changes
- [ ] Close button without saving works

### Resume Page (`/dashboard/resume`)
- [ ] All templates displayed
- [ ] Template selection works
- [ ] Content sections table loads
- [ ] Edit button opens section editor
- [ ] View button shows preview

### Overview Page (`/dashboard/overview`)
- [ ] Status cards display (Supabase, Redis, API)
- [ ] Metrics show correct values
- [ ] Cache management table loads
- [ ] Database operation buttons functional
- [ ] Redis operation buttons functional

### Authentication Flow
- [ ] Login page loads at `/login`
- [ ] Invalid credentials show error
- [ ] Valid login shows MFA step
- [ ] QR code displays in MFA setup
- [ ] TOTP code verification works
- [ ] Session cookie set after MFA
- [ ] Invalid TOTP code shows error
- [ ] Logout clears session cookie
- [ ] Unauthenticated users redirect to `/login`

## API Testing Checklist

### Auth Endpoints
- [ ] `POST /api/auth/register` - Create admin user
- [ ] `POST /api/auth/login` - Login with credentials
- [ ] `POST /api/auth/mfa/setup` - Get TOTP QR
- [ ] `POST /api/auth/mfa/verify` - Verify TOTP code
- [ ] `POST /api/auth/logout` - Clear session

### Admin Endpoints (with session or ADMIN_TOKEN)
- [ ] `GET /api/admin/data` - Fetch collections
- [ ] `POST /api/admin/data` - Save collection
- [ ] `GET /api/admin/config-read` - Read config
- [ ] `POST /api/admin/config` - Update config
- [ ] `POST /api/admin/db` - DB operations
- [ ] `POST /api/admin/cache` - Cache operations

### System Endpoints
- [ ] `GET /api/health` - System health check

## Troubleshooting

### Login Page Shows Blank
- **Cause:** Middleware blocking `/login`
- **Fix:** Ensure `/login` is in publicRoutes in middleware.js

### Session Expires Immediately
- **Cause:** JWT_SECRET mismatch
- **Fix:** Ensure JWT_SECRET is same in `.env.local` and Vercel

### MFA Setup Shows No QR Code
- **Cause:** MFA_ENCRYPTION_KEY not set
- **Fix:** Generate and set MFA_ENCRYPTION_KEY in environment

### Database Connection Fails
- **Cause:** DATABASE_URL incorrect or database unavailable
- **Fix:** Verify DATABASE_URL and database is running/accessible

### Pages Return 401 Unauthorized
- **Cause:** Session cookie missing or invalid
- **Fix:** Clear cookies and login again; check JWT_SECRET

### Build Fails on Vercel
- **Cause:** Missing environment variables
- **Fix:** Add all required env vars to Vercel project settings

## Performance Tips

1. **Cache Invalidation:** Use Overview page cache management
2. **Database Queries:** Monitor in Overview → Supabase stats
3. **Image Optimization:** Use WebP format when possible
4. **Network:** Redis for caching improves response times
5. **Build Size:** Use `npm run build` to check bundle size

## Security Checklist

- [ ] ADMIN_TOKEN is 32+ characters
- [ ] JWT_SECRET is 32+ characters
- [ ] MFA_ENCRYPTION_KEY is 32-char hex
- [ ] DATABASE_URL uses secure connection (postgres:// not postgresql://)
- [ ] HTTPS only on production
- [ ] Session cookies have Secure and HttpOnly flags
- [ ] CORS properly configured
- [ ] Rate limiting on auth endpoints
- [ ] Audit logs enabled for admin operations
- [ ] Regular backups of database

## Monitoring

### Vercel Analytics
Monitor at: https://vercel.com/dashboard

### Database Monitoring
- Check query performance
- Monitor connection count
- Monitor storage usage
- Set up alerts for errors

### Application Logs
Access logs in Vercel dashboard or via CLI:
```bash
vercel logs https://your-domain.vercel.app
```

## Support & Debugging

### Enable Debug Logging
```bash
DEBUG=content-hub:* npm run dev
```

### Check API Response
```bash
curl -v https://your-domain.vercel.app/api/health
```

### View Middleware Logs
Check Vercel function logs for middleware.js execution

### Database Logs
Check Vercel → Deployments → Function logs for database errors
