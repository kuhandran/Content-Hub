# Collections Editor - Feature Documentation

## Overview
Enhanced Collections management interface with JSON viewer and editor capability. This feature allows administrators to:
- Select collection files by language and type
- View collection content as formatted JSON
- Edit JSON content directly in the interface
- Save changes back to the database
- Access collections via URL for viewing

## User Interface Components

### 1. **Collections Selector Dropdowns**
Located at the top of the Collections tab:

- **Language Dropdown**: Select from supported languages (en, es, fr, de, ar-AE, hi, id, my, si, ta, th, zh)
- **Type Dropdown**: Select collection type (config, data)
- **Filename Dropdown**: Dynamically populated with available files for selected language/type

### 2. **JSON Viewer & Editor**
Displays the selected collection's content:

**View Mode:**
- Displays formatted JSON with proper indentation
- Shows statistics (file size in bytes, number of keys)
- Shows metadata (last updated time, file hash)

**Edit Mode:**
- Full-featured textarea for JSON editing
- Real-time JSON validation with error messages
- Save/Cancel buttons
- Visual feedback on parse errors

### 3. **Save Functionality**
- Validates JSON syntax before saving
- Shows error messages if JSON is invalid
- Saves to database and invalidates cache
- Confirms successful save with alert

## API Endpoints

### Get Collection Files
```
GET /api/collections/files?language=en&type=config
```
**Response:**
```json
{
  "status": "success",
  "files": ["apiRouting", "languages", "pageLayout", "urlConfig"],
  "count": 4,
  "language": "en",
  "type": "config"
}
```

### Get Collection Content
```
GET /api/collections/[language]/[type]/[filename]
```
**Response:**
```json
{
  "status": "success",
  "data": { /* JSON content */ },
  "metadata": {
    "id": "uuid",
    "language": "en",
    "type": "config",
    "filename": "apiRouting",
    "file_hash": "sha256hash...",
    "updated_at": "2026-01-19T..."
  }
}
```

### Update Collection Content
```
PUT /api/collections/[language]/[type]/[filename]

Content-Type: application/json
{
  "content": { /* updated JSON object */ }
}
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "content": { /* updated content */ },
    "updated_at": "2026-01-19T..."
  },
  "message": "Collection updated successfully"
}
```

### Invalidate Cache
```
DELETE /api/collections/[language]/[type]/[filename]
```

## File Structure

### New Components
- `components/JsonViewerEditable.jsx` - Editable JSON viewer component
- `components/JsonViewerEditable.module.css` - Styling for JSON viewer

### New API Routes
- `app/api/collections/files/route.js` - Get list of files for language/type
- Modified: `app/api/collections/[language]/[type]/[file]/route.js` - Added PUT endpoint

### Modified Components
- `components/AdminDashboard.jsx` - Enhanced Collections tab with new functionality
- `components/AdminDashboard.module.css` - Added styles for new UI elements

## Workflow

### Step 1: Select Language
User selects a language from the Language dropdown. This automatically loads available files for that language.

### Step 2: Select Type
User selects a collection type (config or data). Available files are filtered based on language + type combination.

### Step 3: Select File
User selects a filename from the dynamically populated Filename dropdown. The component automatically fetches the content from the database.

### Step 4: View Content
Selected file's JSON content is displayed in the JSON Viewer in read-only format initially.

### Step 5: Edit (Optional)
User clicks the "✎ Edit" button to enter edit mode. The JSON content becomes editable in a textarea.

### Step 6: Validate
As the user types, JSON validation occurs in real-time. Invalid JSON shows error messages.

### Step 7: Save
User clicks "✓ Save" button to save changes. Valid JSON is sent to the database via PUT request.

### Step 8: Confirm
Upon successful save:
- Cache is automatically invalidated
- UI shows success message
- Content reloads to reflect database state

## Data Flow

```
User Selection
    ↓
Load Files (GET /api/collections/files)
    ↓
User Selects File
    ↓
Fetch Content (GET /api/collections/[language]/[type]/[file])
    ↓
Display in JSON Viewer
    ↓
User Clicks Edit
    ↓
Enable Textarea Editing
    ↓
User Modifies JSON
    ↓
Real-time Validation
    ↓
User Clicks Save
    ↓
Send PUT Request
    ↓
Database Update + Cache Invalidation
    ↓
Reload & Confirm
```

## Features

### ✅ Smart File Loading
- Files are loaded dynamically based on language/type selection
- Prevents showing invalid combinations
- Shows loading indicator while fetching

### ✅ Real-time Validation
- JSON syntax is validated as user types
- Error messages appear for invalid JSON
- Save button is disabled for invalid JSON

### ✅ Cache Management
- Redis cache is automatically invalidated after updates
- Subsequent requests fetch fresh data from database
- Configurable cache TTL (5 minutes by default)

### ✅ Metadata Display
- Shows last updated timestamp
- Displays file hash for integrity verification
- Shows file statistics (size, key count)

### ✅ Direct URL Access
Collections are accessible via API endpoints:
```
https://yourdomain.com/api/collections/en/config/apiRouting
https://yourdomain.com/api/collections/es/data/experience
```

## Security Considerations

1. **Authentication**: All endpoints require valid authentication token
2. **Input Validation**: JSON content is validated before storing
3. **Error Handling**: Sensitive error details are logged but not exposed to client
4. **Cache Invalidation**: Ensures users see latest updates immediately

## Troubleshooting

### File Dropdown Shows No Files
- Verify the language/type combination exists in the database
- Check that the collections table has records for that combination
- Use DataManager to verify database contents

### JSON Validation Errors
- Ensure JSON syntax is valid (matching quotes, brackets, etc.)
- Check for trailing commas (invalid in JSON)
- Use online JSON validator to verify syntax

### Changes Not Saving
- Check browser console for error messages
- Verify authentication token is valid
- Confirm database connection is working
- Check server logs for database errors

### Stale Data in Dropdown
- Clear browser cache
- Reload the page
- Select a different language/type combination then back

## Future Enhancements

Potential improvements for future versions:

1. **Diff View**: Show before/after changes
2. **Bulk Edit**: Edit multiple files at once
3. **Import/Export**: Download and upload JSON files
4. **Versioning**: Track content change history
5. **Search**: Filter files by name or content
6. **Syntax Highlighting**: Color-coded JSON display
7. **Undo/Redo**: Navigate through edit history
8. **Collaboration**: Show who last edited and when
