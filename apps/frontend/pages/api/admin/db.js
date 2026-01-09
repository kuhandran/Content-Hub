import sql from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Get database info
      const version = await sql`SELECT version()`;
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      
      return res.status(200).json({
        status: 'success',
        message: 'Database Management Endpoint',
        database: {
          connected: true,
          tables: tables.map(t => t.table_name),
          version: version[0]?.version,
        },
        actions: ['create', 'delete', 'drop'],
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  return res.status(405).json({ 
    status: 'error',
    message: 'Method not allowed' 
  });
}
