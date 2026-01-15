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

const ALLOWED_EXTENSIONS = ['.json', '.js', '.xml', '.html', '.txt'];
const IGNORED_DIRS = ['.next', 'node_modules', '.git'];

function calculateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function mapFileToTable(filePath) {
  const sep = path.sep;
  if (filePath.includes(`${sep}collections${sep}`) || filePath.includes('/collections/')) {
    return 'collections';
  }
  if (filePath.includes(`${sep}files${sep}`) || filePath.includes('/files/')) {
    return 'static_files';
  }
  if (filePath.includes(`${sep}config${sep}`) || filePath.includes('/config/')) {
    return 'config_files';
  }
  if (filePath.includes(`${sep}data${sep}`) || filePath.includes('/data/')) {
    return 'data_files';
  }
  if (filePath.includes(`${sep}image${sep}`) || filePath.includes('/image/')) {
    return 'images';
  }
  if (filePath.includes(`${sep}js${sep}`) || filePath.includes('/js/')) {
    return 'javascript_files';
  }
  if (filePath.includes(`${sep}resume${sep}`) || filePath.includes('/resume/')) {
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
            const content = fs.readFileSync(fullPath, 'utf-8');
            const hash = calculateHash(content);
            const table = mapFileToTable(relativePath);
            const fileType = getFileExtension(fullPath);

            if (table !== 'unknown') {
              manifest.files.push({
                path: relativePath,
                hash,
                table,
                fileType,
                size: content.length
              });
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

  // Write manifest
  const manifestPath = path.join(publicPath, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`✅ Manifest written to: ${manifestPath}`);

  return manifest;
}

generateManifest();
