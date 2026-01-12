# 🔧 Pump Implementation Deep Dive

## File Structure

```
app/
├── api/
│   └── admin/
│       ├── data/
│       │   └── route.js              ← POST /api/admin/data (action: 'pump')
│       └── operations/
│           └── route.js              ← POST /api/admin/operations (operation: 'pumpdata')
└── dashboard/
    └── page.jsx                      ← UI that triggers pump

lib/
├── sync-config.js                    ← File mapping logic
├── dbop.js                           ← Unified DB operations
└── supabase.js                       ← Supabase client
```

---

## Code: scanPublicFolder()

**Location**: Both route.js files contain this function

```javascript
function scanPublicFolder() {
  const publicPath = getPublicDir();  // Usually ./public
  const files = [];

  function walkDir(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(publicPath, fullPath);

      if (entry.isDirectory()) {
        // Recursively walk directories (skip ignored ones)
        if (!IGNORED_DIRS.includes(entry.name)) {
          walkDir(fullPath);
        }
      } else {
        // Process files
        if (ALLOWED_EXTENSIONS.includes(path.extname(fullPath).toLowerCase())) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const hash = calculateHash(content);
            const { table, fileType } = mapFileToTable(fullPath);

            if (table !== 'unknown') {
              files.push({
                path: fullPath,              // Absolute path
                relativePath,                // e.g., 'collections/en/config/apiConfig.json'
                content,                     // File contents (string)
                hash,                        // SHA256 hash
                table,                       // Destination table name
                fileType                     // File extension
              });
            }
          } catch (error) {
            console.warn(`⚠️  Failed to read: ${fullPath}`);
          }
        }
      }
    }
  }

  walkDir(publicPath);
  return files;  // Array of file objects ready for processing
}
```

**Returns**: Array of file objects
```javascript
[
  {
    path: "/absolute/path/public/collections/en/config/apiConfig.json",
    relativePath: "collections/en/config/apiConfig.json",
    content: '{"baseUrl":"..."}',
    hash: "abc123def456...",
    table: "collections",
    fileType: "json"
  },
  // ... more files
]
```

---

## Code: mapFileToTable()

**Location**: [lib/sync-config.js](../lib/sync-config.js)

```javascript
function mapFileToTable(filePath) {
  // Check path in order of specificity
  
  if (filePath.includes(`${path.sep}collections${path.sep}`)) {
    return { table: 'collections', fileType: 'json' };
  }
  
  if (filePath.includes(`${path.sep}files${path.sep}`)) {
    const ext = getFileExtension(filePath);
    return { table: 'static_files', fileType: ext };
  }
  
  if (filePath.includes(`${path.sep}config${path.sep}`)) {
    const ext = getFileExtension(filePath);
    return { table: 'config_files', fileType: ext };
  }
  
  if (filePath.includes(`${path.sep}data${path.sep}`)) {
    const ext = getFileExtension(filePath);
    return { table: 'data_files', fileType: ext };
  }
  
  if (filePath.includes(`${path.sep}image${path.sep}`)) {
    return { table: 'images', fileType: getFileExtension(filePath) };
  }
  
  if (filePath.includes(`${path.sep}js${path.sep}`)) {
    return { table: 'javascript_files', fileType: 'js' };
  }
  
  if (filePath.includes(`${path.sep}resume${path.sep}`)) {
    return { table: 'resumes', fileType: getFileExtension(filePath) };
  }
  
  return { table: 'unknown', fileType: getFileExtension(filePath) };
}
```

**Examples**:
```javascript
mapFileToTable('public/collections/en/config/api.json')
// → { table: 'collections', fileType: 'json' }

mapFileToTable('public/config/languages.json')
// → { table: 'config_files', fileType: 'json' }

mapFileToTable('public/image/logo.png')
// → { table: 'images', fileType: 'png' }
```

---

## Code: Main Pump Function

