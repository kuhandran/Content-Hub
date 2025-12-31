# 🎯 Collections CMS - Complete Feature Guide

Learn how to use every feature of Collections CMS to manage your multi-language content.

## Dashboard Overview

The main dashboard is divided into several sections:

```
┌─────────────────────────────────────────────────────┐
│  Header: File Manager | 👤 User | 🌙 Theme | Logout │
├──────────────────────┬──────────────────────────────┤
│                      │ Stats Panel (System Metrics)  │
│   Sidebar Menu       │ • Total Files               │
│ (Collections, etc.)  │ • Locales (10/10)           │
│                      │ • Total Size (XX KB)        │
│                      │ • Completeness (100%)       │
│                      ├──────────────────────────────┤
│                      │ Search Bar                   │
│                      │ [🔍 Search files...]        │
│                      ├──────────────────────────────┤
│                      │ Upload Toolbar              │
│                      │ [📤 Upload File] [Options]  │
│                      ├──────────────────────────────┤
│                      │ File List                   │
│                      │ ┌──────────────────────────┐│
│                      │ │ 📄 projects.json        ││
│                      │ │ 25 KB • 🇬🇧 English   ││
│                      │ │ [📋] [👁️] [✏️] [🗑️]    ││
│                      │ └──────────────────────────┘│
│                      │ ... more files ...          │
└──────────────────────┴──────────────────────────────┘
```

## 1️⃣ Main Navigation

### Sidebar Menu

**Data Section:**
- 📦 Collections - Browse all localized content
  - 🇬🇧 English → ⚙️ Config, 📄 Data Files
  - 🇪🇸 Spanish → ⚙️ Config, 📄 Data Files
  - 🇫🇷 French → ⚙️ Config, 📄 Data Files
  - ...and 7 more locales

**Settings Section:**
- ⚙️ Config - Global configuration files

**Media Section:**
- 🖼️ Image - Image uploads and storage
- 📄 Resume - Resume/CV files

**Storage Section:**
- 📁 Files - General file storage

## 2️⃣ System Statistics

Real-time dashboard metrics showing:

**📊 Total Files** - Count of all content files (70+)
**🌍 Locales** - Completed/Total (10/10)
**💾 Total Size** - Storage used (in KB)
**✅ Completeness** - System health percentage

All stats update automatically when you load collections.

**Backup Button:** 💾 One-click ZIP export of all collections

## 3️⃣ Search & Filter

### Quick Search

1. Click search bar: `🔍 Search files by name, language, type...`
2. Start typing to filter results in real-time
3. Results show:
   - Matching filename
   - Language & folder
   - File size
   - All action buttons available

### Advanced Filtering

Search works by:
- **Filename** - `projects`, `skills`, `education`
- **Language** - `english`, `spanish`, `french`, etc.
- **Type** - `config`, `data`, etc.

**Example searches:**
- Type `english` → Shows all English files
- Type `projects` → Shows all project files across locales
- Type `skills french` → Shows French skills (if both keywords match)

**Clear button:** Click ✕ to reset search and show all files

---

## 4️⃣ Collections Management

### Browse Collections

1. **Click Collections** → Sidebar expands with locales
2. **Click Language** → Shows ⚙️ Config and 📄 Data sections
3. **Click Data Files** → Lists all translation files
4. **View Stats** → Shows file count for this folder

### Supported Locales

| 🌍 Locale | Code | Status | Files |
|-----------|------|--------|-------|
| 🇬🇧 English | `en` | ✅ Complete | 8 |
| 🇪🇸 Spanish | `es` | ✅ Complete | 8 |
| 🇫🇷 French | `fr` | ✅ Complete | 8 |
| 🇩🇪 German | `de` | ⏳ Structure ready | 0 |
| 🇸🇦 Arabic (UAE) | `ar-AE` | ✅ Complete | 8 |
| 🇮🇳 Hindi | `hi` | ✅ Complete | 8 |
| 🇮🇩 Indonesian | `id` | ✅ Complete | 8 |
| 🇲🇾 Malay | `my` | ✅ Complete | 8 |
| 🇱🇰 Sinhala | `si` | ✅ Complete | 8 |
| 🇮🇳 Tamil | `ta` | ✅ Complete | 8 |
| 🇹🇭 Thai | `th` | ✅ Complete | 8 |

---

## 5️⃣ File Operations

### View File (Read-Only)

1. **Click 👁️ View button** on any file
2. Modal opens with JSON content in read-only mode
3. Perfect for inspecting files without editing
4. Fully-formatted JSON with syntax highlighting

