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
const { createClient } = require('@supabase/supabase-js');

// Utility functions
function calculateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function getFileExtension(filename) {
  return path.extname(filename).toLowerCase().slice(1) || 'unknown';
}

function determineFileType(filePath) {
  if (filePath.includes('/collections/')) {
    return { table: 'collections', fileType: 'json' };
  }
  if (filePath.includes('/files/')) {
    const ext = getFileExtension(filePath);
    return { table: 'static_files', fileType: ext };
  }
  if (filePath.includes('/config/')) {
    const ext = getFileExtension(filePath);
    return { table: 'config_files', fileType: ext };
  }
  if (filePath.includes('/data/')) {
    const ext = getFileExtension(filePath);
    return { table: 'data_files', fileType: ext };
  }
  if (filePath.includes('/image/')) {
    return { table: 'images', fileType: getFileExtension(filePath) };
  }
  if (filePath.includes('/js/')) {
    return { table: 'javascript_files', fileType: 'js' };
  }
  if (filePath.includes('/resume/')) {
    return { table: 'resumes', fileType: getFileExtension(filePath) };
  }
  return { table: 'unknown', fileType: getFileExtension(filePath) };
}

// Scan /public folder
function scanPublicFolder() {
  const publicPath = path.join(process.cwd(), 'public');
  const fileMap = new Map();

  function walkDir(dirPath) {
    if (!fs.existsSync(dirPath)) return;

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(publicPath, fullPath);

      if (entry.isDirectory()) {
        if (!['.next', 'node_modules', '.git'].includes(entry.name)) {
          walkDir(fullPath);
        }
      } else {
        if (['.json', '.js', '.xml', '.html', '.txt', '.pdf', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.docx'].includes(path.extname(fullPath))) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const hash = calculateHash(content);
            const { table, fileType } = determineFileType(fullPath);

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
    const { data: manifest, error } = await supabase
      .from('sync_manifest')
      .select('*');

    if (error) {
      throw new Error(`Failed to fetch sync_manifest: ${error.message}`);
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

// Pull mode: Apply changes from /public to database
async function pullChangesToDatabase(supabase, changes) {
  let appliedCount = 0;
  const publicPath = path.join(process.cwd(), 'public');

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

// Main POST handler
async function POST(request) {
  try {
    const body = await request.json();
    const mode = body.mode || 'scan';

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const timestamp = new Date().toISOString();

    if (mode === 'scan') {
      // Scan for changes without applying
      const { changes, stats } = await scanForChanges(supabase);

      return NextResponse.json({
        status: 'success',
        mode: 'scan',
        ...stats,
        changes: changes.slice(0, 100), // Return first 100 changes
        timestamp,
      });
    } else if (mode === 'pull') {
      // Pull changes from /public to database
      const { changes, stats } = await scanForChanges(supabase);
      const result = await pullChangesToDatabase(supabase, changes);

      return NextResponse.json({
        status: 'success',
        mode: 'pull',
        ...stats,
        changes: changes.slice(0, 50),
        timestamp,
      });
    } else if (mode === 'push') {
      // Push changes from database to /public (not yet implemented)
      return NextResponse.json({
        status: 'error',
        mode: 'push',
        error: 'Push mode is not yet implemented',
        timestamp,
      }, { status: 501 });
    } else {
      return NextResponse.json({
        status: 'error',
        mode,
        error: `Unknown mode: ${mode}. Use 'scan', 'pull', or 'push'`,
        timestamp,
      }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      mode: 'unknown',
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// GET endpoint to check sync status
async function GET(request) {
  return NextResponse.json({
    status: 'success',
    message: 'Sync endpoint is active',
    available_modes: ['scan', 'pull', 'push'],
    usage: 'POST /api/admin/sync with { mode: "scan" | "pull" | "push" }',
    timestamp: new Date().toISOString(),
  });
}

module.exports = { POST, GET };
