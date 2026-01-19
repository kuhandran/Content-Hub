# Content Hub

A Next.js-based content delivery and sync system with a PostgreSQL-first backend and clean MVC architecture.

## Quick Start
- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Reset DB: `npm run db:reset`
- Drop DB: `npm run db:drop`

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── controllers/        # Request orchestration
│   │   ├── helpers/           # Reusable utilities (auth, response)
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Infrastructure (database, cache)
│   │   ├── admin/             # Admin APIs
│   │   ├── auth/              # Authentication APIs
│   │   └── dashboard/         # Dashboard APIs
│   ├── components/            # React components
│   ├── login/                 # Login page
│   └── admin/                 # Admin dashboard
├── lib/                       # Core utilities
├── public/                    # Static files
├── utils/                     # Client utilities
└── docs/                      # Documentation
```

## Architecture

### API Pattern: MVC with Services

Each API follows a clean separation of concerns:

- **Routes** (`app/api/*/route.js`): Clean entry points, minimal logic
- **Controllers** (`app/api/controllers/`): Orchestration and coordination
- **Helpers** (`app/api/helpers/`): Reusable utilities (auth, responses)
- **Services** (`app/api/services/`): Pure business logic
- **Utils** (`app/api/utils/`): Infrastructure (database, cache)

See [API_ARCHITECTURE.md](API_ARCHITECTURE.md) for detailed refactoring guide.

## Core Features

- ✅ JWT Authentication with MFA support
- ✅ File synchronization from `/public` to database
- ✅ Admin dashboard with dynamic tabs
- ✅ Redis caching support
- ✅ PostgreSQL + Supabase fallback
- ✅ Debug panel for logout tracking
- ✅ Comprehensive error logging

## Documentation

### Essential Documentation

- [Quick Start Guide](docs/QUICK_START.md)
- [API Architecture](API_ARCHITECTURE.md)
- [Authentication Setup](docs/AUTH_SETUP.md)
- [API Reference](docs/api.md)
- [Database Schema](docs/DATABASE_SCHEMA.sql)
- [Deployment Guide](docs/DEPLOYMENT_TESTING.md)
- [Security Policy](docs/SECURITY.md)

For advanced topics, changelogs, and additional guides, see the [docs/ folder](docs/).

## Developer Docs Index

- [Quick Start](docs/QUICK_START.md): Step-by-step setup and first run
- [Project Architecture](API_ARCHITECTURE.md): How the codebase is structured
- [API Reference](docs/api.md): Endpoints, request/response, usage
- [Authentication & MFA](docs/AUTH_SETUP.md): Auth flow, MFA, security notes
- [Database Schema](docs/DATABASE_SCHEMA.sql): Table structure and relationships
- [Deployment Guide](docs/DEPLOYMENT_TESTING.md): How to deploy and test
- [Security Policy](docs/SECURITY.md): Vulnerability reporting and best practices
- [Resume Upload Setup](docs/RESUME_UPLOAD_SETUP.md): For resume-related features
- [Collections Editor Overview](docs/COLLECTIONS_EDITOR_README.md): Guide to the collections editor
- [Changelog & Updates](docs/COLLECTIONS_EDITOR_CHANGE_LOG.md): Recent changes and improvements

For more, see the [docs/ folder](docs/).

	- User scans the QR in their authenticator and submits the 6-digit code.
	- Backend verifies the code and stores the secret encrypted (AES-256-GCM) using `MFA_ENCRYPTION_KEY`.
	- Subsequent logins require the 6-digit code; upon success, a JWT session cookie is issued.

### Enable MFA
- Ensure database is reachable (Postgres `DATABASE_URL` or Supabase).
- Set env values: `JWT_SECRET` and `MFA_ENCRYPTION_KEY`.
- Start the app and visit `/login`. After password, you’ll be prompted for MFA and a QR code will be shown.

### Security Notes
- Store `MFA_ENCRYPTION_KEY` securely and rotate if needed (migration required).
- Consider backup codes and an admin reset flow for locked-out users.
- Cookies are HttpOnly and Secure in production; JWT expires in ~8 hours by default.

### Try It Locally
```bash
npm install
npm run dev
# Register a user
curl -sS -X POST -H 'Content-Type: application/json' \
	-d '{"username":"admin","password":"changeMe"}' \
	http://localhost:3000/api/auth/register
# Visit http://localhost:3000/login and complete MFA
```

```

Guidelines:
- Keep secrets out of git. `.gitignore` already ignores `.env` files.
- Store production secrets in your hosting provider’s env settings.
- Rotate any credentials that were previously committed.
