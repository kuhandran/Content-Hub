#!/bin/bash
# Verify Vercel deployment file detection

echo "🔍 Vercel Deployment File Detection Verification"
echo "================================================"
echo ""

# Check if DEPLOYMENT_URL is provided
if [ -z "$1" ]; then
  echo "Usage: ./verify-vercel-files.sh <your-deployment-url>"
  echo "Example: ./verify-vercel-files.sh https://your-app.vercel.app"
  exit 1
fi

DEPLOYMENT_URL=$1

echo "Testing deployment: $DEPLOYMENT_URL"
echo ""

# Test files
declare -a test_files=(
  "/api/collections/en/data/caseStudies.json"
  "/api/collections/en/data/caseStudiesTranslations.json"
  "/api/collections/en/data/contentLabels.json"
  "/api/collections/en/data/projects.json"
  "/api/collections/en/data/skills.json"
  "/collections/en/data/caseStudies.json"
  "/health"
)

success_count=0
fail_count=0

for file in "${test_files[@]}"; do
  echo -n "Testing: $file ... "
  
  response=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL$file")
  
  if [ "$response" = "200" ]; then
    echo "✅ OK ($response)"
    ((success_count++))
  else
    echo "❌ FAILED ($response)"
    ((fail_count++))
    
    # Show error details
    echo "   Response body:"
    curl -s "$DEPLOYMENT_URL$file" | head -n 5
    echo ""
  fi
done

echo ""
echo "================================================"
echo "Results: $success_count passed, $fail_count failed"
echo ""

if [ $fail_count -eq 0 ]; then
  echo "✅ All files are accessible!"
else
  echo "⚠️  Some files are not accessible. Check the logs above."
  echo ""
  echo "Common fixes:"
  echo "1. Ensure vercel.json has includeFiles configuration"
  echo "2. Seed Redis with: npm run seed or use the admin endpoint"
  echo "3. Check Vercel environment variables (REDIS_URL, etc.)"
  echo "4. Review deployment logs: vercel logs"
fi

exit $fail_count
