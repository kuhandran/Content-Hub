# Collections Editor - Quick Start Guide

## What's New?

The Collections tab in the Admin Dashboard now has an enhanced interface to view and edit collection content directly from the database:

### Before
- View sync status only
- No way to edit content from UI

### After
- ✅ Select and view collection content
- ✅ Edit JSON content in-place
- ✅ Save changes to database
- ✅ Real-time JSON validation
- ✅ View file metadata
- ✅ Access collections via URL

---

## How to Use

### 1. Navigate to Collections
- Login to Admin Dashboard
- Click "Collections" in the left sidebar
- You'll see three dropdown selectors

### 2. Select Language
```
Language: [en ▼]
```
Choose your desired language from the list:
- en (English)
- es (Spanish)
- fr (French)
- de (German)
- ar-AE (Arabic)
- hi (Hindi)
- id (Indonesian)
- my (Malay)
- si (Sinhala)
- ta (Tamil)
- th (Thai)

> ℹ️ Selecting a language automatically loads all available files for that language.

### 3. Select Type
```
Type: [config ▼]
```
Choose the collection type:
- **config** - Configuration files (apiRouting, languages, etc.)
- **data** - Data files (achievements, education, experience, etc.)

> ℹ️ Changing the type filters the available files.

### 4. Select File
```
Filename: [-- Select a file --▼]
```
- The dropdown populates based on your language/type selection
- Select the file you want to view/edit

> ℹ️ Once selected, the content automatically loads below.

### 5. View Content
The JSON content appears in a formatted display:
```json
{
  "apiRouting": {
    "baseUrl": "https://api.example.com",
    "endpoints": {
      ...
    }
  }
}
```

Below the content you'll see:
- **Updated**: Last modification timestamp
- **Hash**: File integrity hash (first 16 characters)
- **Size**: Content size in bytes
- **Keys**: Number of top-level keys

### 6. Edit Content (Optional)

#### Click "✎ Edit" Button
The content switches to a textarea where you can modify the JSON:

```
✎ Edit    [Switch to edit mode]

┌──────────────────────────────────┐
│ {                                │
│   "apiRouting": {                │
│     "baseUrl": "https://..."     │
│   }                              │
│ }                                │
└──────────────────────────────────┘
```

#### Type Your Changes
Modify the JSON as needed. As you type:
- ✅ Valid JSON: No error message
- ❌ Invalid JSON: Red error message appears

#### Click "✓ Save" to Save
```
✓ Save    [Saves to database]
✕ Cancel  [Reverts to view mode]
```

#### Or Click "✕ Cancel" to Discard
Your changes are discarded and you return to view mode.

---

## Common Tasks

### View a Configuration File
```
1. Language: en
2. Type: config
3. Filename: apiRouting
   → Shows API routing configuration
```

### Edit Experience Data
```
1. Language: en
2. Type: data
3. Filename: experience
4. Click "✎ Edit"
5. Modify experience entries
6. Click "✓ Save"
```

### Compare Versions
```
1. Select file in one language
2. Switch language dropdown
3. Select same file in different language
4. Compare side-by-side (open two tabs)
```

### Export Configuration
```
1. Select and view the file
2. Select all JSON (Ctrl+A)
3. Copy (Ctrl+C)
4. Paste into editor or save to file
```

---

## Tips & Tricks

### 💡 Keyboard Shortcuts
- **Tab**: Indent (in edit mode)
- **Ctrl+A**: Select all content
- **Ctrl+C**: Copy selected content
- **Ctrl+Z**: Browser undo

### 💡 JSON Validation
Invalid JSON examples:
```json
// ❌ Missing quotes
{ apiRouting: { ... } }  

// ❌ Trailing comma
{ "key": "value", }  

// ❌ Unmatched quotes
{ "key": 'value' }  

// ✅ Valid JSON
{ "key": "value" }
```

### 💡 Edit Large Files
- Use Find & Replace (Ctrl+H) in textarea
- Work on sections at a time
- Validate frequently to catch errors early

