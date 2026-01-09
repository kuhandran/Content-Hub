// Unified DB operations using DATABASE_URL (postgres) with Supabase fallback
const postgres = require('postgres');
const { createClient } = require('@supabase/supabase-js');

const TABLES = ['collections','static_files','config_files','data_files','images','resumes','javascript_files','sync_manifest'];

function getSqlClient() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    const sql = postgres(url, { max: 5, prepare: true, ssl: 'prefer' });
    return sql;
  } catch (err) {
    console.error('[DBOP] Postgres init error:', err.message);
    return null;
  }
}

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) return null;
  try {
    return createClient(url, key);
  } catch (err) {
    console.error('[DBOP] Supabase init error:', err.message);
    return null;
  }
}

function db() {
  const sql = getSqlClient();
  const supabase = sql ? null : getSupabaseClient();
  const mode = sql ? 'postgres' : (supabase ? 'supabase' : 'none');
  if (mode === 'none') {
    throw new Error('No database configured: set DATABASE_URL or SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY');
  }
  return { mode, sql, supabase };
}

async function createdb() {
  const { mode, sql, supabase } = db();
  const statements = [
    `CREATE TABLE IF NOT EXISTS collections (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), lang VARCHAR(10), type VARCHAR(20), filename VARCHAR(255), file_content JSONB, file_hash VARCHAR(64), synced_at TIMESTAMP DEFAULT now(), created_at TIMESTAMP DEFAULT now(), updated_at TIMESTAMP DEFAULT now(), UNIQUE(lang, type, filename))`,
    `CREATE TABLE IF NOT EXISTS static_files (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), filename VARCHAR(255) UNIQUE, file_type VARCHAR(50), file_content TEXT, file_hash VARCHAR(64), synced_at TIMESTAMP DEFAULT now(), created_at TIMESTAMP DEFAULT now(), updated_at TIMESTAMP DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS config_files (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), filename VARCHAR(255) UNIQUE, file_type VARCHAR(50), file_content JSONB, file_hash VARCHAR(64), synced_at TIMESTAMP DEFAULT now(), created_at TIMESTAMP DEFAULT now(), updated_at TIMESTAMP DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS data_files (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), filename VARCHAR(255) UNIQUE, file_type VARCHAR(50), file_content JSONB, file_hash VARCHAR(64), synced_at TIMESTAMP DEFAULT now(), created_at TIMESTAMP DEFAULT now(), updated_at TIMESTAMP DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS images (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), filename VARCHAR(255) UNIQUE, file_path VARCHAR(512), mime_type VARCHAR(50), file_hash VARCHAR(64), synced_at TIMESTAMP DEFAULT now(), created_at TIMESTAMP DEFAULT now(), updated_at TIMESTAMP DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS resumes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), filename VARCHAR(255) UNIQUE, file_type VARCHAR(50), file_path VARCHAR(512), file_hash VARCHAR(64), synced_at TIMESTAMP DEFAULT now(), created_at TIMESTAMP DEFAULT now(), updated_at TIMESTAMP DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS javascript_files (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), filename VARCHAR(255) UNIQUE, file_path VARCHAR(512), file_content TEXT, file_hash VARCHAR(64), synced_at TIMESTAMP DEFAULT now(), created_at TIMESTAMP DEFAULT now(), updated_at TIMESTAMP DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS sync_manifest (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), file_path VARCHAR(512) UNIQUE, file_hash VARCHAR(64), table_name VARCHAR(50), last_synced TIMESTAMP DEFAULT now())`,
    `CREATE INDEX IF NOT EXISTS idx_collections_lang ON collections(lang)`,
    `CREATE INDEX IF NOT EXISTS idx_sync_manifest_path ON sync_manifest(file_path)`
  ];
  if (mode === 'postgres') {
    let created = 0;
    for (const stmt of statements) {
      try { await sql.unsafe(stmt); created++; } catch (err) { console.warn('[DBOP] createDB warn:', err.message); }
    }
    return { status: 'success', operation: 'createdb', statements_executed: created };
  } else {
    let created = 0;
    for (const stmt of statements) {
      try { await supabase.rpc('exec_sql', { sql: stmt }); created++; } catch (err) { if (!String(err.message).includes('exists')) console.warn('[DBOP] createDB warn:', err.message); }
    }
    return { status: 'success', operation: 'createdb', statements_executed: created };
  }
}

async function deletedb() {
  const { mode, sql, supabase } = db();
  let cleared = 0;
  if (mode === 'postgres') {
    for (const table of TABLES) {
      try { await sql.unsafe(`DELETE FROM ${table}`); cleared++; } catch (err) { console.warn('[DBOP] delete warn:', table, err.message); }
    }
  } else {
    for (const table of TABLES) {
      try { await supabase.from(table).delete().neq('id', null); cleared++; } catch (err) { console.warn('[DBOP] delete warn:', table, err.message); }
    }
  }
  return { status: 'success', operation: 'deletedb', tables_cleared: cleared };
}

async function count(table) {
  const { mode, sql, supabase } = db();
  if (mode === 'postgres') {
    try { const rows = await sql`SELECT COUNT(*)::int AS count FROM ${sql(table)}`; return rows?.[0]?.count || 0; } catch { return 0; }
  } else {
    try { const { count } = await supabase.from(table).select('*', { count: 'exact', head: true }); return count || 0; } catch { return 0; }
  }
}

async function getManifest() {
  const { mode, sql, supabase } = db();
  if (mode === 'postgres') {
    try { return await sql`SELECT file_path, file_hash, table_name FROM sync_manifest`; } catch { return []; }
  } else {
    const { data, error } = await supabase.from('sync_manifest').select('*');
    if (error) return [];
    return data || [];
  }
}

async function upsertManifest(entry) {
  const { mode, sql, supabase } = db();
  if (mode === 'postgres') {
    try {
      await sql`
        INSERT INTO sync_manifest (file_path, file_hash, table_name, last_synced)
        VALUES (${entry.file_path}, ${entry.file_hash}, ${entry.table_name}, ${entry.last_synced})
        ON CONFLICT (file_path) DO UPDATE SET file_hash = EXCLUDED.file_hash, table_name = EXCLUDED.table_name, last_synced = EXCLUDED.last_synced
      `;
      return true;
    } catch { return false; }
  } else {
    try {
      await supabase.from('sync_manifest').upsert(entry, { onConflict: 'file_path' });
      return true;
    } catch { return false; }
  }
}

module.exports = { db, createdb, deletedb, count, getManifest, upsertManifest, TABLES };
