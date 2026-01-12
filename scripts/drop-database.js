#!/usr/bin/env node

/**
 * scripts/drop-database.js
 *
 * Deletes the entire Postgres database referenced by DATABASE_URL.
 * If full drop is not permitted, falls back to resetting the 'public' schema.
 *
 * Usage:
 *   node scripts/drop-database.js --yes           # Attempt full DB drop; fallback to schema reset
 *   node scripts/drop-database.js --reset         # Only reset 'public' schema
 *
 * Notes:
 * - Dropping a DB requires maintenance DB access (usually 'postgres') and privileges.
 * - Fallback schema reset performs: DROP SCHEMA public CASCADE; CREATE SCHEMA public; CREATE EXTENSION pgcrypto.
 */

require('dotenv').config();
const url = require('url');
const postgres = require('postgres');
const sqlTarget = require('../lib/postgres');

const confirm = process.argv.includes('--yes');
const onlyReset = process.argv.includes('--reset');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL is not set.');
  process.exit(1);
}

function buildAdminUrl(dbUrl) {
  const parsed = new url.URL(dbUrl);
  const dbName = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
  // Connect to maintenance DB (postgres); preserve search params and auth
  parsed.pathname = '/postgres';
  return { adminUrl: parsed.toString(), dbName };
}

async function resetSchema() {
  console.log('\n🔁 Resetting public schema (fallback)...');
  if (!sqlTarget) {
    console.error('❌ Invalid Postgres client for target DB.');
    process.exit(1);
  }
  try {
    await sqlTarget.unsafe('DROP SCHEMA IF EXISTS public CASCADE');
    await sqlTarget.unsafe('CREATE SCHEMA public');
    await sqlTarget.unsafe('GRANT ALL ON SCHEMA public TO public');
    await sqlTarget.unsafe('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    console.log('✅ Public schema reset complete.');
  } catch (err) {
    console.error('❌ Failed to reset schema:', err.message);
    process.exit(1);
  }
}

async function dropDatabase() {
  const { adminUrl, dbName } = buildAdminUrl(databaseUrl);
  console.log('╔════════════════════════════════════════════╗');
  console.log('║        Full Database Deletion (PG)         ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`Target database: ${dbName}`);

  if (!confirm && !onlyReset) {
    console.error("\n⚠️  Destructive action. Re-run with '--yes' to confirm or use '--reset' to only reset schema.");
    process.exit(1);
  }

  if (onlyReset) {
    await resetSchema();
    return;
  }

  let adminSql;
  try {
    adminSql = postgres(adminUrl);
  } catch (err) {
    console.warn('⚠️  Could not create admin connection. Falling back to schema reset.', err.message);
    await resetSchema();
    return;
  }

  try {
    console.log('\n🔪 Terminating active connections...');
    await adminSql`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = ${dbName} AND pid <> pg_backend_pid();
    `;

    console.log('🗑️  Dropping database...');
    await adminSql.unsafe(`DROP DATABASE IF EXISTS "${dbName}"`);
    console.log('✅ Database dropped.');
  } catch (err) {
    console.warn('⚠️  DROP DATABASE failed:', err.message);
    console.warn('↪️  Falling back to schema reset on target DB.');
    await resetSchema();
  } finally {
    try { await adminSql.end({ timeout: 0 }); } catch {}
  }
}

(async () => {
  try {
    if (onlyReset) {
      await resetSchema();
    } else {
      await dropDatabase();
    }
    console.log('\nDone.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Operation failed:', err.message);
    process.exit(1);
  }
})();
