/**
 * app/api/admin/data/route.js
 * 
 * Data Management Endpoint
 * GET: Data statistics
 * POST: Pump data, clear data, migrate data
 */


import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import authMod from '../../../../lib/auth';
import dbopModule from '../../../../lib/dbop';
import supabaseModule from '../../../../lib/supabase';
import syncConfigModule from '../../../../lib/sync-config';
import sql from '../../../../lib/postgres';
import { NextResponse } from 'next/server';
import { logRequest, logResponse, logDatabase, logError } from '../../../../lib/logger';
const { getSupabase } = supabaseModule;
const supabase = getSupabase();
const { mapFileToTable, ALLOWED_EXTENSIONS, IGNORED_DIRS, getPublicDir } = syncConfigModule;

function calculateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// file type mapping centralized in lib/sync-config

function scanPublicFolder() {
  const publicPath = getPublicDir();
  const files = [];

  function walkDir(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(publicPath, fullPath);

      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.includes(entry.name)) walkDir(fullPath);
      } else {
        if (ALLOWED_EXTENSIONS.includes(path.extname(fullPath).toLowerCase())) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const hash = calculateHash(content);
            const { table, fileType } = mapFileToTable(fullPath);

            if (table !== 'unknown') {
              files.push({ path: fullPath, relativePath, content, hash, table, fileType });
            }
          } catch (error) {
            console.warn(`⚠️  Failed to read: ${fullPath}`);
          }
        }
      }
    }
  }

  walkDir(publicPath);
  return files;
}