### Edit File

1. **Click ✏️ Edit button** on any file
2. Modal opens with editable textarea
3. Make your changes to the JSON content
4. **Click Save Changes** to save
5. File validates JSON before saving
6. Activity log records the edit

### Copy File Path

1. **Click 📋 Copy Path** button
2. Path copied to clipboard: `/collections/en/data/projects.json`
3. Perfect for API calls and integration
4. Notification confirms successful copy

### Delete File

1. **Click 🗑️ Delete button**
2. Confirmation dialog appears: "Delete filename?"
3. Confirm deletion
4. File is immediately deleted
5. Dashboard refreshes
6. Activity log records deletion

---

## 6️⃣ File Upload

### Upload Single File

1. **Navigate to folder** - Select language and type (config/data)
2. **Click Upload button** - Button text shows current folder
3. **Select JSON file** - Choose .json file from computer
4. **Enter filename** - Dialog prompts for custom filename
5. **Confirm** - File validates and uploads
6. **Done** - File appears in list immediately

**Upload validation:**
- ✅ File must be valid JSON
- ✅ Filename required (defaults to original if blank)
- ✅ .json extension added automatically
- ✅ Error shown if JSON is invalid

### File Requirements

```json
// Valid JSON structure required
{
  "key": "value",
  "nested": {
    "property": "data"
  },
  "array": [1, 2, 3]
}

// Must be valid JSON!
// No trailing commas
// All strings in quotes
// No comments
```

---

## 7️⃣ Dark Mode

### Toggle Dark Mode

1. **Click 🌙 moon icon** (top-right header)
2. Interface switches to dark theme
3. 👁️ Eye-friendly dark colors
4. **Preference saved** - Stays in dark mode next visit

### Dark Mode Features

