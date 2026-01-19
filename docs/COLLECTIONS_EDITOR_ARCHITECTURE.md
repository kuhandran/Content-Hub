# Collections Editor - Architecture Diagram

## Component Hierarchy

```
AdminDashboard
├── CollectionsTabContent
│   ├── Language Selector (Dropdown)
│   ├── Type Selector (Dropdown)
│   ├── Filename Selector (Dropdown)
│   ├── JsonViewerEditable
│   │   ├── View Mode
│   │   │   ├── Formatted JSON Display
│   │   │   └── Statistics (Size, Keys)
│   │   └── Edit Mode
│   │       ├── Textarea for Editing
│   │       ├── Real-time Validation
│   │       ├── Edit/Save/Cancel Buttons
│   │       └── Error Messages
│   ├── Metadata Display
│   │   ├── Last Updated
│   │   └── File Hash
│   └── Sync Status Section
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Collections Tab (UI)                        │
│  ┌────────────┬──────────────┬──────────────────────────────┐  │
│  │ Language   │ Type         │ Filename                     │  │
│  │ Dropdown   │ Dropdown     │ Dropdown                     │  │
│  └────────────┴──────────────┴──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ├─► loadCollectionFiles()
                          │
                          v
            ┌────────────────────────────────────┐
            │  GET /api/collections/files        │
            │  ?language=en&type=config          │
            └────────────────────────────────────┘
                          │
                          v
            ┌────────────────────────────────────┐
            │  PostgreSQL Database               │
            │  SELECT DISTINCT filename          │
            │  FROM collections                  │
            └────────────────────────────────────┘
                          │
                          v
            ┌────────────────────────────────────┐
            │  Filename Dropdown                 │
            │  [apiRouting, languages, ...]      │
            └────────────────────────────────────┘
                          │
         User Selects File│
                          v
                   loadCollectionContent()
                          │
                          v
            ┌────────────────────────────────────┐
            │ GET /api/collections/en/config/... │
            └────────────────────────────────────┘
                          │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
    ┌───v────┐      ┌─────v──────┐   ┌──────v──────┐
    │ Redis  │──►   │ PostgreSQL  │   │  API Memory │
    │ Cache  │      │ Database    │   │             │
    └────────┘      └─────────────┘   └─────────────┘
                          │
                          v
            ┌────────────────────────────────────┐
            │  JSON Content + Metadata           │
            │  {                                 │
            │    "content": {...},               │
            │    "id": "uuid",                   │
            │    "updated_at": "2026-01-19..."   │
            │  }                                 │
            └────────────────────────────────────┘
                          │
                          v
            ┌────────────────────────────────────┐
            │     JsonViewerEditable             │
            │  (View/Edit Mode Toggling)         │
            └────────────────────────────────────┘
                          │
         User Clicks Edit │
                          v
            ┌────────────────────────────────────┐
            │   Textarea for Editing             │
            │  Real-time JSON Validation         │
            │  Save/Cancel Buttons               │
            └────────────────────────────────────┘
                          │
         User Clicks Save │
                          v
           saveCollectionContent()
                          │
                          v
            ┌────────────────────────────────────┐
            │ PUT /api/collections/en/config/... │
            │ Content: {...}                     │
            └────────────────────────────────────┘
                          │
                          v
            ┌────────────────────────────────────┐
            │   Update Database Record           │
            │   UPDATE collections               │
            │   SET content = $1                 │
            │   WHERE ... RETURNING *             │
            └────────────────────────────────────┘
                          │
                          v
            ┌────────────────────────────────────┐
            │   Invalidate Redis Cache           │
            │   DEL collections:en:config:...    │
            └────────────────────────────────────┘
                          │
                          v
            ┌────────────────────────────────────┐
            │   Return Success Response          │
            │   + Updated Content                │
            └────────────────────────────────────┘
                          │
                          v
            ┌────────────────────────────────────┐
            │   UI Updates                       │
            │   - Shows success message          │
            │   - Reloads content                │
            │   - Reverts to view mode           │
            │   - Clears edit flag               │
            └────────────────────────────────────┘
```

## File Organization

```
Content-Hub/
├── components/
│   ├── AdminDashboard.jsx          [MODIFIED - Added Collections logic]
│   ├── AdminDashboard.module.css    [MODIFIED - Added JSON viewer styles]
│   └── JsonViewerEditable.jsx       [NEW - JSON viewer component]
│   └── JsonViewerEditable.module.css [NEW - JSON viewer styles]
│
├── app/api/
│   └── collections/
│       ├── route.js                [EXISTING - List all collections]
│       ├── files/
│       │   └── route.js            [NEW - Get files for language/type]
│       └── [language]/[type]/[file]/
│           └── route.js            [MODIFIED - Added PUT endpoint]
│
└── docs/
    ├── COLLECTIONS_EDITOR.md              [NEW - Feature documentation]
    └── COLLECTIONS_EDITOR_IMPLEMENTATION.md [NEW - Implementation guide]
```

