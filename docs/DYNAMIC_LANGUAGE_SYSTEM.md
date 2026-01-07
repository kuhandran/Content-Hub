# Dynamic Language System Architecture

## Overview

The language management system is now completely **dynamic** and **configuration-driven**. Instead of hardcoded language models, the system:

1. Loads languages from `public/config/languages.json`
2. Maps language codes to Hugging Face translation models
3. Validates language support before creation
4. Handles unsupported languages gracefully

---

## Configuration-Based Design

### Primary Source: `public/config/languages.json`

```json
{
  "languages": [
    {
      "code": "es",
      "name": "Spanish",
      "nativeName": "Español",
      "flag": "🇪🇸",
      "region": "Europe",
      "status": "completed",
      "lastUpdated": "2025-01-02"
    }
  ]
}
```

This is the **single source of truth** for:
- Available languages
- Language metadata (name, native name, flag)
- Language status (pending, completed, error)
- Update timestamps

### Translation Model Mapping

File: `lib/huggingface-service.ts`

```typescript
const LANGUAGE_MODEL_MAP: Record<string, string> = {
  'ar-AE': 'Helsinki-NLP/opus-mt-en-ar',
  'es': 'Helsinki-NLP/opus-mt-en-es',
  'fr': 'Helsinki-NLP/opus-mt-en-fr',
  // ... more languages
}
```

**Key Points:**
- Maps language CODE to OPUS-MT model ID
- Can be extended without code changes (add new language to map)
- Each language can have its own translation model

---

## Language Support Validation

### 3-Level Validation System

When creating a new language:

**Level 1: Configuration Check**
```typescript
const isConfigured = await isLanguageConfigured(languageCode)
```
- Verifies language exists in `languages.json`
- Prevents creation of unconfigured languages
- Error: "Language not found in languages.json"

**Level 2: Translation Support Check**
```typescript
const hasTranslation = hasTranslationSupport(languageCode)
```
- Verifies translation model exists
- Allows configuration of languages without translation
- Error: "No translation model available"

**Level 3: Filesystem Check**
```typescript
const exists = await languageExists(languageCode)
```
- Verifies no duplicate folder exists
- Ensures base language (en) exists
- Error: "Language already exists in public/collections"

### Checklist Items Generated

```typescript
[
  {
    id: 'configured',
    name: 'Language Configuration',
    status: 'checking',
    message: 'Verifying language in languages.json...'
  },
  {
    id: 'translation',
    name: 'Translation Support',
    status: 'checking',
    message: 'Checking if translation model available...'
  },
  // ... more items
]
```

---

## Adding a New Language

### Step 1: Update `languages.json`

```json
{
  "languages": [
    {
      "code": "pt",
      "name": "Portuguese",
      "nativeName": "Português",
      "flag": "🇵🇹",
      "region": "Europe",
      "status": "pending"
    }
  ]
}
```

### Step 2: Add Translation Model (if needed)

```typescript
// lib/huggingface-service.ts
const LANGUAGE_MODEL_MAP: Record<string, string> = {
  'pt': 'Helsinki-NLP/opus-mt-en-pt',  // Add this line
  // ... existing languages
}
```

### Step 3: System Automatically Handles Everything

- ✅ Configuration validation
- ✅ Translation support check
- ✅ File creation and copying
- ✅ Content translation (if model available)
- ✅ Configuration updates

---

## Handling Unsupported Languages

### Scenario: Language Configured But No Translation Model

```json
{
  "code": "xx",
  "name": "Custom Language",
  "nativeName": "Custom",
  "status": "pending"
}
```

**Result:**
1. Configuration check: ✓ Passes
2. Translation check: ✗ Fails
3. Checklist shows: "Language configured but translation not supported"
4. User cannot create language until model is added

### Scenario: Language Not in Configuration

**Result:**
1. Configuration check: ✗ Fails
2. Checklist shows: "Add language to languages.json first"
3. Creation blocked entirely

### Scenario: Translation API Failure

```typescript
try {
  const result = await translateText(text, 'es')
  // Returns: {
  //   translatedText: text,  // Original text fallback
  //   translated: false,
  //   reason: 'API error...'
  // }
} catch (error) {
  // Handles gracefully
  return originalText
}
```

---

## API Reference

### Service: `huggingface-service.ts`

#### `getConfiguredLanguages()`
```typescript
function getConfiguredLanguages(): Record<string, any>
```
Returns all languages from `languages.json` as lookup map.

#### `getTranslationModel(code)`
```typescript
function getTranslationModel(languageCode: string): string | null
```
Returns Hugging Face model ID or null if not supported.

#### `isLanguageSupported(code)`
```typescript
function isLanguageSupported(languageCode: string): boolean
```
Checks if language is in configuration.

#### `hasTranslationSupport(code)`
```typescript
function hasTranslationSupport(languageCode: string): boolean
```
Checks if translation model is available.

#### `translateText(text, targetLanguage, sourceLanguage)`
```typescript
async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage?: string
): Promise<{
  translatedText: string
  translated: boolean
  reason?: string
}>
```
Returns translated text with success status.

