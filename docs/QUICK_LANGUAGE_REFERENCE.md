# Dynamic Language System - Quick Reference

## TL;DR

**Before:** Languages hardcoded → New language = code changes  
**After:** Languages in config → New language = JSON only  

---

## Adding a New Language (3 Steps)

### 1️⃣ Update Configuration
**File:** `public/config/languages.json`

```json
{
  "code": "pt",
  "name": "Portuguese",
  "nativeName": "Português",
  "flag": "🇵🇹"
}
```

### 2️⃣ Add Translation Model
**File:** `lib/huggingface-service.ts`

```typescript
const LANGUAGE_MODEL_MAP = {
  'pt': 'Helsinki-NLP/opus-mt-en-pt',  // ← Add this line
}
```

### 3️⃣ Create via Dashboard
- Click "+ New Language"
- Select Portuguese
- Confirm
- ✅ Done!

---

## API Endpoints

### Check Language Status
```bash
curl 'http://localhost:3000/api/admin/language-check?lang=es'
```

Returns: Validation checklist with all checks

### Create Language
```bash
curl -X POST http://localhost:3000/api/admin/create-language \
  -H "Content-Type: application/json" \
  -d '{"languageCode":"pt"}'
```

---

## Error Messages & Fixes

| Error | Fix |
|-------|-----|
| "not found in languages.json" | Add to `public/config/languages.json` |
| "No translation model available" | Add to `LANGUAGE_MODEL_MAP` in huggingface-service.ts |
| "Language already exists" | Language folder already created |
| "Base language not found" | English (`en`) folder missing |

---

## Key Functions

### Check If Language is Configured
```typescript
import { isLanguageConfigured } from '@/lib/language-service'

const available = await isLanguageConfigured('pt')
```

### Check If Translation is Supported
```typescript
import { hasTranslationSupport } from '@/lib/huggingface-service'

const canTranslate = hasTranslationSupport('pt')
```

### Translate Text
```typescript
import { translateText } from '@/lib/huggingface-service'

const result = await translateText('Hello', 'pt')
// Returns: { translatedText: 'Olá', translated: true }
```

### Create New Language
```typescript
import { createNewLanguage } from '@/lib/language-service'

await createNewLanguage('pt', (id, status, msg) => {
  console.log(`${id}: ${status} - ${msg}`)
})
```

---

## Validation Levels

```
1️⃣ Is language in languages.json?
   ├─ Yes → Continue
   └─ No → Error: "Add to configuration"

2️⃣ Is translation model available?
   ├─ Yes → Continue
   └─ No → Error: "No translation model"

3️⃣ Does language folder already exist?
   ├─ No → Continue
   └─ Yes → Error: "Already exists"

4️⃣ Does base (en) language exist?
   ├─ Yes → Continue
   └─ No → Error: "Base language missing"

✅ All Pass → Create Language
```

---

## Supported Languages (Example)

| Code | Name | Native | Model |
|------|------|--------|-------|
| en | English | English | - |
| es | Spanish | Español | ✅ |
| fr | French | Français | ✅ |
| de | German | Deutsch | ✅ |
| hi | Hindi | हिन्दी | ✅ |
| ar-AE | Arabic | العربية | ✅ |
| pt | Portuguese | Português | ✅ |
| id | Indonesian | Bahasa Indonesia | ✅ |
| th | Thai | ไทย | ✅ |
| ta | Tamil | தமிழ் | ✅ |

---

## Configuration Structure

```
public/
├── config/
│   └── languages.json          ← Single source of truth
│
├── collections/
│   ├── en/                     ← Base language
│   │   ├── config/
│   │   └── data/
│   └── es/                     ← Language created
│       ├── config/             ← Copied from en
│       └── data/               ← Translated from en
```

---

## Testing

### Test Configuration
```bash
# Language exists in config
curl 'http://localhost:3000/api/admin/language-check?lang=es'

# Language not in config
curl 'http://localhost:3000/api/admin/language-check?lang=pt'

# Invalid language
curl 'http://localhost:3000/api/admin/language-check?lang=xx'
```

### Test Translation
```bash
curl -X POST http://localhost:3000/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","targetLanguage":"es"}'
```

---

## Files to Know

| File | Purpose |
|------|---------|
| `public/config/languages.json` | 🎯 Configuration (single source of truth) |
| `lib/huggingface-service.ts` | 🤖 AI/translation functions |
| `lib/language-service.ts` | 🌐 Language management |
| `app/api/admin/language-check/route.ts` | 🔍 Validation endpoint |
| `app/api/admin/create-language/route.ts` | ➕ Creation endpoint |
| `app/components/LanguageModal.tsx` | 🎨 Language creation UI |
| `docs/DYNAMIC_LANGUAGE_*.md` | 📚 Documentation |

---

## Common Tasks

### ✅ Create Spanish Language
1. Spanish already in `languages.json` ✓
2. Model already in `LANGUAGE_MODEL_MAP` ✓
3. Click "+ New Language"
4. Select "Spanish"
5. Done!

### ✅ Add Portuguese Support
1. Add to `languages.json`:
   ```json
   { "code": "pt", "name": "Portuguese", "nativeName": "Português" }
   ```
2. Add to `LANGUAGE_MODEL_MAP`:
   ```typescript
   'pt': 'Helsinki-NLP/opus-mt-en-pt'
   ```
3. Use dashboard to create

### ❌ Fix "Language not in languages.json"
1. Open `public/config/languages.json`
2. Add missing language entry
3. Reload page
4. Try again

### ❌ Fix "No translation model available"
1. Open `lib/huggingface-service.ts`
2. Find `LANGUAGE_MODEL_MAP`
3. Add model mapping: `'code': 'Helsinki-NLP/opus-mt-en-code'`
4. Rebuild
5. Try again

---

## Architecture (One-Page Diagram)

```
languages.json (config)
     ↓
[Validation 1: Is language configured?]
     ↓
LANGUAGE_MODEL_MAP (model lookup)
     ↓
[Validation 2: Is translation available?]
     ↓
Filesystem checks
     ↓
[Validation 3 & 4: Folders and base language OK?]
     ↓
✅ Create folders
✅ Copy config files
✅ Translate data (or fallback to original)
✅ Update languages.json
✅ Sync changes
     ↓
User sees: "Language created successfully"
```

---

## Key Improvements

| Before | After |
|--------|-------|
| Hardcoded models | Configuration-driven |
| No validation | Multi-level validation |
| Crashes on unsupported | Graceful fallback |
| Manual checks | Automatic checks |
| Hard to extend | Easy to extend |

---

## Need Help?

**Q: How do I add a new language?**  
A: Follow "Adding a New Language" section (3 steps)

**Q: What if translation fails?**  
A: System uses original content, no crash

**Q: Can I have a language without translation?**  
A: Yes, just don't add to LANGUAGE_MODEL_MAP

**Q: How do I check if a language exists?**  
A: Use `/api/admin/language-check?lang=code` endpoint

**Q: Where is the configuration?**  
A: `public/config/languages.json` (single source of truth)

---

**Status:** ✅ Production Ready  
**Documentation:** 📚 Complete  
**Testing:** ✅ Verified  

No more hardcoded language models! 🎉
