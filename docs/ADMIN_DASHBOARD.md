# Admin Dashboard Documentation

## Overview

The admin dashboard provides a comprehensive interface for managing content, configuration, and system operations. It's built with Next.js 16 (App Router) and Tailwind CSS, with full authentication via TOTP MFA.

## Dashboard Pages

### 1. Collections (`/dashboard`)
Manage multi-language content collections.

**Features:**
- Language tabs (EN, FR, ES, DE, HI, ID, MY, SI, TA, TH, AR)
- Config files editor
- Data files editor
- JSON inline editor with syntax highlighting
- Save/Clear/Close operations

**API Integration:**
- `GET /api/admin/data?action=read` - Fetch collection data
- `POST /api/admin/data` - Save collection changes

**Structure:**
```
collections/
├── en/
│   ├── config/
│   │   ├── settings.json
│   │   └── routes.json
│   └── data/
│       ├── articles.json
│       ├── users.json
│       └── products.json
├── fr/
└── ... (other languages)
```

### 2. Images (`/dashboard/images`)
Manage image assets for the application.

**Features:**
- Image grid view with preview
- Upload new images
- Delete image files
- View image properties

**API Integration:**
- `GET /api/admin/data?table=images` - List images
- `POST /api/admin/data` - Upload image
- `DELETE /api/admin/data` - Delete image

### 3. Files (`/dashboard/files`)
Manage static files (robots.txt, sitemap.xml, HTML files, etc.).

**Features:**
- File list table with size and type information
- View file contents
- Download files
- Delete files
- File type badges

**API Integration:**
- `GET /api/admin/files-storage-read` - List files
- `POST /api/admin/files` - Upload file
- `DELETE /api/admin/files` - Delete file

### 4. Config (`/dashboard/config`)
Manage system configuration files.

**Features:**
- Configuration file editor
- Support for JSON, YAML, and plain text formats
- Real-time preview
- Backup before changes
- File history tracking

**Editable Files:**
- `apiRouting.json` - API route configuration
- `languages.json` - Language settings
- `pageLayout.json` - Page layout definitions
- `urlConfig.json` - URL routing configuration

**API Integration:**
- `GET /api/admin/config-read` - Read config files
- `POST /api/admin/config` - Save config changes

### 5. Resume (`/dashboard/resume`)
Manage resume templates and content.

**Features:**
- Resume template selection (Modern, Classic, Minimal, ATS)
- Content section management
- Edit resume content
- Preview different templates
- Export as PDF

**Resume Templates:**
- `template-modern.json` - Contemporary design
- `template-classic.json` - Traditional layout
- `template-minimal.json` - Minimalist style
- `template-ats.json` - ATS-optimized format

**API Integration:**
- `GET /api/admin/data?table=resume` - Fetch resume data
- `POST /api/admin/data` - Save resume changes

### 6. Overview (`/dashboard/overview`)
System health and operations dashboard.

**Features:**
- Service status cards (Supabase, Redis, API)
- Real-time metrics and statistics
- Cache management interface
- Database operations
- Quick action buttons

**Status Cards Display:**
- Connection counts and latency
- Cache memory usage and hit rates
- API uptime and error metrics
- System resource utilization

**Quick Operations:**
- Clear cache
- Create/delete database
- Sync database
- Flush expired keys
- Warm cache

**API Integration:**
- `GET /api/health` - System health check
- `POST /api/admin/db` - Database operations
- `POST /api/admin/cache` - Cache management

## Authentication & Security

### Login Flow
1. Navigate to `/login`
2. Enter username and password
3. System sends temporary session token
4. Receive TOTP QR code and secret key
5. Scan QR code in authenticator app
6. Enter 6-digit TOTP code
7. Receive final session cookie with `mfa=true`

### Session Management
- Session tokens stored in `auth_token` cookie
- JWT-based with 24-hour expiration
- `mfa=true` flag indicates MFA verification
- Middleware enforces authentication on all `/dashboard/*` routes

### API Authentication
Admin API routes accept authentication via:
1. **Session Cookie** (preferred for dashboard)
   - Cookie name: `auth_token`
   - Must have `mfa=true` claim

2. **Bearer Token** (for external scripts/integrations)
   - Header: `Authorization: Bearer {TOKEN}`
   - Token format: `ADMIN_TOKEN` environment variable

3. **API Key Headers** (alternative)
   - Header: `x-api-key: {TOKEN}`
   - Or: `x-admin-token: {TOKEN}`

### Environment Variables Required
```
ADMIN_TOKEN=your-secure-token-here
MFA_ENCRYPTION_KEY=32-char-hex-key-for-aes256
DATABASE_URL=postgresql://...
REDIS_URL=redis://... (optional)
```

## Dashboard Navigation

### Sidebar
- **Collapsible:** Toggle between expanded and minimized views
- **Navigation Items:**
  - 📚 Collections
  - 🖼️ Images
  - 📄 Files
  - ⚙️ Config
  - 📋 Resume
  - 📊 Overview