### Service: `language-service.ts`

#### `getConfiguredLanguagesList()`
```typescript
async function getConfiguredLanguagesList(): Promise<Array<{
  code: string
  name: string
  nativeName: string
  flag?: string
  status?: string
}>>
```
Returns all languages formatted for UI.

#### `isLanguageConfigured(code)`
```typescript
async function isLanguageConfigured(languageCode: string): Promise<boolean>
```
Checks if language is in configuration.

#### `createLanguageChecklist(code)`
```typescript
async function createLanguageChecklist(
  languageCode: string
): Promise<LanguageChecklistItem[]>
```
Generates validation checklist with all checks.

#### `createNewLanguage(code, onProgress)`
```typescript
async function createNewLanguage(
  languageCode: string,
  onProgress?: (id: string, status: string, message: string) => void
): Promise<LanguageConfig>
```
Full workflow: validate → create → translate → update → sync.

---

## Data Flow

### Language Creation Workflow

```
User clicks "New Language"
         ↓
Load languages.json
         ↓
[Validation]
├─ Is language in config? (Level 1)
├─ Is translation available? (Level 2)
├─ Does folder exist? (Level 3)
└─ Is base (en) available? (Level 3)
         ↓
[File Operations]
├─ Create /collections/{code}/ directory
├─ Create /collections/{code}/config/
├─ Create /collections/{code}/data/
└─ Copy config files from /en/config/
         ↓
[Translation]
├─ For each data file:
│  ├─ Read JSON content
│  ├─ Translate via Hugging Face API
│  ├─ Recursively translate all strings
│  └─ Save translated JSON
└─ Fallback to original if translation fails
         ↓
[Configuration Update]
├─ Read languages.json
├─ Add new language entry
├─ Update status to "completed"
└─ Save updated configuration
         ↓
[Sync]
└─ Push changes to system
         ↓
User sees success message
```

---

## Error Handling Strategy

### 1. Configuration Errors (Early Detection)

**Problem:** Language not in configuration  
**Detection:** Checklist validation  
**Action:** Block creation, show message  
**Recovery:** Add language to `languages.json`

### 2. Translation Model Errors (Early Detection)

**Problem:** No OPUS model for language  
**Detection:** Model map lookup  
**Action:** Show warning, allow with fallback  
**Recovery:** Add model to LANGUAGE_MODEL_MAP

### 3. API Errors (Graceful Fallback)

**Problem:** Hugging Face API unavailable  
**Detection:** API response error  
**Action:** Use original content  
**Recovery:** Retry on next creation

### 4. File Operations Errors (Logged)

**Problem:** Filesystem error  
**Detection:** fs.promises exceptions  
**Action:** Log and continue  
**Recovery:** Manual intervention

---

## Benefits of Dynamic System

| Aspect | Before | After |
|--------|--------|-------|
| **Adding Language** | Hardcode in 2+ files | Update `languages.json` only |
| **Language Validation** | Manual checks | Automatic validation |
| **Unsupported Languages** | Crashes | Graceful fallback |
| **Model Management** | Scattered code | Centralized mapping |
| **Configuration** | Multiple sources | Single source of truth |
| **Documentation** | Needed updates | Auto-derived from config |

---

## Future Extensions

### 1. Support More Languages
Simply add to `languages.json`:
```json
{
  "code": "ja",
  "name": "Japanese",
  "nativeName": "日本語"
}
```

And map model:
```typescript
const LANGUAGE_MODEL_MAP = {
  'ja': 'Helsinki-NLP/opus-mt-en-ja'
}
```

### 2. Custom Translation Models
Allow per-language model override:
```json
{
  "code": "pt",
  "translationModel": "custom/model-pt",
  "customProvider": "huggingface"
}
```

### 3. Batch Language Creation
Create multiple languages in one operation:
```typescript
await createMultipleLanguages(['es', 'fr', 'de'])
```

### 4. Language Deletion
Remove language with cleanup:
```typescript
await deleteLanguage('es')
```

### 5. Language Status Dashboard
Track creation progress per language:
```typescript
await getLanguageStatus('es')
// Returns: { code: 'es', status: 'completed', filesCount: 45, ... }
```

---

## Testing

### Test Configuration Validation
```bash
curl http://localhost:3000/api/admin/language-check?lang=es
```

Expected: Checklist with all items passing (if configured)

### Test Translation Support
```bash
curl -X POST http://localhost:3000/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "translationLanguage": "es"}'
```

Expected: Spanish translation of response

### Test Unsupported Language
```bash
curl http://localhost:3000/api/admin/language-check?lang=zz
```

Expected: Configuration error in checklist

---

## Summary

The dynamic language system provides:

✅ **Configuration-Driven** - Single source of truth (`languages.json`)  
✅ **Extensible** - Add languages without code changes  
✅ **Resilient** - Graceful fallbacks for missing translations  
✅ **Validated** - Multi-level checks before creation  
✅ **Documented** - Self-documenting from configuration  
✅ **Maintainable** - Centralized language and model definitions

No more hardcoded language models!
