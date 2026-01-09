/**
 * app/api/admin/operations/route.js
 * 
 * Modular Admin Operations API
 * 
 * Available operations:
 * - createdb: Create database tables
 * - deletedb: Delete all data from tables
 * - pumpdata: Load data from /public to database
 * - syncopublic: Detect and sync changes in /public
 * - status: Check system status
 * - batch: Run multiple operations in sequence
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { NextResponse } = require('next/server');

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Utility functions
function calculateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function getFileExtension(filename) {
  return path.extname(filename).toLowerCase().slice(1) || 'unknown';
}

function determineFileType(filePath) {
  if (filePath.includes('/collections/')) return { table: 'collections', fileType: 'json' };
  if (filePath.includes('/files/')) return { table: 'static_files', fileType: getFileExtension(filePath) };
  if (filePath.includes('/config/')) return { table: 'config_files', fileType: getFileExtension(filePath) };
  if (filePath.includes('/data/')) return { table: 'data_files', fileType: getFileExtension(filePath) };
  if (filePath.includes('/image/')) return { table: 'images', fileType: getFileExtension(filePath) };
  if (filePath.includes('/js/')) return { table: 'javascript_files', fileType: 'js' };
  if (filePath.includes('/resume/')) return { table: 'resumes', fileType: getFileExtension(filePath) };
  return { table: 'unknown', fileType: getFileExtension(filePath) };
}

// OPERATION 1: Create Database Tables
async function createDB() {
  console.log('📊 Creating database tables...');
  
  const schema = `
    CREATE TABLE IF NOT EXISTS collections (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), lang VARCHAR(10), type VARCHAR(20), filename VARCHAR(255), file_content JSONB, file_hash VARCHAR(64), synced_at TIMESTAMP DEFAULT now(), created_at TIMESTAMP DEFAULT now(), updated_at TIMESTAMP DEFAULT now(), UNIQUE(lang, type, filename));
    CREATE TABLE IF NOT EXISTS static_files (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), filename VARCHAR(255) UNIQUE, file_type VARCHAR(50), file_content TEXT, file_hash VARCHAR(64), synced_at TIMESTAMP DEFAULT now(), created_at TIMESTAMP DEFAULT now(), updated_at TIMESTAMP DEFAULT now());
    CREATE TABLE IF NOT EXISTS config_files (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), filename VARCHAR(255) UNIQUE, file_type VARCHAR(50), file_content JSONB, file_hash VARCHAR(64), synced_at TIMESTAMP DEFAULT now(), created_at TIMESTAMP DEFAULT now(), updated_at TIMESTAMP DEFAULT now());
    CREATE TABLE IF NOT EXISTS data_files (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), filename VARCHAR(255) UNIQUE, file_type VARCHAR(50), file_content JSONB, file_hash VARCHAR(64), synced_at TIMESTAMP DEFAULT now(), created_at TIMESTAMP DEFAULT now(), updated_at TIMESTAMP DEFAULT now());
    CREATE TABLE IF NOT EXISTS images (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), filename VARCHAR(255) UNIQUE, file_path VARCHAR(512), mime_type VARCHAR(50), file_hash VARCHAR(64), synced_at TIMESTAMP DEFAULT now(), created_at TIMESTAMP DEFAULT now(), updated_at TIMESTAMP DEFAULT now());
    CREATE TABLE IF NOT EXISTS resumes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), filename VARCHAR(255) UNIQUE, file_type VARCHAR(50), file_path VARCHAR(512), file_hash VARCHAR(64), synced_at TIMESTAMP DEFAULT now(), created_at TIMESTAMP DEFAULT now(), updated_at TIMESTAMP DEFAULT now());
    CREATE TABLE IF NOT EXISTS javascript_files (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), filename VARCHAR(255) UNIQUE, file_path VARCHAR(512), file_content TEXT, file_hash VARCHAR(64), synced_at TIMESTAMP DEFAULT now(), created_at TIMESTAMP DEFAULT now(), updated_at TIMESTAMP DEFAULT now());
    CREATE TABLE IF NOT EXISTS sync_manifest (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), file_path VARCHAR(512) UNIQUE, file_hash VARCHAR(64), table_name VARCHAR(50), last_synced TIMESTAMP DEFAULT now());
    CREATE INDEX IF NOT EXISTS idx_collections_lang ON collections(lang);
    CREATE INDEX IF NOT EXISTS idx_sync_manifest_path ON sync_manifest(file_path);
  `;

  const statements = schema.split(';').filter(s => s.trim());
  let created = 0;

  for (const statement of statements) {
    try {
      await supabase.rpc('exec_sql', { sql: statement.trim() });
      created++;
    } catch (error) {
      if (!error.message.includes('exists')) console.warn(`⚠️ ${error.message}`);
    }
  }

  return { status: 'success', operation: 'createdb', tables: 8, statements_executed: created };
}

// OPERATION 2: Delete Database (Clear all data)
async function deleteDB() {
  console.log('🗑️  Deleting all data...');
  
  const tables = ['sync_manifest', 'collections', 'static_files', 'config_files', 'data_files', 'images', 'resumes', 'javascript_files'];
  let cleared = 0;

  for (const table of tables) {
    try {
      await supabase.from(table).delete().neq('id', null);
      cleared++;
    } catch (error) {
      console.warn(`⚠️  ${table}: ${error.message}`);
    }
  }

  return { status: 'success', operation: 'deletedb', tables_cleared: cleared };
}

// OPERATION 3: Scan /public folder
function scanPublicFolder() {
  const publicPath = path.join(process.cwd(), 'public');
  const files = [];

  function walkDir(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(publicPath, fullPath);

      if (entry.isDirectory()) {
        if (!['.next', 'node_modules', '.git'].includes(entry.name)) walkDir(fullPath);
      } else {
        if (['.json', '.js', '.xml', '.html', '.txt', '.pdf', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.docx'].includes(path.extname(fullPath))) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const hash = calculateHash(content);
            const { table, fileType } = determineFileType(fullPath);

            if (table !== 'unknown') {
              files.push({ path: fullPath, relativePath, content, hash, table, fileType });
            }
          } catch (error) {
            console.warn(`⚠️  Failed to read: ${fullPath}`);
          }
        }
      }
    }
  }

  walkDir(publicPath);
  return files;
}

// OPERATION 4: Pump Data
async function pumpData() {
  console.log('📥 Pumping data...');
  
  const files = scanPublicFolder();
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

  for (const file of files) {
    const filename = path.basename(file.relativePath, path.extname(file.relativePath));
    const ext = getFileExtension(file.relativePath);
    const now = new Date().toISOString();

    tables.sync_manifest.push({ file_path: file.relativePath, file_hash: file.hash, table_name: file.table, last_synced: now });

    switch (file.table) {
      case 'collections': {
        const parts = file.relativePath.split(path.sep);
        const langIdx = parts.findIndex(p => p === 'collections');
        if (langIdx !== -1 && langIdx + 2 < parts.length) {
          try {
            tables.collections.push({
              lang: parts[langIdx + 1],
              type: parts[langIdx + 2],
              filename,
              file_content: JSON.parse(file.content),
              file_hash: file.hash,
              synced_at: now
            });
          } catch (e) { console.warn(`⚠️  Invalid JSON: ${file.relativePath}`); }
        }
        break;
      }
      case 'static_files':
        tables.static_files.push({ filename, file_type: ext, file_content: file.content, file_hash: file.hash, synced_at: now });
        break;
      case 'config_files':
        try {
          tables.config_files.push({ filename, file_type: ext, file_content: JSON.parse(file.content), file_hash: file.hash, synced_at: now });
        } catch (e) { console.warn(`⚠️  Invalid JSON: ${file.relativePath}`); }
        break;
      case 'data_files':
        try {
          tables.data_files.push({ filename, file_type: ext, file_content: JSON.parse(file.content), file_hash: file.hash, synced_at: now });
        } catch (e) { console.warn(`⚠️  Invalid JSON: ${file.relativePath}`); }
        break;
      case 'images':
        tables.images.push({ filename, file_path: file.relativePath, mime_type: `image/${ext}`, file_hash: file.hash, synced_at: now });
        break;
      case 'resumes':
        tables.resumes.push({ filename, file_type: ext, file_path: file.relativePath, file_hash: file.hash, synced_at: now });
        break;
      case 'javascript_files':
        tables.javascript_files.push({ filename, file_path: file.relativePath, file_content: file.content, file_hash: file.hash, synced_at: now });
        break;
    }
  }

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

  return { status: 'success', operation: 'pumpdata', files_scanned: files.length, tables_loaded: loaded };
}

// OPERATION 5: Sync Public
async function syncPublic() {
  console.log('🔄 Syncing /public...');
  
  const files = scanPublicFolder();
  const changes = { new: 0, modified: 0, deleted: 0 };

  try {
    const { data: manifest } = await supabase.from('sync_manifest').select('*');
    const manifestMap = new Map((manifest || []).map(m => [m.file_path, m]));

    for (const file of files) {
      const entry = manifestMap.get(file.relativePath);
      if (!entry) {
        changes.new++;
      } else if (entry.file_hash !== file.hash) {
        changes.modified++;
      }
    }

    for (const [filePath] of manifestMap) {
      if (!files.find(f => f.relativePath === filePath)) {
        changes.deleted++;
      }
    }
  } catch (error) {
    return { status: 'error', operation: 'syncopublic', error: error.message };
  }

  return { status: 'success', operation: 'syncopublic', files_scanned: files.length, changes };
}

// OPERATION 6: System Status
async function getStatus() {
  try {
    const tables = ['collections', 'static_files', 'config_files', 'data_files', 'images', 'resumes', 'javascript_files', 'sync_manifest'];
    const stats = {};

    for (const table of tables) {
      const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
      stats[table] = count || 0;
    }

    const publicFiles = scanPublicFolder();

    return {
      status: 'success',
      operation: 'status',
      database: stats,
      public_folder_files: publicFiles.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return { status: 'error', operation: 'status', error: error.message };
  }
}

// Main handler
async function POST(request) {
  console.log('[ADMIN OPERATIONS] POST request received');
  try {
    const body = await request.json();
    const { operation, batch } = body;
    console.log('[ADMIN OPERATIONS] Operation:', operation, 'Batch:', batch);

    if (batch && Array.isArray(batch)) {
      // Batch operations
      const results = [];
      for (const op of batch) {
        let result;
        try {
          switch (op.toLowerCase()) {
            case 'createdb': result = await createDB(); break;
            case 'deletedb': result = await deleteDB(); break;
            case 'pumpdata': result = await pumpData(); break;
            case 'syncopublic': result = await syncPublic(); break;
            case 'status': result = await getStatus(); break;
            default: result = { status: 'error', operation: op, error: 'Unknown operation' };
          }
          console.log('[ADMIN OPERATIONS] Batch operation result:', result);
        } catch (batchErr) {
          console.log('[ADMIN OPERATIONS] Batch Exception:', batchErr.message);
          result = { status: 'error', operation: op, error: batchErr.message };
        }
        results.push(result);
      }
      // Example Redis logging (pseudo-code)
      try {
        // await redis.set('operations:batch', JSON.stringify(results));
        console.log('[ADMIN OPERATIONS] Redis cache simulated for batch');
      } catch (redisException) {
        console.log('[ADMIN OPERATIONS] Redis Exception:', redisException.message);
      }
      return NextResponse.json({ status: 'success', operations: batch, results, timestamp: new Date().toISOString() });
    }

    // Single operation
    let result;
    try {
      switch (operation?.toLowerCase()) {
        case 'createdb': result = await createDB(); break;
        case 'deletedb': result = await deleteDB(); break;
        case 'pumpdata': result = await pumpData(); break;
        case 'syncopublic': result = await syncPublic(); break;
        case 'status': result = await getStatus(); break;
        default: throw new Error('Unknown operation. Use: createdb, deletedb, pumpdata, syncopublic, status');
      }
      console.log('[ADMIN OPERATIONS] Operation result:', result);
    } catch (opException) {
      console.log('[ADMIN OPERATIONS] Operation Exception:', opException.message);
      result = { status: 'error', error: opException.message };
    }

    // Example Redis logging (pseudo-code)
    try {
      // await redis.set('operations:last', JSON.stringify(result));
      console.log('[ADMIN OPERATIONS] Redis cache simulated for operation');
    } catch (redisException) {
      console.log('[ADMIN OPERATIONS] Redis Exception:', redisException.message);
    }

    return NextResponse.json({ ...result, timestamp: new Date().toISOString() });
  } catch (error) {
    console.log('[ADMIN OPERATIONS] Handler error:', error.message);
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
  }
}

async function GET() {
  return NextResponse.json({
    status: 'success',
    message: 'Admin Operations API',
    available_operations: [
      { name: 'createdb', description: 'Create all database tables' },
      { name: 'deletedb', description: 'Delete all data from tables' },
      { name: 'pumpdata', description: 'Load data from /public to database' },
      { name: 'syncopublic', description: 'Detect changes in /public folder' },
      { name: 'status', description: 'Get system status and counts' }
    ],
    usage: {
      single: 'POST /api/admin/operations { "operation": "createdb" }',
      batch: 'POST /api/admin/operations { "batch": ["createdb", "pumpdata", "status"] }'
    }
  });
}

module.exports = { POST, GET };
