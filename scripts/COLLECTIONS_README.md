# Collection Management Scripts

This directory contains scripts for managing and validating language collections in `public/collections/`.

## Available Scripts

### 1. 🔍 `validate-collections.sh`
**Purpose:** Validate JSON syntax for all collection files

**Usage:**
```bash
./scripts/validate-collections.sh
```

**What it does:**
- Checks all JSON files in all language collections
- Reports valid ✅ and invalid ❌ files
- Shows detailed error messages for invalid JSON
- Exit code 0 if all valid, 1 if any invalid

**When to run:**
- After editing any collection files
- Before committing changes
- As part of CI/CD pipeline

---

### 2. 📊 `check-collection-structure.sh`
**Purpose:** Ensure all languages have the same file structure as English

**Usage:**
```bash
./scripts/check-collection-structure.sh
```

**What it does:**
- Compares each language collection to English (base)
- Identifies missing files
- Identifies extra files
- Exit code 0 if all match, 1 if mismatches found

**When to run:**
- After adding new files to English collection
- Periodically to verify consistency
- Before releases

---

### 3. 🔄 `sync-collections-from-en.sh`
**Purpose:** Copy missing files from English to other languages

**Usage:**
```bash
./scripts/sync-collections-from-en.sh
```

**What it does:**
- Finds files in English that don't exist in other languages
- Copies missing files (does NOT overwrite existing ones)
- Creates necessary directories
- Prompts for confirmation before proceeding

**⚠️ Warning:** Copied files will be in English and need translation

**When to run:**
- After adding new files to English collection
- When structure check shows missing files
- During initial setup of new languages

---

### 4. 📋 `review-translations.sh`
**Purpose:** Generate checklist of files needing translation

**Usage:**
```bash
./scripts/review-translations.sh
```

**What it does:**
- Lists all files that were copied from English
- Prioritizes files by importance (High/Medium/Low)
- Provides translation tips and best practices
- Shows which files contain English text

**When to run:**
- After running sync-collections-from-en.sh
- Before sending files to translators
- To track translation progress

---

## Recommended Workflow

### Adding New Files to English
1. Create/edit files in `public/collections/en/`
2. Run `./scripts/check-collection-structure.sh` to see what's missing
3. Run `./scripts/sync-collections-from-en.sh` to copy to all languages
4. Run `./scripts/review-translations.sh` to get translation checklist
5. Translate the copied files
6. Run `./scripts/validate-collections.sh` to verify
7. Commit changes

### Regular Maintenance
```bash
# Weekly or before each release
./scripts/check-collection-structure.sh
./scripts/validate-collections.sh
```

### After Translation Updates
```bash
# Validate all files
./scripts/validate-collections.sh

# Check if any files still need translation
./scripts/review-translations.sh
```

---

## File Structure

All language collections should have this structure:

```
public/collections/{language}/
├── config/
│   ├── apiConfig.json
│   ├── pageLayout.json
│   └── urlConfig.json
└── data/
    ├── achievements.json
    ├── caseStudies.json
    ├── caseStudiesTranslations.json
    ├── chatConfig.json
    ├── contentLabels.json
    ├── defaultContentLabels.json
    ├── education.json
    ├── errorMessages.json
    ├── experience.json
    ├── projects.json
    └── skills.json
```

**Total:** 14 files per language (3 config + 11 data)

---

## Supported Languages

- `en` - English (BASE - source of truth)
- `ar-AE` - Arabic (UAE)
- `de` - German
- `es` - Spanish
- `fr` - French
- `hi` - Hindi
- `id` - Indonesian
- `my` - Malay
- `si` - Sinhala
- `ta` - Tamil
- `th` - Thai

---

## Troubleshooting

### Invalid JSON Error
```bash
# Check specific file
python3 -m json.tool public/collections/en/data/skills.json

# Fix common issues:
# - Missing commas between array elements
# - Trailing commas before closing braces
# - Unescaped quotes in strings
# - Missing closing brackets/braces
```

### Missing Files
```bash
# Run structure check first
./scripts/check-collection-structure.sh

# Then sync from English
./scripts/sync-collections-from-en.sh
```

### All Scripts
```bash
# Make all scripts executable (if needed)
chmod +x scripts/*.sh

# Or individual script
chmod +x scripts/validate-collections.sh
```

---

## Integration with Git

Add to your pre-commit hook (`.git/hooks/pre-commit`):
```bash
#!/bin/bash
echo "Validating collections..."
./scripts/validate-collections.sh
if [ $? -ne 0 ]; then
    echo "❌ Collection validation failed. Fix errors before committing."
    exit 1
fi
```

---

## Notes

- Always keep `en/` (English) as the source of truth
- Test files after translation to ensure JSON validity
- Use native speakers for best translation quality
- Maintain consistent JSON structure across all languages
- Only translate text values, never JSON keys or structure

---

Last updated: 2026-01-02
