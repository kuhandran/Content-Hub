require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

const connStr = process.env.POSTGRES_PRISMA_URL;

(async () => {
  const sql = postgres(connStr, {
    max: 10,
    prepare: true,
    ssl: { rejectUnauthorized: false },
    idle_timeout: 20,
    connect_timeout: 10,
    statement_timeout: 30000,
  });

  try {
    console.log('Testing urlConfig...\n');
    const result = await sql`SELECT id, updated_at, file_hash, content FROM collections WHERE language='en' AND type='config' AND filename='urlConfig'`;
    
    if (result.length === 0) {
      console.log('❌ urlConfig not found');
      return;
    }
    
    const record = result[0];
    const content = typeof record.content === 'string' ? JSON.parse(record.content) : record.content;
    
    console.log('✅ urlConfig loaded successfully');
    console.log('Updated:', record.updated_at);
    console.log('Hash:', record.file_hash.substring(0, 16) + '...');
    console.log('Top keys:', Object.keys(content).join(', '));
    console.log('Size:', JSON.stringify(content).length, 'bytes');
    console.log('Empty:', Object.keys(content).length === 0 ? '❌ YES' : '✅ NO');
  } finally {
    await sql.end();
  }
})();
