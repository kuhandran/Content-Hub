# Application Configuration Files

This directory contains centralized configuration for the application, making it easy to manage URLs, error messages, and prepare for multi-language support.

## Files Overview

### 1. `urlConfig.json`
**Location**: `/public/config/urlConfig.json`

Centralized URL configuration with organized structure for domains, subdomains, and paths.

**Structure**:
```json
{
  "services": {
    "cdn": { protocol, domain, paths },
    "primary": { protocol, domain, paths },
    "api": { multiple API endpoints },
    "external": { third-party services }
  },
  "fullUrls": { pre-built complete URLs },
  "csp": { Content Security Policy configuration },
  "preconnect": [ DNS preconnection domains ]
}
```

**Usage Example**:
```typescript
import { getUrl, getUrlSync } from '@/lib/config/appConfig';

// Async usage
const cdnBase = await getUrl('fullUrls.cdnBase');

// Sync usage (after initialization)
const contactUrl = getUrlSync('fullUrls.contact');
```

**Benefits**:
- ✅ Single source of truth for all URLs
- ✅ Easy domain/path management
- ✅ Centralized CSP configuration
- ✅ Environment-agnostic (works in dev, staging, production)
- ✅ No hardcoded URLs in code

### 2. `errorMessages.json`
**Location**: `/public/data/errorMessages.json`

Comprehensive error messages, warnings, and info messages organized by category.

**Structure**:
```json
{
  "errors": {
    "common": {},
    "network": {},
    "validation": {},
    "file": {},
    "contact": {},
    "data": {},
    "chatbot": {}
  },
  "warnings": {},
  "info": {},
  "messages": {}
}
```

**Usage Example**:
```typescript
import { getErrorMessage, getErrorMessageSync } from '@/lib/config/appConfig';

// Async usage
const error = await getErrorMessage('contact.validation.missingFields');
// Returns: "All fields are required"

// Sync usage (after initialization)
const networkError = getErrorMessageSync('network.connectionError');
// Returns: "Connection error. Please check your internet connection."
```

**Benefits**:
- ✅ Centralized error message management
- ✅ Easy multi-language translation (just create new JSON files)
- ✅ Consistent error messaging across app
- ✅ Easy to update without code changes
- ✅ Supports nested message paths

## Configuration Loader Module

**Location**: `/src/lib/config/appConfig.ts`

Provides utilities to load and access configuration from JSON files.

### Functions

#### `loadUrlConfig()`
Loads URL configuration with caching and error handling.
```typescript
const config = await loadUrlConfig();
```

#### `loadErrorMessages()`
Loads error messages with caching and error handling.
```typescript
const messages = await loadErrorMessages();
```

#### `initializeAppConfig()`
Initialize both configs during app startup (call in layout).
```typescript
await initializeAppConfig();
```

#### `getUrl(path: string)`
Get URL by path (async). Path uses dot notation.
```typescript
const url = await getUrl('fullUrls.contact');
// Path examples: 'fullUrls.cdnBase', 'services.cdn.domain'
```

#### `getErrorMessage(path: string, defaultMessage?: string)`
Get error message by path (async). Path uses dot notation.
```typescript
const msg = await getErrorMessage('contact.file.invalidType');
// Returns: "Only PDF and DOCX files are allowed"
```

#### Synchronous Versions
For use after initialization (when cached data available):
```typescript
getUrlSync(path, defaultUrl)        // Get URL synchronously
getErrorMessageSync(path, default)   // Get error message synchronously
getUrlConfigSync()                   // Get full URL config
getErrorMessagesSync()               // Get full error messages
```

## Integration Guide

### Step 1: Initialize in Layout
Update `src/app/layout.tsx`:
```typescript
import { initializeAppConfig } from '@/lib/config/appConfig';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize configs on app startup
  await initializeAppConfig();
  
  return (
    // ... layout content
  );
}
```

### Step 2: Use in Components
```typescript
import { getUrlSync, getErrorMessageSync } from '@/lib/config/appConfig';

export const MyComponent = () => {
  const contactUrl = getUrlSync('fullUrls.contact');
  const errorMsg = getErrorMessageSync('contact.submission.failed');
  
  return (
    // ... component content
  );
};
```

### Step 3: Use in API Routes
```typescript
import { getUrlSync, getErrorMessageSync } from '@/lib/config/appConfig';

export async function POST(request: Request) {
  try {
    // ... handle request
  } catch (error) {
    const errorMsg = getErrorMessageSync('common.unknownError');
    return NextResponse.json({ error: errorMsg });
  }
}
```

## Multi-Language Support

To support multiple languages, follow this pattern:

1. **Create language-specific error files**:
   - `/public/data/errorMessages-en.json` (English)
   - `/public/data/errorMessages-es.json` (Spanish)
   - `/public/data/errorMessages-fr.json` (French)

2. **Create language-specific URL files**:
   - `/public/config/urlConfig-en.json`
   - `/public/config/urlConfig-es.json`

3. **Update appConfig.ts** to load based on locale:
   ```typescript
   const locale = getLocale(); // From context or URL
   const messagesFile = `/data/errorMessages-${locale}.json`;
   ```

4. **Restart app** - configs will load with selected language

## Migration Checklist

- [ ] Move all hardcoded URLs to `urlConfig.json`
- [ ] Move all error messages to `errorMessages.json`
- [ ] Update components to use `getUrl()` / `getUrlSync()`
- [ ] Update components to use `getErrorMessage()` / `getErrorMessageSync()`
- [ ] Call `initializeAppConfig()` in layout
- [ ] Test in dev environment
- [ ] Deploy to production

## CSP Configuration

CSP headers are generated from `urlConfig.json` in `/src/app/layout.tsx`:

```typescript
const urlConfig = getUrlConfigSync();
const cspHeader = `
  connect-src ${urlConfig.csp.connectSources.join(' ')}
  script-src ${urlConfig.csp.scriptSources.join(' ')}
`;
```

This ensures CSP is always in sync with configured URLs.

## Benefits Summary

✅ **No Hardcoded URLs** - All URLs in JSON files  
✅ **No Hardcoded Error Messages** - All messages in JSON files  
✅ **Multi-Language Ready** - Easy to add new language files  
✅ **Centralized Management** - Single place to update all config  
✅ **Easy Maintenance** - Update without code rebuild  
✅ **Type-Safe** - Using dot-notation path strings  
✅ **Cached** - Configs loaded once and cached  
✅ **Error Handling** - Graceful fallbacks if files missing  
✅ **CSP Integration** - Automatic CSP header generation  
✅ **Environment Agnostic** - Works in all environments  

## File Size Impact

- `urlConfig.json`: ~2-3 KB
- `errorMessages.json`: ~2-3 KB
- `appConfig.ts`: ~5 KB

**Total**: ~7-8 KB additional file size (negligible impact)

## Questions?

Refer to the existing config JSON files for structure examples and usage patterns.
