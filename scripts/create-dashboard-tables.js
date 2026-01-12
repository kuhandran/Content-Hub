const fs = require('fs');
const path = require('path');
const pg = require('pg');

// Read .env.local manually
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');
const env = {};
envLines.forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key] = valueParts.join('=').replace(/^"(.*)"$/, '$1');
  }
});

const connectionString = env.DATABASE_URL || env.POSTGRES_PRISMA_URL;

async function createTables() {
  const client = new pg.Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log('[DASHBOARD_SETUP] Connected to database');

    // Create resources table (tracks files from public folder)
    await client.query(`
      CREATE TABLE IF NOT EXISTS resources (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        type TEXT NOT NULL, -- 'collection', 'config', 'image', 'file', 'js', 'placeholder', 'resume', 'data'
        path TEXT NOT NULL UNIQUE,
        parent_id UUID REFERENCES resources(id) ON DELETE CASCADE,
        is_directory BOOLEAN DEFAULT false,
        file_size INTEGER,
        language TEXT, -- For collections
        content_type TEXT, -- For files (e.g., 'application/json', 'image/png')
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✓ Created resources table');

    // Create file_content table (tracks JSON content snapshots)
    await client.query(`
      CREATE TABLE IF NOT EXISTS file_content (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        version INTEGER DEFAULT 1,
        created_by TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✓ Created file_content table');

    // Create dashboard_status table (tracks service status)
    await client.query(`
      CREATE TABLE IF NOT EXISTS dashboard_status (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        service_name TEXT NOT NULL UNIQUE, -- 'supabase', 'redis', 'api'
        status TEXT DEFAULT 'unknown', -- 'online', 'offline', 'unknown'
        response_time_ms INTEGER,
        last_checked TIMESTAMP DEFAULT NOW(),
        last_updated TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✓ Created dashboard_status table');

    // Create menu_config table (defines sidebar menus)
    await client.query(`
      CREATE TABLE IF NOT EXISTS menu_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        menu_name TEXT NOT NULL UNIQUE, -- 'overview', 'collections', 'config', 'data', 'files', 'images', 'js', 'placeholder', 'resume'
        display_name TEXT NOT NULL,
        icon TEXT,
        folder_path TEXT,
        menu_order INTEGER,
        has_submenu BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✓ Created menu_config table');

    // Create indexes for better performance
    await client.query(`CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_resources_parent ON resources(parent_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_resources_language ON resources(language);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_file_content_resource ON file_content(resource_id);`);
    console.log('✓ Created indexes');

    // Seed menu configuration
    const menus = [
      ['overview', 'Overview', '📊', null, 1, false],
      ['collections', 'Collections', '📚', 'public/collections', 2, true],
      ['config', 'Config', '⚙️', 'public/config', 3, false],
      ['data', 'Data', '📋', 'public/data', 4, false],
      ['files', 'Files', '📄', 'public/files', 5, false],
      ['images', 'Images', '🖼️', 'public/image', 6, false],
      ['js', 'JavaScript', '✨', 'public/js', 7, false],
      ['placeholder', 'Placeholders', '🎯', 'public', 8, false],
      ['resume', 'Resume', '📑', 'public/resume', 9, false],
    ];

    for (const [name, displayName, icon, folderPath, order, hasSubmenu] of menus) {
      await client.query(
        `INSERT INTO menu_config (menu_name, display_name, icon, folder_path, menu_order, has_submenu)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (menu_name) DO NOTHING;`,
        [name, displayName, icon, folderPath, order, hasSubmenu]
      );
    }
    console.log('✓ Seeded menu configuration');

    // Initialize service status
    const services = ['supabase', 'redis', 'api'];
    for (const service of services) {
      await client.query(
        `INSERT INTO dashboard_status (service_name, status)
         VALUES ($1, 'unknown')
         ON CONFLICT (service_name) DO NOTHING;`,
        [service]
      );
    }
    console.log('✓ Initialized service status');

    console.log('\n✅ Dashboard tables created successfully!');
    console.log('\nTables created:');
    console.log('  - resources (file/folder tracking)');
    console.log('  - file_content (JSON content versions)');
    console.log('  - dashboard_status (service status)');
    console.log('  - menu_config (sidebar menu configuration)');

  } catch (err) {
    console.error('[ERROR]', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createTables();
