import sql from '../../../lib/db';
import { logRequest, logResponse, logDatabase, logError } from '../../../lib/logger';

export default async function handler(req, res) {
  logRequest(req, { endpoint: '/api/admin/db' });

  if (req.method === 'GET') {
    try {
      // Get database info
      logDatabase('SELECT', 'system', { action: 'get_version' });
      const version = await sql`SELECT version()`;
      
      logDatabase('SELECT', 'information_schema.tables', { 
        action: 'list_tables',
        schema: 'public'
      });
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      
      const response = {
        status: 'success',
        message: 'Database Management Endpoint',
        database: {
          connected: true,
          tables: tables.map(t => t.table_name),
          version: version[0]?.version,
        },
        actions: ['create', 'delete', 'drop'],
        timestamp: new Date().toISOString(),
      };

      logDatabase('SELECT', 'system', { 
        action: 'get_db_info',
        status: 'success',
        tableCount: tables.length
      });

      logResponse(200, response, { endpoint: '/api/admin/db' });
      return res.status(200).json(response);
    } catch (error) {
      logError(error, { endpoint: '/api/admin/db', action: 'get_db_info' });
      const errorResponse = {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
      };
      logResponse(500, errorResponse, { endpoint: '/api/admin/db' });
      return res.status(500).json(errorResponse);
    }
  }

  const errorResponse = { 
    status: 'error',
    message: 'Method not allowed' 
  };
  logResponse(405, errorResponse, { endpoint: '/api/admin/db' });
  return res.status(405).json(errorResponse);
}
