import sql from '../../lib/db';
import { logRequest, logResponse, logDatabase, logError } from '../../lib/logger';

export default async function handler(req, res) {
  logRequest(req, { endpoint: '/api' });

  try {
    // Test database connection
    logDatabase('SELECT', 'system', { action: 'test_connection' });
    const result = await sql`SELECT NOW() as timestamp`;
    
    logDatabase('SELECT', 'system', { 
      action: 'test_connection',
      status: 'success',
      timestamp: result[0]?.timestamp
    });

    const response = {
      status: 'success',
      message: 'Backend API is running',
      endpoint: '/api',
      database: 'connected',
      timestamp: result[0]?.timestamp || new Date().toISOString(),
    };

    logResponse(200, response, { endpoint: '/api' });
    return res.status(200).json(response);
  } catch (error) {
    logError(error, { endpoint: '/api', action: 'database_connection' });
    
    const response = {
      status: 'success',
      message: 'Backend API is running',
      endpoint: '/api',
      database: 'not connected',
      error: error.message,
      timestamp: new Date().toISOString(),
    };

    logResponse(200, response, { endpoint: '/api' });
    return res.status(200).json(response);
  }
}