- Dark backgrounds (#1e1e1e)
- Light text (#ffffff)
- Reduced eye strain
- Perfect for night work
- All features identical
- Persistent storage in browser

**Switch back:** Click ☀️ sun icon to return to light mode

---

## 8️⃣ Bulk Operations

### Select Multiple Files

1. **Multiple files in list** - Checkboxes appear
2. **Click checkboxes** - Select files
3. **Bar appears** - Shows "📋 X files selected"

### Bulk Actions Available

**🗑️ Delete Selected**
- Confirms deletion of all selected
- Removes in batch operation
- Faster than one-by-one

**💾 Backup Selected**
- Creates ZIP of selected files only
- Coming soon feature

**✕ Clear**
- Deselects all files
- Hides bulk action bar

---

## 9️⃣ Backup & Export

### Full System Backup

1. **System Statistics Panel** - Top of dashboard
2. **Click 💾 Backup button**
3. ZIP file downloads automatically
4. Filename: `collections-backup-YYYY-MM-DD-HHmmss.zip`
5. Contains all locales and files
6. Safe to store offsite

### Individual Locale Backup

```javascript
// Via API (JavaScript example):
await fetch('/api/backup/export/en', {
  headers: { 'Authorization': `Bearer TOKEN` }
});
// Downloads en-backup-YYYY-MM-DD-HHmmss.zip
```

### Restore from Backup

1. Unzip backup file
2. Copy `/collections` folder
3. Paste over existing `/public/collections`
4. Restart application
5. All data restored!

---

## 🔟 Activity Log

### View Recent Activities

The activity log appears at bottom of file operations:

```
12:34:56 - save projects.json (en/data)
12:34:45 - edit experience.json (en/data)
12:33:12 - delete tempfile.json (en/config)
12:32:08 - bulk-delete 3 files (all/all)
```

### Information Tracked

- **Timestamp** - Exact time of operation
- **Action** - save, edit, delete, bulk-delete, etc.
- **Filename** - Which file was affected
- **Location** - Language/Type combination

### Uses

- Audit trail for compliance
- Debugging changes
- Undo reference
- Usage analytics
- Change documentation

---

## 1️⃣1️⃣ File Templates

### Available Templates

Predefined structures for quick file creation:

```javascript
projects        // Array of project objects
experience      // Array of job positions
skills          // Object with skill categories
education       // Array of education entries
achievements    // Array of awards
chatConfig      // Chatbot configuration
contentLabels   // UI strings and labels
```

### Using Templates

1. **New file** - Click upload
2. **Select template type** - Dropdown shows all templates
3. **Auto-fill structure** - Template fills JSON skeleton
4. **Add your data** - Customize as needed
5. **Save** - Regular save process

---

## 1️⃣2️⃣ Statistics Deep Dive

### What Each Stat Means

**Total Files**
- Count of all JSON files across all locales
- Includes config and data files
- Updates as you add/delete files

**Locales**
- Shows completed/total locales (e.g., 10/10)
- Locale is "complete" when has all required files
- Helps identify missing translations

**Total Size**
- Combined file size in KB
- Indicates storage usage
- Helps plan backup frequency

**Completeness**
- Percentage of all locales that are complete
- 100% = all locales have all required files
- Shows translation progress

### How to Improve

- 📈 **Increase files** - More content files
- 🌍 **Complete locales** - Fill missing translations
- 📦 **Reduce size** - Trim unnecessary data

---

## 1️⃣3️⃣ API Integration

### Using the API

All dashboard features available via API:

```javascript
// List files
GET /api/collections/en/data
  → Returns array of files

// Read file
GET /api/collections/en/data/projects.json
  → Returns parsed JSON

// Update file
POST /api/collections/en/data/projects.json
  → { "projects": [...] }

// Delete file
DELETE /api/collections/en/data/projects.json
  → Success response

// Get statistics
GET /api/config/statistics
  → Returns system metrics

// Export backup
GET /api/backup/export
  → Returns ZIP file
```

### Authentication

All API requests require JWT token:

```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

## 🎓 Common Workflows

### Workflow 1: Add New Content

1. ✅ Select locale (English)
2. ✅ Click data files
3. ✅ Click edit on relevant file
4. ✅ Add content to JSON array
5. ✅ Click Save
6. ✅ Verify in view mode

### Workflow 2: Translate Content

1. ✅ Open English version of file
2. ✅ Note the structure and keys
3. ✅ Go to target locale
4. ✅ Copy English file or use template
5. ✅ Translate all values
6. ✅ Save and verify

### Workflow 3: Backup Before Update

1. ✅ Click 💾 Backup button
2. ✅ Save ZIP to safe location
3. ✅ Make your updates
4. ✅ Test changes
5. ✅ If needed, restore from backup

### Workflow 4: Search & Replace

1. ✅ Search for text you want to find
2. ✅ Open files one-by-one
3. ✅ Edit JSON to replace text
4. ✅ Save each file
5. ✅ Or use API for bulk replacement

### Workflow 5: Monitor Changes

1. ✅ Check Activity Log frequently
2. ✅ Note timestamp of changes
3. ✅ Track who did what (if multi-user)
4. ✅ Create audit report if needed
5. ✅ Archive old backups

---

## ⚡ Keyboard Shortcuts

Coming soon! Planned shortcuts:
- `Cmd+S` / `Ctrl+S` - Save file
- `Cmd+K` / `Ctrl+K` - Open search
- `Esc` - Close modal

---

## 🆘 Troubleshooting

### Search not returning results?

**Cause:** Collection not loaded
**Fix:** 
1. Click Collections in sidebar
2. Select language
3. Click "Data Files"
4. Then search

### Upload failing?

**Check:**
- File is valid JSON
- Filename is not empty
- No special characters in filename
- File size < 10MB

**Error?** Check browser console (F12)

### Can't save changes?

**Check:**
- JSON is valid (no trailing commas)
- All quotes matched
- No syntax errors
- Try refreshing page

**Error message?** Copy to JSON validator

### Dark mode not saving?

**Fix:**
- Clear browser cookies
- Check browser storage allowed
- Try different browser
- Check privacy mode disabled

---

## 📚 Quick Reference

| Task | Button | Shortcut |
|------|--------|----------|
| View file | 👁️ | - |
| Edit file | ✏️ | - |
| Copy path | 📋 | - |
| Delete file | 🗑️ | - |
| Search | 🔍 | Cmd+K |
| Theme | 🌙☀️ | - |
| Backup | 💾 | - |
| Logout | Button | - |

---

## 💡 Pro Tips

1. **Backup regularly** - Use 💾 button weekly
2. **Test before deploy** - View files before using
3. **Keep activity log** - Reference for audits
4. **Search often** - Don't navigate manually
5. **Use templates** - Faster file creation
6. **Copy paths** - Great for API documentation
7. **Dark mode** - Easier on eyes for long sessions
8. **Check stats** - Monitor completeness

---

## 🎯 Success Indicators

You're using Collections CMS effectively when:

✅ Can navigate to any file in <5 seconds
✅ Search finds files across all locales
✅ Can edit and save without errors
✅ Backups download successfully
✅ Activity log shows your changes
✅ Dark mode preferred for night work
✅ Stats show 100% completeness
✅ Can explain API endpoints

---

Enjoy managing your multilingual content! 🎉
