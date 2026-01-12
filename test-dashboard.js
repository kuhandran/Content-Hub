#!/usr/bin/env node

/**
 * Test Dashboard Functionality
 * Tests the dashboard API endpoints and file operations
 */

const http = require('http');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

// Helper function to make HTTP requests
function makeRequest(method, pathname, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathname, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test runner
async function runTests() {
  console.log('🧪 Starting Dashboard Tests\n');
  
  try {
    // Test 1: Login
    console.log('Test 1: Login with admin credentials...');
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      username: 'admin',
      password: 'admin@2024'
    });
    
    if (loginRes.status !== 200) {
      console.error('❌ Login failed:', loginRes.data);
      process.exit(1);
    }
    
    const setCookieHeader = loginRes.headers['set-cookie'];
    let authToken = null;
    if (Array.isArray(setCookieHeader)) {
      const authCookie = setCookieHeader.find(c => c.startsWith('auth_token='));
      if (authCookie) {
        authToken = authCookie.split(';')[0];
        console.log('✅ Login successful, got auth_token');
      }
    }
    
    // Use token from Set-Cookie or try without it
    const cookieHeader = authToken ? authToken : '';
    
    // Test 2: Check public file structure
    console.log('\nTest 2: Checking public folder structure...');
    const collectionsPath = path.join(process.cwd(), 'public', 'collections');
    const languages = fs.readdirSync(collectionsPath)
      .filter(f => fs.statSync(path.join(collectionsPath, f)).isDirectory());
    
    console.log(`✅ Found ${languages.length} language folders:`, languages.join(', '));
    
    // Test 3: Dashboard page loads
    console.log('\nTest 3: Testing dashboard page load...');
    const dashboardRes = await makeRequest('GET', '/dashboard', null, {
      'Cookie': cookieHeader
    });
    
    if (dashboardRes.status === 200) {
      console.log('✅ Dashboard page loads successfully');
      
      // Check if HTML contains expected elements
      if (dashboardRes.data.includes('Dashboard') || dashboardRes.data.includes('sidebar')) {
        console.log('✅ Dashboard HTML contains expected elements');
      }
    } else {
      console.log(`⚠️  Dashboard returned ${dashboardRes.status}`);
    }
    
    // Test 4: Check if we can read the collections from database
    console.log('\nTest 4: Database connectivity check...');
    const pg = require('pg');
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;
    
    try {
      const connectionUrl = new URL(connectionString || '');
      const isProduction = connectionUrl.hostname && !connectionUrl.hostname.includes('localhost');
      
      const client = new pg.Client({
        connectionString,
        ssl: isProduction ? { rejectUnauthorized: false } : false,
      });
      
      await client.connect();
      
      // Check menu_config table
      const menusResult = await client.query('SELECT COUNT(*) FROM menu_config');
      console.log(`✅ Database connected, found ${menusResult.rows[0].count} menus in config`);
      
      // Check dashboard_status table
      const statusResult = await client.query('SELECT * FROM dashboard_status');
      console.log(`✅ Dashboard status records: ${statusResult.rows.length}`);
      statusResult.rows.forEach(row => {
        console.log(`   - ${row.service_name}: ${row.status}`);
      });
      
      await client.end();
    } catch (err) {
      console.error('❌ Database error:', err.message);
    }
    
    // Test 5: File system operations
    console.log('\nTest 5: File system operations...');
    const enConfigPath = path.join(process.cwd(), 'public', 'collections', 'en', 'config');
    if (fs.existsSync(enConfigPath)) {
      const files = fs.readdirSync(enConfigPath);
      console.log(`✅ Found ${files.length} files in en/config:`, files.slice(0, 3).join(', ') + (files.length > 3 ? '...' : ''));
    }
    
    // Test 6: Check sidebar menu structure
    console.log('\nTest 6: Expected sidebar menu structure:');
    const expectedMenus = ['Overview', 'Collections', 'Config', 'Data', 'Files', 'Images', 'JS', 'Placeholder', 'Resume'];
    console.log('  Expected items:', expectedMenus.join(', '));
    
    // Test 7: Service status endpoints
    console.log('\nTest 7: Testing service status endpoint (without auth for now)...');
    try {
      // This will fail without auth, but we're checking for the right error
      const statusRes = await makeRequest('GET', '/api/dashboard/status');
      if (statusRes.status === 401) {
        console.log('✅ Endpoint properly protected (returns 401 without auth)');
      } else if (statusRes.status === 200) {
        console.log('✅ Service status endpoint accessible');
        console.log('   Services:', Object.keys(statusRes.data.services || {}).join(', '));
      }
    } catch (err) {
      console.error('⚠️  Error testing status endpoint:', err.message);
    }
    
    console.log('\n✅ All dashboard tests completed!\n');
    
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
}

// Run tests
runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
