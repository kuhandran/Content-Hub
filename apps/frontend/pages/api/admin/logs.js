import { logRequest, logResponse, logDatabase, logError, getLogs } from '../../../lib/logger';

export default async function handler(req, res) {
  const operation = req.body?.operation || 'unknown';
  
  logRequest(req, { operation });

  try {
    const result = await handleLogsEndpoint(req, res);
    logResponse(200, { message: 'Logs retrieved', count: result.count });
    return result.response;
  } catch (error) {
    logError(error, { endpoint: '/api/admin/logs', operation });
    return res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

async function handleLogsEndpoint(req, res) {
  const { type, table, limit = 50 } = req.query;
  
  logDatabase('SELECT', 'logs', { 
    filter: { type, table },
    limit 
  });

  const logs = getLogs({
    type: type ? type.toUpperCase() : undefined,
    table,
    limit: parseInt(limit),
  });

  return {
    response: res.status(200).json({
      status: 'success',
      logs,
      count: logs.length,
      timestamp: new Date().toISOString(),
    }),
    count: logs.length,
  };
}
