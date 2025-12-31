# 🚀 Deployment & Setup Guide

Production-ready guide for deploying Collections CMS to various platforms.

## Prerequisites

- Node.js 16+ (or 18+ for best performance)
- npm or yarn package manager
- 500MB+ disk space
- Internet connection (for initial setup)

## Local Development Setup

### Step 1: Clone & Install

```bash
git clone <repository-url>
cd data
npm install
```

### Step 2: Configure Environment

Create `.env` file (optional, defaults provided):

```env
# Security
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRY=24h

# Server
NODE_ENV=development
PORT=3001
HOST=localhost

# Cache
CACHE_TTL_JSON=1800000        # 30 minutes
CACHE_TTL_IMAGES=7200000      # 2 hours
CACHE_TTL_OTHER=3600000       # 1 hour

# Authentication
AUTH_USER=Kuhandran
AUTH_PASSWORD=secure-password  # Change this!
```

### Step 3: Start Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start

# With PM2
pm2 start src/server.js --name "collections-cms"
```

### Step 4: Access Dashboard

- Open http://localhost:3001
- Login with username: `Kuhandran`
- Default password in AUTH_TESTING.md

---

## Docker Deployment

### Simple Docker Image

```bash
# Build
docker build -t collections-cms:latest .

# Run
docker run -d \
  --name collections-cms \
  -p 3001:3001 \
  -e JWT_SECRET=your-secret \
  -v $(pwd)/public:/app/public \
  collections-cms:latest
```

### Docker Compose (Recommended)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  cms:
    build: .
    container_name: collections-cms
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET:-change-me-in-production}
      - PORT=3001
    volumes:
      - ./public:/app/public
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

Deploy:

```bash
# Set environment variable
export JWT_SECRET="your-production-secret-key"

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f cms

# Stop
docker-compose down
```

---

## Cloud Deployment

### Heroku

```bash
# 1. Create Heroku account & install CLI
curl https://cli-assets.heroku.com/install.sh | sh

# 2. Login
heroku login

# 3. Create app
heroku create your-cms-app-name

# 4. Set environment variables
heroku config:set JWT_SECRET=your-secret
heroku config:set NODE_ENV=production

# 5. Deploy
git push heroku main

# 6. View logs
heroku logs --tail
```

**Procfile** (already included):
```
web: node src/server.js
```

### AWS EC2

#### Setup EC2 Instance

1. **Create EC2 instance** (Ubuntu 20.04 LTS, t3.micro)
2. **Security Group** - Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)
3. **Key Pair** - Download and secure your PEM file

#### Install & Deploy

```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone <your-repo-url>
cd data

# Install dependencies
npm install --production

# Create .env file
nano .env
# Add: JWT_SECRET=your-secret, NODE_ENV=production

# Install PM2 for process management
sudo npm install -g pm2

# Start app
pm2 start src/server.js --name "cms"
pm2 startup
pm2 save

# Verify
curl http://localhost:3001/api/health
```

#### Setup Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install -y nginx

# Create config
sudo nano /etc/nginx/sites-available/default
```

Paste this configuration:

```nginx
upstream cms_backend {
    server localhost:3001;
}

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS (optional)
    # return 301 https://$server_name$request_uri;
    
    # Main proxy
    location / {
        proxy_pass http://cms_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for large file uploads
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }
    
    # Cache static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Test Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Enable Nginx
sudo systemctl enable nginx
```

#### Setup SSL/HTTPS (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (automatic)
sudo certbot --nginx -d your-domain.com

# Auto-renew
sudo systemctl enable certbot.timer
```

### Google Cloud Run

```bash
# Install gcloud CLI
curl https://sdk.cloud.google.com | bash

# Authenticate
gcloud auth login

# Deploy
gcloud run deploy collections-cms \
  --source . \
  --platform managed \
  --region us-central1 \
  --memory 512Mi \
  --set-env-vars JWT_SECRET=your-secret

# View URL
gcloud run services list
```

### DigitalOcean App Platform

1. **Connect GitHub** - Link your repo
2. **Create App** - Select your repository
3. **Configure**:
   - Buildpack: Node.js
   - Run Command: `npm start`
4. **Environment** - Add `JWT_SECRET`
5. **Deploy** - Click "Launch"

### Azure App Service

```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login
az login

# Create resource group
az group create --name cms-group --location eastus

# Create App Service Plan
az appservice plan create \
  --name cms-plan \
  --resource-group cms-group \
  --sku B1

# Create Web App
az webapp create \
  --name collections-cms \
  --resource-group cms-group \
  --plan cms-plan \
  --runtime "NODE|18"

# Deploy
az webapp deployment source config-zip \
  --resource-group cms-group \
  --name collections-cms \
  --src-path <path-to-zip>
