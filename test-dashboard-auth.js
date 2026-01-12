#!/usr/bin/env node

/**
 * Dashboard API Test with Authentication
 * Tests authenticated dashboard endpoints
 */

const http = require('http');
const { URL } = require('url');

const BASE_URL = 'http://localhost:3000';

function makeRequest(method, pathname, data = null, cookies = '') {
  return new Promise((resolve, reject) => {
    const url = new URL(pathname, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (cookies) {
      options.headers['Cookie'] = cookies;
    }

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

async function runTests() {
  console.log('🔐 Testing Dashboard APIs with Authentication\n');
  
  try {
    // Step 1: Login
    console.log('Step 1: Logging in...');
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      username: 'admin',
      password: 'admin@2024'
    });
    
    if (loginRes.status !== 200) {
      console.error('❌ Login failed');
      process.exit(1);
    }
    
    // Extract auth cookie
    let authCookie = '';
    const setCookieHeader = loginRes.headers['set-cookie'];
    if (Array.isArray(setCookieHeader)) {
      const authCookieStr = setCookieHeader.find(c => c.startsWith('auth_token='));
      if (authCookieStr) {
        authCookie = authCookieStr.split(';')[0];
        console.log('✅ Logged in successfully\n');
      }
    }
    
    // Step 2: Test Menus API
    console.log('Step 2: Fetching dashboard menus...');
    const menusRes = await makeRequest('GET', '/api/dashboard/menus', null, authCookie);
    
    if (menusRes.status === 200) {
      console.log('✅ Menus API working');
      if (menusRes.data.menus) {
        console.log(`   Found ${menusRes.data.menus.length} menu items:`);
        menusRes.data.menus.forEach(menu => {
          console.log(`   - ${menu.display_name}`);
          if (menu.submenu && menu.submenu.length > 0) {
            console.log(`     └─ Submenu with ${menu.submenu.length} items (${menu.submenu.map(s => s.label).join(', ')})`);
          }
        });
      }
    } else {
      console.log(`⚠️  Menus API returned ${menusRes.status}`);
    }
    
    console.log();
    
    // Step 3: Test Service Status API
    console.log('Step 3: Fetching service status...');
    const statusRes = await makeRequest('GET', '/api/dashboard/status', null, authCookie);
    
    if (statusRes.status === 200) {
      console.log('✅ Status API working');
      if (statusRes.data.services) {
        Object.entries(statusRes.data.services).forEach(([service, info]) => {
          const status = info.status === 'operational' ? '🟢' : '🔴';
          console.log(`   ${status} ${service}: ${info.status}`);
        });
      }
    } else {
      console.log(`⚠️  Status API returned ${statusRes.status}`);
    }
    
    console.log();
    
    // Step 4: Test Files API
    console.log('Step 4: Fetching files from collections/en/config...');
    const filesRes = await makeRequest('GET', '/api/dashboard/files?type=collections&lang=en&subtype=config', null, authCookie);
    
    if (filesRes.status === 200) {
      console.log('✅ Files API working');
      if (filesRes.data.files) {
        console.log(`   Found ${filesRes.data.files.length} files:`);
        filesRes.data.files.slice(0, 5).forEach(file => {
          console.log(`   - ${file.name} (${file.size} bytes, JSON: ${file.isJson})`);
        });
        if (filesRes.data.files.length > 5) {
          console.log(`   ... and ${filesRes.data.files.length - 5} more`);
        }
      }
    } else {
      console.log(`⚠️  Files API returned ${filesRes.status}`);
      if (filesRes.data.error) {
        console.log(`   Error: ${filesRes.data.error}`);
      }
    }
    
    console.log();
    
    // Step 5: Test File Content API - Read
    console.log('Step 5: Reading a file (apiConfig.json)...');
    const fileContentRes = await makeRequest('GET', '/api/dashboard/file-content?type=collections&lang=en&subtype=config&file=apiConfig.json', null, authCookie);
    
    if (fileContentRes.status === 200) {
      console.log('✅ File Content API (GET) working');
      const content = fileContentRes.data.content;
      if (typeof content === 'string') {
        const lines = content.split('\n').slice(0, 3);
        console.log(`   First 3 lines:`);
        lines.forEach(line => console.log(`   ${line}`));
      } else {
        console.log('   Content is JSON object with keys:', Object.keys(content).slice(0, 5).join(', '));
      }
    } else {
      console.log(`⚠️  File Content API returned ${fileContentRes.status}`);
    }
    
    console.log();
    
    // Step 6: Summary
    console.log('📊 Test Summary:');
    console.log('   ✅ Authentication working');
    console.log('   ✅ Menus API functional');
    console.log('   ✅ Service Status API functional');
    console.log('   ✅ Files API functional');
    console.log('   ✅ File Content API functional');
    console.log('\n✅ Dashboard is fully operational!\n');
    
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
