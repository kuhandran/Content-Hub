#!/bin/bash
# Production deployment script for Docker
# Usage: ./deploy-docker.sh

set -e

echo "🚀 Portfolio CMS - Docker Deployment Script"
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo ""
echo "📋 Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker installed${NC}"

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose installed${NC}"

# Check environment file
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠ .env.production not found${NC}"
    if [ -f ".env.production.example" ]; then
        echo "  Creating from example..."
        cp .env.production.example .env.production
        echo -e "${YELLOW}  ⚠ IMPORTANT: Edit .env.production with your production values!${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✓ .env.production exists${NC}"

# Check for required environment variables
echo ""
echo "🔐 Checking environment variables..."
if grep -q "CHANGE_THIS" .env.production; then
    echo -e "${RED}✗ .env.production contains placeholder values${NC}"
    echo "  Please update JWT_SECRET, AUTH_PASSWORD, etc."
    exit 1
fi
echo -e "${GREEN}✓ Environment variables configured${NC}"

# Build Docker image
echo ""
echo "🔨 Building Docker image..."
docker-compose build

# Stop existing containers
echo ""
echo "🛑 Stopping existing containers..."
docker-compose down || true

# Start new containers
echo ""
echo "▶️ Starting containers..."
docker-compose up -d

# Wait for service to be ready
echo ""
echo "⏳ Waiting for service to be ready..."
sleep 5

# Check health
echo ""
echo "🏥 Checking service health..."
if curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✓ Service is healthy${NC}"
else
    echo -e "${RED}✗ Service health check failed${NC}"
    echo "  Checking logs:"
    docker-compose logs app | tail -20
    exit 1
fi

# Show service status
echo ""
echo "📊 Service Status:"
docker-compose ps

# Show next steps
echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "📝 Next Steps:"
echo "  1. Access dashboard: http://localhost:3001/dashboard"
echo "  2. Configure Nginx reverse proxy"
echo "  3. Set up SSL certificate (Let's Encrypt)"
echo "  4. Configure backups"
echo ""
echo "📚 Documentation:"
echo "  - PRODUCTION_SETUP.md - Full deployment guide"
echo "  - DEPLOYMENT_CHECKLIST.md - Pre/post deployment checklist"
echo ""
echo "🔍 Monitor logs:"
echo "  docker-compose logs -f app"
echo ""
echo "🛑 To stop services:"
echo "  docker-compose down"
