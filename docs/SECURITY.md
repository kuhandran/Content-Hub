# Security & Public Readiness Checklist

Use this checklist before making the repository public or deploying broadly.

## Secrets & Environment
- Ensure no secrets are committed. Verify `.gitignore` ignores `.env`, `.env.*`.
- Store production secrets in your platform (Vercel) env settings.
- Rotate any credentials that may have been committed historically.

## Database
- `lib/postgres.js` enforces SSL in production.
- Use a least-privilege DB user for runtime (no `DROP DATABASE`).
- Keep destructive scripts (e.g. `db:drop`) for local use only.

## API Access
- Protect admin endpoints (`/api/admin/*`) behind auth.
- Configure allowed origins (`src/config/allowedOrigins.js`) appropriately.
- Add rate limiting to sensitive endpoints.

## Caching & Logs
- Avoid logging sensitive data.
- Clear caches on sync/update; confirm Redis keys TTLs align with needs.

## Frontend
- Validate user inputs; sanitize output (XSS protection).
- Keep dependencies updated; run `npm audit` periodically.

## Repository Hygiene
- Root `README.md` points to `docs/`.
- Issue templates and CODE_OF_CONDUCT are recommended for public repos.
- LICENSE present (MIT).

## Deployment
- Verify `vercel.json` and build command.
- Confirm environment variables in Vercel.
- Test endpoints and review deployment logs.
