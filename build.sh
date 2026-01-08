#!/bin/bash

# Build Script - Build both backend and frontend for production

echo "🏗️  Building Content Hub for Production..."
echo ""

set -e

# Run setup database
echo "🗄️  Setting up database..."
npm run setup-db

# Build backend
echo ""
echo "🔨 Building Backend API..."
npm run backend:build

# Build frontend
echo ""
echo "🔨 Building Frontend UI..."
npm run frontend:build

echo ""
echo "✅ Build complete!"
echo ""
echo "To start production servers:"
echo "  Terminal 1: npm run backend:start"
echo "  Terminal 2: npm run frontend:start"
