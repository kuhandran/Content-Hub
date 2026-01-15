/**
 * app/api/services/syncService.js
 * 
 * Sync Service - Business Logic for File Synchronization
 * - Scan for changes
 * - Pull changes to database
 * - Compare files
 * - Update manifest
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const syncConfig = require('../../../lib/sync-config');
const { connectPostgres, connectSupabase, getActiveDB, initializeDatabaseTables } = require('../utils/db');

const { mapFileToTable, getFileExtension, ALLOWED_EXTENSIONS, IGNORED_DIRS, getPublicDir } = syncConfig;

/**
 * Calculate file hash
 * @param {string} content - File content
 * @returns {string} SHA256 hash
 */
function calculateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Scan public folder for files
 * @returns {Map} Map of file paths to file data
 */
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
            console.warn('[SYNC_SERVICE] ⚠️ Failed to read file:', relativePath, error.message);
          }
        }
      }
    }
  }

  walkDir(publicPath);
  console.log('[SYNC_SERVICE] ✓ Public folder scanned:', fileMap.size, 'files');
  return fileMap;
}

/**
 * Scan for changes using PostgreSQL
 * @param {Object} sqlClient - PostgreSQL client
 * @returns {Object} { changes, stats }
 */
async function scanForChanges(sqlClient) {
  console.log('[SYNC_SERVICE] 🔍 Scanning for changes (PostgreSQL)...');
  
  const currentFiles = scanPublicFolder();
  const changes = [];
  let newFiles = 0;
  let modifiedFiles = 0;
  let deletedFiles = 0;

  try {
    // Initialize tables
    await initializeDatabaseTables(sqlClient);

    // Get manifest entries
    let manifestRows = [];
    try {
      manifestRows = await sqlClient`SELECT file_path, file_hash, table_name FROM sync_manifest`;
      console.log('[SYNC_SERVICE] ✓ Manifest loaded:', manifestRows?.length || 0, 'entries');
    } catch (err) {
      console.warn('[SYNC_SERVICE] ⚠️ Manifest query failed:', err.message);
      manifestRows = [];
    }

    const manifestMap = new Map((manifestRows || []).map(m => [m.file_path, m]));

    // Check for new and modified files
    for (const [relativePath, fileData] of currentFiles) {
      const manifestEntry = manifestMap.get(relativePath);
      if (!manifestEntry) {
        changes.push({
          path: path.join('public', relativePath),
          relativePath,
          status: 'new',
          table: fileData.table,
          hash: fileData.hash,
          fileType: fileData.fileType
        });
        newFiles++;
      } else if (manifestEntry.file_hash !== fileData.hash) {
        changes.push({
          path: path.join('public', relativePath),
          relativePath,
          status: 'modified',
          table: fileData.table,
          hash: fileData.hash,
          fileType: fileData.fileType
        });
        modifiedFiles++;
      }
    }

    // Check for deleted files
    for (const [filePath, manifestEntry] of manifestMap) {
      if (!currentFiles.has(filePath)) {
        changes.push({
          path: path.join('public', filePath),
          relativePath: filePath,
          status: 'deleted',
          table: manifestEntry.table_name,
          hash: manifestEntry.file_hash,
          fileType: getFileExtension(filePath)
        });
        deletedFiles++;
      }
    }

    const stats = {
      files_scanned: currentFiles.size,
      new_files: newFiles,
      modified_files: modifiedFiles,
      deleted_files: deletedFiles
    };

    console.log('[SYNC_SERVICE] ✓ Scan complete:', stats);

    return { changes, stats };
  } catch (error) {
    console.error('[SYNC_SERVICE] ❌ Scan failed:', error.message);
    throw new Error(`Scan failed: ${error.message}`);
  }
}

/**
 * Pull changes to database
 * @param {Object} sqlClient - PostgreSQL client
 * @param {Array} changes - Array of file changes
 * @returns {Object} { applied, failed }
 */
async function pullChanges(sqlClient, changes) {
  console.log('[SYNC_SERVICE] 📥 Pulling', changes.length, 'changes to database...');
  
  let applied = 0;
  let failed = 0;
  const publicPath = getPublicDir();

  for (const change of changes) {
    try {
      const fullPath = path.join(publicPath, change.relativePath);

      if (change.status === 'deleted') {
        // Delete from database
        await sqlClient`DELETE FROM ${sqlClient(change.table)} WHERE file_path = ${change.relativePath}`;
        applied++;
        console.log('[SYNC_SERVICE] ✓ Deleted:', change.relativePath);
      } else if (change.status === 'new' || change.status === 'modified') {
        // Read and upsert file
        const content = fs.readFileSync(fullPath, 'utf-8');
        let parsedContent = content;
        
        try {
          parsedContent = JSON.parse(content);
        } catch {
          // Not JSON, keep as string
        }

        await sqlClient`
          INSERT INTO ${sqlClient(change.table)} 
          (filename, file_path, file_type, file_content, file_hash)
          VALUES (${path.basename(fullPath)}, ${change.relativePath}, ${change.fileType}, ${JSON.stringify(parsedContent)}, ${change.hash})
          ON CONFLICT (file_path) DO UPDATE SET
          file_content = EXCLUDED.file_content,
          file_hash = EXCLUDED.file_hash,
          synced_at = now()
        `;

        applied++;
        console.log('[SYNC_SERVICE] ✓ Applied:', change.relativePath);
      }

      // Update manifest
      await sqlClient`
        INSERT INTO sync_manifest (file_path, file_hash, table_name)
        VALUES (${change.relativePath}, ${change.hash}, ${change.table})
        ON CONFLICT (file_path) DO UPDATE SET
        file_hash = EXCLUDED.file_hash,
        last_synced = now()
      `;
    } catch (error) {
      failed++;
      console.error('[SYNC_SERVICE] ❌ Failed to apply change:', change.relativePath, error.message);
    }
  }

  console.log('[SYNC_SERVICE] ✓ Pull complete:', { applied, failed });
  return { applied, failed };
}

module.exports = {
  scanForChanges,
  pullChanges
};
