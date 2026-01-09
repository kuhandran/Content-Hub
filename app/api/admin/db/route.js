/**
 * app/api/admin/db/route.js
 * 
 * Database Management Endpoint
 * GET: Database status
 * POST: Create/Delete/Manage tables
 */


import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { logRequest, logResponse, logDatabase, logError } from '../../../../lib/logger';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);


export async function POST(request) {
  logRequest(request);
  try {
    const { action, table } = await request.json();

    if (action === 'create') {
      try {
        const schema = `
          CREATE TABLE IF NOT EXISTS collections (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), lang VARCHAR(10), type VARCHAR(20), filename VARCHAR(255), file_content JSONB, file_hash VARCHAR(64), synced_at TIMESTAMP DEFAULT now(), created_at TIMESTAMP DEFAULT now(), updated_at TIMESTAMP DEFAULT now(), UNIQUE(lang, type, filename));
          CREATE TABLE IF NOT EXISTS static_files (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), filename VARCHAR(255) UNIQUE, file_type VARCHAR(50), file_content TEXT, file_hash VARCHAR(64), synced_at TIMESTAMP DEFAULT now(), created_at TIMESTAMP DEFAULT now(), updated_at TIMESTAMP DEFAULT now());
          CREATE TABLE IF NOT EXISTS config_files (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), filename VARCHAR(255) UNIQUE, file_type VARCHAR(50), file_content JSONB, file_hash VARCHAR(64), synced_at TIMESTAMP DEFAULT now(), created_at TIMESTAMP DEFAULT now(), updated_at TIMESTAMP DEFAULT now());
          CREATE TABLE IF NOT EXISTS data_files (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), filename VARCHAR(255) UNIQUE, file_type VARCHAR(50), file_content JSONB, file_hash VARCHAR(64), synced_at TIMESTAMP DEFAULT now(), created_at TIMESTAMP DEFAULT now(), updated_at TIMESTAMP DEFAULT now());
          CREATE TABLE IF NOT EXISTS images (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), filename VARCHAR(255) UNIQUE, file_path VARCHAR(512), mime_type VARCHAR(50), file_hash VARCHAR(64), synced_at TIMESTAMP DEFAULT now(), created_at TIMESTAMP DEFAULT now(), updated_at TIMESTAMP DEFAULT now());
          CREATE TABLE IF NOT EXISTS resumes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), filename VARCHAR(255) UNIQUE, file_type VARCHAR(50), file_path VARCHAR(512), file_hash VARCHAR(64), synced_at TIMESTAMP DEFAULT now(), created_at TIMESTAMP DEFAULT now(), updated_at TIMESTAMP DEFAULT now());
          CREATE TABLE IF NOT EXISTS javascript_files (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), filename VARCHAR(255) UNIQUE, file_path VARCHAR(512), file_content TEXT, file_hash VARCHAR(64), synced_at TIMESTAMP DEFAULT now(), created_at TIMESTAMP DEFAULT now(), updated_at TIMESTAMP DEFAULT now());
          CREATE TABLE IF NOT EXISTS sync_manifest (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), file_path VARCHAR(512) UNIQUE, file_hash VARCHAR(64), table_name VARCHAR(50), last_synced TIMESTAMP DEFAULT now());
          CREATE INDEX IF NOT EXISTS idx_collections_lang ON collections(lang);
          CREATE INDEX IF NOT EXISTS idx_sync_manifest_path ON sync_manifest(file_path);
        `;

        const statements = schema.split(';').filter(s => s.trim());
        let created = 0;


        for (const stmt of statements) {
          try {
            await supabase.rpc('exec_sql', { sql: stmt.trim() });
            created++;
            logDatabase('EXEC_SQL', 'schema', { statement: stmt.trim() });
          } catch (e) {
            if (!e.message.includes('exists')) logError(e);
          }
        }
        logResponse(200, { action: 'create', tables: 8, statements_executed: created });
        return NextResponse.json({ status: 'success', action: 'create', tables: 8, statements_executed: created });
      } catch (createException) {
        logError(createException);
        return NextResponse.json({ status: 'error', error: createException.message }, { status: 500 });
      }
    }

    if (action === 'delete') {
      try {
        const tables = ['sync_manifest', 'collections', 'static_files', 'config_files', 'data_files', 'images', 'resumes', 'javascript_files'];
        let cleared = 0;


        for (const t of tables) {
          try {
            await supabase.from(t).delete().neq('id', null);
            cleared++;
            logDatabase('CLEAR', t);
          } catch (e) {
            logError(e);
          }
        }
        logResponse(200, { action: 'delete', tables_cleared: cleared });
        return NextResponse.json({ status: 'success', action: 'delete', tables_cleared: cleared });
      } catch (deleteException) {
        logError(deleteException);
        return NextResponse.json({ status: 'error', error: deleteException.message }, { status: 500 });
      }
    }

    if (action === 'drop' && table) {

      try {
        await supabase.rpc('exec_sql', { sql: `DROP TABLE IF EXISTS ${table} CASCADE;` });
        logDatabase('DROP', table);
        logResponse(200, { action: 'drop', table });
        return NextResponse.json({ status: 'success', action: 'drop', table });
      } catch (dropException) {
        logError(dropException);
        return NextResponse.json({ status: 'error', error: dropException.message }, { status: 500 });
      }
    }


    return NextResponse.json({ status: 'error', error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    logError(error);
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
  }
}


export async function GET() {
  try {
    const tables = ['collections', 'static_files', 'config_files', 'data_files', 'images', 'resumes', 'javascript_files', 'sync_manifest'];
    const stats = {};
    for (const t of tables) {
      const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
      stats[t] = count || 0;
    }
    logResponse(200, { database: stats });
    return NextResponse.json({
      status: 'success',
      database: stats,
      total_records: Object.values(stats).reduce((a, b) => a + b, 0),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError(error);
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
  }
}
