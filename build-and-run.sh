#!/bin/bash

# Content Hub Build & Run Script
# This script builds the Next.js app and starts the dev server

echo "================================"
echo "Content Hub - Build & Run Script"
echo "================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check Node version
echo "✅ Node version: $(node --version)"
echo "✅ NPM version: $(npm --version)"
echo ""

# Build the project
echo "🔨 Building Next.js application..."
echo "   Running: npm run build"
echo ""
npm run build

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Build failed! Check the errors above."
    exit 1
fi

echo ""
echo "✅ Build completed successfully!"
echo ""
echo "================================"
echo "🚀 Starting Development Server"
echo "================================"
echo ""
echo "📍 Server will start on: http://localhost:3000"
echo ""
echo "To stop the server: Press Ctrl + C"
echo ""

# Start dev server
npm run dev