export async function POST(request) {
  logRequest(request);
  const auth = authMod?.isAuthorized ? authMod.isAuthorized(request) : { ok: true };
  if (!auth.ok) {
    return NextResponse.json({ status: 'error', error: auth.message || 'Unauthorized' }, { status: auth.status || 401 });
  }
  try {
    const { action, table, payload, id } = await request.json();
    if (action === 'pump') {
      // Detect if running in a serverless environment (like Vercel) where fs is not available
      // Vercel sets process.env.VERCEL to '1' in its environment
      if (process.env.VERCEL === '1') {
        return NextResponse.json({
          status: 'error',
          error: 'The "pump" action is not available in the Vercel serverless environment. Please use this feature locally or migrate your ingestion logic to cloud storage.'
        }, { status: 400 });
      }
      try {
        const files = scanPublicFolder();
        console.log('[ADMIN DATA] Files scanned:', files.length);
        const tables = {
          collections: [],
          static_files: [],
          config_files: [],
          data_files: [],
          images: [],
          resumes: [],
          javascript_files: [],
          sync_manifest: []
        };
        // ...existing code...
        // (rest of pump logic here)
      } catch (pumpException) {
        console.log('[ADMIN DATA] Pump Exception:', pumpException.message);
        return NextResponse.json({ status: 'error', error: pumpException.message }, { status: 500 });
      }
    } else if (action === 'clear') {
      try {
        const tables = dbopModule.TABLES;
        let cleared = 0;

        for (const t of tables) {
          try {
            await supabase.from(t).delete().neq('id', null);
            cleared++;
            console.log('[ADMIN DATA] Cleared table:', t);
          } catch (e) {
            console.warn('[ADMIN DATA] Clear Exception:', e.message);
          }
        }

        // Example Redis logging (pseudo-code, replace with actual Redis logic if available)
        try {
          // await redis.del('data:all');
          console.log('[ADMIN DATA] Redis cache simulated for clear');
        } catch (redisException) {
          console.log('[ADMIN DATA] Redis Exception:', redisException.message);
        }

        return NextResponse.json({ status: 'success', action: 'clear', tables_cleared: cleared });
      } catch (clearException) {
        console.log('[ADMIN DATA] Clear Exception:', clearException.message);
        return NextResponse.json({ status: 'error', error: clearException.message }, { status: 500 });
      }
    } else if (action === 'create' && table && payload) {
      try {
        if (!dbopModule.TABLES.includes(table)) {
          return NextResponse.json({ status: 'error', error: 'Invalid table' }, { status: 400 });
        }
        const useSql = !!sql;
        if (useSql) {
          const keys = Object.keys(payload);
          const values = keys.map(k => payload[k]);
          const cols = keys.map(k => `"${k}"`).join(', ');
          const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
          const query = `INSERT INTO ${table} (${cols}) VALUES (${placeholders}) RETURNING *`;
          const rows = await sql.unsafe(query, values);
          logDatabase('INSERT', table, { payload });
          logResponse(200, rows);
          return NextResponse.json({ status: 'success', data: rows });
        } else {
          const { data, error } = await supabase.from(table).insert(payload).select();
          if (error) throw error;
          logDatabase('INSERT', table, { payload });
          logResponse(200, data);
          return NextResponse.json({ status: 'success', data });
        }
      } catch (err) {
        logError(err);
        return NextResponse.json({ status: 'error', error: err.message }, { status: 500 });
      }
    } else if (action === 'read' && table) {
      try {
        if (!dbopModule.TABLES.includes(table)) {
          return NextResponse.json({ status: 'error', error: 'Invalid table' }, { status: 400 });
        }
        const useSql = !!sql;
        if (useSql) {
          const rows = await sql.unsafe(`SELECT * FROM ${table}`);
          logDatabase('SELECT', table);
          logResponse(200, rows);
          return NextResponse.json({ status: 'success', data: rows });
        } else {
          const { data, error } = await supabase.from(table).select('*');
          if (error) throw error;
          logDatabase('SELECT', table);
          logResponse(200, data);
          return NextResponse.json({ status: 'success', data });
        }
      } catch (err) {
        logError(err);
        return NextResponse.json({ status: 'error', error: err.message }, { status: 500 });
      }
    } else if (action === 'update' && table && id && payload) {
      try {
        if (!dbopModule.TABLES.includes(table)) {
          return NextResponse.json({ status: 'error', error: 'Invalid table' }, { status: 400 });
        }
        const useSql = !!sql;
        if (useSql) {
          const keys = Object.keys(payload);
          const values = keys.map(k => payload[k]);
          const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
          const query = `UPDATE ${table} SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;
          const rows = await sql.unsafe(query, [...values, id]);
          logDatabase('UPDATE', table, { id, payload });
          logResponse(200, rows);
          return NextResponse.json({ status: 'success', data: rows });
        } else {
          const { data, error } = await supabase.from(table).update(payload).eq('id', id).select();
          if (error) throw error;
          logDatabase('UPDATE', table, { id, payload });
          logResponse(200, data);
          return NextResponse.json({ status: 'success', data });
        }
      } catch (err) {
        logError(err);
        return NextResponse.json({ status: 'error', error: err.message }, { status: 500 });
      }
    } else if (action === 'delete' && table && id) {
      try {
        if (!dbopModule.TABLES.includes(table)) {
          return NextResponse.json({ status: 'error', error: 'Invalid table' }, { status: 400 });
        }
        const useSql = !!sql;
        if (useSql) {
          const rows = await sql.unsafe(`DELETE FROM ${table} WHERE id = $1 RETURNING *`, [id]);
          logDatabase('DELETE', table, { id });
          logResponse(200, rows);
          return NextResponse.json({ status: 'success', data: rows });
        } else {
          const { data, error } = await supabase.from(table).delete().eq('id', id).select();
          if (error) throw error;
          logDatabase('DELETE', table, { id });
          logResponse(200, data);
          return NextResponse.json({ status: 'success', data });
        }
      } catch (err) {
        logError(err);
        return NextResponse.json({ status: 'error', error: err.message }, { status: 500 });
      }
    }
    return NextResponse.json({ status: 'error', error: 'Invalid action. Use: pump, clear, create, read, update, delete' }, { status: 400 });
  } catch (error) {
    logError(error);
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
  }
}


export async function GET(request) {
  const auth = authMod?.isAuthorized ? authMod.isAuthorized(request) : { ok: true };
  if (!auth.ok) {
    return NextResponse.json({ status: 'error', error: auth.message || 'Unauthorized' }, { status: auth.status || 401 });
  }
  try {
    const files = scanPublicFolder();
    const byType = {};
    for (const file of files) {
      byType[file.table] = (byType[file.table] || 0) + 1;
    }
    const stats = {};
    const tables = dbopModule.TABLES;
    for (const t of tables) {
      stats[t] = await dbopModule.count(t);
    }
    return NextResponse.json({
      status: 'success',
      public_folder: { total_files: files.length, by_type: byType },
      database: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError(error);
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
  }
}
