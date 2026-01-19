// Lightweight Postgres client using DATABASE_URL
// If DATABASE_URL is not set, this will export null.

const postgres = require('postgres');

const connectionString = process.env.DATABASE_URL || 
  (process.env.NODE_ENV === 'production' 
    ? process.env.POSTGRES_PRISMA_URL  // Use pooler in production
    : process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_PRISMA_URL); // Use direct connection in dev
const isProd = process.env.NODE_ENV === 'production';
let sql = null;

if (connectionString && typeof connectionString === 'string' && connectionString.length > 0) {
  try {
    // For Supabase, use SSL config appropriate to the endpoint
    const sslConfig = connectionString.includes('pooler.supabase.com') 
      ? { rejectUnauthorized: false }  // Pooler connection
      : true;  // Direct connection
    
    // Guard against accidental client-side import
    if (typeof window !== 'undefined') {
      throw new Error('Postgres client should not be imported in browser code');
    }
    sql = postgres(connectionString, {
      max: isProd ? 10 : 5,  // Smaller pool for dev
      prepare: true,
      ssl: sslConfig,
      idle_timeout: 20, // Close idle connections after 20 seconds
      max_lifetime: 60 * 15, // 15 minutes max connection lifetime
      connect_timeout: 10, // 10 second connection timeout
      statement_timeout: 30000, // 30 second query timeout in ms
    });
    console.log(`[POSTGRES] Client initialized ${isProd ? '(PRODUCTION)' : '(DEVELOPMENT)'}`);
  } catch (err) {
    console.error('[POSTGRES] Failed to initialize client:', err.message);
    sql = null;
  }
}

module.exports = sql;