**Location**: [app/api/admin/operations/route.js](../app/api/admin/operations/route.js#L296)

```javascript
async function pumpData(supabase) {
  console.log('📥 Pumping data...');
  
  // Step 1: Scan public folder
  const files = scanPublicFolder();
  
  // Step 2: Initialize table buckets
  const tables = {
    collections: [],
    static_files: [],
    config_files: [],
    data_files: [],
    images: [],
    resumes: [],
    javascript_files: [],
    sync_manifest: []
  };

  // Step 3: Process each file
  for (const file of files) {
    // Extract file info
    const filename = path.basename(file.relativePath, path.extname(file.relativePath));
    const ext = getFileExtension(file.relativePath);
    const now = new Date().toISOString();

    // Always add to sync_manifest (tracks what was synced)
    tables.sync_manifest.push({
      file_path: file.relativePath,
      file_hash: file.hash,
      table_name: file.table,
      last_synced: now
    });

    // Process by table type
    switch (file.table) {
      
      // ========== COLLECTIONS (Special handling for languages) ==========
      case 'collections': {
        const parts = file.relativePath.split(path.sep);
        const langIdx = parts.findIndex(p => p === 'collections');
        
        if (langIdx !== -1 && langIdx + 2 < parts.length) {
          try {
            tables.collections.push({
              lang: parts[langIdx + 1],           // 'en', 'fr', etc
              type: parts[langIdx + 2],           // 'config' or 'data'
              filename,
              file_content: JSON.parse(file.content),  // Parse JSON
              file_hash: file.hash,
              synced_at: now
            });
          } catch (e) {
            console.warn(`⚠️  Invalid JSON: ${file.relativePath}`);
          }
        }
        break;
      }

      // ========== STATIC FILES (HTML, XML - NOT parsed) ==========
      case 'static_files':
        tables.static_files.push({
          filename,
          file_type: ext,
          file_content: file.content,  // ← Plain text, NOT parsed
          file_hash: file.hash,
          synced_at: now
        });
        break;

      // ========== CONFIG FILES (JSON configs) ==========
      case 'config_files':
        try {
          tables.config_files.push({
            filename,
            file_type: ext,
            file_content: JSON.parse(file.content),  // Parse JSON
            file_hash: file.hash,
            synced_at: now
          });
        } catch (e) {
          console.warn(`⚠️  Invalid JSON: ${file.relativePath}`);
        }
        break;

      // ========== DATA FILES (JSON data) ==========
      case 'data_files':
        try {
          tables.data_files.push({
            filename,
            file_type: ext,
            file_content: JSON.parse(file.content),  // Parse JSON
            file_hash: file.hash,
            synced_at: now
          });
        } catch (e) {
          console.warn(`⚠️  Invalid JSON: ${file.relativePath}`);
        }
        break;

      // ========== IMAGES (Store path, not content) ==========
      case 'images':
        tables.images.push({
          filename,
          file_path: file.relativePath,  // ← Path, not content
          mime_type: `image/${ext}`,     // Infer from extension
          file_hash: file.hash,
          synced_at: now
        });
        break;

      // ========== RESUMES (Store path, not content) ==========
      case 'resumes':
        tables.resumes.push({
          filename,
          file_type: ext,
          file_path: file.relativePath,  // ← Path, not content
          file_hash: file.hash,
          synced_at: now
        });
        break;

      // ========== JAVASCRIPT FILES (Plain text, NOT parsed) ==========
      case 'javascript_files':
        tables.javascript_files.push({
          filename,
          file_path: file.relativePath,
          file_content: file.content,    // ← Plain text, NOT parsed
          file_hash: file.hash,
          synced_at: now
        });
        break;
    }
  }

  // Step 4: Insert all tables into database
  let loaded = 0;
  for (const [tableName, data] of Object.entries(tables)) {
    if (data.length === 0) continue;  // Skip empty tables
    
    try {
      await supabase.from(tableName).insert(data);
      loaded++;
    } catch (error) {
      console.error(`❌ ${tableName}: ${error.message}`);
    }
  }

  // Step 5: Return success response
  return {
    status: 'success',
    operation: 'pumpdata',
    files_scanned: files.length,
    tables_loaded: loaded
  };
}
```

---

## Code: POST Request Handler

**Location**: [app/api/admin/operations/route.js](../app/api/admin/operations/route.js#L487)

```javascript
export async function POST(request) {
  // Check authorization
  const auth = isAuthorized(request);
  if (!auth.ok) {
    return NextResponse.json(
      { status: 'error', error: auth.message || 'Unauthorized' },
      { status: auth.status || 401 }
    );
  }

  try {
    const { operation, batch } = await request.json();

    // Handle batch operations
    if (batch && Array.isArray(batch)) {
      const results = [];
      for (const op of batch) {
        let result;
        try {
          switch (op.toLowerCase()) {
            case 'createdb':
              result = await createDB(supabase);
              break;
            case 'deletedb':
              result = await deleteDB(supabase);
              break;
            case 'pumpdata':
              result = await pumpData(supabase);  // ← Call pump here
              break;
            case 'syncopublic':
              result = await syncPublic(supabase);
              break;
            case 'status':
              result = await getStatus(supabase);
              break;
            default:
              result = { status: 'error', error: 'Unknown operation' };
          }
          results.push(result);
        } catch (error) {
          results.push({
            status: 'error',
            operation: op,
            error: error.message
          });
        }
      }
      return NextResponse.json({
        status: 'success',
        operations: batch,
        results,
        timestamp: new Date().toISOString()
      });
    }

    // Handle single operation
    let result;
    switch (operation?.toLowerCase()) {
      case 'pumpdata':
        result = await pumpData(supabase);  // ← Call pump here
        break;
      // ... other operations
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { status: 'error', error: error.message },
      { status: 500 }
    );
  }
}
```

---

## Code: Data Route Handler

**Location**: [app/api/admin/data/route.js](../app/api/admin/data/route.js#L65)

```javascript
export async function POST(request) {
  logRequest(request);
  const auth = authMod?.isAuthorized ? authMod.isAuthorized(request) : { ok: true };
  if (!auth.ok) {
    return NextResponse.json(
      { status: 'error', error: auth.message || 'Unauthorized' },
      { status: auth.status || 401 }
    );
  }

  try {
    const { action, table, payload, id } = await request.json();

    // ========== PUMP ACTION ==========
    if (action === 'pump') {
      // Block on Vercel (no file system access)
      if (process.env.VERCEL === '1') {
        return NextResponse.json({
          status: 'error',
          error: 'The "pump" action is not available in Vercel serverless environment.'
        }, { status: 400 });
      }

      try {
        const files = scanPublicFolder();
        console.log('[ADMIN DATA] Files scanned:', files.length);

        const tables = {
          collections: [],
          static_files: [],
          config_files: [],
          data_files: [],
          images: [],
          resumes: [],
          javascript_files: [],
          sync_manifest: []
        };

        // Process files same as pumpData() function
        for (const file of files) {
          // ... (same switch logic as above)
        }

        // Insert into database
        let loaded = 0;
        for (const [tableName, data] of Object.entries(tables)) {
          if (data.length === 0) continue;
          try {
            await supabase.from(tableName).insert(data);
            loaded++;
          } catch (error) {
            console.error(`❌ ${tableName}: ${error.message}`);
          }
        }

        return NextResponse.json({
          status: 'success',
          action: 'pump',
          files_scanned: files.length,
          tables_loaded: loaded
        });

      } catch (pumpException) {
        console.log('[ADMIN DATA] Pump Exception:', pumpException.message);
        return NextResponse.json(
          { status: 'error', error: pumpException.message },
          { status: 500 }
        );
      }
    }

    // ... other actions (clear, create, read, update, delete)
  } catch (error) {
    logError(error);
    return NextResponse.json(
      { status: 'error', error: error.message },
      { status: 500 }
    );
  }
}
```

---

## Side-by-Side: Collections Processing

### Before Pump
```
File System: /public/collections/en/config/apiConfig.json
Content: {"baseUrl": "https://api.example.com", ...}
```

### During Pump
```javascript
// Step 1: File is read
file = {
  relativePath: "collections/en/config/apiConfig.json",
  content: '{"baseUrl": "..."}'
}

// Step 2: Path is parsed
parts = ["collections", "en", "config", "apiConfig.json"]
langIdx = 0
lang = parts[1]  // "en"
type = parts[2]  // "config"
filename = "apiConfig"

// Step 3: Object created
record = {
  lang: "en",
  type: "config",
  filename: "apiConfig",
  file_content: { baseUrl: "..." },  // Parsed!
  file_hash: "abc123...",
  synced_at: "2026-01-12T10:30:00Z"
}

// Step 4: Added to bucket
tables.collections.push(record)
```

### After Pump
```sql
-- Database State
SELECT * FROM collections WHERE lang='en' AND type='config' AND filename='apiConfig';

id | lang | type   | filename  | file_content                    | file_hash | synced_at
---|------|--------|-----------|------------------------------|-----------|------------------------
a1 | en   | config | apiConfig | {"baseUrl":"https://api..."} | abc123... | 2026-01-12 10:30:00
```

### Dashboard Usage
```javascript
// Dashboard queries this data
const response = await fetch(
  '/api/dashboard/files?type=collections&lang=en&subtype=config'
);

// Returns in browser
{
  status: 'success',
  files: [
    {
      name: 'apiConfig',
      type: 'file',
      extension: 'json',
      size: 895,
      isJson: true,
      path: 'public/collections/en/config/apiConfig.json'
    }
  ]
}

// Dashboard can then:
// 1. Show file in editor
// 2. Load JSON content: SELECT file_content FROM collections WHERE ...
// 3. Allow editing and re-save
```

---

## Performance Characteristics

### Time Complexity
- **Scan**: O(n) - where n = total files in /public
- **Map**: O(n) - one map operation per file
- **Parse**: O(n) - JSON parsing for each file
- **Insert**: O(n) - batch insert operations
- **Total**: O(n)

### Space Complexity
- **In Memory**: All files loaded into arrays
- **In DB**: Stored with indexes on lang, type, filename, etc.

### Typical Execution
```
487 files in /public
├── Scan: 200ms (read all files)
├── Process: 800ms (parse JSON, categorize)
└── Insert: 1000ms (batch database operations)
Total: ~2 seconds
```

---

## Error Scenarios

### Scenario 1: Invalid JSON
```javascript
// File: public/config/bad.json
// Content: { invalid json }

// Result:
try {
  JSON.parse("{ invalid json }")  // ← Throws error
} catch (e) {
  console.warn(`⚠️  Invalid JSON: config/bad.json`)
  // Skip this file, continue with next
}
```

### Scenario 2: Missing Language Index
```javascript
// File: public/somefolder/file.json
// Path contains '/collections/' but wrong structure

const parts = file.relativePath.split(path.sep);
const langIdx = parts.findIndex(p => p === 'collections');

if (langIdx !== -1 && langIdx + 2 < parts.length) {
  // Process
} else {
  // Skip - malformed path
}
```

### Scenario 3: Database Insert Fails
```javascript
try {
  await supabase.from('collections').insert(data);
  loaded++;
} catch (error) {
  console.error(`❌ collections: ${error.message}`);
  // Continue with next table, don't fail entire pump
}
```

---

## Next Steps

1. Review [Pumpdata API Guide](./PUMPDATA_API_GUIDE.md) for full context
2. Check [Table Mapping](./DASHBOARD_TABLE_MAPPING.md) for schema details
3. See [Quick Reference](./PUMP_QUICK_REFERENCE.md) for common tasks

