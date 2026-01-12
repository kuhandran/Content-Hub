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
- Environment variables are required (`.env`, Vercel envs).
- All database access is server-only; do not import DB client in browser code.
