# 🚀 Production Deployment Checklist

> **Application:** Portfolio Collections CMS  
> **Version:** 1.0.0  
> **Date:** 2025-01-01

## Pre-Deployment

### Code Readiness
- [ ] All tests pass (`npm test`)
- [ ] No console.log statements in production code
- [ ] No hardcoded credentials in code
- [ ] Git repository clean (`git status`)
- [ ] Latest code committed and pushed

### Dependencies
- [ ] `npm ci` installs successfully
- [ ] `node_modules` excluded from deployment
- [ ] No security vulnerabilities (`npm audit`)
- [ ] All required environment variables documented

### Environment Setup
- [ ] `.env.production` created from `.env.production.example`
- [ ] JWT_SECRET generated (32+ chars): `openssl rand -base64 32`
- [ ] AUTH_USER and AUTH_PASSWORD changed
- [ ] CORS_ORIGIN configured for your domain
- [ ] Database paths correct
- [ ] Log paths correct

---

## Deployment Method Selection

### Choose One:

#### Option 1: Docker Compose (⭐ Recommended)
- [ ] Docker 20.10+ installed
- [ ] Docker Compose 2.0+ installed
- [ ] Port 3001 available
- [ ] 2GB+ RAM available
- [ ] Run: `docker-compose up -d`

#### Option 2: Manual Linux
- [ ] Node.js 18+ installed
- [ ] npm 9+ installed
- [ ] System user created: `cms-user`
- [ ] App directory created: `/opt/portfolio-cms`
- [ ] Systemd service installed
- [ ] Run: `sudo systemctl start collections-cms`

#### Option 3: Vercel
- [ ] Vercel account created
- [ ] Repository connected to Vercel
- [ ] Environment variables configured
- [ ] Deploy with: `vercel deploy --prod`

#### Option 4: DigitalOcean App Platform
- [ ] DigitalOcean account created
- [ ] App configured in control panel
- [ ] Environment variables set
- [ ] Deploy with control panel

---

## Security Hardening

### Credentials
- [ ] JWT_SECRET is random (32+ chars)
- [ ] AUTH_PASSWORD is strong (16+ chars, mixed case, numbers, symbols)
- [ ] No credentials in git history
- [ ] `.env.production` not committed to git
- [ ] `.env.production` file permissions: 600 (`chmod 600 .env.production`)

### Network Security
- [ ] Firewall configured (allow 22, 80, 443 only)
- [ ] SSH key authentication enabled
- [ ] Password authentication disabled for SSH
- [ ] Rate limiting enabled in Nginx
- [ ] CORS restricted to your domain

