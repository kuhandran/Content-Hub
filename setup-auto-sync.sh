#!/bin/bash
# Quick setup script for auto-sync system

echo "🚀 Auto-Sync System Setup"
echo "=========================="
echo ""

# Check if Redis is available
echo "1. Checking Redis connection..."
if [ -z "$REDIS_URL" ]; then
  echo "   ⚠️  REDIS_URL not set"
  echo "   Set it with: export REDIS_URL=redis://localhost:6379"
  echo ""
else
  echo "   ✅ REDIS_URL configured: $REDIS_URL"
  echo ""
fi

# Test Redis connection
if command -v redis-cli &> /dev/null; then
  if redis-cli ping &> /dev/null; then
    echo "   ✅ Redis is running"
  else
    echo "   ⚠️  Redis not responding"
    echo "   Start with: brew services start redis (macOS)"
    echo "            or: sudo systemctl start redis (Linux)"
  fi
else
  echo "   ⚠️  redis-cli not found"
fi

echo ""
echo "2. Available commands:"
echo "   npm run sync        - Start file watcher (development)"
echo "   npm run dev:watch   - Same as above"
echo "   npm run auto-sync   - Trigger manual sync (requires running server)"
echo ""

echo "3. Testing auto-sync endpoint..."
if curl -f -X POST http://localhost:3000/api/auto-sync &> /dev/null; then
  echo "   ✅ Auto-sync endpoint is working"
  echo ""
  echo "4. Checking sync status..."
  curl -s http://localhost:3000/api/auto-sync/status | head -n 20
else
  echo "   ℹ️  Server not running at http://localhost:3000"
  echo "   Start server with: npm start"
fi

echo ""
echo "=========================="
echo "📖 For detailed documentation, see: AUTO_SYNC_GUIDE.md"
echo ""

# Show quick start instructions
echo "Quick Start:"
echo "------------"
echo "1. Start Redis: brew services start redis"
echo "2. Set REDIS_URL: export REDIS_URL=redis://localhost:6379"
echo "3. Start server: npm start"
echo "4. In another terminal, start watcher: npm run sync"
echo "5. Add/edit files in public/ folders - they'll auto-sync!"
echo ""
