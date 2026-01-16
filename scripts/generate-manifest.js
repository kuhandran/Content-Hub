#!/usr/bin/env node
/**
 * Generate file manifest for public folder
 * Run this locally before deploying to create public/manifest.json
 * 
 * Usage: node scripts/generate-manifest.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ALLOWED_EXTENSIONS = ['.json', '.js', '.xml', '.html', '.txt', '.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.docx', '.doc'];
const BINARY_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.docx', '.doc', '.xlsx', '.xls'];
const IGNORED_DIRS = ['.next', 'node_modules', '.git'];

function calculateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function isBinaryFile(ext) {
  return BINARY_EXTENSIONS.includes(ext.toLowerCase());
}

function mapFileToTable(filePath) {
  const sep = path.sep;
  // Handle both absolute and relative paths - check if path starts with or contains the folder
  if (filePath.startsWith('collections/') || filePath.startsWith('collections\\') || filePath.includes(`${sep}collections${sep}`) || filePath.includes('/collections/')) {
    return 'collections';
  }
  if (filePath.startsWith('files/') || filePath.startsWith('files\\') || filePath.includes(`${sep}files${sep}`) || filePath.includes('/files/')) {
    return 'static_files';
  }
  if (filePath.startsWith('config/') || filePath.startsWith('config\\') || filePath.includes(`${sep}config${sep}`) || filePath.includes('/config/')) {
    return 'config_files';
  }
  if (filePath.startsWith('data/') || filePath.startsWith('data\\') || filePath.includes(`${sep}data${sep}`) || filePath.includes('/data/')) {
    return 'data_files';
  }
  if (filePath.startsWith('image/') || filePath.startsWith('image\\') || filePath.includes(`${sep}image${sep}`) || filePath.includes('/image/')) {
    return 'images';
  }
  if (filePath.startsWith('js/') || filePath.startsWith('js\\') || filePath.includes(`${sep}js${sep}`) || filePath.includes('/js/')) {
    return 'javascript_files';
  }
  if (filePath.startsWith('resume/') || filePath.startsWith('resume\\') || filePath.includes(`${sep}resume${sep}`) || filePath.includes('/resume/')) {
    return 'resumes';
  }
  return 'unknown';
}

function getFileExtension(filename) {
  return path.extname(filename).toLowerCase().slice(1) || 'unknown';
}

function generateManifest() {
  const publicPath = path.join(process.cwd(), 'public');
  const manifest = {
    generated: new Date().toISOString(),
    version: '1.0',
    files: []
  };

  if (!fs.existsSync(publicPath)) {
    console.error('❌ public folder not found at:', publicPath);
    process.exit(1);
  }

  function walkDir(dirPath, relativeTo) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(relativeTo, fullPath).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.includes(entry.name)) {
          walkDir(fullPath, relativeTo);
        }
      } else {
        const ext = path.extname(fullPath).toLowerCase();
        if (ALLOWED_EXTENSIONS.includes(ext)) {
          try {
            const isBinary = isBinaryFile(ext);
            let content, hash, size;
            
            if (isBinary) {
              // For binary files, read as buffer for hash, don't embed content
              const buffer = fs.readFileSync(fullPath);
              hash = calculateHash(buffer);
              size = buffer.length;
              content = null; // Don't embed binary content in manifest
            } else {
              // For text files, read as utf-8
              content = fs.readFileSync(fullPath, 'utf-8');
              hash = calculateHash(content);
              size = content.length;
            }
            
            const table = mapFileToTable(relativePath);
            const fileType = getFileExtension(fullPath);

            if (table !== 'unknown') {
              const fileEntry = {
                path: relativePath,
                hash,
                table,
                fileType,
                size,
                isBinary
              };
              
              // Only include content for text files
              if (!isBinary && content) {
                fileEntry.content = content;
              }
              
              manifest.files.push(fileEntry);
            }
          } catch (error) {
            console.warn(`⚠️ Could not read: ${relativePath} - ${error.message}`);
          }
        }
      }
    }
  }

  walkDir(publicPath, publicPath);

  // Group by table for summary
  const tableCounts = {};
  for (const file of manifest.files) {
    tableCounts[file.table] = (tableCounts[file.table] || 0) + 1;
  }

  console.log('📊 Manifest Summary:');
  console.log(`   Total files: ${manifest.files.length}`);
  console.log('   By table:', JSON.stringify(tableCounts, null, 2));

  // Write manifest JSON
  const manifestPath = path.join(publicPath, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`✅ Manifest written to: ${manifestPath}`);

  // Also write as JS module for bundling
  const jsModulePath = path.join(process.cwd(), 'lib', 'manifest-data.js');
  const jsContent = `// Auto-generated manifest data - do not edit
// Generated: ${manifest.generated}
export const manifest = ${JSON.stringify(manifest, null, 2)};
export default manifest;
`;
  fs.writeFileSync(jsModulePath, jsContent);
  console.log(`✅ JS module written to: ${jsModulePath}`);

  return manifest;
}

generateManifest();
