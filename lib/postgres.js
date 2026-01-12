// Lightweight Postgres client using DATABASE_URL
// If DATABASE_URL is not set, this will export null.

const postgres = require('postgres');

const connectionString = process.env.DATABASE_URL;
const isProd = process.env.NODE_ENV === 'production';
let sql = null;

if (connectionString && typeof connectionString === 'string' && connectionString.length > 0) {
  try {
    // Enforce SSL in production; prefer in non-prod
    const sslMode = isProd ? 'require' : 'prefer';
    // Guard against accidental client-side import
    if (typeof window !== 'undefined') {
      throw new Error('Postgres client should not be imported in browser code');
    }
    sql = postgres(connectionString, {
      max: 5,
      prepare: true,
      ssl: sslMode,
    });
    console.log('[POSTGRES] Client initialized with DATABASE_URL');
  } catch (err) {
    console.error('[POSTGRES] Failed to initialize client:', err.message);
    sql = null;
  }
}

module.exports = sql;
