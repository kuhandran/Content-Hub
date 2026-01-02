#!/bin/bash
# Test the admin seed endpoint

echo "Testing /api/admin/seed-files endpoint..."
curl -s -X POST http://localhost:3001/api/admin/seed-files \
  -H "Content-Type: application/json" | jq '.' 2>/dev/null || echo "Endpoint error"

echo ""
echo "Testing /api/admin/seed-status endpoint..."
curl -s http://localhost:3001/api/admin/seed-status | jq '.' 2>/dev/null || echo "Endpoint error"

echo ""
echo "Testing /api/files/list-public/files endpoint..."
curl -s http://localhost:3001/api/files/list-public/files | jq '.count' 2>/dev/null || echo "Endpoint error"

echo ""
echo "Testing /api/admin/files page..."
curl -s http://localhost:3001/api/admin/files | head -20
