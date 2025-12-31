# Production Deployment Guide

> **Last Updated:** 2025-01-01  
> **Status:** Ready for Production  
> **Version:** 1.0.0

## Table of Contents

1. [Deployment Options](#deployment-options)
2. [Docker Deployment (Recommended)](#docker-deployment-recommended)
3. [Manual Linux/macOS Deployment](#manual-linuxmacos-deployment)
4. [Nginx Reverse Proxy Setup](#nginx-reverse-proxy-setup)
5. [Security Checklist](#security-checklist)
6. [Monitoring & Logging](#monitoring--logging)
7. [Backups & Recovery](#backups--recovery)
8. [Troubleshooting](#troubleshooting)

---

## Deployment Options

### Quick Comparison

| Option | Setup Time | Management | Portability | Recommended |
|--------|-----------|-----------|------------|------------|
| **Docker Compose** | 5 mins | Easy (1 command) | Excellent | ⭐⭐⭐ |
| **Manual Linux** | 30 mins | Medium | Good | ⭐⭐ |
| **Vercel** | 10 mins | Very Easy | Good | ⭐⭐⭐ |
| **DigitalOcean App** | 15 mins | Very Easy | Excellent | ⭐⭐⭐ |

---

## Docker Deployment (Recommended)

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum
- 5GB disk space

### Step 1: Prepare Configuration

```bash
# Copy environment template
cp .env.production.example .env.production

# Edit with your production values
nano .env.production
```

**Critical settings to change:**
```env
JWT_SECRET=your-random-string-at-least-32-chars
AUTH_USER=admin
AUTH_PASSWORD=your-very-secure-password
CORS_ORIGIN=https://your-domain.com
```

### Step 2: Build and Deploy

```bash
# Start services
docker-compose up -d

# Verify services are running
docker-compose ps

# View logs
docker-compose logs -f app

# Check health
docker ps --filter "status=running"
```

### Step 3: Verify Deployment

```bash
# Test API endpoint
curl http://localhost:3001/health

# Check container logs
docker-compose logs app | tail -20

# View resource usage
docker stats
```

### Useful Docker Commands

```bash
# Stop all services
docker-compose down

# Rebuild image
docker-compose build --no-cache

# View specific container logs
docker-compose logs nginx

# Execute command in container
docker-compose exec app node -v

# Scale services (if needed)
docker-compose up -d --scale app=2
```

---

## Manual Linux/macOS Deployment

### Prerequisites

- Node.js 18+ 
- npm 9+
- Nginx or Apache
- Systemd (Linux) or Supervisord

### Step 1: Server Setup

```bash
# Create app user
sudo useradd -m -s /bin/bash cms-user

# Create app directory
sudo mkdir -p /opt/portfolio-cms
sudo chown cms-user:cms-user /opt/portfolio-cms

# Create log directory
sudo mkdir -p /var/log/portfolio-cms
sudo chown cms-user:cms-user /var/log/portfolio-cms
```

### Step 2: Application Installation

```bash
# Download application
cd /opt/portfolio-cms
git clone <your-repo-url> .
# or
# scp -r . user@server:/opt/portfolio-cms

# Install dependencies
npm ci --only=production

# Setup environment
cp .env.production.example .env.production
nano .env.production

# Create necessary directories
mkdir -p backups temp
```

### Step 3: Systemd Service Setup

```bash
# Copy service file
sudo cp collections-cms.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable and start service
sudo systemctl enable collections-cms
sudo systemctl start collections-cms

# Check status
sudo systemctl status collections-cms

# View logs
sudo journalctl -u collections-cms -f
```

### Step 4: Nginx Configuration

```bash
# Install Nginx
sudo apt-get install nginx

# Copy configuration
sudo cp nginx.conf /etc/nginx/nginx.conf

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Useful Systemd Commands

```bash
# Start/stop/restart service
sudo systemctl start collections-cms
sudo systemctl stop collections-cms
sudo systemctl restart collections-cms

# View logs
sudo journalctl -u collections-cms -f
sudo journalctl -u collections-cms --since "1 hour ago"

# Check service status
sudo systemctl status collections-cms

# View resource usage
top -p $(pgrep -f "node src/server.js")
```

---

## Nginx Reverse Proxy Setup

### Basic Configuration

```nginx
upstream app {
    server localhost:3001;
    keepalive 32;
}

server {
    listen 80;
    server_name your-domain.com;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    location / {
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### HTTPS with Let's Encrypt

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d your-domain.com

# Auto-renewal check
sudo certbot renew --dry-run

# View certificate
sudo certbot certificates
```

Update Nginx config with SSL:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;

    location / {
        # Same proxy configuration as above
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Security Checklist

### ✅ Before Going Live

- [ ] Change all default credentials
- [ ] Generate strong JWT_SECRET (32+ chars)
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set up rate limiting
- [ ] Enable CORS for your domain only
- [ ] Configure security headers
- [ ] Run security audit
- [ ] Set up logging and monitoring
- [ ] Create backup schedule

### ✅ Environment Security

```bash
# Generate secure JWT secret
openssl rand -base64 32

# Generate secure password
openssl rand -base64 32 | head -c 20

# Check file permissions
ls -la /opt/portfolio-cms/.env.production
# Should be: -rw------- (600)
sudo chmod 600 /opt/portfolio-cms/.env.production
```

### ✅ Firewall Rules (Ubuntu/Debian)

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Deny everything else
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### ✅ Security Headers (Nginx)

Already configured in `nginx.conf`, includes:
- HSTS (HTTP Strict Transport Security)
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Referrer-Policy

### ✅ Rate Limiting

Configured in `nginx.conf`:
- API endpoints: 10 req/s (burst 20)
- Login endpoint: 5 req/min
- Helps prevent DDoS attacks

---

## Monitoring & Logging

### Docker Logging

```bash
# View container logs
docker-compose logs app

# Follow logs in real-time
docker-compose logs -f app

# View last 100 lines
docker-compose logs app --tail=100

# View logs with timestamps
docker-compose logs app --timestamps
```

### Systemd Logging

```bash
# View application logs
sudo journalctl -u collections-cms -f

# View since specific time
sudo journalctl -u collections-cms --since "2024-01-15 10:00:00"

# View with priority
sudo journalctl -u collections-cms -p err

# Export logs
sudo journalctl -u collections-cms -o json > logs.json
```

### File-Based Logging

```bash
# View application log
tail -f /var/log/portfolio-cms/app.log

# View Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Search logs
grep "ERROR" /var/log/portfolio-cms/app.log
grep "API" /var/log/portfolio-cms/app.log
```

### Health Check

```bash
# Health endpoint
curl http://localhost:3001/health

# Full status
curl http://localhost:3001/api/config/status

# Metrics (if enabled)
curl http://localhost:9090/metrics
```

---

## Backups & Recovery

### Automated Backups (Docker)

```bash
# Create backup volume
docker-compose exec app npm run backup

# Backup collections folder
docker cp portfolio-cms:/app/public/collections ./backups/collections-$(date +%Y%m%d-%H%M%S)

# View backup volumes
docker volume ls
```

### Manual Backup Script

```bash
#!/bin/bash
# save as: /opt/backup-cms.sh

BACKUP_DIR="/backups/portfolio-cms"
SOURCE_DIR="/opt/portfolio-cms/public/collections"
DATE=$(date +%Y%m%d-%H%M%S)

mkdir -p $BACKUP_DIR

# Backup collections
tar -czf $BACKUP_DIR/collections-$DATE.tar.gz $SOURCE_DIR

# Backup database files
tar -czf $BACKUP_DIR/backups-$DATE.tar.gz /opt/portfolio-cms/backups

# Keep only last 30 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/collections-$DATE.tar.gz"
```

Setup cron job:

```bash
# Add to crontab
sudo crontab -e

# Run daily at 2 AM
0 2 * * * /opt/backup-cms.sh
```

### Restore from Backup

```bash
# Restore collections
tar -xzf /backups/portfolio-cms/collections-20250101-020000.tar.gz -C /

# Verify restoration
ls -la /opt/portfolio-cms/public/collections

# Restart application
sudo systemctl restart collections-cms
```

---

## Troubleshooting

### Docker Issues

#### Container exits immediately

```bash
# Check logs
docker-compose logs app

# Common fixes
# 1. Check .env.production exists and is valid
# 2. Check PORT is not already in use
# 3. Check permissions on volumes
docker-compose down
docker-compose up -d

# Full rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

#### Port already in use

```bash
# Find process using port 3001
lsof -i :3001
# or
netstat -tulpn | grep 3001

# Kill process
kill -9 <PID>

# Change port in .env.production
PORT=3002
```

### Service Issues

#### Service fails to start

```bash
# Check service status
sudo systemctl status collections-cms

# View detailed logs
sudo journalctl -u collections-cms -n 50

# Check permissions
ls -la /opt/portfolio-cms/
ls -la /opt/portfolio-cms/.env.production

# Verify Node.js works
node -v
which node
```

#### High memory usage

```bash
# Check memory
free -h

# Monitor process
top -p $(pgrep -f "node src/server.js")

# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=1024"

# In systemd service, add to [Service]:
Environment="NODE_OPTIONS=--max-old-space-size=1024"
```

### API Issues

#### API returns 503 (Service Unavailable)

```bash
# Check if service is running
curl http://localhost:3001/health

# Check logs
sudo journalctl -u collections-cms -f

# Restart service
sudo systemctl restart collections-cms
```

#### Authentication fails

```bash
# Check JWT_SECRET is set
echo $JWT_SECRET

# Check token not expired
# Clear browser cache/cookies
# Re-login

# Generate new JWT_SECRET
openssl rand -base64 32
```

#### 502 Bad Gateway (Nginx)

```bash
# Check Nginx config
sudo nginx -t

# Check upstream server is running
curl http://localhost:3001/health

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### File Upload Issues

#### Uploads fail with "413 Request Entity Too Large"

```bash
# Check Nginx client_max_body_size
grep client_max_body_size /etc/nginx/nginx.conf
# Should be: client_max_body_size 50m;

# Check Node.js limits
# In .env.production:
MAX_UPLOAD_SIZE=50mb
```

#### Files not persisting

```bash
# Check volume mounts (Docker)
docker-compose exec app ls -la /app/public/collections

# Check file permissions (Manual)
ls -la /opt/portfolio-cms/public/collections

# Ensure directory is writable
sudo chown -R cms-user:cms-user /opt/portfolio-cms/public/collections
sudo chmod -R 755 /opt/portfolio-cms/public/collections
```

---

## Performance Optimization

### Enable Caching

Already configured with `cache-manager.js`:
- File caching (1 hour TTL)
- API response caching
- Automatic invalidation on changes

### Enable Gzip Compression

Configured in `nginx.conf`:
- Reduces response size by ~70%
- Enabled for text, JSON, fonts
- Min file size: 1KB

### Database Indexing

For production scale, consider:
```bash
# Monitor slow queries
npm run monitor

# Optimize database indexes
npm run optimize-db
```

### Load Testing

```bash
# Test with Apache Bench
ab -n 1000 -c 10 http://your-domain.com/health

# Test with wrk
wrk -t4 -c100 -d30s http://your-domain.com/health

# Monitor results
watch -n 1 'docker stats'
```

---

## Support & Resources

- **Documentation:** See README.md
- **Issues:** Check QUICKSTART.md for common issues
- **Authentication:** See AUTH-TESTING.md
- **Local Development:** See CMS-SETUP.md

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-01 | Initial production release |
| 1.0.1 | 2025-01-02 | Added security hardening |
| 1.0.2 | 2025-01-03 | Docker improvements |

---

**Last Reviewed:** 2025-01-01  
**Next Review:** 2025-02-01