## State Management

```
AdminDashboard (Parent Component)
│
├── activeLanguage                        [User selected language]
│   └── triggers: loadCollectionFiles()
│
├── activeCollectionType                  [User selected type]
│   └── triggers: loadCollectionFiles()
│
├── collectionFiles []                    [Array of filenames]
│   └── fetched from: GET /api/collections/files
│
├── activeCollectionFile                  [Selected filename]
│   └── triggers: loadCollectionContent()
│
├── collectionContent {                   [Loaded content object]
│   ├── id
│   ├── content {}
│   ├── fileHash
│   └── updatedAt
│  }└── from: GET /api/collections/.../...
│
├── collectionContentLoading boolean      [Loading indicator]
│   └── for: GET requests
│
├── collectionContentEdited boolean       [Tracks if edited]
│   └── sets: Save button visibility
│
└── collectionContentSaving boolean       [Saving indicator]
    └── for: PUT requests
```

## Database Schema (Relevant)

```sql
CREATE TABLE collections (
  id UUID PRIMARY KEY,
  language VARCHAR(10),
  type VARCHAR(50),
  filename VARCHAR(255),
  file_path TEXT,
  file_hash VARCHAR(64),
  content JSONB,                    ◄── Stores the JSON data
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(language, type, filename)
);

CREATE INDEX idx_collections_language ON collections(language);
CREATE INDEX idx_collections_type ON collections(type);
```

## API Endpoint Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    API ENDPOINTS                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ GET /api/collections/files                                 │
│ ├─ Query: ?language=en&type=config                         │
│ └─ Returns: { files: [...], count: N }                     │
│                                                             │
│ GET /api/collections/[language]/[type]/[file]              │
│ ├─ Returns: { data: {...}, metadata: {...} }               │
│ └─ Cached: 5 minutes in Redis                              │
│                                                             │
│ PUT /api/collections/[language]/[type]/[file]              │
│ ├─ Body: { content: {...} }                                │
│ ├─ Updates: database record                                │
│ └─ Side-effect: invalidates cache                          │
│                                                             │
│ DELETE /api/collections/[language]/[type]/[file]           │
│ ├─ Purpose: invalidate cache                               │
│ └─ Called: automatically after PUT                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Interaction Sequence Diagram

```
User                UI              API              Database
 │                  │                 │                │
 ├─ Select Lang ──► │                 │                │
 │                  ├─ Load Files ───► │                │
 │                  │                  ├─ Query ───────► │
 │                  │                  │◄─ Files List ──┤
 │                  │◄─────────────────┤                │
 │                  │                  │                │
 ├─ Select Type ──► │                  │                │
 │                  ├─ Load Files ───► │                │
 │                  │                  ├─ Query ───────► │
 │                  │                  │◄─ Files List ──┤
 │                  │◄─────────────────┤                │
 │                  │                  │                │
 ├─ Select File ──► │                  │                │
 │                  ├─ Load Content ──► │                │
 │                  │                  ├─ Try Redis ─┐  │
 │                  │                  │  (miss)     │  │
 │                  │                  ├─ Query ────────► │
 │                  │                  │◄─ Content ──────┤
 │                  │                  ├─ Cache ─────┐   │
 │                  │◄─────────────────┤             │   │
 │                  │                  │             │   │
 ├─ Click Edit ────► │ Toggle Mode      │             │   │
 │                  │ Show Textarea    │             │   │
 │                  │                  │             │   │
 ├─ Type JSON ─────► │ Real-time        │             │   │
 │                  │ Validation       │             │   │
 │                  │                  │             │   │
 ├─ Click Save ────► │                  │             │   │
 │                  ├─ Save Content ──► │             │   │
 │                  │                  ├─ Update ──────► │
 │                  │                  │◄─ OK ──────────┤
 │                  │                  ├─ Invalidate ──► │
 │                  │                  │  Cache         │
 │                  │◄─────────────────┤                │
 │                  │ Show Success      │                │
 │
```

## Error Handling Flow

```
Operation Fails
       │
       ├─► Database Error
       │   └─► Log to server
       │   └─► Return error message to client
       │   └─► Show alert to user
       │
       ├─► JSON Validation Error
       │   └─► Show inline error message
       │   └─► Disable save button
       │   └─► Highlight error location
       │
       └─► Network Error
           └─► Show error alert
           └─► Suggest retry
```

## Performance Optimization

```
Initial Load (First Time)
├─► Load files: ~50ms (DB query)
├─► Load content: ~100ms (DB query + parse)
└─► Total: ~150ms

Subsequent Loads (Cached)
├─► Load files: ~50ms (DB query)
├─► Load content: ~5ms (Redis cache)
└─► Total: ~55ms (Cache hit saves 95ms)

Save Operation
├─► Validate JSON: <1ms (client-side)
├─► Send to API: ~10ms (network)
├─► Update DB: ~50ms
├─► Invalidate Cache: ~5ms
└─► Return Response: ~10ms
└─► Total: ~75ms
```
