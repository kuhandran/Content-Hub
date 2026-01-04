#!/bin/bash

# Seed script using raw curl commands to Upstash REST API
# This uploads each file individually

KV_URL="https://redis-19930.c232.us-east-1-2.ec2.cloud.redislabs.com"
KV_TOKEN="7qqVS3b9pHULdelwly3uY1QFk7hNYBwx"

echo "🌱 Starting Vercel KV Seed via curl..."
echo ""

# Function to upload a single file
upload_file() {
  local file_path=$1
  local key=$2
  local file_size=$(wc -c < "$file_path")
  
  # Read file content and escape for JSON
  local content=$(cat "$file_path" | jq -Rs .)
  
  # Upload using SET command
  curl -s -X POST "${KV_URL}/multi" \
    -H "Authorization: Bearer ${KV_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "[\"SET\", \"${key}\", ${content}, \"EX\", \"7776000\"]" > /dev/null 2>&1
}

# Find all JSON files in collections
TOTAL=0
SUCCESS=0
FAILED=0

for file in $(find public/collections -name "*.json" -type f); do
  TOTAL=$((TOTAL + 1))
  
  # Get relative path
  REL_PATH=$(echo "$file" | sed 's|^public/collections/||')
  KEY="cms:file:${REL_PATH}"
  
  # Try to upload
  if upload_file "$file" "$KEY"; then
    SUCCESS=$((SUCCESS + 1))
    echo "✅ [$SUCCESS/$TOTAL] $REL_PATH"
  else
    FAILED=$((FAILED + 1))
    echo "❌ $REL_PATH"
  fi
done

echo ""
echo "📊 Complete: $SUCCESS/$TOTAL uploaded"
