# Content Hub

A Next.js-based content delivery and sync system with a Postgres-first backend and on-demand sync utilities.

## Quick Start
- Install: `npm install`
- Dev: `npm run dev`
- Build & initialize DB: `npm run build`
- Drop DB safely: `npm run db:drop` (destructive; see docs)
- Reset schema: `npm run db:reset`

## Documentation
See the complete documentation index in `docs/README.md`.

- Architecture: `docs/architecture.md`
- Database: `docs/db-structure.md`
- Sync Strategy: `docs/sync-strategy.md`
- API Reference: `docs/api.md`
- Quick Reference: `docs/quick-reference.md`
- Deployment: `docs/deployment-guide.md`, `docs/deploy-to-vercel.md`

## Notes
- Environment variables are required (local `.env`, set in Vercel).
- All database access is server-only; do not import DB client in browser code.

## Environment Setup
Create a local `.env` (do not commit) with placeholders like below:

```dotenv
# Database (preferred)
DATABASE_URL="postgresql://USER:PASS@HOST:PORT/DBNAME?sslmode=require"

# Supabase (optional fallback / public anon)
SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon-key>"

# Cache (optional)
REDIS_URL="redis://default:PASSWORD@HOST:PORT"

# Auth (optional)
JWT_SECRET="<random-strong-secret>"
```

Guidelines:
- Keep secrets out of git. `.gitignore` already ignores `.env` files.
- Store production secrets in your hosting provider’s env settings.
- Rotate any credentials that were previously committed.
