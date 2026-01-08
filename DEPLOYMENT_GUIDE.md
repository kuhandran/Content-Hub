# 🚀 Deployment Guide - Content Hub Monorepo

Complete guide for deploying Content Hub to Vercel and Docker.

## 📋 Table of Contents

1. [Vercel Deployment](#vercel-deployment)
2. [Docker Deployment](#docker-deployment)
3. [Environment Variables](#environment-variables)
4. [Troubleshooting](#troubleshooting)

---

## Vercel Deployment

### Prerequisites
- Vercel account (https://vercel.com)
- GitHub repository linked to Vercel
- Supabase account with database credentials

### Step 1: Connect Repository to Vercel

```bash
# Push code to GitHub
git push origin main

# Visit Vercel dashboard
# Import project from GitHub
# Select the Content-Hub repository
```

### Step 2: Configure Environment Variables

In Vercel Project Settings → Environment Variables, add:

```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
POSTGRES_URL=your_postgres_url
BACKEND_PORT=3001
FRONTEND_PORT=3000
NODE_ENV=production
```

### Step 3: Review Deployment Settings

Vercel will auto-detect the monorepo structure:
- **Build Command:** `npm run setup-db && npm run build --workspaces`
- **Install Command:** `npm ci --workspaces`
- **Framework:** Next.js (auto-detected)

### Step 4: Deploy

```bash
# Automatic deployment on push
git push origin main

# Or manual deployment
vercel deploy --prod
```

### Step 5: Verify Deployment

```bash
# Check frontend
curl https://your-domain.vercel.app

# Check backend API
curl https://your-domain.vercel.app/api/admin/operations

# Check database status
curl -X POST https://your-domain.vercel.app/api/admin/operations \
  -H "Content-Type: application/json" \
  -d '{"operation": "status"}'
```

### Accessing the Deployed Application

- **Frontend:** `https://your-domain.vercel.app`
- **Backend API:** `https://your-domain.vercel.app/api`
- **API Docs:** `https://your-domain.vercel.app/api/admin/operations`

---

## Docker Deployment

### Prerequisites
- Docker installed
- Docker Compose (optional, for easy orchestration)
- Supabase credentials

### Local Docker Development

#### Option 1: Using Docker Compose (Recommended)

```bash
# 1. Create .env.local with your credentials
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 2. Build and start containers
docker-compose up --build

# 3. Access services
# Frontend: http://localhost:3000
# Backend: http://localhost:3001/api

# 4. Stop services
docker-compose down
```

#### Option 2: Individual Docker Containers

```bash
# Build images
docker build -t content-hub-backend apps/backend
docker build -t content-hub-frontend apps/frontend

# Run backend
docker run -p 3001:3001 \
  -e SUPABASE_URL=your_url \
  -e SUPABASE_SERVICE_ROLE_KEY=your_key \
  --name backend \
  content-hub-backend

# Run frontend (in another terminal)
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:3001 \
  --name frontend \
  content-hub-frontend
```

### Production Docker Deployment

#### Option 1: Docker Hub

```bash
# 1. Tag images
docker tag content-hub-backend your-docker-username/content-hub-backend:latest
docker tag content-hub-frontend your-docker-username/content-hub-frontend:latest

# 2. Push to Docker Hub
docker push your-docker-username/content-hub-backend:latest
docker push your-docker-username/content-hub-frontend:latest

# 3. Deploy on any Docker-compatible hosting
# (DigitalOcean App Platform, AWS ECS, Azure Container Instances, etc.)
```

#### Option 2: Container Orchestration (Kubernetes)

```bash
# Create a Kubernetes deployment file (k8s-deployment.yaml)
# Deploy to your cluster
kubectl apply -f k8s-deployment.yaml
```

### Docker Compose Production File

```yaml
version: '3.8'

services:
  backend:
    image: your-registry/content-hub-backend:latest
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - BACKEND_PORT=3001
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    restart: always

  frontend:
    image: your-registry/content-hub-frontend:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://backend:3001
    restart: always
    depends_on:
      - backend
```

---

## Environment Variables

### Required for Both Services

```bash
# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxxx...

# Optional: Direct PostgreSQL Connection
POSTGRES_URL=postgres://user:password@host/dbname
```

### Backend-Specific

```bash
BACKEND_PORT=3001
NODE_ENV=production
```

### Frontend-Specific

```bash
FRONTEND_PORT=3000
NEXT_PUBLIC_API_URL=http://backend:3001  # Local dev
# In production:
NEXT_PUBLIC_API_URL=https://your-domain.vercel.app/api
```

### All Variables

```bash
# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Database (optional)
POSTGRES_URL=
REDIS_URL=

# Ports
BACKEND_PORT=3001
FRONTEND_PORT=3000

# Environment
NODE_ENV=production

# API
NEXT_PUBLIC_API_URL=https://your-domain.vercel.app/api

# Application
APP_NAME=Content Hub
APP_VERSION=2.0.0
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database credentials verified
- [ ] Code committed to main branch
- [ ] Dependencies updated and locked

### Vercel Deployment
- [ ] Repository connected to Vercel
- [ ] Environment variables set in Vercel dashboard
- [ ] Build command verified: `npm run setup-db && npm run build --workspaces`
- [ ] Install command verified: `npm ci --workspaces`
- [ ] Auto-deploy on push enabled
- [ ] Domain configured (custom or vercel.app)

### Docker Deployment
- [ ] Dockerfiles tested locally
- [ ] Docker images built successfully
- [ ] Images pushed to registry
- [ ] docker-compose.yml configured
- [ ] Environment variables loaded from .env

### Post-Deployment
- [ ] Frontend loads at root URL
- [ ] Backend API responds to requests
- [ ] Database connections working
- [ ] File sync operations functional
- [ ] Monitoring/logging enabled

---

## Health Checks

### Frontend Health Check

```bash
curl -I https://your-domain.vercel.app
# Expected: 200 OK
```

### Backend Health Check

```bash
curl https://your-domain.vercel.app/api/admin/operations
# Expected: JSON response with available operations
```

### Database Health Check

```bash
curl -X POST https://your-domain.vercel.app/api/admin/operations \
  -H "Content-Type: application/json" \
  -d '{"operation": "status"}'
# Expected: Database table counts
```

---

## Performance Optimization

### Frontend
```javascript
// Next.js image optimization
import Image from 'next/image';

// Static generation where possible
export const getStaticProps = async () => { ... }
```

### Backend
```javascript
// Database query optimization
// Use indexes on frequently queried columns
// Implement caching with Redis
```

### Vercel
- Enable Edge Caching
- Use Web Analytics for monitoring
- Configure ISR (Incremental Static Regeneration)
- Monitor function execution time

---

## Monitoring & Logging

### Vercel Dashboard
- Visit https://vercel.com/dashboard
- View build logs
- Monitor function analytics
- Check uptime and performance

### Docker Logs
```bash
# Backend logs
docker logs backend -f

# Frontend logs
docker logs frontend -f

# Docker Compose all logs
docker-compose logs -f
```

### Application Logging
```bash
# Check application logs
tail -f logs/database.log
tail -f logs/api.log
```

---

## Rolling Back

### Vercel
```bash
# View deployment history
vercel list

# Rollback to previous deployment
vercel rollback
```

### Docker
```bash
# List images
docker images

# Run previous version
docker run -p 3001:3001 content-hub-backend:v1.0.0
```

### GitHub
```bash
# Revert to previous commit
git revert <commit-hash>
git push origin main
```

---

## Scaling

### Vercel (Auto-scaling)
- Vercel automatically scales backend functions
- Frontend served on CDN globally
- No manual scaling needed

### Docker (Manual Scaling)
```bash
# Load balancing with Nginx
docker run -p 80:80 nginx:latest

# Multiple backend replicas
docker run -p 3001:3001 content-hub-backend
docker run -p 3002:3001 content-hub-backend
```

---

## Security

### Environment Variables
- Never commit `.env.local` to Git
- Use `.env.example` for documentation
- Rotate credentials regularly
- Use Vercel Environment Variables for secrets

### HTTPS
- Vercel provides automatic SSL/TLS
- Enable HSTS headers
- Configure CSP headers in `next.config.js`

### Database
- Use Supabase's built-in security features
- Enable Row Level Security (RLS) on tables
- Regular backups via Supabase dashboard

### API Security
- Implement rate limiting
- Add authentication/authorization
- Validate all inputs
- Use CORS properly

---

## Troubleshooting

### Build Failures

**Error: "Module not found"**
```bash
# Solution: Clean install
npm ci --workspaces --force
```

**Error: "ENOSPC"**
```bash
# Solution: Increase Node memory
export NODE_OPTIONS=--max_old_space_size=4096
npm run build
```

### Runtime Issues

**Port already in use**
```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

**Database connection error**
```bash
# Verify credentials
cat .env.local | grep SUPABASE

# Test connection
npm run setup-db
```

### Deployment Issues

**Vercel build timeout**
- Increase build timeout in project settings
- Optimize database setup script
- Consider caching

**Docker image too large**
- Use alpine base images
- Prune unused dependencies
- Multi-stage builds

---

## Support & Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Docker Documentation](https://docs.docker.com)
- [Supabase Docs](https://supabase.com/docs)
- [GitHub Issues](https://github.com/kuhandran/Content-Hub/issues)

---

Last Updated: January 8, 2026
