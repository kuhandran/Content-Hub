#!/usr/bin/env node

/**
 * Setup Users Database Script
 * Creates users table and inserts test users with Argon2 hashed passwords
 * 
 * Usage: node scripts/setup-users.js
 */

const fs = require('fs');
const path = require('path');
const postgres = require('postgres');
const argon2 = require('argon2');

// Load .env.local manually
const envFile = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf-8');
  envContent.split('\n').forEach(line => {
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts) {
        let value = valueParts.join('=').trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  });
}

const connectionString = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not set in .env.local');
  process.exit(1);
}

async function setupUsers() {
  if (!connectionString) {
    console.error('❌ DATABASE_URL not set in .env.local');
    process.exit(1);
  }

  console.log('🔄 Database URL:', connectionString.substring(0, 50) + '...');
  
  let sql;
  try {
    sql = postgres(connectionString, {
      ssl: false,
      max: 3
    });

    // Test connection
    await sql`SELECT 1`;
    console.log('✓ Database connection successful');
    
    // Create users table
    console.log('📋 Creating users table...');
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(64) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        mfa_enabled BOOLEAN DEFAULT false,
        mfa_secret TEXT,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `);
    console.log('✓ Users table created');

    // Create index
    console.log('🔍 Creating index on username...');
    await sql.unsafe(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)
    `);
    console.log('✓ Index created');

    // Hash test passwords
    console.log('🔐 Hashing test passwords...');
    const testuserhash = await argon2.hash('testuser123');
    const demohash = await argon2.hash('demo123456');
    const adminhash = await argon2.hash('admin@2024');
    console.log('✓ Passwords hashed');

    // Clear existing test users
    console.log('🗑️  Clearing existing test users...');
    await sql.unsafe(`
      DELETE FROM users WHERE username IN ('testuser', 'demo', 'admin')
    `);

    // Insert test users
    console.log('👥 Inserting test users...');
    await sql.unsafe(`
      INSERT INTO users (username, password_hash, mfa_enabled) 
      VALUES 
        ($1, $2, false),
        ($3, $4, false),
        ($5, $6, false)
      ON CONFLICT (username) DO NOTHING
    `, ['testuser', testuserhash, 'demo', demohash, 'admin', adminhash]);
    
    console.log('✓ Test users created');

    // Display users
    console.log('\n📊 Current users:');
    const users = await sql.unsafe(`
      SELECT id, username, mfa_enabled, created_at FROM users ORDER BY created_at DESC
    `);
    
    console.table(users);

    console.log('\n✅ Database setup complete!\n');
    console.log('Test Credentials:');
    console.log('─'.repeat(50));
    console.log('Username: testuser     | Password: testuser123');
    console.log('Username: demo         | Password: demo123456');
    console.log('Username: admin        | Password: admin@2024');
    console.log('─'.repeat(50));

    await sql.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (sql) await sql.end();
    process.exit(1);
  }
}

setupUsers();
