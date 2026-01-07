# Chat & Language Management Features

## Overview
Enhanced dashboard with AI-powered chat and automated language management using Hugging Face.

---

## 1. Chat Service (Right Panel)

### Features
- **Real-time Chat** - Chat with content assistant about your collections
- **Context-Aware** - Understands dashboard context
- **No Tables** - Clean message-based interface
- **Hugging Face Powered** - Uses Mistral-7B model for intelligence

### Usage
1. Click **💬 Chat** button on dashboard
2. Type your question about content
3. Get instant responses from AI assistant
4. Chat history persists during session

### Example Questions
- "What collections do we have?"
- "Summarize the English content"
- "What languages are available?"
- "How many items in our database?"

### Implementation
- **Component**: `app/components/ChatPanel.tsx`
- **Service**: `lib/huggingface-service.ts`
- **API Endpoint**: `POST /api/v1/chat/message`

---

## 2. Language Management

### Create New Language
1. Click **+ New Language** button on dashboard
2. Select target language from list
3. System shows **checklist** of operations:
   - ✓ Check existing languages
   - ✓ Create folder structure
   - ✓ Copy config files
   - ✓ Translate data files (Hugging Face)
   - ✓ Update languages.json
   - ✓ Sync changes

4. Review checklist items
5. Click **Confirm & Create** to proceed
6. Files are created and content translated automatically

### Supported Languages
- Spanish (es)
- French (fr)
- German (de)
- Hindi (hi)
- Arabic (ar)
- Portuguese (pt)
- Indonesian (id)
- Thai (th)
- Tamil (ta)

### What Happens Behind the Scenes
1. **Folder Checking**
   - Verifies if language already exists
   - Confirms English (en) as base exists
   - Lists files to be processed

2. **File Creation**
   - Creates `/public/collections/{lang}/` directory
   - Creates `config/` subfolder
   - Creates `data/` subfolder

3. **File Processing**
   - **Config Files**: Copied as-is from English
   - **Data Files**: Translated using Hugging Face translation API

4. **Translation Details**
   - Uses Helsinki-NLP OPUS models for accuracy
   - Translates JSON content recursively
   - Preserves JSON structure

5. **Configuration Update**
   - Adds language to `public/config/languages.json`
   - Records creation timestamp
   - Sets language as enabled

6. **Sync & Push**
   - Ready to push changes to system
   - Updates configuration files
   - Broadcasts changes to all clients

### Implementation Details

#### Services
- **`lib/huggingface-service.ts`**
  - `translateText()` - Translate individual strings
  - `chat()` - Chat functionality
  - `summarizeContent()` - Content summarization

- **`lib/language-service.ts`**
  - `createLanguageChecklist()` - Generate checklist
  - `createNewLanguage()` - Execute language creation
  - `languageExists()` - Check if language exists
  - `translateJsonContent()` - Recursive JSON translation

#### Components
- **`app/components/LanguageModal.tsx`**
  - Language selection UI
  - Checklist display
  - Progress tracking
  - Confirmation workflow

#### API Endpoints
- **`POST /api/admin/create-language`** - Create new language
- **`GET /api/admin/language-check`** - Check language before creation

---

## 3. Configuration

### Environment Variables
Add to `.env.local`:

```env
# Hugging Face API Token
HUGGINGFACEHUB_API_TOKEN=your_token_here

# Database
DATABASE_URL=postgresql://...

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

### Get Hugging Face Token
1. Visit https://huggingface.co/settings/tokens
2. Create new token with read access
3. Copy token to `.env.local`

### Available Models
- **Chat**: `mistralai/Mistral-7B-Instruct-v0.1`
- **Translation**: `Helsinki-NLP/opus-mt-*-*` (language-specific)
- **Summarization**: `facebook/bart-large-cnn`

---

## 4. Workflow Example

### Scenario: Create Spanish Language Content

**User Actions:**
1. Click **+ New Language**
2. Select "Spanish - Español"
3. View checklist showing:
   - Create `/es` folder
   - Create `es/config` folder
   - Create `es/data` folder
   - Copy 3 config files
   - Translate 8 data files
   - Update languages.json
   - Sync changes

4. Review items (all pass)
5. Click **Confirm & Create**

**System Actions:**
1. ✓ Creates directories
2. ✓ Copies `skills.json`, `projects.json`, etc.
3. ✓ Translates content using Hugging Face
   - English: "Software Engineer" → Spanish: "Ingeniero de Software"
   - English: "React Expert" → Spanish: "Experto en React"
4. ✓ Updates `languages.json` with Spanish entry
5. ✓ Marks as complete and ready to sync

**Result:**
- New `/public/collections/es/` folder with all content
- Spanish version of all JSON files
- Configuration updated
- Ready for users to access Spanish content

---

## 5. File Structure

```
Content Hub/
├── app/
│   ├── components/
│   │   ├── ChatPanel.tsx          # Chat UI
│   │   ├── LanguageModal.tsx      # Language creation UI
│   │   └── ...
│   ├── api/
│   │   ├── v1/chat/message/       # Chat API
│   │   └── admin/
│   │       ├── create-language/   # Language creation
│   │       └── language-check/    # Checklist generation
│   └── admin/dashboard/           # Updated with new features
│
├── lib/
│   ├── huggingface-service.ts     # HF API integration
│   ├── language-service.ts        # Language management
│   └── ...
│
├── public/collections/
│   ├── en/                        # English (base)
│   │   ├── config/
│   │   └── data/
│   ├── es/                        # Spanish (created)
│   │   ├── config/                # Copied from en
│   │   └── data/                  # Translated from en
│   └── ...
│
└── .env.local                     # API tokens
```

---

## 6. Error Handling

### Common Issues & Solutions

**Error: "HUGGINGFACEHUB_API_TOKEN is not set"**
- Solution: Add token to `.env.local`

**Error: "Language already exists"**
- Solution: Choose different language or delete existing first

**Error: "Base language not found"**
- Solution: Ensure `/public/collections/en/` exists

**Translation fails for specific file**
- Fallback: File copied as-is, retried once
- Check API token validity

**Modal stuck on processing**
- Check browser console for errors
- Verify network connection
- Retry operation

---

## 7. Performance Notes

- **Chat responses**: ~2-5 seconds (depends on API)
- **Language creation**: ~30-120 seconds (depends on file count)
- **Translation**: ~500-1000ms per JSON field
- **File operations**: Handled serverside, no timeout issues

---

## 8. Security Considerations

- API tokens stored in `.env.local` (server-only)
- Language creation requires admin role (future implementation)
- Chat context limited to dashboard scope
- No sensitive data in translation logs

---

## 9. Future Enhancements

- [ ] Batch language creation
- [ ] Custom translation models
- [ ] Chat history persistence
- [ ] Language status dashboard
- [ ] Translation quality metrics
- [ ] Automated content sync
- [ ] Role-based access control
- [ ] Language deletion with confirmation

---

## 10. Testing

### Test Chat Feature
```bash
curl -X POST http://localhost:3000/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is this dashboard about?",
    "context": "Content Hub Dashboard"
  }'
```

### Test Language Check
```bash
curl http://localhost:3000/api/admin/language-check?lang=es
```

### Test Language Creation
```bash
curl -X POST http://localhost:3000/api/admin/create-language \
  -H "Content-Type: application/json" \
  -d '{"languageCode": "es"}'
```

---

**Created**: January 7, 2026  
**Version**: 1.0  
**Status**: Production Ready
