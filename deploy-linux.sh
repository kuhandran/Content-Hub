#!/bin/bash
# Manual Linux deployment script
# Usage: ./deploy-linux.sh

set -e

echo "🚀 Portfolio CMS - Linux Manual Deployment Script"
echo "=================================================="

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
APP_DIR="/opt/portfolio-cms"
APP_USER="cms-user"
LOG_DIR="/var/log/portfolio-cms"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}✗ This script must be run as root${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Running as root${NC}"

# Check prerequisites
echo ""
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not installed${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js installed: $NODE_VERSION${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm installed${NC}"

# Create app user if not exists
echo ""
echo "👤 Setting up app user..."
if ! id "$APP_USER" &>/dev/null; then
    useradd -m -s /bin/bash "$APP_USER"
    echo -e "${GREEN}✓ Created user: $APP_USER${NC}"
else
    echo -e "${GREEN}✓ User already exists: $APP_USER${NC}"
fi

# Create directories
echo ""
echo "📁 Creating directories..."
mkdir -p "$APP_DIR"
mkdir -p "$LOG_DIR"
mkdir -p "$APP_DIR/backups"
mkdir -p "$APP_DIR/temp"

# Set ownership
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
chown -R "$APP_USER:$APP_USER" "$LOG_DIR"
chmod 755 "$APP_DIR"
chmod 755 "$LOG_DIR"

# Copy application files
echo ""
echo "📦 Copying application files..."
cp -r . "$APP_DIR"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
chmod 600 "$APP_DIR/.env.production"

# Install dependencies
echo ""
echo "📚 Installing dependencies..."
cd "$APP_DIR"
npm ci --only=production

# Install systemd service
echo ""
echo "⚙️ Installing systemd service..."
cp collections-cms.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable collections-cms

# Test configuration
echo ""
echo "✅ Starting service..."
systemctl start collections-cms

# Check status
sleep 2
if systemctl is-active --quiet collections-cms; then
    echo -e "${GREEN}✓ Service is running${NC}"
else
    echo -e "${RED}✗ Service failed to start${NC}"
    journalctl -u collections-cms -n 20
    exit 1
fi

# Show status
echo ""
echo "📊 Service Status:"
systemctl status collections-cms

# Installation summary
echo ""
echo -e "${GREEN}✅ Installation Complete!${NC}"
echo ""
echo "📝 Configuration:"
echo "  - Application: $APP_DIR"
echo "  - App User: $APP_USER"
echo "  - Log Directory: $LOG_DIR"
echo "  - Service: collections-cms"
echo ""
echo "📝 Next Steps:"
echo "  1. Edit configuration: $APP_DIR/.env.production"
echo "  2. Restart service: systemctl restart collections-cms"
echo "  3. Install Nginx reverse proxy"
echo "  4. Configure SSL certificate"
echo "  5. Set up automated backups"
echo ""
echo "🔍 View logs:"
echo "  journalctl -u collections-cms -f"
echo ""
echo "🛑 Manage service:"
echo "  systemctl start collections-cms"
echo "  systemctl stop collections-cms"
echo "  systemctl restart collections-cms"
echo "  systemctl status collections-cms"
