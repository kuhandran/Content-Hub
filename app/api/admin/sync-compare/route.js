/**
 * app/api/admin/sync-compare/route.js
 * 
 * Sync Comparison Endpoint
 * Compares /public folder with database
 * Returns: Similar, Different, Missing files
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { isAuthorized } from '../../../../lib/auth';
import { ALLOWED_EXTENSIONS, IGNORED_DIRS, getPublicDir } from '../../../../lib/sync-config';
import dbopModule from '../../../../lib/dbop';

function calculateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Scan folder for specific table type
function scanFolderForTable(tableName) {
  const publicPath = getPublicDir();
  const files = [];
  let targetFolder = '';

  // Map table to folder
  switch (tableName) {
    case 'collections':
      targetFolder = path.join(publicPath, 'collections');
      break;
    case 'config_files':
      targetFolder = path.join(publicPath, 'config');
      break;
    case 'data_files':
      targetFolder = path.join(publicPath, 'data');
      break;
    case 'static_files':
      targetFolder = path.join(publicPath, 'files');
      break;
    case 'images':
      targetFolder = path.join(publicPath, 'image');
      break;
    case 'javascript_files':
      targetFolder = path.join(publicPath, 'js');
      break;
    case 'resumes':
      targetFolder = path.join(publicPath, 'resume');
      break;
    default:
      return [];
  }

  if (!fs.existsSync(targetFolder)) {
    return [];
  }

  function walkDir(dirPath) {
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
            const filename = path.basename(fullPath, path.extname(fullPath));

            files.push({
              filename,
              path: relativePath,
              hash,
              size: Buffer.byteLength(content, 'utf-8')
            });
          } catch (error) {
            console.warn(`⚠️ Failed to read: ${fullPath}`);
          }
        }
      }
    }
  }

  walkDir(targetFolder);
  return files;
}

// Get files from database
async function getFilesFromDB(tableName) {
  const { mode, sql, supabase } = dbopModule.db?.() || { mode: 'supabase' };

  try {
    let rows = [];

    if (mode === 'postgres' && sql) {
      rows = await sql.unsafe(`SELECT filename, file_hash as hash FROM ${tableName}`);
    } else {
      const { data } = await supabase.from(tableName).select('filename, file_hash');
      rows = data || [];
      // Rename file_hash to hash for consistency
      rows = rows.map(r => ({ filename: r.filename, hash: r.file_hash }));
    }

    return rows || [];
  } catch (error) {
    console.error(`Error fetching from ${tableName}:`, error.message);
    return [];
  }
}

// Special handling for collections (multi-language)
async function getCollectionsFromDB() {
  const { mode, sql, supabase } = dbopModule.db?.() || { mode: 'supabase' };

  try {
    let rows = [];

    if (mode === 'postgres' && sql) {
      rows = await sql.unsafe(`SELECT lang, type, filename, file_hash as hash FROM collections`);
    } else {
      const { data } = await supabase.from('collections').select('lang, type, filename, file_hash');
      rows = data || [];
      rows = rows.map(r => ({
        lang: r.lang,
        type: r.type,
        filename: r.filename,
        hash: r.file_hash
      }));
    }

    return rows || [];
  } catch (error) {
    console.error('Error fetching collections:', error.message);
    return [];
  }
}

// Compare files
function compareFiles(publicFiles, dbFiles, tableName) {
  const similar = [];
  const different = [];
  const missing = [];

  const dbMap = new Map();
  dbFiles.forEach(file => {
    dbMap.set(file.filename, file);
  });

  // Check each public file
  publicFiles.forEach(pubFile => {
    const dbFile = dbMap.get(pubFile.filename);

    if (!dbFile) {
      missing.push({
        filename: pubFile.filename,
        path: pubFile.path,
        status: 'missing',
        message: 'In /public but not in database'
      });
    } else if (pubFile.hash === dbFile.hash) {
      similar.push({
        filename: pubFile.filename,
        path: pubFile.path,
        hash: pubFile.hash,
        status: 'similar',
        message: 'In sync'
      });
    } else {
      different.push({
        filename: pubFile.filename,
        path: pubFile.path,
        publicHash: pubFile.hash,
        dbHash: dbFile.hash,
        status: 'different',
        message: 'Hash mismatch - needs update'
      });
    }
  });

  return { similar, different, missing };
}

// Compare collections (special handling for multi-language)
function compareCollections(publicFiles, dbFiles) {
  const similar = [];
  const different = [];
  const missing = [];

  // Group DB files by lang/type/filename
  const dbMap = new Map();
  dbFiles.forEach(file => {
    const key = `${file.lang}/${file.type}/${file.filename}`;
    dbMap.set(key, file);
  });

  // Check each public file
  publicFiles.forEach(pubFile => {
    // Extract lang and type from path: collections/en/config/filename
    const parts = pubFile.path.split(path.sep);
    const langIdx = parts.findIndex(p => p === 'collections');
    
    if (langIdx !== -1 && langIdx + 2 < parts.length) {
      const lang = parts[langIdx + 1];
      const type = parts[langIdx + 2];
      const key = `${lang}/${type}/${pubFile.filename}`;

      const dbFile = dbMap.get(key);

      if (!dbFile) {
        missing.push({
          filename: pubFile.filename,
          lang,
          type,
          path: pubFile.path,
          status: 'missing',
          message: 'In /public but not in database'
        });
      } else if (pubFile.hash === dbFile.hash) {
        similar.push({
          filename: pubFile.filename,
          lang,
          type,
          path: pubFile.path,
          hash: pubFile.hash,
          status: 'similar',
          message: 'In sync'
        });
      } else {
        different.push({
          filename: pubFile.filename,
          lang,
          type,
          path: pubFile.path,
          publicHash: pubFile.hash,
          dbHash: dbFile.hash,
          status: 'different',
          message: 'Hash mismatch - needs update'
        });
      }
    }
  });

  return { similar, different, missing };
}

export async function POST(request) {
  try {
    const auth = isAuthorized(request);
    if (!auth.ok) {
      return NextResponse.json(
        { status: 'error', error: 'Unauthorized' },
        { status: auth.status || 401 }
      );
    }

    const { table } = await request.json();

    if (!table) {
      return NextResponse.json(
        { status: 'error', error: 'Table name required' },
        { status: 400 }
      );
    }

    if (!dbopModule.TABLES.includes(table)) {
      return NextResponse.json(
        { status: 'error', error: 'Invalid table name' },
        { status: 400 }
      );
    }

    console.log(`[SYNC COMPARE] Comparing ${table}...`);

    let publicFiles, dbFiles, comparison;

    if (table === 'collections') {
      publicFiles = scanFolderForTable('collections');
      dbFiles = await getCollectionsFromDB();
      comparison = compareCollections(publicFiles, dbFiles);
    } else {
      publicFiles = scanFolderForTable(table);
      dbFiles = await getFilesFromDB(table);
      comparison = compareFiles(publicFiles, dbFiles, table);
    }

    return NextResponse.json({
      status: 'success',
      table,
      timestamp: new Date().toISOString(),
      comparison: {
        similar: comparison.similar,
        different: comparison.different,
        missing: comparison.missing,
        summary: {
          total_in_public: publicFiles.length,
          total_in_db: dbFiles.length,
          similar_count: comparison.similar.length,
          different_count: comparison.different.length,
          missing_count: comparison.missing.length
        }
      }
    });
  } catch (error) {
    console.error('[SYNC COMPARE] Error:', error.message);
    return NextResponse.json(
      { status: 'error', error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const auth = isAuthorized(request);
    if (!auth.ok) {
      return NextResponse.json(
        { status: 'error', error: 'Unauthorized' },
        { status: auth.status || 401 }
      );
    }

    return NextResponse.json({
      status: 'success',
      message: 'Sync Compare API',
      usage: 'POST /api/admin/sync-compare { "table": "config_files" }',
      available_tables: dbopModule.TABLES
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', error: error.message },
      { status: 500 }
    );
  }
}
