import sql from '../../lib/db';

export default async function handler(req, res) {
  try {
    // Test database connection
    const result = await sql`SELECT NOW() as timestamp`;
    
    return res.status(200).json({
      status: 'success',
      message: 'Backend API is running',
      endpoint: '/api',
      database: 'connected',
      timestamp: result[0]?.timestamp || new Date().toISOString(),
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(200).json({
      status: 'success',
      message: 'Backend API is running',
      endpoint: '/api',
      database: 'not connected',
      timestamp: new Date().toISOString(),
    });
  }
}
