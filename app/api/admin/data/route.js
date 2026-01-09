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
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { logRequest, logResponse, logDatabase, logError } from '../../../../lib/logger';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

function calculateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function getFileExtension(filename) {
  return path.extname(filename).toLowerCase().slice(1) || 'unknown';
}

function determineFileType(filePath) {
  if (filePath.includes('/collections/')) return { table: 'collections', fileType: 'json' };
  if (filePath.includes('/files/')) return { table: 'static_files', fileType: getFileExtension(filePath) };
  if (filePath.includes('/config/')) return { table: 'config_files', fileType: getFileExtension(filePath) };
  if (filePath.includes('/data/')) return { table: 'data_files', fileType: getFileExtension(filePath) };
  if (filePath.includes('/image/')) return { table: 'images', fileType: getFileExtension(filePath) };
  if (filePath.includes('/js/')) return { table: 'javascript_files', fileType: 'js' };
  if (filePath.includes('/resume/')) return { table: 'resumes', fileType: getFileExtension(filePath) };
  return { table: 'unknown', fileType: getFileExtension(filePath) };
}

function scanPublicFolder() {
  const publicPath = path.join(process.cwd(), 'public');
  const files = [];

  function walkDir(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(publicPath, fullPath);

      if (entry.isDirectory()) {
        if (!['.next', 'node_modules', '.git'].includes(entry.name)) walkDir(fullPath);
      } else {
        if (['.json', '.js', '.xml', '.html', '.txt', '.pdf', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.docx'].includes(path.extname(fullPath))) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const hash = calculateHash(content);
            const { table, fileType } = determineFileType(fullPath);

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
        const tables = ['sync_manifest', 'collections', 'static_files', 'config_files', 'data_files', 'images', 'resumes', 'javascript_files'];
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
        const { data, error } = await supabase.from(table).insert(payload).select();
        if (error) throw error;
        logDatabase('INSERT', table, { payload });
        logResponse(200, data);
        return NextResponse.json({ status: 'success', data });
      } catch (err) {
        logError(err);
        return NextResponse.json({ status: 'error', error: err.message }, { status: 500 });
      }
    } else if (action === 'read' && table) {
      try {
        const { data, error } = await supabase.from(table).select('*');
        if (error) throw error;
        logDatabase('SELECT', table);
        logResponse(200, data);
        return NextResponse.json({ status: 'success', data });
      } catch (err) {
        logError(err);
        return NextResponse.json({ status: 'error', error: err.message }, { status: 500 });
      }
    } else if (action === 'update' && table && id && payload) {
      try {
        const { data, error } = await supabase.from(table).update(payload).eq('id', id).select();
        if (error) throw error;
        logDatabase('UPDATE', table, { id, payload });
        logResponse(200, data);
        return NextResponse.json({ status: 'success', data });
      } catch (err) {
        logError(err);
        return NextResponse.json({ status: 'error', error: err.message }, { status: 500 });
      }
    } else if (action === 'delete' && table && id) {
      try {
        const { data, error } = await supabase.from(table).delete().eq('id', id).select();
        if (error) throw error;
        logDatabase('DELETE', table, { id });
        logResponse(200, data);
        return NextResponse.json({ status: 'success', data });
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


export async function GET() {
  try {
    const files = scanPublicFolder();
    const byType = {};
    for (const file of files) {
      byType[file.table] = (byType[file.table] || 0) + 1;
    }
    const stats = {};
    const tables = ['collections', 'static_files', 'config_files', 'data_files', 'images', 'resumes', 'javascript_files', 'sync_manifest'];
    for (const t of tables) {
      const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
      stats[t] = count || 0;
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
