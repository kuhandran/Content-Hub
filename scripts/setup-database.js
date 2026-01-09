#!/usr/bin/env node

/**
 * scripts/setup-database.js
 * 
 * Runs during: npm run build
 * Purpose: 
 * 1. Drop all existing tables
 * 2. Scan /public folder for all files
 * 3. Detect file types and structure
 * 4. Create fresh database tables
 * 5. Load all data from /public into database
 * 6. Generate file hashes for change detection
 * 7. Populate sync_manifest
 * 
 * This ensures the database always matches /public folder state
 * 
 * Run directly: node scripts/setup-database.js
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sql = require('../lib/postgres');
const { ALLOWED_EXTENSIONS, IGNORED_DIRS, getPublicDir, getFileExtension, mapFileToTable } = require('../lib/sync-config');
const { TABLES } = require('../lib/dbop');

// Ensure Postgres client is available
if (!sql) {
  console.error('❌ Missing or invalid DATABASE_URL. Configure DATABASE_URL for Postgres.');
  process.exit(1);
}

// Utility functions
function calculateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// file type mapping and helpers centralized in lib/sync-config

// Scan /public folder recursively
function scanPublicFolder() {
  const publicPath = getPublicDir();
  const files = [];

  function walkDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
      console.log(`⚠️  Directory not found: ${dirPath}`);
      return;
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(publicPath, fullPath);

      // Skip certain directories
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.includes(entry.name)) {
          walkDir(fullPath);
        }
      } else {
        // Only process relevant files
        if (ALLOWED_EXTENSIONS.includes(path.extname(fullPath).toLowerCase())) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const hash = calculateHash(content);
            const { table, fileType } = mapFileToTable(fullPath);

            if (table !== 'unknown') {
              files.push({
                path: fullPath,
                relativePath,
                content,
                hash,
                table,
                fileType,
              });
            }
          } catch (error) {
            console.warn(`⚠️  Failed to read file: ${fullPath}`, error.message);
          }
        }
      }
    }
  }

  walkDir(publicPath);
  return files;
}

// Parse collections files (special handling for /public/collections/[lang]/[type]/ structure)
function parseCollectionFile(filePath, content) {
  const parts = filePath.split(path.sep);
  const collectionsIndex = parts.findIndex(p => p === 'collections');

  if (collectionsIndex === -1 || collectionsIndex + 2 >= parts.length) {
    return null;
  }

  const lang = parts[collectionsIndex + 1];
  const type = parts[collectionsIndex + 2];
  const filename = path.basename(filePath, path.extname(filePath));

  try {
    const fileContent = JSON.parse(content);
    return {
      lang,
      type,
      filename,
      file_content: fileContent,
      file_hash: calculateHash(content),
      synced_at: new Date().toISOString(),
    };
  } catch (error) {
    console.warn(`⚠️  Failed to parse JSON in ${filePath}`);
    return null;
  }
}

// Drop all tables
async function dropAllTables() {
  console.log('\n🗑️  Dropping existing tables (Postgres)...');
  for (const table of TABLES) {
    try {
      await sql.unsafe(`DROP TABLE IF EXISTS ${table} CASCADE`);
      console.log(`✅ Dropped ${table}`);
    } catch (error) {
      console.log(`ℹ️  Could not drop ${table}: ${error.message}`);
    }
  }
}

// Create all database tables using Supabase RPC
async function createAllTables() {
  console.log('\n📊 Creating database tables (Postgres)...');

  const schema = `
    CREATE TABLE IF NOT EXISTS collections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lang VARCHAR(10) NOT NULL,
      type VARCHAR(20) NOT NULL CHECK(type IN ('config', 'data')),
      filename VARCHAR(255) NOT NULL,
      file_content JSONB NOT NULL,
      file_hash VARCHAR(64),
      synced_at TIMESTAMP DEFAULT now(),
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now(),
      UNIQUE(lang, type, filename)
    );
    CREATE INDEX IF NOT EXISTS idx_collections_lang ON collections(lang);
    CREATE INDEX IF NOT EXISTS idx_collections_type ON collections(type);

    CREATE TABLE IF NOT EXISTS static_files (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      filename VARCHAR(255) NOT NULL UNIQUE,
      file_type VARCHAR(50),
      file_content TEXT NOT NULL,
      file_hash VARCHAR(64),
      synced_at TIMESTAMP DEFAULT now(),
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_static_files_filename ON static_files(filename);

    CREATE TABLE IF NOT EXISTS config_files (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      filename VARCHAR(255) NOT NULL UNIQUE,
      file_type VARCHAR(50),
      file_content JSONB NOT NULL,
      file_hash VARCHAR(64),
      synced_at TIMESTAMP DEFAULT now(),
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_config_files_filename ON config_files(filename);

    CREATE TABLE IF NOT EXISTS data_files (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      filename VARCHAR(255) NOT NULL UNIQUE,
      file_type VARCHAR(50),
      file_content JSONB NOT NULL,
      file_hash VARCHAR(64),
      synced_at TIMESTAMP DEFAULT now(),
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_data_files_filename ON data_files(filename);

    CREATE TABLE IF NOT EXISTS images (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      filename VARCHAR(255) NOT NULL UNIQUE,
      file_path VARCHAR(512),
      mime_type VARCHAR(50),
      file_hash VARCHAR(64),
      synced_at TIMESTAMP DEFAULT now(),
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_images_filename ON images(filename);

    CREATE TABLE IF NOT EXISTS resumes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      filename VARCHAR(255) NOT NULL UNIQUE,
      file_type VARCHAR(50),
      file_path VARCHAR(512),
      description TEXT,
      version VARCHAR(50),
      file_hash VARCHAR(64),
      synced_at TIMESTAMP DEFAULT now(),
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_resumes_filename ON resumes(filename);

    CREATE TABLE IF NOT EXISTS javascript_files (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      filename VARCHAR(255) NOT NULL UNIQUE,
      file_path VARCHAR(512),
      file_content TEXT NOT NULL,
      file_hash VARCHAR(64),
      synced_at TIMESTAMP DEFAULT now(),
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_js_files_filename ON javascript_files(filename);

    CREATE TABLE IF NOT EXISTS sync_manifest (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      file_path VARCHAR(512) NOT NULL UNIQUE,
      file_hash VARCHAR(64) NOT NULL,
      table_name VARCHAR(50),
      last_synced TIMESTAMP DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_sync_manifest_path ON sync_manifest(file_path);
  `;

  // Execute each statement separately
  const statements = schema.split(';').filter(s => s.trim());
  let created = 0;

  for (const statement of statements) {
    const stmt = statement.trim();
    if (!stmt) continue;
    try {
      await sql.unsafe(stmt);
      created++;
    } catch (error) {
      console.warn(`⚠️  ${error.message}`);
    }
  }

  console.log(`✅ Database tables setup (${created} statements executed)`);
}

// Load data into tables
async function loadDataIntoTables(files) {
  console.log('\n📥 Loading data into tables (Postgres)...');

  const collections = [];
  const staticFiles = [];
  const configFiles = [];
  const dataFiles = [];
  const imageFiles = [];
  const resumeFiles = [];
  const jsFiles = [];
  const syncManifest = [];

  // Categorize files
  for (const file of files) {
    const filename = path.basename(file.relativePath, path.extname(file.relativePath));
    const ext = getFileExtension(file.relativePath);
    const now = new Date().toISOString();

    syncManifest.push({
      file_path: file.relativePath,
      file_hash: file.hash,
      table_name: file.table,
      last_synced: now,
    });

    switch (file.table) {
      case 'collections': {
        const parsed = parseCollectionFile(file.relativePath, file.content);
        if (parsed) collections.push(parsed);
        break;
      }
      case 'static_files':
        staticFiles.push({
          filename,
          file_type: ext,
          file_content: file.content,
          file_hash: file.hash,
          synced_at: now,
        });
        break;
      case 'config_files':
        try {
          const parsed = JSON.parse(file.content);
          configFiles.push({
            filename,
            file_type: ext,
            file_content: parsed,
            file_hash: file.hash,
            synced_at: now,
          });
        } catch {
          console.warn(`⚠️  Could not parse config file: ${file.relativePath}`);
        }
        break;
      case 'data_files':
        try {
          const parsed = JSON.parse(file.content);
          dataFiles.push({
            filename,
            file_type: ext,
            file_content: parsed,
            file_hash: file.hash,
            synced_at: now,
          });
        } catch {
          console.warn(`⚠️  Could not parse data file: ${file.relativePath}`);
        }
        break;
      case 'images':
        imageFiles.push({
          filename,
          file_path: file.relativePath,
          mime_type: file.fileType ? `image/${file.fileType}` : 'image/unknown',
          file_hash: file.hash,
          synced_at: now,
        });
        break;
      case 'resumes':
        resumeFiles.push({
          filename,
          file_type: ext,
          file_path: file.relativePath,
          description: null,
          version: '1.0',
          file_hash: file.hash,
          synced_at: now,
        });
        break;
      case 'javascript_files':
        jsFiles.push({
          filename,
          file_path: file.relativePath,
          file_content: file.content,
          file_hash: file.hash,
          synced_at: now,
        });
        break;
    }
  }

  // Insert into tables
  const tables = [
    { name: 'collections', data: collections },
    { name: 'static_files', data: staticFiles },
    { name: 'config_files', data: configFiles },
    { name: 'data_files', data: dataFiles },
    { name: 'images', data: imageFiles },
    { name: 'resumes', data: resumeFiles },
    { name: 'javascript_files', data: jsFiles },
    { name: 'sync_manifest', data: syncManifest },
  ];

  for (const table of tables) {
    if (table.data.length === 0) {
      console.log(`ℹ️  No data for ${table.name}`);
      continue;
    }
    try {
      for (const row of table.data) {
        const now = new Date().toISOString();
        switch (table.name) {
          case 'collections': {
            await sql`
              INSERT INTO collections (lang, type, filename, file_content, file_hash, synced_at)
              VALUES (${row.lang}, ${row.type}, ${row.filename}, ${sql.json(row.file_content)}, ${row.file_hash || ''}, ${row.synced_at || now})
              ON CONFLICT (lang, type, filename) DO UPDATE SET file_content = EXCLUDED.file_content, file_hash = EXCLUDED.file_hash, synced_at = EXCLUDED.synced_at
            `;
            break;
          }
          case 'static_files': {
            await sql`
              INSERT INTO static_files (filename, file_type, file_content, file_hash, synced_at)
              VALUES (${row.filename}, ${row.file_type}, ${row.file_content}, ${row.file_hash || ''}, ${row.synced_at || now})
              ON CONFLICT (filename) DO UPDATE SET file_type = EXCLUDED.file_type, file_content = EXCLUDED.file_content, file_hash = EXCLUDED.file_hash, synced_at = EXCLUDED.synced_at
            `;
            break;
          }
          case 'config_files': {
            await sql`
              INSERT INTO config_files (filename, file_type, file_content, file_hash, synced_at)
              VALUES (${row.filename}, ${row.file_type}, ${sql.json(row.file_content)}, ${row.file_hash || ''}, ${row.synced_at || now})
              ON CONFLICT (filename) DO UPDATE SET file_type = EXCLUDED.file_type, file_content = EXCLUDED.file_content, file_hash = EXCLUDED.file_hash, synced_at = EXCLUDED.synced_at
            `;
            break;
          }
          case 'data_files': {
            await sql`
              INSERT INTO data_files (filename, file_type, file_content, file_hash, synced_at)
              VALUES (${row.filename}, ${row.file_type}, ${sql.json(row.file_content)}, ${row.file_hash || ''}, ${row.synced_at || now})
              ON CONFLICT (filename) DO UPDATE SET file_type = EXCLUDED.file_type, file_content = EXCLUDED.file_content, file_hash = EXCLUDED.file_hash, synced_at = EXCLUDED.synced_at
            `;
            break;
          }
          case 'images': {
            await sql`
              INSERT INTO images (filename, file_path, mime_type, file_hash, synced_at)
              VALUES (${row.filename}, ${row.file_path}, ${row.mime_type || 'image/unknown'}, ${row.file_hash || ''}, ${row.synced_at || now})
              ON CONFLICT (filename) DO UPDATE SET file_path = EXCLUDED.file_path, mime_type = EXCLUDED.mime_type, file_hash = EXCLUDED.file_hash, synced_at = EXCLUDED.synced_at
            `;
            break;
          }
          case 'resumes': {
            await sql`
              INSERT INTO resumes (filename, file_type, file_path, description, version, file_hash, synced_at)
              VALUES (${row.filename}, ${row.file_type}, ${row.file_path}, ${row.description || null}, ${row.version || '1.0'}, ${row.file_hash || ''}, ${row.synced_at || now})
              ON CONFLICT (filename) DO UPDATE SET file_type = EXCLUDED.file_type, file_path = EXCLUDED.file_path, description = EXCLUDED.description, version = EXCLUDED.version, file_hash = EXCLUDED.file_hash, synced_at = EXCLUDED.synced_at
            `;
            break;
          }
          case 'javascript_files': {
            await sql`
              INSERT INTO javascript_files (filename, file_path, file_content, file_hash, synced_at)
              VALUES (${row.filename}, ${row.file_path}, ${row.file_content}, ${row.file_hash || ''}, ${row.synced_at || now})
              ON CONFLICT (filename) DO UPDATE SET file_path = EXCLUDED.file_path, file_content = EXCLUDED.file_content, file_hash = EXCLUDED.file_hash, synced_at = EXCLUDED.synced_at
            `;
            break;
          }
          case 'sync_manifest': {
            await sql`
              INSERT INTO sync_manifest (file_path, file_hash, table_name, last_synced)
              VALUES (${row.file_path}, ${row.file_hash}, ${row.table_name}, ${row.last_synced || now})
              ON CONFLICT (file_path) DO UPDATE SET file_hash = EXCLUDED.file_hash, table_name = EXCLUDED.table_name, last_synced = EXCLUDED.last_synced
            `;
            break;
          }
        }
      }
      console.log(`✅ Loaded ${table.data.length} records into ${table.name}`);
    } catch (error) {
      console.error(`❌ Error inserting into ${table.name}:`, error.message);
    }
  }
}

// Main execution
async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║     Content Hub - Database Setup Script    ║');
  console.log('║         Running during npm build           ║');
  console.log('╚════════════════════════════════════════════╝');

  try {
    // Step 1: Scan public folder
    console.log('\n🔍 Scanning /public folder...');
    const files = await scanPublicFolder();
    console.log(`✅ Found ${files.length} files`);

    // Step 2: Drop existing tables
    await dropAllTables();

    // Step 3: Create fresh tables
    await createAllTables();

    // Step 4: Load data
    await loadDataIntoTables(files);

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║   ✅ Database setup completed successfully ║');
    console.log('╚════════════════════════════════════════════╝\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();
