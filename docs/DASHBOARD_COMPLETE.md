# Admin Dashboard - Complete Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Dashboard Pages](#dashboard-pages)
3. [Architecture](#architecture)
4. [Setup & Configuration](#setup--configuration)
5. [Authentication & MFA](#authentication--mfa)
6. [API Integration](#api-integration)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The **Admin Dashboard** is a comprehensive content management system built with Next.js 16, React 19, and Tailwind CSS. It provides:

✅ **Multi-language Support** - 11 languages (EN, FR, ES, DE, HI, ID, MY, SI, TA, TH, AR)
✅ **Secure Authentication** - Free TOTP MFA with AES-256-GCM encryption
✅ **Content Management** - Edit config and data files in JSON format
✅ **System Monitoring** - Real-time health checks for Supabase, Redis, API
✅ **Resource Management** - Images, files, configuration, resume templates
✅ **Responsive Design** - Works on desktop and mobile devices

### Key Features
- **Session-Based Auth** - JWT tokens with MFA verification
- **Sidebar Navigation** - Collapsible navigation with quick access
- **Real-time Editors** - In-line JSON editor for configuration
- **Status Monitoring** - System health dashboard
- **Cache Management** - View and manage application cache
- **Database Operations** - Perform admin operations on database

---

## Dashboard Pages

### 1️⃣ Collections (`/dashboard`)
**Purpose:** Manage multi-language content collections

```
Collections/
├── EN, FR, ES, DE, HI, ID, MY, SI, TA, TH, AR (Language tabs)
├── Config Files
│   ├── settings.json
│   ├── routes.json
│   └── apiConfig.json
└── Data Files
    ├── articles.json
    ├── users.json
    └── products.json
```

**Features:**
- Language-specific content management
- Real-time JSON editor with syntax highlighting
- Save, clear, and close operations
- File preview and organization

**Usage:**
1. Select language tab
2. Click config or data file
3. Edit JSON content
4. Click "Save Changes" or "Clear Cache"

---

### 2️⃣ Images (`/dashboard/images`)
**Purpose:** Manage image assets

```
Images/
├── banner.png
├── logo.svg
├── hero-bg.jpg
├── avatar-default.png
└── icon-set.svg
```

**Features:**
- Grid view with image preview
- Upload new images
- Delete image files
- View image properties (size, type, date)
- Batch operations

**Usage:**
1. Click "Upload Image" button
2. Select image files
3. View images in grid
4. Click "View" or "Delete" for individual images

---

### 3️⃣ Files (`/dashboard/files`)
**Purpose:** Manage static files

```
Files/
├── robots.txt
├── sitemap.xml
├── manifest.json
├── offline.html
├── privacy-policy.html
└── terms-of-service.html
```

**Features:**
- Sortable file table with size and type
- Download files
- Delete files
- View file content
- Type-based filtering

**Usage:**
1. Browse files in table
2. Click "View" to see content
3. Click "Download" to get file
4. Click "Delete" to remove (with confirmation)

---

### 4️⃣ Config (`/dashboard/config`)
**Purpose:** Manage system configuration

```
Configuration/
├── apiRouting.json - API endpoint configuration
├── languages.json - Language definitions
├── pageLayout.json - Page layout templates
└── urlConfig.json - URL routing rules
```

**Features:**
- Card-based layout for each config
- Real-time JSON editor
- Syntax validation
- Change history
- Backup before save

**Usage:**
1. Click "Edit" on config card
2. Modify JSON in editor
3. Click "Save" to persist
4. Click "Close" to exit

---

### 5️⃣ Resume (`/dashboard/resume`)
**Purpose:** Manage resume templates and content

```
Resume/
├── Templates
│   ├── Modern Template
│   ├── Classic Template
│   ├── Minimal Template
│   └── ATS Template
├── Content Sections
│   ├── Professional Summary (3 items)
│   ├── Work Experience (5 items)
│   ├── Education (2 items)
│   ├── Skills (12 items)
│   ├── Certifications (4 items)
│   └── Projects (6 items)
```

**Features:**
- Template selection and preview
- Content section management
- Edit section items
- Export functionality
- Template switching

**Usage:**
1. Select resume template
2. Edit content sections
3. Click "Edit" to modify section items
4. Click "View" to preview
5. Export in selected format

---

### 6️⃣ Overview (`/dashboard/overview`)
**Purpose:** System health and operations

```
Overview/
├── Status Cards
│   ├── Supabase (Connections, Queries, Latency)
│   ├── Redis (Memory, Keys, Usage)
│   └── API (Requests, Errors, Uptime)
├── Cache Management
│   ├── View cached items
│   ├── Clear specific cache
│   └── Create cache
└── Operations
    ├── Database: Create/Delete/Sync
    └── Redis: Clear/Flush/Warm
```

**Features:**
- Real-time service health
- Cache statistics and management
- Database operations
- Performance metrics
- Quick action buttons

**Usage:**
1. Monitor service status at top
2. View cache statistics
3. Click operation buttons for quick actions
4. Check metrics for performance tuning

---

## Architecture

### Directory Structure
```
app/
├── dashboard/
│   ├── layout.jsx          # Main dashboard layout with sidebar
│   ├── page.jsx            # Collections page
│   ├── images/page.jsx     # Images management
│   ├── files/page.jsx      # Files management
│   ├── config/page.jsx     # Config editor
│   ├── resume/page.jsx     # Resume manager
│   └── overview/page.jsx   # System overview
├── login/
│   └── page.jsx            # Login with MFA
└── api/
    ├── admin/              # Admin operations (protected)
    │   ├── data.js         # Collections CRUD
    │   ├── db.js           # Database operations
    │   ├── cache.js        # Cache management
    │   ├── config-read.js  # Config reader
    │   ├── files.js        # File operations
    │   └── ...
    └── auth/               # Authentication
        ├── register.js     # User registration
        ├── login.js        # Login
        ├── logout.js       # Logout
        └── mfa/
            ├── setup.js    # TOTP QR setup
            └── verify.js   # TOTP verification
```

### Tech Stack
- **Frontend:** Next.js 16, React 19, Tailwind CSS
- **Backend:** Node.js 20.x, Express (in Next.js)
- **Database:** PostgreSQL (via postgres npm client)
- **Cache:** Redis (optional, via ioredis)
- **Auth:** JWT (jsonwebtoken), TOTP (otplib), Argon2 (password hashing)
- **Encryption:** AES-256-GCM (crypto module)

### Component Architecture
```
DashboardLayout
├── Sidebar Navigation
│   ├── Logo
│   ├── Nav Items (with icons)
│   ├── Collapse/Expand toggle
│   └── Sign Out button
├── Header
│   ├── Title
│   └── Breadcrumbs/Context
└── Main Content
    ├── Collections Page
    ├── Images Page
    ├── Files Page
    ├── Config Page
    ├── Resume Page
    └── Overview Page
```

---

## Setup & Configuration

### Prerequisites
- Node.js 20.x
- PostgreSQL database
- Redis (optional)
- Git

### Installation

1. **Clone Repository**
```bash
git clone <repo-url>
cd Content-Hub
```

2. **Install Dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
# Copy example env
cp .env.example .env.local

# Generate secure keys
JWT_SECRET=$(openssl rand -base64 32)
ADMIN_TOKEN=$(openssl rand -hex 32)
MFA_ENCRYPTION_KEY=$(openssl rand -hex 16)

# Add to .env.local
echo "JWT_SECRET=$JWT_SECRET" >> .env.local
echo "ADMIN_TOKEN=$ADMIN_TOKEN" >> .env.local
echo "MFA_ENCRYPTION_KEY=$MFA_ENCRYPTION_KEY" >> .env.local
```

4. **Database Setup**
```bash
# Create PostgreSQL database
createdb content_hub

# Set DATABASE_URL in .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/content_hub"
```

5. **Start Development Server**
```bash
npm run dev
# Open http://localhost:3000/login
```

### Environment Variables Required

```bash
# Authentication
JWT_SECRET=32+ character secret key
ADMIN_TOKEN=32+ character admin token
MFA_ENCRYPTION_KEY=32-char hex key for AES-256

# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Optional: Caching
REDIS_URL=redis://host:port

# Optional: Application
NODE_ENV=development|production
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## Authentication & MFA

### Login Flow

```
┌─────────────────┐
│   Login Page    │
│  Username/Pwd   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Auth API       │
│  /auth/login    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MFA Setup Page │
│   Scan QR Code  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MFA Verify     │
│  Enter 6-digit  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Dashboard      │
│  Authenticated  │
└─────────────────┘
```

### MFA Security

- **TOTP (Time-based One-Time Password)** using `otplib`
- **Secret Encryption** using AES-256-GCM
- **QR Code** for easy provisioning
- **Authenticator Apps** (Google Authenticator, Authy, Microsoft Authenticator)

### Session Management

- **Token:** JWT with claims (username, mfa)
- **Cookie:** Secure, HttpOnly, SameSite=Strict
- **Expiration:** 24 hours (configurable)
- **Verification:** Required for all dashboard routes

### API Authentication Methods

#### 1. Session Cookie (Dashboard)
```bash
# Already set after login
Cookie: auth_token=eyJhbGc...
```

#### 2. Bearer Token (Scripts/API)
```bash
Authorization: Bearer YOUR_ADMIN_TOKEN
```

#### 3. API Key Headers
```bash
x-api-key: YOUR_ADMIN_TOKEN
# or
x-admin-token: YOUR_ADMIN_TOKEN
```

---

## API Integration

### Admin Data Endpoints

#### Get Collection Data
```bash
GET /api/admin/data?action=read&language=en
```

Response:
```json
{
  "config": [
    { "name": "settings.json", "path": "..." },
    { "name": "routes.json", "path": "..." }
  ],
  "data": [
    { "name": "articles.json", "path": "..." }
  ]
}
```

#### Save Collection Data
```bash
POST /api/admin/data
Content-Type: application/json
Authorization: Bearer ADMIN_TOKEN

{
  "action": "create",
  "table": "config_files",
  "payload": {
    "filename": "settings.json",
    "file_type": "json",
    "file_content": { "theme": "dark" }
  }
}
```

### Admin Config Endpoints

#### Read Config
```bash
GET /api/admin/config-read
```

#### Update Config
```bash
POST /api/admin/config
Content-Type: application/json

{
  "filename": "languages.json",
  "content": { "languages": [...] }
}
```

### Admin Database Endpoints

#### Database Operations
```bash
POST /api/admin/db
Content-Type: application/json

{
  "operation": "create|delete|sync",
  "target": "database|table"
}
```

### Admin Cache Endpoints

#### Cache Operations
```bash
POST /api/admin/cache
Content-Type: application/json

{
  "operation": "clear|create",
  "key": "cache_key",
  "ttl": 3600
}
```

### System Health Endpoint

#### Health Check
```bash
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00Z",
  "services": {
    "database": "ok",
    "redis": "ok",
    "api": "ok"
  }
}
```

---

## Testing

### Unit Tests
```bash
npm test
```

Tests cover:
- Database connection and SSL
- Auth token generation and validation
- JWT token verification
- MFA TOTP generation and verification
- Password hashing with Argon2

### Smoke Tests
```bash
./test-all.sh
```

Tests cover:
- Complete auth flow (register → login → MFA → verify)
- Admin API operations
- File operations
- Cache management
- System health

### E2E Testing (Manual)
```bash
npm run dev
# Open http://localhost:3000/login
# Register admin user
# Complete MFA setup
# Test each dashboard page
```

### Build Verification
```bash
npm run build
# Verify no TypeScript errors
# Check all pages compile
```

---

## Deployment

### Vercel Deployment

1. **Connect GitHub Repository**
   - Push code to GitHub
   - Connect repo to Vercel

2. **Set Environment Variables**
   - JWT_SECRET
   - ADMIN_TOKEN
   - MFA_ENCRYPTION_KEY
   - DATABASE_URL
   - REDIS_URL (optional)

3. **Deploy**
   ```bash
   git push origin main
   # Automatic deployment triggered
   ```

4. **Test on Production**
   - Register first admin user
   - Complete MFA login
   - Access dashboard

### Environment Setup for Vercel

Go to **Project Settings → Environment Variables**:

| Variable | Example | Required |
|----------|---------|----------|
| JWT_SECRET | `a8f9k2m...` (32+ chars) | ✅ Yes |
| ADMIN_TOKEN | `k3p9l2m...` (32+ chars) | ✅ Yes |
| MFA_ENCRYPTION_KEY | `a1b2c3d4...` (32-char hex) | ✅ Yes |
| DATABASE_URL | `postgresql://...` | ✅ Yes |
| REDIS_URL | `redis://...` | ❌ Optional |
| NODE_ENV | `production` | ✅ Yes |

---

## Troubleshooting

### Dashboard Issues

**Problem:** Pages show 401 Unauthorized
```
→ Solution: Clear cookies and login again
→ Check: JWT_SECRET matches in all deployments
```

**Problem:** MFA QR code not showing
```
→ Solution: Ensure MFA_ENCRYPTION_KEY is set
→ Check: Key length is exactly 32 characters (hex)
```

**Problem:** Database connection fails
```
→ Solution: Verify DATABASE_URL is correct
→ Check: Database is running and accessible
→ Test: psql "postgresql://..." -c "SELECT 1"
```

**Problem:** Session expires immediately
```
→ Solution: Check JWT_SECRET consistency
→ Verify: TOKEN_EXPIRY environment variable
→ Check: Server time is synchronized
```

### API Issues

**Problem:** API returns 401 even with ADMIN_TOKEN
```
→ Solution: Check Bearer token format
→ Verify: Token matches ADMIN_TOKEN in env
→ Check: Authorization header is correct
```

**Problem:** File operations fail
```
→ Solution: Verify file paths are correct
→ Check: Permissions on /public directory
→ Ensure: Database has proper schema
```

**Problem:** Cache operations not working
```
→ Solution: Verify REDIS_URL if using Redis
→ Check: Redis is running and accessible
→ Enable: REDIS_URL in environment
```

### Build Issues

**Problem:** TypeScript compilation fails
```
→ Solution: Run npm test to find issues
→ Check: All imports have correct paths
→ Verify: Node.js version is 20.x
```

**Problem:** Module not found errors
```
→ Solution: Remove conflicting page files
→ Verify: Only app/ directory exists
→ Check: middleware.js is in root
```

**Problem:** Build slow on Vercel
```
→ Solution: Check bundle size
→ Optimize: Remove unused dependencies
→ Cache: Enable Turbopack caching
```

### Performance

**Slow Dashboard Load**
- Check database query performance
- Monitor Redis cache hit rate
- Reduce number of initial API calls
- Enable image optimization

**High Memory Usage**
- Monitor file editor with large JSON
- Clear browser cache
- Reduce poll frequency for health checks
- Check for memory leaks in dev tools

**Slow API Responses**
- Check database indexes
- Enable Redis caching
- Optimize queries
- Monitor network latency

---

## Security Best Practices

✅ **Passwords**
- Minimum 12 characters
- Mix uppercase, lowercase, numbers, symbols
- Use Argon2 for hashing (not plain text)

✅ **Tokens**
- ADMIN_TOKEN: 32+ random characters
- JWT_SECRET: 32+ random characters
- MFA_ENCRYPTION_KEY: 32-char hex (openssl rand -hex 16)
- Rotate tokens regularly

✅ **Database**
- Use SSL/TLS for connections
- Strong password for database user
- Restrict network access
- Regular backups

✅ **Session**
- Secure flag: Set for HTTPS only
- HttpOnly flag: Prevent JavaScript access
- SameSite: Strict for CSRF protection
- Short expiration: 24 hours or less

✅ **API**
- HTTPS only in production
- Rate limiting on auth endpoints
- Input validation on all endpoints
- Audit logging for admin operations

✅ **MFA**
- TOTP secrets encrypted at rest
- Backup codes for account recovery
- Enforce MFA for all admin users

---

## Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and test: `npm test && npm run build`
3. Commit with message: `git commit -am "feat: description"`
4. Push to branch: `git push origin feature/my-feature`
5. Submit pull request

---

## Support & Documentation

- **Dashboard Guide:** [ADMIN_DASHBOARD.md](./ADMIN_DASHBOARD.md)
- **Deployment Guide:** [DEPLOYMENT_TESTING.md](./DEPLOYMENT_TESTING.md)
- **Security Guide:** [SECURITY_ENHANCEMENTS.md](./SECURITY_ENHANCEMENTS.md)
- **API Documentation:** See `/api` endpoint files

---

## License

See [LICENSE](../LICENSE) file for details.

---

**Last Updated:** January 15, 2025
**Version:** 2.0.0
**Status:** Production Ready ✅
