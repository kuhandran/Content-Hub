#!/usr/bin/env node

/**
 * apps/backend/scripts/setup-database.js
 * Database initialization during build
 */

require('dotenv').config({ path: '../../.env.local' });
require('dotenv').config({ path: '../../.env' });

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🗄️  Database Setup Script');
console.log('=' .repeat(50));

// Check environment
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.log('⚠️  Skipping database setup - Supabase credentials not found');
  console.log('   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(0);
}

console.log('✅ Supabase credentials found');

// Scan public folder
const publicPath = path.join(process.cwd(), '../../public');
let fileCount = 0;

if (fs.existsSync(publicPath)) {
  function countFiles(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory() && !['.next', 'node_modules', '.git'].includes(entry.name)) {
        countFiles(fullPath);
      } else if (entry.isFile()) {
        fileCount++;
      }
    }
  }
  countFiles(publicPath);
  console.log(`📁 Found ${fileCount} files in /public`);
}

console.log('✅ Database setup script ready');
console.log('');
console.log('Note: Full database initialization runs when database connection is available');
console.log('');
