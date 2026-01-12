#!/usr/bin/env node

/**
 * scripts/drop-image-tables.js
 *
 * Drops or clears image-related tables in Postgres.
 *
 * Usage:
 *   node scripts/drop-image-tables.js            # Drop tables: image, images
 *   node scripts/drop-image-tables.js --clear    # Delete rows from: image, images
 */

require('dotenv').config();
const sql = require('../lib/postgres');

if (!sql) {
  console.error('❌ Missing or invalid DATABASE_URL. Configure DATABASE_URL for Postgres.');
  process.exit(1);
}

const mode = process.argv.includes('--clear') ? 'clear' : 'drop';
const tables = ['image', 'images'];

async function run() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║        Image Tables Maintenance (PG)       ║');
  console.log('╚════════════════════════════════════════════╝');

  try {
    for (const table of tables) {
      try {
        if (mode === 'clear') {
          console.log(`\n🧹 Clearing rows from: ${table}`);
          await sql.unsafe(`DELETE FROM ${table}`);
          console.log(`✅ Cleared rows from ${table}`);
        } else {
          console.log(`\n🗑️  Dropping table: ${table}`);
          await sql.unsafe(`DROP TABLE IF EXISTS ${table} CASCADE`);
          console.log(`✅ Dropped ${table}`);
        }
      } catch (err) {
        console.warn(`⚠️  ${table}: ${err.message}`);
      }
    }

    console.log('\n✅ Completed image table maintenance.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Operation failed:', error.message);
    process.exit(1);
  }
}

run();
