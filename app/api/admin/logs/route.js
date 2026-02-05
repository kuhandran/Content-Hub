// /api/admin/logs - return logs
import { getLogs, logError } from '../../../../lib/logger';
import authMod from '../../../../lib/auth';

export async function GET(request) {
  const auth = authMod?.isAuthorized ? authMod.isAuthorized(request) : { ok: true };
  if (!auth.ok) {
    return new Response(JSON.stringify({ status: 'error', error: auth.message || 'Unauthorized' }), { status: auth.status || 401 });
  }
  try {
    const logs = getLogs({ limit: 100 });
    const safeLogs = logs.map(log => {
      const base = {
        timestamp: log.timestamp,
        type: log.type,
      };

      if (log.type === 'REQUEST') {
        return {
          ...base,
          method: log.method,
          url: log.url,
        };
      }

      if (log.type === 'RESPONSE') {
        return {
          ...base,
          statusCode: log.statusCode,
        };
      }

      if (log.type === 'DATABASE') {
        return {
          ...base,
          operation: log.operation,
          table: log.table,
        };
      }

      if (log.type === 'ERROR') {
        return {
          ...base,
          message: log.message,
          name: log.name,
          code: log.code,
        };
      }

      // Fallback for any unknown log types: only expose basic metadata.
      return base;
    });

    return new Response(JSON.stringify({ status: 'success', logs: safeLogs }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    logError(err);
    return new Response(JSON.stringify({ status: 'error', message: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