```

---

## Production Checklist

### Security
- [ ] Change default JWT secret
- [ ] Update authentication credentials
- [ ] Enable HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Enable IP whitelisting (if needed)
- [ ] Set up intrusion detection
- [ ] Regular security audits

### Performance
- [ ] Enable gzip compression
- [ ] Set up CDN (if needed)
- [ ] Configure cache headers
- [ ] Monitor memory usage
- [ ] Set up auto-scaling (cloud)
- [ ] Load test the system
- [ ] Monitor response times

### Reliability
- [ ] Set up automated backups
- [ ] Test backup recovery
- [ ] Implement health checks
- [ ] Set up error monitoring
- [ ] Enable logging to file/service
- [ ] Implement rate limiting
- [ ] Test failover procedures

### Maintenance
- [ ] Document your setup
- [ ] Create runbooks
- [ ] Set up monitoring alerts
- [ ] Plan update schedule
- [ ] Test update process
- [ ] Document rollback plan
- [ ] Schedule regular reviews

---

## Monitoring & Maintenance

### Health Check

```bash
# Check if API is running
curl http://localhost:3001/api/health

# Expected response:
# {"status":"online","user":{...},"timestamp":"..."}
```

### View Logs

**Local:**
```bash
# Real-time logs
pm2 logs

# Restart app
pm2 restart cms

# Stop app
pm2 stop cms
```

**Docker:**
```bash
# View logs
docker-compose logs -f cms

# Execute command in container
docker exec collections-cms node -v
```

### Backup Collections

```bash
# Manual backup via API
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3001/api/backup/export \
  -o backup-$(date +%Y%m%d-%H%M%S).zip

# Or via dashboard: Click "💾 Backup" button
```

### Update Node.js

```bash
# Check current version
node --version

# Update (Linux)
sudo apt update
sudo apt upgrade nodejs

# Update (macOS with Homebrew)
brew upgrade node

# Restart app
pm2 restart cms
```

---

## Scaling Guide

### Vertical Scaling (Bigger Server)
1. Increase server size (RAM, CPU)
2. No code changes needed
3. Restart application

### Horizontal Scaling (Multiple Servers)

For production multi-server setup:

1. **Set up shared storage**
   - AWS S3 for collections
   - Database for sessions
   - Redis for caching

2. **Use reverse proxy**
   - Nginx with load balancing
   - HA-Proxy alternative

3. **Distribute load**
   - Round-robin DNS
   - Cloud load balancer
   - Geographic distribution

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>

# Or change port
PORT=3002 npm start
```

### Permission Denied (Linux)

```bash
# Fix file permissions
chmod -R 755 public/
chmod -R 755 src/

# Fix directory permissions
chmod -R 755 /app
```

### Out of Memory

```bash
# Increase Node.js memory limit
NODE_OPTIONS=--max-old-space-size=2048 npm start

# Monitor memory
pm2 monit
```

### SSL Certificate Errors

```bash
# Check certificate validity
openssl x509 -in cert.pem -text -noout

# Renew Let's Encrypt (auto)
sudo certbot renew --dry-run

# Manual renewal
sudo certbot renew
```

### Cache Issues

```bash
# Clear all caches
# Edit src/core/cache-manager.js and restart

# Or access API to invalidate specific cache
curl -X DELETE http://localhost:3001/api/cache/clear \
  -H "Authorization: Bearer TOKEN"
```

---

## Performance Optimization

### Enable Compression

```nginx
# In Nginx config
gzip on;
gzip_vary on;
gzip_min_length 1000;
gzip_types text/plain text/css text/xml application/json application/javascript;
```

### Cache Static Assets

```nginx
# In Nginx config
location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### Database Optimization (If scaled)

```javascript
// Consider adding Redis for session/cache:
npm install redis
// Configure in cache-manager.js
```

---

## Backup & Disaster Recovery

### Automated Backups

```bash
#!/bin/bash
# backup-daily.sh

BACKUP_DIR="/backups/cms"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Create backup
mkdir -p $BACKUP_DIR
zip -r $BACKUP_DIR/collections-$TIMESTAMP.zip /app/public/collections

# Keep only last 30 days
find $BACKUP_DIR -name "*.zip" -mtime +30 -delete
```

### Restore from Backup

```bash
# Extract backup
unzip backup-20240105-120000.zip

# Restart application
pm2 restart cms

# Verify
curl http://localhost:3001/api/config/statistics
```

---

## Success Indicators

✅ **Setup is complete when:**
- [ ] Server starts without errors
- [ ] Dashboard loads at http://localhost:3001
- [ ] Can login with credentials
- [ ] Statistics load showing 10 locales
- [ ] Search functionality works
- [ ] Can edit and save files
- [ ] Backup downloads ZIP file
- [ ] Dark mode toggle works
- [ ] API endpoints respond correctly

---

## Next Steps

1. **Configure your domain** - Point DNS to server
2. **Set up monitoring** - Enable error tracking
3. **Create backup schedule** - Daily automated backups
4. **Document setup** - Write runbook
5. **Test disaster recovery** - Practice restore process
6. **Go live!** - Deploy to production

---

## Support

- Check server logs: `pm2 logs`
- Verify config: Check `.env` file
- Test health: `curl http://localhost:3001/api/health`
- Read docs: See LOCALIZATION_API.md

Good luck! 🚀
