#!/bin/bash

# Seed collection files to Vercel via admin endpoint

echo "📦 Seeding collection files to Vercel Redis..."

for file in public/collections/en/data/*.json; do
  filename=$(basename "$file")
  echo "Uploading: $filename"
  curl -s -X POST https://static-api-opal.vercel.app/api/admin/seed-collections \
    -H "x-admin-token: dev-seed-only" \
    -F "file=@$file" > /dev/null
done

echo "✅ All collection files seeded to Vercel"
