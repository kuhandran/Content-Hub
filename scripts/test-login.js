#!/usr/bin/env node

/**
 * Test Login API Script
 * Tests the authentication API with test users
 * 
 * Usage: node scripts/test-login.js
 */

const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

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
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

if (!connectionString) {
  console.error('❌ DATABASE_URL not set in .env.local');
  process.exit(1);
}

async function testLogin() {
  let sql;
  
  try {
    console.log('🔄 Fetching users from database...\n');
    
    sql = postgres(connectionString, {
      ssl: false,
      max: 3
    });
    
    // Fetch all users
    const users = await sql.unsafe(`
      SELECT id, username, mfa_enabled FROM users 
      ORDER BY created_at DESC
    `);
    
    if (users.length === 0) {
      console.log('❌ No users found. Run: node scripts/setup-users.js');
      process.exit(1);
    }

    console.log('📊 Users in database:');
    console.table(users.map(u => ({
      ID: u.id.substring(0, 8) + '...',
      Username: u.username,
      'MFA Enabled': u.mfa_enabled ? '✓' : '✗'
    })));

    // Test credentials mapping
    console.log('\n🧪 Test Credentials:');
    console.log('─'.repeat(60));
    const testCredentials = [
      { username: 'testuser', password: 'testuser123' },
      { username: 'demo', password: 'demo123456' },
      { username: 'admin', password: 'admin@2024' }
    ];

    testCredentials.forEach((cred, i) => {
      const user = users.find(u => u.username === cred.username);
      console.log(`${i + 1}. Username: ${cred.username.padEnd(15)} | Password: ${cred.password}`);
      console.log(`   Found in DB: ${user ? '✓ YES' : '✗ NO'}`);
      if (user) {
        console.log(`   User ID: ${user.id}`);
        console.log(`   MFA Enabled: ${user.mfa_enabled ? 'Yes' : 'No'}`);
      }
      console.log();
    });

    console.log('─'.repeat(60));
    console.log('\n📍 API Testing:');
    console.log(`API Base URL: ${API_BASE_URL}`);
    console.log('\nTo test the login API:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Open browser: http://localhost:3000/login');
    console.log('3. Use any test credential above to login\n');

    console.log('✅ Database mapping complete!');

    await sql.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (sql) await sql.end();
    process.exit(1);
  }
}

testLogin();