### 💡 Verify Changes
After saving:
1. Check success message
2. Notice "Updated" timestamp changes
3. File hash may change if content changed
4. Refresh page to confirm database saved it

---

## Error Messages & Solutions

### "Invalid JSON: ..."
**Problem**: Your JSON syntax is incorrect

**Solution**:
- Check for missing/extra quotes
- Check for trailing commas
- Verify all brackets are matched
- Use online JSON validator

### "Missing required parameters"
**Problem**: Incomplete selection

**Solution**:
- Ensure you selected all three dropdowns
- Language, Type, and Filename must all be selected

### "Collection not found"
**Problem**: Selected file doesn't exist

**Solution**:
- Verify the language/type combination has this file
- Try different language/type combinations
- Use DataManager to check what files exist

### "Changes Not Saving"
**Problem**: Save button doesn't respond

**Solution**:
- Check browser console for errors
- Verify valid JSON before saving
- Check your authentication token is valid
- Refresh page and try again

---

## API Access

### View Collection via URL
Collections are accessible via REST API:

```
GET /api/collections/[language]/[type]/[filename]
```

Examples:
```bash
# Get English API routing config
https://yourdomain.com/api/collections/en/config/apiRouting

# Get Spanish experience data
https://yourdomain.com/api/collections/es/data/experience

# Get German education data
https://yourdomain.com/api/collections/de/data/education
```

### Get List of Files
```bash
# List all files for English config
https://yourdomain.com/api/collections/files?language=en&type=config

# List all data files for Spanish
https://yourdomain.com/api/collections/files?language=es&type=data
```

---

## Important Notes

### ⚠️ Backup Before Major Changes
- Make a copy of original content before large edits
- Test changes in development before production
- Use version control for your configurations

### ⚠️ JSON Validation
- Always validate JSON before saving
- The editor helps but doesn't guarantee correctness
- Test the updated content in your application

### ⚠️ Performance
- Large JSON files may take time to load/save
- Browser may become unresponsive with very large files
- Consider splitting into smaller files if too large

### ⚠️ Security
- Only authorized users can edit collections
- All changes are logged to database
- Don't share authentication tokens

---

## Frequently Asked Questions

### Q: Can I edit multiple files at once?
**A**: Not yet, but you can open multiple browser tabs.

### Q: What happens to the old content?
**A**: It's replaced in the database. Consider keeping backups.

### Q: Can I revert changes?
**A**: Not directly. You need to edit back or restore from backup.

### Q: How often is content cached?
**A**: 5 minutes in Redis. Cache is invalidated immediately after saves.

### Q: Can I upload JSON from a file?
**A**: Not yet. You can copy/paste instead.

### Q: What if the JSON file is very large?
**A**: The editor handles it but may be slow. Consider splitting the file.

### Q: Are changes synced to public folder?
**A**: No, changes are database-only. Use DataManager to sync to disk.

---

## Getting Help

If you encounter issues:

1. **Check the Console**: Open browser DevTools (F12) → Console for errors
2. **Check Server Logs**: Look for API errors in server logs
3. **Review Documentation**: See `COLLECTIONS_EDITOR.md` for details
4. **Verify Setup**: Confirm database connection is working
5. **Test API**: Use curl/Postman to test endpoints directly

---

## Next Steps

- Explore other Admin Dashboard features
- Review [Collections Editor Documentation](./COLLECTIONS_EDITOR.md)
- Check out the [Architecture Diagram](./COLLECTIONS_EDITOR_ARCHITECTURE.md)
- Experiment with different language/type combinations
- Use the JSON editor for your content management needs!

---

## Summary

The Collections Editor provides an intuitive interface to:
- ✅ Browse collection files by language and type
- ✅ View formatted JSON content
- ✅ Edit content directly in the browser
- ✅ Validate JSON syntax in real-time
- ✅ Save changes to database automatically
- ✅ Access collections via REST API

Happy editing! 🚀
