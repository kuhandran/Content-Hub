#!/bin/bash
##############################################################################
# Translation Review Script
# Purpose: Identify files that need translation updates after copying from EN
# Usage: ./scripts/review-translations.sh
##############################################################################

echo "══════════════════════════════════════════════════════"
echo "  📋 TRANSLATION REVIEW CHECKLIST"
echo "══════════════════════════════════════════════════════"
echo ""
echo "The following files were copied from English and contain"
echo "English text that needs to be translated:"
echo ""

# Files that need translation (copied from EN base)
FILES_NEED_TRANSLATION=(
  "config/urlConfig.json"
  "data/caseStudies.json"
  "data/caseStudiesTranslations.json"
  "data/defaultContentLabels.json"
  "data/errorMessages.json"
)

LANGUAGES=("ar-AE" "de" "es" "fr" "hi" "id" "my" "si" "ta" "th")
BASE_PATH="public/collections"

for lang in "${LANGUAGES[@]}"; do
  echo "────────────────────────────────────────────────────"
  echo "🌍 $lang (${LANG_NAMES[$lang]:-$lang})"
  echo "────────────────────────────────────────────────────"
  
  for file in "${FILES_NEED_TRANSLATION[@]}"; do
    filepath="$BASE_PATH/$lang/$file"
    
    if [ -f "$filepath" ]; then
      # Count lines in file (rough estimate of content)
      lines=$(wc -l < "$filepath" | xargs)
      
      # Check if file contains English words (basic check)
      if grep -q -i "english\|experience\|education\|skills\|projects" "$filepath" 2>/dev/null; then
        status="❌ NEEDS TRANSLATION"
      else
        status="⚠️  REVIEW NEEDED"
      fi
      
      echo "   $status - $file ($lines lines)"
    else
      echo "   ⚠️  MISSING - $file"
    fi
  done
  echo ""
done

echo "══════════════════════════════════════════════════════"
echo "📝 TRANSLATION PRIORITY ORDER"
echo "══════════════════════════════════════════════════════"
echo ""
echo "1. HIGH PRIORITY - User-facing content"
echo "   • data/errorMessages.json"
echo "   • data/caseStudiesTranslations.json"
echo "   • data/caseStudies.json"
echo ""
echo "2. MEDIUM PRIORITY - Configuration"
echo "   • data/defaultContentLabels.json"
echo ""
echo "3. LOW PRIORITY - Technical config (may not need translation)"
echo "   • config/urlConfig.json"
echo ""
echo "══════════════════════════════════════════════════════"
echo "💡 TRANSLATION TIPS"
echo "══════════════════════════════════════════════════════"
echo "• Use the English (en) files as reference"
echo "• Maintain the same JSON structure"
echo "• Translate only text values, not keys"
echo "• Test JSON validity after editing"
echo "• Use native speakers for best quality"
echo ""
echo "To validate after translation:"
echo "  ./scripts/validate-collections.sh"
echo ""
