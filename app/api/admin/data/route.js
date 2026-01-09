/**
 * app/api/admin/data/route.js
 * 
 * Data Management Endpoint
 * GET: Data statistics
 * POST: Pump data, clear data, migrate data
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

async function POST(request) {
  console.log('[ADMIN DATA] POST request received');
  try {
    const { action } = await request.json();
    console.log('[ADMIN DATA] Action:', action);

    if (action === 'pump') {
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

        for (const file of files) {
          const filename = path.basename(file.relativePath, path.extname(file.relativePath));
          const ext = getFileExtension(file.relativePath);
          const now = new Date().toISOString();

          tables.sync_manifest.push({ file_path: file.relativePath, file_hash: file.hash, table_name: file.table, last_synced: now });

          try {
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
                    console.log('[ADMIN DATA] Added collection:', filename);
                  } catch (e) { console.warn(`⚠️  Invalid JSON: ${file.relativePath}`); }
                }
                break;
              }
              case 'static_files':
                tables.static_files.push({ filename, file_type: ext, file_content: file.content, file_hash: file.hash, synced_at: now });
                console.log('[ADMIN DATA] Added static file:', filename);
                break;
              case 'config_files':
                try {
                  tables.config_files.push({ filename, file_type: ext, file_content: JSON.parse(file.content), file_hash: file.hash, synced_at: now });
                  console.log('[ADMIN DATA] Added config file:', filename);
                } catch (e) { console.warn(`⚠️  Invalid JSON: ${file.relativePath}`); }
                break;
              case 'data_files':
                try {
                  tables.data_files.push({ filename, file_type: ext, file_content: JSON.parse(file.content), file_hash: file.hash, synced_at: now });
                  console.log('[ADMIN DATA] Added data file:', filename);
                } catch (e) { console.warn(`⚠️  Invalid JSON: ${file.relativePath}`); }
                break;
              case 'images':
                tables.images.push({ filename, file_path: file.relativePath, mime_type: `image/${ext}`, file_hash: file.hash, synced_at: now });
                console.log('[ADMIN DATA] Added image:', filename);
                break;
              case 'resumes':
                tables.resumes.push({ filename, file_type: ext, file_path: file.relativePath, file_hash: file.hash, synced_at: now });
                console.log('[ADMIN DATA] Added resume:', filename);
                break;
              case 'javascript_files':
                tables.javascript_files.push({ filename, file_path: file.relativePath, file_content: file.content, file_hash: file.hash, synced_at: now });
                console.log('[ADMIN DATA] Added JS file:', filename);
                break;
            }
          } catch (fileException) {
            console.error('[ADMIN DATA] File Exception:', fileException.message);
          }
        }

        let loaded = 0;
        for (const [tableName, data] of Object.entries(tables)) {
          if (data.length === 0) continue;
          try {
            await supabase.from(tableName).insert(data);
            loaded++;
            console.log(`[ADMIN DATA] Loaded table: ${tableName}, count: ${data.length}`);
          } catch (error) {
            console.error(`[ADMIN DATA] DB Error in ${tableName}:`, error.message);
          }
        }

        // Example Redis logging (pseudo-code, replace with actual Redis logic if available)
        try {
          // await redis.set('data:pump', JSON.stringify(tables));
          console.log('[ADMIN DATA] Redis cache simulated for pump');
        } catch (redisException) {
          console.log('[ADMIN DATA] Redis Exception:', redisException.message);
        }

        return NextResponse.json({ status: 'success', action: 'pump', files_scanned: files.length, tables_loaded: loaded, details: tables });
      } catch (pumpException) {
        console.log('[ADMIN DATA] Pump Exception:', pumpException.message);
        return NextResponse.json({ status: 'error', error: pumpException.message }, { status: 500 });
      }
    }

    if (action === 'clear') {
      try {
        const tables = ['sync_manifest', 'collections', 'static_files', 'config_files', 'data_files', 'images', 'resumes', 'javascript_files'];
        let cleared = 0;

        for (const t of tables) {
          try {
            await supabase.from(t).delete().neq('id', null);
            cleared++;
            console.log('[ADMIN DATA] Cleared table:', t);
          } catch (e) {
            console.warn('[ADMIN DATA] Clear Exception:', e.message);
          }
        }

        // Example Redis logging (pseudo-code, replace with actual Redis logic if available)
        try {
          // await redis.del('data:all');
          console.log('[ADMIN DATA] Redis cache simulated for clear');
        } catch (redisException) {
          console.log('[ADMIN DATA] Redis Exception:', redisException.message);
        }

        return NextResponse.json({ status: 'success', action: 'clear', tables_cleared: cleared });
      } catch (clearException) {
        console.log('[ADMIN DATA] Clear Exception:', clearException.message);
        return NextResponse.json({ status: 'error', error: clearException.message }, { status: 500 });
      }
    }

    return NextResponse.json({ status: 'error', error: 'Invalid action. Use: pump, clear' }, { status: 400 });
  } catch (error) {
    console.log('[ADMIN DATA] Handler error:', error.message);
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
  }
}

async function GET() {
  try {
    const files = scanPublicFolder();
    const byType = {};

    for (const file of files) {
      byType[file.table] = (byType[file.table] || 0) + 1;
    }

    const stats = {};
    const tables = ['collections', 'static_files', 'config_files', 'data_files', 'images', 'resumes', 'javascript_files', 'sync_manifest'];

    for (const t of tables) {
      const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
      stats[t] = count || 0;
    }

    return NextResponse.json({
      status: 'success',
      public_folder: { total_files: files.length, by_type: byType },
      database: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
  }
}

module.exports = { POST, GET };
