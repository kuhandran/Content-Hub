# 🚀 Quick Start: Deploy to Production

> **TL;DR:** Choose your deployment method below and follow the 3-5 step guide.

## 📋 Deployment Methods (Choose One)

### 1️⃣ Docker Compose (Easiest) ⭐ Recommended

**Best for:** Cloud servers, quick setup, scalability

**Time:** ~5 minutes

```bash
# 1. Prepare environment
cp .env.production.example .env.production
nano .env.production  # Change JWT_SECRET, AUTH_PASSWORD, etc.

# 2. Deploy
./deploy-docker.sh

# 3. Done! Access at http://localhost:3001
```

**That's it!** Docker handles everything automatically.

---

### 2️⃣ Linux Systemd (Traditional)

**Best for:** Dedicated Linux servers, permanent installation

**Time:** ~15 minutes

```bash
# 1. Prepare environment
cp .env.production.example .env.production
nano .env.production  # Change credentials

# 2. Run deployment script (requires sudo)
sudo ./deploy-linux.sh

# 3. Configure Nginx reverse proxy
sudo cp nginx.conf /etc/nginx/nginx.conf
sudo nginx -t && sudo systemctl restart nginx

# 4. Setup SSL (Let's Encrypt)
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com

# 5. Access at https://your-domain.com
```

---

### 3️⃣ Vercel (Serverless)

**Best for:** Minimal ops, auto-scaling, global CDN

**Time:** ~10 minutes

1. Create account at [vercel.com](https://vercel.com)
2. Connect your GitHub repository
3. Add environment variables:
   ```
   JWT_SECRET=your-random-string
   AUTH_USER=admin
   AUTH_PASSWORD=your-secure-password
   ```
4. Deploy button → Done!

---

### 4️⃣ DigitalOcean App Platform

**Best for:** Managed hosting, simplicity, affordability

**Time:** ~10 minutes

1. Create DigitalOcean account
2. Go to App Platform → Create App
3. Select your GitHub repo
4. Set environment variables (same as Vercel)
5. Deploy → Done!

---

## ⚙️ Configuration (All Methods)

### Essential Environment Variables

```env
# MUST CHANGE THESE:
JWT_SECRET=your-random-string-32-chars-minimum
AUTH_USER=admin
AUTH_PASSWORD=your-very-secure-password

# RECOMMENDED CHANGES:
CORS_ORIGIN=https://your-domain.com
AUTH_USER=your-custom-username
ALLOWED_IP=your-ip-address
```

**Generate secure values:**

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate password
openssl rand -base64 32 | head -c 20
```

---

## 📦 What Gets Deployed

Your entire CMS application including:

✅ **Features:**
- Authentication system (JWT tokens)
- File manager (read, write, delete)
- Collections browser (all 11 locales + 99 files)
- Search across all locales
- File backup/export
- Real-time file scanning
- Dashboard and UI

✅ **Infrastructure:**
- Express.js API server
- EJS template engine
- Nginx reverse proxy (recommended)
- SSL/TLS encryption (optional but recommended)
- Automatic service restart
- Log management

✅ **Storage:**
- `/public/collections/` - All your JSON files
- `/backups/` - Automated backups
- `/logs/` - Application logs

---

## 🔒 Security Checklist

Before going live, ensure:

```bash
# ✅ Change all credentials
JWT_SECRET=<random-32-chars>
AUTH_PASSWORD=<strong-password>

# ✅ Enable HTTPS (if using Linux/server)
sudo certbot certonly --nginx -d your-domain.com

# ✅ Set correct file permissions
chmod 600 .env.production
chmod 755 public/collections

# ✅ Configure firewall (Linux)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# ✅ Test authentication
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}'
```

---

## ✅ Verify Deployment

```bash
# Health check
curl http://localhost:3001/health

# Status endpoint
curl http://localhost:3001/api/config/status

# Check service running (Linux)
sudo systemctl status collections-cms

# View logs (Docker)
docker-compose logs -f app

