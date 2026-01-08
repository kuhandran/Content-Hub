#!/bin/bash

# Content Hub Monorepo Setup Script
# Sets up the development environment for backend and frontend

set -e

echo "╔═══════════════════════════════════════════════════╗"
echo "║  🚀 Content Hub Monorepo Setup                    ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

# Check Node.js version
echo "📋 Checking Node.js..."
NODE_VERSION=$(node -v)
echo "   Node.js version: $NODE_VERSION"

# Check npm version
echo "📋 Checking npm..."
NPM_VERSION=$(npm -v)
echo "   npm version: $NPM_VERSION"

# Check if .env.local exists
echo ""
echo "📋 Checking environment configuration..."
if [ -f .env.local ]; then
    echo "   ✅ .env.local found"
else
    echo "   ⚠️  .env.local not found - creating from .env.example"
    cp .env.example .env.local
    echo "   📝 Please update .env.local with your credentials"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies for all workspaces..."
npm install --workspaces

# Create necessary directories
echo ""
echo "📁 Creating necessary directories..."
mkdir -p apps/backend/pages/api/admin
mkdir -p apps/backend/scripts
mkdir -p apps/backend/lib
mkdir -p apps/frontend/pages
mkdir -p apps/frontend/components
mkdir -p apps/frontend/public

echo "   ✅ Directories created"

# Display next steps
echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║  ✅ Setup Complete!                              ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""
echo "🎯 Next Steps:"
echo ""
echo "1. Start the development servers (run in separate terminals):"
echo "   Terminal 1: npm run backend:dev"
echo "   Terminal 2: npm run frontend:dev"
echo ""
echo "2. Initialize the database:"
echo "   npm run setup-db"
echo ""
echo "3. Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3001/api"
echo ""
echo "4. View API documentation:"
echo "   cat MODULAR_API_GUIDE.md"
echo ""
echo "📚 More information:"
echo "   See MONOREPO_GUIDE.md for complete documentation"
echo ""
