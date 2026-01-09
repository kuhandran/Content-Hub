// Lightweight Postgres client using DATABASE_URL
// If DATABASE_URL is not set, this will export null.

const postgres = require('postgres');

const connectionString = process.env.DATABASE_URL;
let sql = null;

if (connectionString && typeof connectionString === 'string' && connectionString.length > 0) {
  try {
    sql = postgres(connectionString, {
      max: 5,
      prepare: true,
      ssl: 'prefer',
    });
    console.log('[POSTGRES] Client initialized with DATABASE_URL');
  } catch (err) {
    console.error('[POSTGRES] Failed to initialize client:', err.message);
    sql = null;
  }
}

module.exports = sql;