# View logs (Linux)
sudo journalctl -u collections-cms -f
```

---

## 🛠️ Common Tasks

### View Logs

**Docker:**
```bash
docker-compose logs app
docker-compose logs -f app  # Follow in real-time
```

**Linux Systemd:**
```bash
sudo journalctl -u collections-cms -f
```

### Restart Service

**Docker:**
```bash
docker-compose restart
```

**Linux Systemd:**
```bash
sudo systemctl restart collections-cms
```

### Stop Service

**Docker:**
```bash
docker-compose down
```

**Linux Systemd:**
```bash
sudo systemctl stop collections-cms
```

### Create Backup

```bash
./backup.sh
# Backups stored in /backups/portfolio-cms/
```

### Restore from Backup

```bash
# List backups
ls -la /backups/portfolio-cms/

# Extract specific backup
tar -xzf /backups/portfolio-cms/collections-20250101-120000.tar.gz -C /
```

---

## 📊 Performance

**Default Configuration:**
- Memory: 256-512 MB
- CPU: 1-2 cores
- Disk: 5+ GB
- Max concurrent users: 100+
- Response time: <200ms

**To increase capacity:**

```bash
# Increase Node.js memory (Linux)
export NODE_OPTIONS="--max-old-space-size=1024"

# Or in systemd service:
Environment="NODE_OPTIONS=--max-old-space-size=1024"

# Or in .env.production:
NODE_OPTIONS=--max-old-space-size=1024
```

---

## 🆘 Troubleshooting

### Service won't start

**Docker:**
```bash
docker-compose logs app
docker-compose build --no-cache
docker-compose up
```

**Linux:**
```bash
sudo journalctl -u collections-cms -n 50
sudo systemctl restart collections-cms
```

### Can't access dashboard

```bash
# Check if service running
curl http://localhost:3001/health

# Check Nginx status (if using)
sudo systemctl status nginx
sudo nginx -t

# Check firewall
sudo ufw status
```

### Authentication fails

```bash
# Verify credentials in .env.production
cat .env.production | grep AUTH

# Restart service after changing credentials
sudo systemctl restart collections-cms
# or
docker-compose restart
```

### High disk usage

```bash
# Check disk space
df -h

# Clean old backups
find /backups -name "*.tar.gz" -mtime +30 -delete

# Check log size
ls -lh /var/log/portfolio-cms/
```

---

## 📚 Full Documentation

- **[PRODUCTION_SETUP.md](PRODUCTION_SETUP.md)** - Detailed deployment guide
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Pre/post deployment checklist
- **[README.md](README.md)** - Project overview
- **[AUTH-TESTING.md](AUTH-TESTING.md)** - Authentication testing

---

## 🎯 Next Steps After Deployment

1. **Test Access**
   - Visit https://your-domain.com
   - Login with your credentials
   - Browse collections

2. **Configure Backups**
   ```bash
   # Add to crontab for daily backups
   0 2 * * * /opt/portfolio-cms/backup.sh
   ```

3. **Monitor Performance**
   ```bash
   # Watch logs daily
   sudo journalctl -u collections-cms --since "1 hour ago"
   ```

4. **Setup Alerts**
   - Configure error notifications
   - Setup uptime monitoring
   - Configure disk space alerts

---

## 📞 Support

Having issues? Check:

1. **Logs first** - They contain the answer 99% of the time
2. **Checklist** - See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
3. **Documentation** - See [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md)
4. **Troubleshooting** - See section above

---

## 🎉 You're Done!

Your CMS is now running in production. 

- ✅ User management with JWT authentication
- ✅ File browser for 11 locales with 99+ files
- ✅ Real-time search and filtering
- ✅ Automated backups
- ✅ Secure API endpoints
- ✅ Scalable infrastructure

Start managing your collections! 🚀

---

**Questions?** See the detailed [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md) guide.

**Ready to scale?** See [Performance](#performance) section.

**Need backups?** See [Create Backup](#create-backup) section.
