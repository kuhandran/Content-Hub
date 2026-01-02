#!/bin/bash
##############################################################################
# Collection Validation Script
# Purpose: Validate all JSON files in language collections
# Usage: ./scripts/validate-collections.sh
##############################################################################

COLLECTIONS_PATH="public/collections"
LANGUAGES=("en" "ar-AE" "de" "es" "fr" "hi" "id" "my" "si" "ta" "th")

echo "══════════════════════════════════════════════════════"
echo "  🔍 VALIDATING COLLECTION FILES"
echo "══════════════════════════════════════════════════════"
echo ""

total=0
valid=0
invalid=0
invalid_files=()

for lang in "${LANGUAGES[@]}"; do
    echo "📁 $lang"
    files=$(find "$COLLECTIONS_PATH/$lang" -type f -name "*.json" 2>/dev/null)
    
    if [ -z "$files" ]; then
        echo "   ⚠️  No files found"
        continue
    fi
    
    for file in $files; do
        total=$((total + 1))
        filename=$(basename "$file")
        
        if python3 -m json.tool "$file" > /dev/null 2>&1; then
            valid=$((valid + 1))
            echo "   ✅ $filename"
        else
            invalid=$((invalid + 1))
            echo "   ❌ $filename - INVALID JSON"
            invalid_files+=("$file")
        fi
    done
    echo ""
done

echo "══════════════════════════════════════════════════════"
echo "📊 VALIDATION SUMMARY"
echo "══════════════════════════════════════════════════════"
echo "   Total files: $total"
echo "   Valid: $valid ✅"
echo "   Invalid: $invalid ❌"
echo ""

if [ $invalid -gt 0 ]; then
    echo "❌ INVALID FILES FOUND:"
    for file in "${invalid_files[@]}"; do
        echo "   • $file"
        echo "     Error details:"
        python3 -m json.tool "$file" 2>&1 | head -5 | sed 's/^/     /'
        echo ""
    done
    exit 1
else
    echo "✅ All files are valid!"
    exit 0
fi
