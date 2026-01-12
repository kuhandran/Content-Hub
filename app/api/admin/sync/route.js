/**
 * app/api/admin/sync/route.js (MODULAR VERSION)
 * 
 * Enhanced Bidirectional Sync Endpoint
 * 
 * Modes:
 * - scan: Detect changes in /public folder (new, modified, deleted files)
 * - pull: Apply changes from /public to database
 * - push: Apply changes from database to /public (future)
 * - status: Get sync status and manifest
 * 
 * Example:
 * POST /api/admin/sync { "mode": "scan" }
 * GET /api/admin/sync
 * 
 * Response:
 * {
 *   "status": "success",
 *   "mode": "scan",
 *   "files_scanned": 156,
 *   "new_files": 3,
 *   "modified_files": 5,
 *   "deleted_files": 1,
 *   "timestamp": "2026-01-08T10:30:00Z",
 *   "changes": [...]
 * }
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { NextResponse } = require('next/server');
const { isAuthorized } = require('../../../../lib/auth');
const { getSupabase } = require('../../../../lib/supabase');
const { mapFileToTable, getFileExtension, ALLOWED_EXTENSIONS, IGNORED_DIRS, getPublicDir } = require('../../../../lib/sync-config');
const sql = require('../../../../lib/postgres');

// Utility functions
function calculateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// file type mapping and extension helpers now provided by lib/sync-config

// Scan /public folder
function scanPublicFolder() {
  const publicPath = getPublicDir();
  const fileMap = new Map();

  function walkDir(dirPath) {
    if (!fs.existsSync(dirPath)) return;

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(publicPath, fullPath);

      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.includes(entry.name)) {
          walkDir(fullPath);
        }
      } else {
        if (ALLOWED_EXTENSIONS.includes(path.extname(fullPath).toLowerCase())) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const hash = calculateHash(content);
            const { table, fileType } = mapFileToTable(fullPath);

            if (table !== 'unknown') {
              fileMap.set(relativePath, { hash, content, table, fileType });
            }
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    }
  }

  walkDir(publicPath);
  return fileMap;
}

// Scan mode: Detect changes compared to sync_manifest
async function scanForChanges(supabase) {
  const currentFiles = scanPublicFolder();
  const changes = [];

  let newFiles = 0;
  let modifiedFiles = 0;
  let deletedFiles = 0;

  try {
    // Get sync manifest from database
    let manifest = [];
    const res = await supabase
      .from('sync_manifest')
      .select('*');

    if (res.error) {
      const msg = res.error.message || 'Unknown Supabase error';
      // Gracefully handle missing table
      if (msg.includes('does not exist') || msg.includes('relation') && msg.includes('does not exist')) {
        manifest = [];
      } else {
        throw new Error(`Failed to fetch sync_manifest: ${msg}`);
      }
    } else {
      manifest = res.data || [];
    }

    const manifestMap = new Map(manifest?.map(m => [m.file_path, m]) || []);

    // Detect new and modified files
    for (const [relativePath, fileData] of currentFiles) {
      const manifestEntry = manifestMap.get(relativePath);

      if (!manifestEntry) {
        // New file
        changes.push({
          path: path.join('public', relativePath),
          relativePath,
          status: 'new',
          table: fileData.table,
          hash: fileData.hash,
          fileType: fileData.fileType,
        });
        newFiles++;
      } else if (manifestEntry.file_hash !== fileData.hash) {
        // Modified file
        changes.push({
          path: path.join('public', relativePath),
          relativePath,
          status: 'modified',
          table: fileData.table,
          hash: fileData.hash,
          fileType: fileData.fileType,
        });
        modifiedFiles++;
      }
    }

    // Detect deleted files
    for (const [filePath, manifestEntry] of manifestMap) {
      if (!currentFiles.has(filePath)) {
        changes.push({
          path: path.join('public', filePath),
          relativePath: filePath,
          status: 'deleted',
          table: manifestEntry.table_name,
          hash: manifestEntry.file_hash,
          fileType: getFileExtension(filePath),
        });
        deletedFiles++;
      }
    }

    return {
      changes,
      stats: {
        files_scanned: currentFiles.size,
        new_files: newFiles,
        modified_files: modifiedFiles,
        deleted_files: deletedFiles,
      },
    };
  } catch (error) {
    throw new Error(`Scan failed: ${error.message}`);
  }
}

// Scan mode using Postgres client
async function scanForChangesPg(sqlClient) {
  const currentFiles = scanPublicFolder();
  const changes = [];
  let newFiles = 0;
  let modifiedFiles = 0;
  let deletedFiles = 0;

  try {
    const manifestRows = await sqlClient`SELECT file_path, file_hash, table_name FROM sync_manifest`;
    const manifestMap = new Map((manifestRows || []).map(m => [m.file_path, m]));

    for (const [relativePath, fileData] of currentFiles) {
      const manifestEntry = manifestMap.get(relativePath);
      if (!manifestEntry) {
        changes.push({ path: path.join('public', relativePath), relativePath, status: 'new', table: fileData.table, hash: fileData.hash, fileType: fileData.fileType });
        newFiles++;
      } else if (manifestEntry.file_hash !== fileData.hash) {
        changes.push({ path: path.join('public', relativePath), relativePath, status: 'modified', table: fileData.table, hash: fileData.hash, fileType: fileData.fileType });
        modifiedFiles++;
      }
    }

    for (const [filePath, manifestEntry] of manifestMap) {
      if (!currentFiles.has(filePath)) {
        changes.push({ path: path.join('public', filePath), relativePath: filePath, status: 'deleted', table: manifestEntry.table_name, hash: manifestEntry.file_hash, fileType: getFileExtension(filePath) });
        deletedFiles++;
      }
    }

    return {
      changes,
      stats: { files_scanned: currentFiles.size, new_files: newFiles, modified_files: modifiedFiles, deleted_files: deletedFiles },
    };
  } catch (error) {
    throw new Error(`Scan failed (pg): ${error.message}`);
  }
}

// Pull mode: Apply changes from /public to database
async function pullChangesToDatabase(supabase, changes) {
  let appliedCount = 0;
  const publicPath = getPublicDir();

  for (const change of changes) {
    try {
      const fullPath = path.join(publicPath, change.relativePath);

      if (change.status === 'deleted') {
        // Delete from database based on table type
        const { error } = await supabase
          .from(change.table)
          .delete()
          .match({ file_path: change.relativePath });

        if (!error) appliedCount++;
      } else if (change.status === 'new' || change.status === 'modified') {
        // Read file and insert/update
        const content = fs.readFileSync(fullPath, 'utf-8');
        const now = new Date().toISOString();
        const filename = path.basename(fullPath, path.extname(fullPath));

        let data = {};

        // Prepare data based on table type
        if (change.table === 'collections') {
          const parts = change.relativePath.split(path.sep);
          const langIndex = parts.findIndex(p => p === 'collections');
          const lang = parts[langIndex + 1];
          const type = parts[langIndex + 2];

          try {
            const fileContent = JSON.parse(content);
            data = {
              lang,
              type,
              filename,
              file_content: fileContent,
              file_hash: change.hash,
              synced_at: now,
            };
          } catch {
            continue; // Skip invalid JSON
          }
        } else if (['config_files', 'data_files'].includes(change.table)) {
          try {
            const fileContent = JSON.parse(content);
            data = {
              filename,
              file_type: change.fileType,
              file_content: fileContent,
              file_hash: change.hash,
              synced_at: now,
            };
          } catch {
            continue;
          }
        } else if (change.table === 'static_files') {
          data = {
            filename,
            file_type: change.fileType,
            file_content: content,
            file_hash: change.hash,
            synced_at: now,
          };
        } else {
          data = {
            filename,
            file_path: change.relativePath,
            file_type: change.fileType,
            file_hash: change.hash,
            synced_at: now,
          };
        }

        // Upsert into database
        const { error } = await supabase
          .from(change.table)
          .upsert(data, { onConflict: 'filename' });

        if (!error) {
          appliedCount++;
          // Update sync_manifest
          await supabase
            .from('sync_manifest')
            .upsert({
              file_path: change.relativePath,
              file_hash: change.hash,
              table_name: change.table,
              last_synced: now,
            }, { onConflict: 'file_path' });
        }
      }
    } catch (error) {
      console.error(`Failed to apply change ${change.relativePath}: ${error.message}`);
    }
  }

  return { status: 'completed', applied: appliedCount };
}

// Pull mode using Postgres client
async function pullChangesToDatabasePg(sqlClient, changes) {
  let appliedCount = 0;
  const publicPath = getPublicDir();

  for (const change of changes) {
    try {
      const fullPath = path.join(publicPath, change.relativePath);
      const now = new Date().toISOString();
      const filename = path.basename(fullPath, path.extname(fullPath));

      if (change.status === 'deleted') {
        await sqlClient.unsafe(`DELETE FROM ${change.table} WHERE file_path = ${sqlClient.parameters([change.relativePath])}`);
        appliedCount++;
      } else if (change.status === 'new' || change.status === 'modified') {
        const content = fs.readFileSync(fullPath, 'utf-8');
        switch (change.table) {
          case 'collections': {
            const parts = change.relativePath.split(path.sep);
            const langIndex = parts.findIndex(p => p === 'collections');
            const lang = parts[langIndex + 1];
            const type = parts[langIndex + 2];
            const fileContent = JSON.parse(content);
            await sqlClient`
              INSERT INTO collections (lang, type, filename, file_content, file_hash, synced_at)
              VALUES (${lang}, ${type}, ${filename}, ${sqlClient.json(fileContent)}, ${change.hash}, ${now})
              ON CONFLICT (lang, type, filename) DO UPDATE SET file_content = EXCLUDED.file_content, file_hash = EXCLUDED.file_hash, synced_at = EXCLUDED.synced_at
            `;
            break;
          }
          case 'config_files': {
            const fileContent = JSON.parse(content);
            await sqlClient`
              INSERT INTO config_files (filename, file_type, file_content, file_hash, synced_at)
              VALUES (${filename}, ${change.fileType}, ${sqlClient.json(fileContent)}, ${change.hash}, ${now})
              ON CONFLICT (filename) DO UPDATE SET file_type = EXCLUDED.file_type, file_content = EXCLUDED.file_content, file_hash = EXCLUDED.file_hash, synced_at = EXCLUDED.synced_at
            `;
            break;
          }
          case 'data_files': {
            const fileContent = JSON.parse(content);
            await sqlClient`
              INSERT INTO data_files (filename, file_type, file_content, file_hash, synced_at)
              VALUES (${filename}, ${change.fileType}, ${sqlClient.json(fileContent)}, ${change.hash}, ${now})
              ON CONFLICT (filename) DO UPDATE SET file_type = EXCLUDED.file_type, file_content = EXCLUDED.file_content, file_hash = EXCLUDED.file_hash, synced_at = EXCLUDED.synced_at
            `;
            break;
          }
          case 'static_files': {
            await sqlClient`
              INSERT INTO static_files (filename, file_type, file_content, file_hash, synced_at)
              VALUES (${filename}, ${change.fileType}, ${content}, ${change.hash}, ${now})
              ON CONFLICT (filename) DO UPDATE SET file_type = EXCLUDED.file_type, file_content = EXCLUDED.file_content, file_hash = EXCLUDED.file_hash, synced_at = EXCLUDED.synced_at
            `;
            break;
          }
          case 'images': {
            await sqlClient`
              INSERT INTO images (filename, file_path, mime_type, file_hash, synced_at)
              VALUES (${filename}, ${change.relativePath}, ${`image/${getFileExtension(fullPath)}`}, ${change.hash}, ${now})
              ON CONFLICT (filename) DO UPDATE SET file_path = EXCLUDED.file_path, mime_type = EXCLUDED.mime_type, file_hash = EXCLUDED.file_hash, synced_at = EXCLUDED.synced_at
            `;
            break;
          }
          case 'resumes': {
            await sqlClient`
              INSERT INTO resumes (filename, file_type, file_path, file_hash, synced_at)
              VALUES (${filename}, ${getFileExtension(fullPath)}, ${change.relativePath}, ${change.hash}, ${now})
              ON CONFLICT (filename) DO UPDATE SET file_type = EXCLUDED.file_type, file_path = EXCLUDED.file_path, file_hash = EXCLUDED.file_hash, synced_at = EXCLUDED.synced_at
            `;
            break;
          }
          case 'javascript_files': {
            await sqlClient`
              INSERT INTO javascript_files (filename, file_path, file_content, file_hash, synced_at)
              VALUES (${filename}, ${change.relativePath}, ${content}, ${change.hash}, ${now})
              ON CONFLICT (filename) DO UPDATE SET file_path = EXCLUDED.file_path, file_content = EXCLUDED.file_content, file_hash = EXCLUDED.file_hash, synced_at = EXCLUDED.synced_at
            `;
            break;
          }
        }
        // Update sync_manifest via upsert
        await sqlClient`
          INSERT INTO sync_manifest (file_path, file_hash, table_name, last_synced)
          VALUES (${change.relativePath}, ${change.hash}, ${change.table}, ${now})
          ON CONFLICT (file_path) DO UPDATE SET file_hash = EXCLUDED.file_hash, table_name = EXCLUDED.table_name, last_synced = EXCLUDED.last_synced
        `;
        appliedCount++;
      }
    } catch (error) {
      console.error(`[SYNC][PG] Failed to apply ${change.relativePath}:`, error.message);
    }
  }

  return { status: 'completed', applied: appliedCount };
}

// Main POST handler
export async function POST(request) {
  const auth = isAuthorized(request);
  if (!auth.ok) {
    return NextResponse.json({ status: 'error', error: auth.message || 'Unauthorized' }, { status: auth.status || 401 });
  }
  try {
    const body = await request.json();
    const mode = body.mode || 'scan';
    const vercelId = request.headers?.get?.('x-vercel-id');
    const forwardedFor = request.headers?.get?.('x-forwarded-for');
    const region = process.env.VERCEL_REGION || 'unknown-region';
    const env = process.env.VERCEL_ENV || (process.env.NODE_ENV || 'development');

    console.log('[SYNC] Request received', {
      mode,
      vercelId,
      forwardedFor,
      region,
      env,
      time: new Date().toISOString(),
    });

    const useSql = !!sql;
    console.log('[SYNC] Client selection', { useSql });
    let supabase;
    if (!useSql) {
      supabase = getSupabase();
      console.log('[SYNC] Supabase client initialized', {
        supabaseUrlConfigured: !!(process.env.SUPABASE_URL),
        serviceKeyConfigured: !!(process.env.SUPABASE_SERVICE_ROLE_KEY),
      });
    }

    const timestamp = new Date().toISOString();

    if (mode === 'scan') {
      // Scan for changes without applying
      console.log('[SYNC] Scan starting');
      const { changes, stats } = useSql ? await scanForChangesPg(sql) : await scanForChanges(supabase);
      console.log('[SYNC] Scan completed', { stats, changesCount: changes.length });

      return NextResponse.json({
        status: 'success',
        mode: 'scan',
        ...stats,
        changes: changes.slice(0, 100), // Return first 100 changes
        timestamp,
      });
    } else if (mode === 'pull') {
      // Pull changes from /public to database
      console.log('[SYNC] Pull starting');
      const { changes, stats } = useSql ? await scanForChangesPg(sql) : await scanForChanges(supabase);
      const result = useSql ? await pullChangesToDatabasePg(sql, changes) : await pullChangesToDatabase(supabase, changes);
      console.log('[SYNC] Pull completed', { stats, applied: result.applied, changesCount: changes.length });

      return NextResponse.json({
        status: 'success',
        mode: 'pull',
        ...stats,
        changes: changes.slice(0, 50),
        timestamp,
      });
    } else if (mode === 'push') {
      // Push changes from database to /public (not yet implemented)
      console.warn('[SYNC] Push requested but not implemented');
      return NextResponse.json({
        status: 'error',
        mode: 'push',
        error: 'Push mode is not yet implemented',
        timestamp,
      }, { status: 501 });
    } else {
      console.warn('[SYNC] Unknown mode', { mode });
      return NextResponse.json({
        status: 'error',
        mode,
        error: `Unknown mode: ${mode}. Use 'scan', 'pull', or 'push'`,
        timestamp,
      }, { status: 400 });
    }
  } catch (error) {
    console.error('[SYNC] Error handler', { message: error.message, stack: error.stack });
    return NextResponse.json({
      status: 'error',
      mode: 'unknown',
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// GET endpoint to check sync status
export async function GET(request) {
  const auth = isAuthorized(request);
  if (!auth.ok) {
    return NextResponse.json({ status: 'error', error: auth.message || 'Unauthorized' }, { status: auth.status || 401 });
  }
  console.log('[SYNC] GET status', {
    vercelId: request.headers?.get?.('x-vercel-id'),
    region: process.env.VERCEL_REGION || 'unknown-region',
    time: new Date().toISOString(),
  });
  return NextResponse.json({
    status: 'success',
    message: 'Sync endpoint is active',
    available_modes: ['scan', 'pull', 'push'],
    usage: 'POST /api/admin/sync with { mode: "scan" | "pull" | "push" }',
    timestamp: new Date().toISOString(),
  });
}

