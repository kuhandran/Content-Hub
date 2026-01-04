#!/bin/bash
##############################################################################
# Collection Structure Check Script
# Purpose: Ensure all language collections have the same file structure as EN
# Usage: ./scripts/check-collection-structure.sh
##############################################################################

COLLECTIONS_PATH="public/collections"
BASE_LANG="en"
LANGUAGES=("ar-AE" "de" "es" "fr" "hi" "id" "my" "si" "ta" "th")

echo "══════════════════════════════════════════════════════"
echo "  📊 COLLECTION STRUCTURE COMPARISON"
echo "══════════════════════════════════════════════════════"
echo ""

# Get base file list from English
EN_FILES=$(find "$COLLECTIONS_PATH/$BASE_LANG" -type f -name "*.json" | sed "s|.*/$BASE_LANG/||" | sort)
EN_COUNT=$(echo "$EN_FILES" | wc -l | xargs)

echo "Base: English ($BASE_LANG) - $EN_COUNT files"
echo ""

all_match=true

for lang in "${LANGUAGES[@]}"; do
    echo "🔍 Checking: $lang"
    
    if [ ! -d "$COLLECTIONS_PATH/$lang" ]; then
        echo "   ❌ Directory does not exist!"
        all_match=false
        continue
    fi
    
    LANG_FILES=$(find "$COLLECTIONS_PATH/$lang" -type f -name "*.json" | sed "s|.*/$lang/||" | sort)
    LANG_COUNT=$(echo "$LANG_FILES" | wc -l | xargs)
    
    # Find missing files
    MISSING=$(comm -23 <(echo "$EN_FILES") <(echo "$LANG_FILES"))
    
    # Find extra files
    EXTRA=$(comm -13 <(echo "$EN_FILES") <(echo "$LANG_FILES"))
    
    if [ -z "$MISSING" ] && [ -z "$EXTRA" ]; then
        echo "   ✅ Structure matches ($LANG_COUNT files)"
    else
        all_match=false
        
        if [ ! -z "$MISSING" ]; then
            echo "   ❌ Missing files:"
            echo "$MISSING" | sed 's/^/      - /'
        fi
        
        if [ ! -z "$EXTRA" ]; then
            echo "   ⚠️  Extra files:"
            echo "$EXTRA" | sed 's/^/      - /'
        fi
    fi
    echo ""
done

echo "══════════════════════════════════════════════════════"

if [ "$all_match" = true ]; then
    echo "✅ All language collections have matching structure!"
    exit 0
else
    echo "❌ Structure mismatches found. Run sync if needed."
    exit 1
fi