### Application Security
- [ ] HTTPS/SSL enabled (Let's Encrypt)
- [ ] Security headers configured (HSTS, X-Frame-Options, etc.)
- [ ] CORS_ORIGIN not set to "*"
- [ ] File upload size limited (50MB max)
- [ ] API authentication required for all routes

### System Security
- [ ] Application runs as non-root user
- [ ] File permissions appropriate (755 dirs, 644 files)
- [ ] No world-readable secrets
- [ ] Backup encryption enabled (optional)
- [ ] SELinux/AppArmor configured (optional)

---

## Infrastructure Setup

### Reverse Proxy (Nginx)
- [ ] Nginx installed
- [ ] `nginx.conf` deployed
- [ ] Configuration tested: `nginx -t`
- [ ] Service enabled: `systemctl enable nginx`
- [ ] Service running: `systemctl status nginx`
- [ ] Health check working: `curl http://localhost:3001/health`

### SSL/TLS
- [ ] Let's Encrypt certificate obtained
- [ ] Certificate auto-renewal configured
- [ ] Certificate valid for your domain
- [ ] HTTPS enforced (redirect HTTP → HTTPS)
- [ ] TLS version 1.2+ only
- [ ] Certificate in correct location

### Storage
- [ ] `/opt/portfolio-cms/public/collections` exists and is writable
- [ ] `/opt/portfolio-cms/backups` exists and is writable
- [ ] `/var/log/portfolio-cms` exists and is writable
- [ ] Disk space: 20GB+ available
- [ ] Backup location: 50GB+ available (if applicable)

### Logging
- [ ] Log directory created: `/var/log/portfolio-cms`
- [ ] Log directory permissions: writable by app user
- [ ] Log rotation configured (logrotate)
- [ ] Log retention: 30 days minimum

---

## Service Configuration

### Systemd (Linux)
- [ ] Service file copied: `/etc/systemd/system/collections-cms.service`
- [ ] Permissions correct: 644
- [ ] `systemctl daemon-reload` run
- [ ] Service enabled: `systemctl enable collections-cms`
- [ ] Service starts on boot
- [ ] Service restarts on failure

### Process Management (Alternative)
- [ ] Supervisor/PM2 installed (if not using systemd)
- [ ] Configuration file created
- [ ] Process starts on boot
- [ ] Process monitoring enabled
- [ ] Restart on crash enabled

---

## Application Testing

### Basic Connectivity
- [ ] `curl http://localhost:3001/health` returns 200
- [ ] `curl http://your-domain.com/health` returns 200
- [ ] HTTPS works: `curl https://your-domain.com/health`
- [ ] Rate limiting works: send 100 requests quickly (some should fail)

### Authentication
- [ ] Login page accessible
- [ ] Can login with credentials
- [ ] JWT token issued and stored
- [ ] Dashboard loads after login
- [ ] Logout clears token
- [ ] Protected routes require authentication

### API Endpoints
- [ ] GET /api/auth/status returns user info
- [ ] GET /api/files/tree returns folder structure
- [ ] GET /api/scanner/files returns collections
- [ ] GET /api/config/status returns server status
- [ ] File operations work (read, write, delete)

### File Operations
- [ ] File upload works
- [ ] File download works
- [ ] File edit works
- [ ] File delete works
- [ ] 50MB size limit enforced

### Error Handling
- [ ] 404 errors display properly
- [ ] 403 errors for unauthorized access
- [ ] 500 errors logged with details
- [ ] Errors don't expose sensitive info

---

## Performance & Monitoring

### Benchmarking
- [ ] Response time < 200ms (baseline)
- [ ] Throughput > 100 req/s
- [ ] CPU usage < 80% under normal load
- [ ] Memory usage < 500MB
- [ ] Disk I/O acceptable

### Monitoring Setup
- [ ] Error tracking configured (Sentry optional)
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring configured
- [ ] Alert thresholds set:
  - [ ] CPU > 80%
  - [ ] Memory > 80%
  - [ ] Disk > 90%
  - [ ] Error rate > 1%
  - [ ] Response time > 1s

### Logging
- [ ] Access logs configured
- [ ] Error logs configured
- [ ] Log aggregation (optional)
- [ ] Log rotation working
- [ ] Logs searchable and accessible

---

## Backup & Disaster Recovery

### Backup Strategy
- [ ] Automated daily backups configured
- [ ] Collections folder backed up
- [ ] Configuration backed up
- [ ] Database backed up (if applicable)
- [ ] Backup retention: 30 days minimum

### Backup Testing
- [ ] Backup script tested
- [ ] Restore tested on development server
- [ ] Recovery time documented
- [ ] Recovery procedure documented
- [ ] Backup location secure and verified

### Disaster Recovery Plan
- [ ] RTO (Recovery Time Objective) defined
- [ ] RPO (Recovery Point Objective) defined
- [ ] Runbook for emergency restoration
- [ ] Contact list for incidents
- [ ] Escalation procedures defined

---

## Documentation

### Deployment Documentation
- [ ] PRODUCTION_SETUP.md reviewed and understood
- [ ] Server architecture documented
- [ ] Network diagram created
- [ ] Credentials management procedure documented
- [ ] Access control list created

### Operational Documentation
- [ ] Startup procedure documented
- [ ] Shutdown procedure documented
- [ ] Troubleshooting guide updated
- [ ] Common issues and solutions documented
- [ ] Support contact information documented

### Runbooks
- [ ] Service restart procedure
- [ ] Log review procedure
- [ ] Backup restore procedure
- [ ] Emergency contact list
- [ ] Escalation matrix

---

## Post-Deployment

### Verification (Day 1)
- [ ] Application running without errors
- [ ] All users can access dashboard
- [ ] Files can be viewed and edited
- [ ] Search functionality works
- [ ] Backups are being created

### Verification (Week 1)
- [ ] No errors in logs
- [ ] Performance metrics normal
- [ ] Disk space not growing unexpectedly
- [ ] Memory usage stable
- [ ] All features working as expected

### Verification (Month 1)
- [ ] Backup restoration tested
- [ ] Documentation updated
- [ ] Performance metrics reviewed
- [ ] Security audit completed
- [ ] User feedback collected

---

## Post-Deployment Monitoring

### Daily Tasks
```bash
# Check service status
sudo systemctl status collections-cms

# Check logs for errors
sudo journalctl -u collections-cms -n 20

# Monitor resources
watch -n 5 'top -p $(pgrep -f "node src/server.js")'

# Check disk usage
df -h /opt/portfolio-cms
```

### Weekly Tasks
```bash
# Review logs for patterns
sudo journalctl -u collections-cms --since "1 week ago" | grep ERROR

# Test backup and restore
tar -tzf /backups/portfolio-cms/collections-*.tar.gz | head -10

# Check certificate expiry
sudo certbot certificates

# Review security logs
sudo tail -100 /var/log/nginx/error.log
```

### Monthly Tasks
```bash
# Full security audit
sudo ufw status
sudo nginx -T
sudo journalctl -u collections-cms --statistics

# Performance review
cat /var/log/portfolio-cms/app.log | grep "Response time"

# Update documentation
# ...review and update runbooks...

# Disaster recovery drill
# ...test backup restoration...
```

---

## Troubleshooting Quick Links

| Issue | Solution |
|-------|----------|
| Service won't start | Check logs: `sudo journalctl -u collections-cms` |
| Can't access dashboard | Check Nginx: `sudo systemctl status nginx` |
| Files not saving | Check permissions: `ls -la /opt/portfolio-cms/public/collections` |
| High memory usage | Increase heap: `NODE_OPTIONS="--max-old-space-size=1024"` |
| SSL certificate error | Renew: `sudo certbot renew` |
| Port already in use | Find process: `lsof -i :3001` |

---

## Sign-Off

- [ ] All checklist items completed
- [ ] Deployment approved by: __________________
- [ ] Deployment date: __________________
- [ ] Deployment time: __________________
- [ ] Deployed by: __________________
- [ ] Verified by: __________________

---

**Next Review Date:** 2025-02-01

For detailed information, see [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md)
