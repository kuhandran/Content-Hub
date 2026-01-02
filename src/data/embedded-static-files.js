/**
 * Embedded static file contents for Vercel serverless environments
 * These are the actual file contents embedded as strings for production use
 * This file is auto-generated from public/files
 */

const fs = require('fs');
const path = require('path');

// Build the embedded files object
const EMBEDDED_FILES = {};

// Try to load files from disk at startup
try {
  const filesDir = path.join(__dirname, '../../public/files');
  if (fs.existsSync(filesDir)) {
    const files = fs.readdirSync(filesDir);
    for (const file of files) {
      try {
        const filePath = path.join(filesDir, file);
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
          const content = fs.readFileSync(filePath, 'utf8');
          EMBEDDED_FILES[file] = content;
          console.log('[EMBEDDED-FILES] Loaded', file);
        }
      } catch (err) {
        console.error('[EMBEDDED-FILES] Failed to load', file, ':', err.message);
      }
    }
  }
} catch (err) {
  console.warn('[EMBEDDED-FILES] Could not load files from filesystem:', err.message);
}

console.log('[EMBEDDED-FILES] Loaded', Object.keys(EMBEDDED_FILES).length, 'files');

module.exports = EMBEDDED_FILES;
