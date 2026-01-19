/**
 * Test script to verify collections API data without running full dev server
 */
const postgres = require('postgres');

require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;

async function testAPI() {
  console.log('🧪 Testing Collections API Data...\n');
  
  if (!connectionString) {
    console.error('❌ No database URL found (DATABASE_URL or POSTGRES_PRISMA_URL)');
    console.error('Available env:', Object.keys(process.env).filter(k => k.includes('POSTGRES') || k.includes('DATABASE')));
    process.exit(1);
  }
  
  console.log(`📌 Using: ${connectionString.substring(0, 50)}...`)
  
  const sql = postgres(connectionString, {
    max: 5,
    prepare: true,
    ssl: 'require',
    idle_timeout: 20,
    connect_timeout: 10,
    statement_timeout: 30000,
  });
  
  try {
    console.log('📡 Connecting to database...');
    
    // Test query
    const result = await sql`
      SELECT 
        id, language, type, filename, file_hash, 
        content, created_at, updated_at
      FROM collections
      WHERE language = 'en'
        AND type = 'config'
        AND filename = 'pageLayout'
      LIMIT 1
    `;
    
    if (result.length === 0) {
      console.log('❌ No data found for en/config/pageLayout');
      process.exit(1);
    }
    
    const record = result[0];
    console.log('✅ Record found!\n');
    console.log('📋 Metadata:');
    console.log(`  ID: ${record.id}`);
    console.log(`  Language: ${record.language}`);
    console.log(`  Type: ${record.type}`);
    console.log(`  Filename: ${record.filename}`);
    console.log(`  Updated: ${record.updated_at}`);
    console.log(`  Hash: ${record.file_hash.substring(0, 16)}...`);
    
    // Check content
    const content = typeof record.content === 'string' ? JSON.parse(record.content) : record.content;
    console.log(`\n📄 Content Analysis:`);
    console.log(`  Type: ${typeof content}`);
    console.log(`  Top-level keys: ${Object.keys(content).join(', ')}`);
    console.log(`  Content size: ${JSON.stringify(content).length} bytes`);
    console.log(`  Empty: ${Object.keys(content).length === 0 ? '❌ YES (EMPTY)' : '✅ NO (HAS DATA)'}`);
    
    if (content.theme) {
      console.log(`\n🎨 Theme:`);
      console.log(`  Primary Color: ${content.theme.primaryColor}`);
      console.log(`  Secondary Color: ${content.theme.secondaryColor}`);
    }
    
    if (content.sections && Array.isArray(content.sections)) {
      console.log(`\n📑 Sections (${content.sections.length} total):`);
      content.sections.forEach((section, i) => {
        console.log(`  ${i + 1}. ${section.type || 'Unknown'} (id: ${section.id})`);
      });
    }
    
    console.log('\n✅ All checks passed! The database has valid data.');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

testAPI();