- **Actions:**
  - Collapse/Expand toggle
  - Sign Out button

### Header
- Title: "CMS Admin"
- Subtitle: "Manage content and configuration"
- Current page context

## API Endpoints

### Admin Routes (Protected)
All require valid session or ADMIN_TOKEN.

```
GET    /api/admin/data?action=read&table=COLLECTION
POST   /api/admin/data
DELETE /api/admin/data

GET    /api/admin/files-storage-read
POST   /api/admin/files
DELETE /api/admin/files

GET    /api/admin/config-read
POST   /api/admin/config

POST   /api/admin/db
POST   /api/admin/cache

GET    /api/admin/sync
POST   /api/admin/operations

GET    /api/admin/logs
```

### Auth Routes
```
POST   /api/auth/register          # Create new admin user
POST   /api/auth/login             # Login with credentials
POST   /api/auth/mfa/setup         # Get TOTP QR code
POST   /api/auth/mfa/verify        # Verify TOTP code
POST   /api/auth/logout            # Clear session

GET    /api/health                 # System health check
```

## Styling & Design

### Color Scheme
- **Primary:** Blue (#3B82F6)
- **Success:** Green (#10B981)
- **Warning:** Orange (#F59E0B)
- **Error:** Red (#EF4444)
- **Neutral:** Gray scale

### Components
- **Cards:** White bg, rounded corners, subtle shadow
- **Buttons:** Primary blue, hover state darkening
- **Tables:** Striped rows with hover states
- **Forms:** Full-width inputs, clear labels
- **Modals:** Overlay with centered content

### Responsive Design
- Desktop-first approach
- Sidebar navigation (responsive)
- Grid layouts adapt to screen size
- Mobile-optimized tables (horizontal scroll)

## Development Guide

### File Structure
```
app/
├── dashboard/
│   ├── layout.jsx           # Main dashboard layout with sidebar
│   ├── page.jsx             # Collections page
│   ├── images/
│   │   └── page.jsx         # Images management
│   ├── files/
│   │   └── page.jsx         # Files management
│   ├── config/
│   │   └── page.jsx         # Config editor
│   ├── resume/
│   │   └── page.jsx         # Resume manager
│   └── overview/
│       └── page.jsx         # System overview
├── login/
│   └── page.jsx             # Login page with MFA
└── api/
    ├── admin/               # Admin API routes
    │   ├── data.js
    │   ├── db.js
    │   ├── cache.js
    │   └── ...
    └── auth/                # Auth API routes
        ├── register.js
        ├── login.js
        ├── logout.js
        └── mfa/
            ├── setup.js
            └── verify.js
```

### Adding New Dashboard Pages

1. Create directory: `app/dashboard/[feature]/`
2. Create `page.jsx` with "use client" directive
3. Use existing components (Cards, Tables, etc.)
4. Implement API integration
5. Add sidebar navigation item in `app/dashboard/layout.jsx`

Example:
```jsx
"use client";
import { useState, useEffect } from "react";

export default function FeaturePage() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const res = await fetch("/api/admin/feature");
    setData(await res.json());
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Feature Title</h1>
      {/* Content here */}
    </div>
  );
}
```

## Testing

### Local Testing
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm test                 # Run Jest unit tests
./test-all.sh           # Run comprehensive smoke tests
```

### End-to-End Flow
1. Start dev server: `npm run dev`
2. Navigate to `http://localhost:3000/login`
3. Register admin account (first user must register)
4. Complete MFA setup
5. Access dashboard at `http://localhost:3000/dashboard`
6. Test each page and API integration

### Vercel Deployment Testing
1. Set environment variables (ADMIN_TOKEN, MFA_ENCRYPTION_KEY)
2. Deploy to Vercel
3. Register admin user via API: `POST /api/auth/register`
4. Test MFA flow on production domain
5. Run smoke tests against production

## Troubleshooting

### Session Cookie Not Set
- Check `lib/auth.js` cookie configuration
- Verify `mfa=true` claim is present in JWT
- Clear browser cookies and retry login

### API Authentication Fails
- Verify `ADMIN_TOKEN` is set in `.env.local`
- Check Bearer token format in request headers
- Ensure session cookie is being sent with requests

### Pages Not Loading
- Check middleware configuration in `middleware.js`
- Verify routes are protected correctly
- Check browser console for errors

### Build Errors
- Remove conflicting Pages Router files (`pages/` directory)
- Verify all imports use correct relative paths
- Check Node.js version (should be 20.x)

## Future Enhancements

- [ ] Real-time collaboration on config files
- [ ] Advanced search and filtering
- [ ] File version history and rollback
- [ ] Scheduled cache warming
- [ ] Audit logs for all admin actions
- [ ] Role-based access control (RBAC)
- [ ] Backup and restore functionality
- [ ] Analytics dashboard
- [ ] Performance monitoring charts
