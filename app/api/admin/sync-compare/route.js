/**
 * app/api/admin/sync-compare/route.js
 * 
 * Sync Comparison Endpoint
 * Compares manifest files with database
 * Returns: Similar, Different, Missing files
 */

import path from 'path';
import { NextResponse } from 'next/server';
import jwtManager from '../../../../lib/jwt-manager';
import dbopModule from '../../../../lib/dbop';
import manifestData from '../../../../lib/manifest-data.js';

/**
 * Verify JWT token from Authorization header
 */
function verifyJWT(request) {
  try {
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
    if (!authHeader) {
      return { ok: false, error: 'No authorization header' };
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return { ok: false, error: 'Invalid authorization header' };
    }

    const token = parts[1];
    const decoded = jwtManager.verifyToken(token);
    
    if (!decoded) {
      return { ok: false, error: 'Invalid or expired token' };
    }

    return { ok: true, user: decoded };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function calculateHash(content) {
  // Use the hash from manifest, or calculate if needed
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Get files from manifest for specific table type
function getFilesFromManifest(tableName) {
  const files = manifestData.files || [];
  const result = [];

  // Map table to folder prefix
  const folderMap = {
    'collections': 'collections/',
    'config_files': 'config/',
    'data_files': 'data/',
    'static_files': 'files/',
    'images': 'image/',
    'javascript_files': 'js/',
    'resumes': 'resume/'
  };

  const targetPrefix = folderMap[tableName];
  if (!targetPrefix) return [];

  for (const file of files) {
    if (file.path.startsWith(targetPrefix)) {
      const filename = path.basename(file.path, path.extname(file.path));
      result.push({
        filename,
        path: file.path,
        hash: file.hash,
        size: file.size || 0
      });
    }
  }

  return result;
}

// Get collections from manifest (special handling for multi-language)
function getCollectionsFromManifest() {
  const files = manifestData.files || [];
  const result = [];

  for (const file of files) {
    if (file.path.startsWith('collections/')) {
      // Path format: collections/en/config/filename.json
      const parts = file.path.split('/');
      if (parts.length >= 4) {
        const lang = parts[1];
        const type = parts[2];
        const filename = path.basename(file.path, path.extname(file.path));
        result.push({
          filename,
          path: file.path,
          hash: file.hash,
          lang,
          type,
          size: file.size || 0
        });
      }
    }
  }

  return result;
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
      rows = await sql.unsafe(`SELECT language, type, filename, file_hash as hash FROM collections`);
    } else {
      const { data } = await supabase.from('collections').select('language, type, filename, file_hash');
      rows = data || [];
      rows = rows.map(r => ({
        lang: r.language,
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
function compareCollections(manifestFiles, dbFiles) {
  const similar = [];
  const different = [];
  const missing = [];

  // Group DB files by lang/type/filename
  const dbMap = new Map();
  dbFiles.forEach(file => {
    // Handle both 'lang' and 'language' column names
    const lang = file.lang || file.language;
    const key = `${lang}/${file.type}/${file.filename}`;
    dbMap.set(key, file);
  });

  // Check each manifest file
  manifestFiles.forEach(mFile => {
    const key = `${mFile.lang}/${mFile.type}/${mFile.filename}`;
    const dbFile = dbMap.get(key);

    if (!dbFile) {
      missing.push({
        filename: mFile.filename,
        lang: mFile.lang,
        type: mFile.type,
        path: mFile.path,
        status: 'missing',
        message: 'In manifest but not in database'
      });
    } else if (mFile.hash === dbFile.hash) {
      similar.push({
        filename: mFile.filename,
        lang: mFile.lang,
        type: mFile.type,
        path: mFile.path,
        hash: mFile.hash,
        status: 'similar',
        message: 'In sync'
      });
    } else {
      different.push({
        filename: mFile.filename,
        lang: mFile.lang,
        type: mFile.type,
        path: mFile.path,
        manifestHash: mFile.hash,
        dbHash: dbFile.hash,
        status: 'different',
        message: 'Hash mismatch - needs update'
      });
    }
  });

  return { similar, different, missing };
}

export async function POST(request) {
  try {
    const auth = verifyJWT(request);
    if (!auth.ok) {
      return NextResponse.json(
        { status: 'error', error: `Unauthorized - ${auth.error}` },
        { status: 401 }
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

    let manifestFiles, dbFiles, comparison;

    if (table === 'collections') {
      manifestFiles = getCollectionsFromManifest();
      dbFiles = await getCollectionsFromDB();
      comparison = compareCollections(manifestFiles, dbFiles);
    } else {
      manifestFiles = getFilesFromManifest(table);
      dbFiles = await getFilesFromDB(table);
      comparison = compareFiles(manifestFiles, dbFiles, table);
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
          total_in_manifest: manifestFiles.length,
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
    const auth = verifyJWT(request);
    if (!auth.ok) {
      return NextResponse.json(
        { status: 'error', error: 'Unauthorized' },
        { status: 401 }
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
