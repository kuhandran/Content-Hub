// /api/admin/cache - cache/clear/check
import { getRedis } from '../../../../lib/redis';
import { logRequest, logResponse, logError } from '../../../../lib/logger';

export async function POST(req) {
  logRequest(req);
  try {
    const { action, key, value } = await req.json();
    const redis = getRedis();
    if (!redis) {
      const msg = 'Redis not configured';
      logError(new Error(msg));
      return new Response(JSON.stringify({ status: 'error', error: msg }), { status: 500 });
    }

    if (action === 'cache' && key && value) {
      await redis.set(key, JSON.stringify(value));
      logResponse(200, { action: 'cache', key });
      return new Response(JSON.stringify({ status: 'success', action: 'cache', key }), { status: 200 });
    } else if (action === 'clear' && key) {
      await redis.del(key);
      logResponse(200, { action: 'clear', key });
      return new Response(JSON.stringify({ status: 'success', action: 'clear', key }), { status: 200 });
    } else if (action === 'check' && key) {
      const data = await redis.get(key);
      logResponse(200, { action: 'check', key, data });
      return new Response(JSON.stringify({ status: 'success', action: 'check', key, data: data ? JSON.parse(data) : null }), { status: 200 });
    } else if (action === 'clearAll') {
      await redis.flushall();
      logResponse(200, { action: 'clearAll' });
      return new Response(JSON.stringify({ status: 'success', action: 'clearAll' }), { status: 200 });
    }
    return new Response(JSON.stringify({ status: 'error', error: 'Invalid action or missing key/value' }), { status: 400 });
  } catch (err) {
    logError(err);
    return new Response(JSON.stringify({ status: 'error', message: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
