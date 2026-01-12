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
ADMIN_TOKEN="<set-to-enable-admin-API-auth>"
MFA_ENCRYPTION_KEY="<32-char key for encrypting MFA secrets>"
## MFA (Free, TOTP-based)
- What: Use TOTP (Time-based One-Time Password) via authenticator apps (Google Authenticator, Authy). No paid service required.
- How it works:
	- User registers with username/password (passwords hashed with Argon2).
	- On first login, backend generates a TOTP secret and QR (otplib + qrcode).
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
