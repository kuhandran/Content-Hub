#!/bin/bash
##############################################################################
# Collection Sync Script
# Purpose: Sync missing files from English to all other language collections
# Usage: ./scripts/sync-collections-from-en.sh
# WARNING: This will overwrite files! Use with caution.
##############################################################################

COLLECTIONS_PATH="public/collections"
BASE_LANG="en"
LANGUAGES=("ar-AE" "de" "es" "fr" "hi" "id" "my" "si" "ta" "th")

echo "══════════════════════════════════════════════════════"
echo "  🔄 COLLECTION SYNC FROM ENGLISH"
echo "══════════════════════════════════════════════════════"
echo ""
echo "⚠️  WARNING: This will copy missing files from EN"
echo "   Existing files will NOT be overwritten."
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Sync cancelled."
    exit 0
fi

echo ""
echo "Starting sync..."
echo ""

# Get base file list from English
EN_FILES=$(find "$COLLECTIONS_PATH/$BASE_LANG" -type f -name "*.json" | sed "s|.*/$BASE_LANG/||")

total_copied=0

for lang in "${LANGUAGES[@]}"; do
    echo "📦 Processing: $lang"
    lang_copied=0
    
    # Ensure directories exist
    mkdir -p "$COLLECTIONS_PATH/$lang/config"
    mkdir -p "$COLLECTIONS_PATH/$lang/data"
    
    for file in $EN_FILES; do
        src="$COLLECTIONS_PATH/$BASE_LANG/$file"
        dest="$COLLECTIONS_PATH/$lang/$file"
        
        if [ ! -f "$dest" ]; then
            cp "$src" "$dest"
            echo "   ✅ Copied: $file"
            lang_copied=$((lang_copied + 1))
            total_copied=$((total_copied + 1))
        fi
    done
    
    if [ $lang_copied -eq 0 ]; then
        echo "   ✓ No files needed"
    else
        echo "   📋 Copied $lang_copied file(s)"
    fi
    echo ""
done

echo "══════════════════════════════════════════════════════"
echo "✅ Sync complete!"
echo "   Total files copied: $total_copied"
echo ""
echo "Next steps:"
echo "1. Review and translate copied files"
echo "2. Run: ./scripts/validate-collections.sh"
echo "3. Run: ./scripts/review-translations.sh"
echo ""
