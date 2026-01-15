/**
 * app/api/utils/db.js
 * 
 * Database Connection Utilities
 * - Connect to databases (PostgreSQL, Supabase)
 * - Close connections safely
 * - Handle connection pooling
 * - Manage database initialization
 */

const postgres = require('../../../lib/postgres');
const supabaseModule = require('../../../lib/supabase');

let pgConnection = null;
let supabaseConnection = null;
let connectionState = {
  postgres: { connected: false, lastError: null },
  supabase: { connected: false, lastError: null }
};

/**
 * Connect to PostgreSQL database
 * @returns {Object} PostgreSQL client
 */
async function connectPostgres() {
  try {
    if (pgConnection && connectionState.postgres.connected) {
      console.log('[DB] ✓ PostgreSQL already connected');
      return pgConnection;
    }

    console.log('[DB] 🔗 Connecting to PostgreSQL...');
    
    if (!postgres) {
      throw new Error('PostgreSQL client not available - check DATABASE_URL');
    }

    // Test connection
    const testResult = await postgres`SELECT 1 as test`;
    
    pgConnection = postgres;
    connectionState.postgres.connected = true;
    connectionState.postgres.lastError = null;
    
    console.log('[DB] ✓ PostgreSQL connected successfully');
    return pgConnection;
  } catch (error) {
    connectionState.postgres.connected = false;
    connectionState.postgres.lastError = error.message;
    console.error('[DB] ❌ PostgreSQL connection failed:', error.message);
    throw error;
  }
}

/**
 * Connect to Supabase database
 * @returns {Object} Supabase client
 */
async function connectSupabase() {
  try {
    if (supabaseConnection && connectionState.supabase.connected) {
      console.log('[DB] ✓ Supabase already connected');
      return supabaseConnection;
    }

    console.log('[DB] 🔗 Connecting to Supabase...');
    
    supabaseConnection = supabaseModule.getSupabase();
    
    if (!supabaseConnection) {
      throw new Error('Supabase client not available - check SUPABASE_URL');
    }

    // Test connection
    const { data, error } = await supabaseConnection
      .from('sync_manifest')
      .select('id')
      .limit(1);

    if (error) {
      throw error;
    }

    connectionState.supabase.connected = true;
    connectionState.supabase.lastError = null;
    
    console.log('[DB] ✓ Supabase connected successfully');
    return supabaseConnection;
  } catch (error) {
    connectionState.supabase.connected = false;
    connectionState.supabase.lastError = error.message;
    console.error('[DB] ❌ Supabase connection failed:', error.message);
    throw error;
  }
}

/**
 * Get active database client (PostgreSQL if available, else Supabase)
 * @returns {Object} Database client
 */
async function getActiveDB() {
  // Try PostgreSQL first
  if (postgres) {
    try {
      return await connectPostgres();
    } catch (err) {
      console.warn('[DB] ⚠️ PostgreSQL not available, falling back to Supabase');
    }
  }

  // Fallback to Supabase
  return await connectSupabase();
}

/**
 * Close PostgreSQL connection
 */
async function closePostgres() {
  try {
    if (pgConnection && postgres?.end) {
      console.log('[DB] 🔌 Closing PostgreSQL connection...');
      await postgres.end();
      pgConnection = null;
      connectionState.postgres.connected = false;
      console.log('[DB] ✓ PostgreSQL connection closed');
    }
  } catch (error) {
    console.error('[DB] ❌ Error closing PostgreSQL:', error.message);
  }
}

/**
 * Close all database connections
 */
async function closeAllConnections() {
  console.log('[DB] 🔌 Closing all database connections...');
  
  try {
    await closePostgres();
  } catch (err) {
    console.error('[DB] Error closing PostgreSQL:', err.message);
  }

  // Supabase doesn't need explicit closing
  supabaseConnection = null;
  connectionState.supabase.connected = false;
  
  console.log('[DB] ✓ All connections closed');
}

/**
 * Get connection status
 * @returns {Object} Status of all connections
 */
function getConnectionStatus() {
  return {
    postgres: connectionState.postgres,
    supabase: connectionState.supabase,
    timestamp: new Date().toISOString()
  };
}

/**
 * Initialize all database tables
 * @param {Object} sqlClient - PostgreSQL client
 */
async function initializeDatabaseTables(sqlClient) {
  console.log('[DB] 🔧 Initializing database tables...');
  
  const tables = [
    `CREATE TABLE IF NOT EXISTS collections (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), lang VARCHAR(10), type VARCHAR(20), filename VARCHAR(255), file_content JSONB, file_hash VARCHAR(64), synced_at TIMESTAMP DEFAULT now(), created_at TIMESTAMP DEFAULT now(), updated_at TIMESTAMP DEFAULT now(), UNIQUE(lang, type, filename))`,
    `CREATE TABLE IF NOT EXISTS static_files (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), filename VARCHAR(255) UNIQUE, file_type VARCHAR(50), file_content TEXT, file_hash VARCHAR(64), synced_at TIMESTAMP DEFAULT now(), created_at TIMESTAMP DEFAULT now(), updated_at TIMESTAMP DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS config_files (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), filename VARCHAR(255) UNIQUE, file_type VARCHAR(50), file_content JSONB, file_hash VARCHAR(64), synced_at TIMESTAMP DEFAULT now(), created_at TIMESTAMP DEFAULT now(), updated_at TIMESTAMP DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS data_files (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), filename VARCHAR(255) UNIQUE, file_type VARCHAR(50), file_content JSONB, file_hash VARCHAR(64), synced_at TIMESTAMP DEFAULT now(), created_at TIMESTAMP DEFAULT now(), updated_at TIMESTAMP DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS images (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), filename VARCHAR(255) UNIQUE, file_path VARCHAR(512), mime_type VARCHAR(50), file_hash VARCHAR(64), synced_at TIMESTAMP DEFAULT now(), created_at TIMESTAMP DEFAULT now(), updated_at TIMESTAMP DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS resumes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), filename VARCHAR(255) UNIQUE, file_type VARCHAR(50), file_path VARCHAR(512), file_hash VARCHAR(64), synced_at TIMESTAMP DEFAULT now(), created_at TIMESTAMP DEFAULT now(), updated_at TIMESTAMP DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS javascript_files (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), filename VARCHAR(255) UNIQUE, file_path VARCHAR(512), file_content TEXT, file_hash VARCHAR(64), synced_at TIMESTAMP DEFAULT now(), created_at TIMESTAMP DEFAULT now(), updated_at TIMESTAMP DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS sync_manifest (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), file_path VARCHAR(512) UNIQUE, file_hash VARCHAR(64), table_name VARCHAR(50), last_synced TIMESTAMP DEFAULT now())`,
    `CREATE INDEX IF NOT EXISTS idx_sync_manifest_path ON sync_manifest(file_path)`
  ];

  let successCount = 0;
  for (const stmt of tables) {
    try {
      await sqlClient.unsafe(stmt);
      successCount++;
    } catch (err) {
      console.warn('[DB] Table creation warning:', err.message);
    }
  }

  console.log(`[DB] ✓ Database tables initialized (${successCount}/${tables.length})`);
}

module.exports = {
  connectPostgres,
  connectSupabase,
  getActiveDB,
  closePostgres,
  closeAllConnections,
  getConnectionStatus,
  initializeDatabaseTables
};
