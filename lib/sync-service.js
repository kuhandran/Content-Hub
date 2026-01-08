/**
 * lib/sync-service.js
 * 
 * Sync utilities for file monitoring and change detection
 * Provides functions for tracking, hashing, and detecting changes
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Calculate SHA256 hash of file content
function calculateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Calculate hash for a file
function calculateFileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return calculateHash(content);
  } catch (error) {
    console.error(`Error calculating hash for ${filePath}: ${error.message}`);
    return null;
  }
}

// Get file extension
function getFileExtension(filename) {
  return path.extname(filename).toLowerCase().slice(1) || 'unknown';
}

// Determine which database table a file belongs to
function determineFileType(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');

  if (normalizedPath.includes('/collections/')) {
    return { table: 'collections', fileType: 'json' };
  }
  if (normalizedPath.includes('/files/')) {
    const ext = getFileExtension(filePath);
    return { table: 'static_files', fileType: ext };
  }
  if (normalizedPath.includes('/config/')) {
    const ext = getFileExtension(filePath);
    return { table: 'config_files', fileType: ext };
  }
  if (normalizedPath.includes('/data/')) {
    const ext = getFileExtension(filePath);
    return { table: 'data_files', fileType: ext };
  }
  if (normalizedPath.includes('/image/')) {
    return { table: 'images', fileType: getFileExtension(filePath) };
  }
  if (normalizedPath.includes('/js/')) {
    return { table: 'javascript_files', fileType: 'js' };
  }
  if (normalizedPath.includes('/resume/')) {
    return { table: 'resumes', fileType: getFileExtension(filePath) };
  }
  
  return { table: 'unknown', fileType: getFileExtension(filePath) };
}

// Check if file should be scanned
function shouldScanFile(filePath) {
  const ext = getFileExtension(filePath);
  const supportedExtensions = ['json', 'js', 'xml', 'html', 'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'docx'];
  const ignoredDirs = ['.next', 'node_modules', '.git', '.env'];

  const isIgnored = ignoredDirs.some(dir => filePath.includes(`/${dir}/`) || filePath.includes(`\\${dir}\\`));
  const isSupported = supportedExtensions.includes(ext);

  return !isIgnored && isSupported;
}

// Get file metadata
function getFileMetadata(filePath, baseDir = '') {
  try {
    const stat = fs.statSync(filePath);
    const relativePath = baseDir ? path.relative(baseDir, filePath).replace(/\\/g, '/') : filePath;
    const hash = calculateFileHash(filePath);
    const { table, fileType } = determineFileType(filePath);

    return {
      path: filePath,
      relativePath,
      filename: path.basename(filePath),
      extension: getFileExtension(filePath),
      size: stat.size,
      hash,
      table,
      fileType,
      modifiedAt: stat.mtime.toISOString(),
      createdAt: stat.birthtime.toISOString(),
    };
  } catch (error) {
    console.error(`Error getting metadata for ${filePath}: ${error.message}`);
    return null;
  }
}

// Scan directory recursively
function scanDirectory(dirPath, baseDir = null) {
  const files = [];
  const base = baseDir || dirPath;

  function walk(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (!['.next', 'node_modules', '.git'].includes(entry.name)) {
            walk(fullPath);
          }
        } else if (entry.isFile() && shouldScanFile(fullPath)) {
          const metadata = getFileMetadata(fullPath, base);
          if (metadata) {
            files.push(metadata);
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dir}: ${error.message}`);
    }
  }

  walk(dirPath);
  return files;
}

// Compare two file metadata objects for changes
function hasFileChanged(oldMetadata, newMetadata) {
  if (!oldMetadata || !newMetadata) return true;
  return oldMetadata.hash !== newMetadata.hash || oldMetadata.size !== newMetadata.size;
}

// Detect changes between two file lists
function detectChanges(oldFileMap, newFileMap) {
  const changes = {
    created: [],
    modified: [],
    deleted: [],
  };

  // Check for new and modified files
  for (const [path, newData] of Object.entries(newFileMap)) {
    const oldData = oldFileMap[path];

    if (!oldData) {
      changes.created.push(newData);
    } else if (hasFileChanged(oldData, newData)) {
      changes.modified.push(newData);
    }
  }

  // Check for deleted files
  for (const [path, oldData] of Object.entries(oldFileMap)) {
    if (!newFileMap[path]) {
      changes.deleted.push(oldData);
    }
  }

  return changes;
}

// Create file map from metadata array (for easy lookup)
function createFileMap(files) {
  const map = {};
  for (const file of files) {
    map[file.relativePath] = file;
  }
  return map;
}

// Watch directory for changes (polling-based)
function watchDirectory(dirPath, onChangeCallback, interval = 5000) {
  let previousFiles = createFileMap(scanDirectory(dirPath));

  const watcherId = setInterval(() => {
    try {
      const currentFiles = createFileMap(scanDirectory(dirPath));
      const changes = detectChanges(previousFiles, currentFiles);

      if (changes.created.length > 0 || changes.modified.length > 0 || changes.deleted.length > 0) {
        onChangeCallback(changes);
        previousFiles = currentFiles;
      }
    } catch (error) {
      console.error(`Error in directory watch: ${error.message}`);
    }
  }, interval);

  return {
    watcherId,
    stop: () => clearInterval(watcherId),
    getCurrentFiles: () => previousFiles,
  };
}

// Format file list for display
function formatFileList(files, includeHashes = false) {
  return files.map(file => {
    const formatted = {
      path: file.relativePath,
      size: `${(file.size / 1024).toFixed(2)} KB`,
      type: file.fileType,
      table: file.table,
      modified: file.modifiedAt.split('T')[0],
    };

    if (includeHashes) {
      formatted.hash = file.hash;
    }

    return formatted;
  });
}

// Generate sync report
function generateSyncReport(changes, timestamp = null) {
  const time = timestamp || new Date().toISOString();

  return {
    timestamp: time,
    summary: {
      total_changes: changes.created.length + changes.modified.length + changes.deleted.length,
      created: changes.created.length,
      modified: changes.modified.length,
      deleted: changes.deleted.length,
    },
    changes: {
      created: formatFileList(changes.created, true),
      modified: formatFileList(changes.modified, true),
      deleted: formatFileList(changes.deleted, true),
    },
  };
}

// Batch file operations
async function batchOperation(files, operation, concurrency = 5) {
  const results = [];
  const errors = [];

  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);
    const promises = batch.map(file =>
      operation(file)
        .then(result => results.push({ file: file.relativePath, ...result }))
        .catch(error => errors.push({ file: file.relativePath, error: error.message }))
    );

    await Promise.all(promises);
  }

  return { results, errors };
}

// Validate sync manifest
function validateSyncManifest(manifest) {
  const issues = [];

  if (!Array.isArray(manifest)) {
    return ['Manifest is not an array'];
  }

  for (const entry of manifest) {
    if (!entry.file_path) issues.push(`Entry missing file_path: ${JSON.stringify(entry)}`);
    if (!entry.file_hash) issues.push(`Entry missing file_hash: ${entry.file_path}`);
    if (!entry.table_name) issues.push(`Entry missing table_name: ${entry.file_path}`);
    if (!entry.last_synced) issues.push(`Entry missing last_synced: ${entry.file_path}`);
  }

  return issues;
}

// Export functions
module.exports = {
  calculateHash,
  calculateFileHash,
  getFileExtension,
  determineFileType,
  shouldScanFile,
  getFileMetadata,
  scanDirectory,
  hasFileChanged,
  detectChanges,
  createFileMap,
  watchDirectory,
  formatFileList,
  generateSyncReport,
  batchOperation,
  validateSyncManifest,
};
